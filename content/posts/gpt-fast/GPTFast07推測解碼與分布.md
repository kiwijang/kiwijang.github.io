---
title: "GPT Fast 07：Speculative Decoding，先猜再驗證為什麼不必犧牲分布？"
date: "2026-10-31"
description: "推導推測採樣的接受率與拒絕後修正分布，以兩 token 算例驗證目標分布，並說明加速條件、快取回退與版本介面落差。"
tags: [DL, LLM, PyTorch, 推論加速, GPTFast, SpeculativeDecoding]
---

## 能不能讓大模型少跑幾次？

[LLM 01](../llm-from-scratch/LLM01認識大型語言模型.md) 說明自迴歸生成每步依賴前文；[LLM 05](../llm-from-scratch/LLM05預訓練與文字生成.md) 則把 logits 轉成採樣分布。推測解碼結合兩件事：先由便宜的 draft 模型提出多個 token，再讓 target 模型一次驗證多個位置。

它沒有假裝未來 token 已經知道，而是先提出候選；只有通過正確規則的部分才成為輸出。

## 1. Draft 依序猜，target 同時驗證

Draft 先自迴歸產生 k 個候選。由於候選已知，target 可以把它們當作一段序列，透過 causal attention 一次計算各位置的條件分布。

這和訓練時能並行計算多個位置很像：有完整輸入，不代表每個位置能偷看未來。Target 驗證仍必須使用正確 causal mask 與絕對位置。

逐一接受候選時，前面的條件前綴必須一致。一旦某處拒絕，該處後面的候選就不能繼續當成已驗證答案，因為它們依賴了錯誤的前綴。[Speculative Decoding 原論文](https://arxiv.org/abs/2211.17192)

## 2. 不只比較 argmax，還要修正機率

本文定義 p 為 target 分布、q 為 draft 分布。候選 x 從 q 抽出，接受機率為：

```text
accept(x) = min(1, p(x) / q(x))
```

若拒絕，改從下列殘差分布採樣：

```text
r(x) = max(p(x) − q(x), 0) / sum_y max(p(y) − q(y), 0)
```

這裡對已從 q 抽到的候選計算比例；數值實作仍要處理極小機率與精度問題。如果所有候選都通過，target 可再產生一個額外 token。

只要「草稿和大模型最高分相同就接受」，一般不等於正確的隨機推測採樣。Greedy 驗證與抽樣分布驗證是不同情境。

## 3. 兩個 token 的例子，看見修正的必要

假設只有 A、B：target 分布為 `[0.6, 0.4]`，draft 為 `[0.8, 0.2]`。

Draft 過度偏好 A。接受後的機率質量為 A 的 0.6、B 的 0.2，剩下 0.2 被拒絕；殘差完全分給 B，結果就回到 `[0.6, 0.4]`。

以下是獨立純 Python 精確枚舉這一步的算例，不是完整多 token 解碼器：

```python
p = [0.6, 0.4]  # target
q = [0.8, 0.2]  # draft
accepted_mass = [min(pi, qi) for pi, qi in zip(p, q)]
reject_mass = 1 - sum(accepted_mass)
residual = [max(pi - qi, 0) for pi, qi in zip(p, q)]
total = sum(residual)
r = [v / total for v in residual]  # 本例拒絕率非零
final = [a + reject_mass * b for a, b in zip(accepted_mass, r)]
print([round(v, 6) for v in final])  # [0.6, 0.4]
```

若 p 與 q 完全相同，就不需進入拒絕修正分支，也不能硬把零殘差除以零。

## 4. 保留的是分布，不是同 seed 的逐字輸出

標準演算法在假設成立時，保留 target 的採樣分布。但 draft、接受檢查和修正採樣會消耗不同亂數，因此不保證同 seed 生成同一句話。

Temperature、top-k 等轉換也屬於分布定義。接受與修正需要使用實際抽樣用的分布，不能用一套分布提出候選，再拿未經同樣定義的分數宣稱驗證成立。

若 target 本身已量化，所保留的是那個量化 target 的分布，不是自動恢復未量化模型的分布。這與第六篇的品質誤差需要分開評估。

Draft 與 target 也必須使用相容的 token 空間與條件序列；不能只因為兩者都能生成中文，就把不同 tokenizer 的同一個 ID 當成相同事件。

## 5. 為什麼不一定變快？

每輪成本包含 draft 的 k 步、target 的批次驗證、接受判斷與 cache 整理。粗略比較可寫成：

```text
推測後每 token 成本 ≈ 每輪總時間 / 每輪實際輸出 token 數
```

候選接受率高、draft 足夠便宜、target 多位置驗證能有效攤提成本時，較容易有收益。盲目增大 k 可能讓更多後半候選被丟棄，甚至增加延遲。

拒絕後，draft／target cache 的有效前綴也必須對齊。無效後綴不一定要清零，但必須被遮住並在後續適當覆寫，不能讓未被接受的 token 影響答案。

## 6. gpt-fast 原碼如何讀，哪裡不能直接照跑？

`speculative_decode` 包含比例接受、拒絕後正殘差與全接受時的額外採樣；注意原碼 p、q 命名與本文相反，應依角色閱讀。[固定版本生成程式](https://github.com/meta-pytorch/gpt-fast/blob/6ecad9b5b6b987d17ac4303965545873d0192086/generate.py)

但此快照的 `model_forward` 仍呼叫 `model(x, input_pos)`，而模型定義需要 `forward(mask, idx, input_pos)`。推測驗證與 draft 補寫沿用該 helper，介面未對齊；另外序列寫入也有單序列假設。本文分析演算法，不宣稱這個快照可直接執行任意 batch 的推測解碼。

實作時需先補齊驗證段的 mask、絕對位置與 batch 索引，再檢查 cache 狀態。這不是換一個函式參數名字就完成的正確性驗證。

## 7. 練習與檢查

先用上面的兩 token 算例理解分布守恆，再測全接受、第一處拒絕與中途拒絕。逐步追蹤輸出長度和有效 cache 終點，確認沒有重複或跳過 token。

最後才量 acceptance、每輪輸出量與延遲。同時保留統計測試與演算法依據，單次回答相同不能證明分布等價。

## 系列導覽

[系列目錄](./GPTFast推論加速系列.md) · [上一篇](./GPTFast06量化與品質驗證.md) · [下一篇：多卡張量平行](./GPTFast08多卡張量平行.md)
