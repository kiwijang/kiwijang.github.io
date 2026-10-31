---
title: "Nano-vLLM 04：每個請求的 KV Cache 要放在哪裡？"
date: "2026-10-31"
description: "用邏輯 block、實體 block table 與 slot mapping 理解分頁 KV cache，分析尾端浪費、配置與釋放的正確性。"
tags: [DL, LLM, 推論加速, NanoVLLM, KVCache]
---

## 從每個請求一大塊，改成共用池中的小塊

[LLM 03](../llm-from-scratch/LLM03實作Attention機制.md) 說明每層 K、V 的用途；[GPT Fast 03](../gpt-fast/GPTFast03KVCache位置與遮罩.md) 用靜態容量保存它們。多請求下，若每筆都預留最大長度，短請求也占滿大空間，能同時服務的數量就受限。

分頁管理把 KV 位置切成固定 token 數的 blocks，請求只需持有對應表。這是類似分頁的索引管理，不代表使用作業系統的虛擬記憶體或自動交換到磁碟。

## 1. 邏輯位置如何找到實體 slot？

設 block size 為 S，token 的邏輯位置為 p：

```text
logical_block = p // S
offset = p % S
physical_block = block_table[logical_block]
slot = physical_block × S + offset
```

獨立純 Python 算例：

```python
block_size = 4
block_table = [7, 2, 9]
position = 5
slot = block_table[position // block_size] * block_size + position % block_size
print(slot)  # 9
```

位置 5 在請求的第二個邏輯 block，對應實體 block 2、offset 1。邏輯連續不要求實體連續；同一張表的對應關係由每層的 KV buffers 共同使用。

## 2. Block table 管讀取，slot mapping 管新寫入

Block table 描述請求整段歷史在哪裡；slot mapping 則告訴本輪新 K、V 要寫到哪些槽。兩者對錯任何一邊，都可能把其他請求的歷史當成自己的。

ModelRunner 建立這些索引，Attention 的 Triton store 核心寫入，再由支援 block table 的 attention 路徑讀取。[Attention 原碼](https://github.com/GeeeekExplorer/nano-vllm/blob/main/nanovllm/layers/attention.py)

這不會刪除模型需要的前文 attention 工作；它改善的是 KV 儲存配置與索引方式。分頁和 FlashAttention 也處理不同層面的問題，可搭配使用，見 [GPT Fast 05](../gpt-fast/GPTFast05Attention核心與GQA.md)。

## 3. 尾端浪費與 block size

長度 L 所需 blocks 為 `ceil(L/S)`，未使用槽位為 `ceil(L/S)×S−L`。在不共享的單一配置下，每筆尾端浪費介於 0 和 S−1 個 token 槽。

獨立純 Python 範例：

```python
lengths, block_size = [5, 8, 9], 4
allocated = [((n + block_size - 1) // block_size) * block_size for n in lengths]
print(allocated)  # [8, 8, 12]
print(sum(allocated) - sum(lengths))  # 6
```

小 blocks 可減少尾端浪費並細化共享粒度，但增加表項、管理與索引成本。實際核心也可能有 block size 限制，不能把教學範例的 4 直接當成可用 GPU 設定。

## 4. 一個 block 的實際 bytes

只算 K、V，一張卡上的每 block bytes 約為：

```text
2 × layers × block_size × 該卡 KV_heads × head_dim × element_bytes
```

GQA 與 tensor parallelism 影響該卡 head 數，不能一律帶入全模型 Q heads。這接續 [GPT Fast 05 的 GQA](../gpt-fast/GPTFast05Attention核心與GQA.md) 和 [GPT Fast 08 的多卡切分](../gpt-fast/GPTFast08多卡張量平行.md)。

ModelRunner 依裝置總量、使用比例和 warm-up 記憶體統計估算可配置 blocks；這是啟動時的容量估算，不是對任何後續工作負載都不會 OOM 的保證。[配置程式](https://github.com/GeeeekExplorer/nano-vllm/blob/main/nanovllm/engine/model_runner.py)

## 5. 正確性要測跨 block 邊界

特別測長度 S−1、S、S+1，追蹤新採樣 token 下一輪寫入何處。最後一個 token 已在序列中但尚無 KV 時，配置判斷會和只看 cached 長度不同。

再讓 A 完成、釋放 blocks，B 接著取得相同實體 ID。B 的可讀長度必須限制在有效前綴，不能讀到 A 的殘值。釋放可以只改所有權，不必立即清零，但索引與遮罩必須正確。

對照 [BlockManager](https://github.com/GeeeekExplorer/nano-vllm/blob/main/nanovllm/engine/block_manager.py)，也要確認 free 集合與 used 集合不重疊、活躍請求引用的 block 沒有被重新配置。快取效能建立在這些不變條件之上。

## 系列導覽

[系列目錄](./NanoVLLM系列.md) · [上一篇](./NanoVLLM03動態批次與變長輸入.md) · [下一篇：前綴共享](./NanoVLLM05前綴共享與回收.md)
