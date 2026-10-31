---
title: "GPT Fast 03：KV Cache 省下什麼，又怎麼避免算錯？"
date: "2026-10-31"
description: "從 causal attention 推導 KV cache，解釋靜態預配置、絕對位置、遮罩位移與記憶體估算，建立完整前綴和增量推論的比較方法。"
tags: [DL, LLM, PyTorch, 推論加速, GPTFast, KVCache]
---

## 已算過的前文，為什麼還要再算？

[LLM 03：Attention](../llm-from-scratch/LLM03實作Attention機制.md) 說明目前位置透過 Q 比對前文的 K，再混合 V。[LLM 04：生成迴圈](../llm-from-scratch/LLM04從零組裝GPT模型.md) 則先用完整前文幫助理解。真正逐字生成時，可以保存每層前文的 K、V，省掉重複投影與前文各層計算。

## 1. Causal 結構讓快取成立

在固定權重、位置規則與確定的推論行為下，前面位置不會因為後面新增 token 而改變。新的 token 只需產生自己的 Q、K、V，再讀取已保存的前文 K、V。

Q 通常不需要跨步保存，因為下一個位置會有自己的查詢。KV cache 也不是把先前 attention 輸出直接複製成答案；新位置仍要計算新的 attention 分布。

必須每層各自保存 K、V，因為不同層的表示不同。只快取第一層無法替其他層省下同樣工作。

## 2. 靜態空間，動態寫入位置

gpt-fast 的 `KVCache` 先配置 `[B_max, H_kv, T_max, d_h]` 的 K、V buffers，依 `input_pos` 寫入對應槽位，而非每步串接一塊更長張量。`setup_caches` 也會把容量向上對齊。[固定版本模型原碼](https://github.com/meta-pytorch/gpt-fast/blob/6ecad9b5b6b987d17ac4303965545873d0192086/model.py)

固定配置有利於減少配置、搬移與編譯形狀變動，但會預留空間。未使用的槽位仍存在，attention 必須看不到它們；寫了幾個 token 和配置了多少容量，是不同資訊。

這裡的 max batch 是容量設定，不代表已提供任意多使用者請求管理。連同 positions、mask 和有效序列一起考慮，才能重用 buffers。

## 3. 最常出錯的是「現在位於哪裡」

假設提示有 4 個 token，位置為 `0,1,2,3`。Prefill 的最後 logits 產生 token A，但 A 還沒被寫入 cache。下一步應把 A 以位置 4 送入，才算出 token B。

```text
prefill: [提示0, 提示1, 提示2, 提示3] → 產生 A
decode:  A at position 4 → cache 寫入位置4 → 產生 B
decode:  B at position 5 → cache 寫入位置5 → 產生 C
```

不要因為 A 已在輸出字串中，就假設它已經通過模型。少寫這一步會讓 cache 落後，重複餵入則可能多算一格。

## 4. Query 的局部索引，不等於絕對位置

單 token decode 的 Q 長度只有 1，所以其局部索引是 0；但它可能代表整段序列的位置 100。若直接用 `key_index <= query_local_index`，只會允許看見 key 0。

正確的可見範圍應依絕對位置，例如 `key_position <= query_absolute_position`，並同時排除無效或其他請求的槽位。gpt-fast 的位置偏移與 block mask 就是在處理這類問題。

獨立純 Python 算例：

```python
query_position = 4
capacity = 8
visible = [key <= query_position for key in range(capacity)]
print(visible)
# [True, True, True, True, True, False, False, False]
```

也不能看到 `is_causal=True` 就認定一切正確。非方形 Q／K 的 causal 對齊需要核對 API 語意；使用明確的絕對位置遮罩比較容易驗證。[SDPA 文件中的遮罩定義](https://docs.pytorch.org/docs/2.9/generated/torch.nn.functional.scaled_dot_product_attention.html)

## 5. KV cache 的記憶體怎麼估？

只算 K、V 的元素儲存量：

```text
bytes = 2 × layers × batch × KV_heads × capacity × head_dim × bytes_per_element
```

獨立純 Python 範例使用假設設定：

```python
layers, batch, kv_heads = 32, 1, 8
capacity, head_dim, element_bytes = 4096, 128, 2
size = 2 * layers * batch * kv_heads * capacity * head_dim * element_bytes
print(size / 2**30, "GiB")  # 0.5 GiB
```

這不包含權重、activation、RoPE 表、mask 和配置器保留空間。若使用 GQA，公式帶入的是 KV head 數，不是 Q head 數；兩者差異見第五篇。

## 6. 三組驗證要在加速前完成

首先，使用固定 token 序列，比較完整前綴與增量 cache 的每步 logits。其次，在未來槽位放不同值，確認目前輸出不受它們影響。最後，先跑長請求再跑短請求，確認舊槽位不會洩漏進新輸出。

重設不一定要把整個 buffer 清零，但必須保證本次可見範圍全部有效、其餘全部不可見。單純再呼叫 `setup_caches` 不等於清空狀態；容量足夠時它可能直接返回。

若要滑動視窗或重編位置，也必須重新檢查模型的位置表示和保留 KV 是否仍一致。前一系列「取最後一段文字重算」的簡單做法，不能直接等同於任意丟棄舊 cache 而不處理位置。

## 系列導覽

[系列目錄](./GPTFast推論加速系列.md) · [上一篇](./GPTFast02PrefillDecode與頻寬.md) · [下一篇：編譯與 CUDA Graphs](./GPTFast04編譯與CUDAGraphs.md)
