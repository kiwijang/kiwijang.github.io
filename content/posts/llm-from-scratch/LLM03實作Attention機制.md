---
title: "LLM 從零開始 03：從 Self-Attention 到 Multi-Head Attention"
date: "2026-10-31"
description: "用 Q、K、V 與張量尺寸理解 scaled dot-product attention，實作 causal mask，並拆解多頭注意力的維度轉換。"
tags: [DL, LLM, PyTorch, Attention, Transformer]
---

## 每個位置，應該參考哪些前文？

前一章把文字轉成 `[B, T, D]` 的向量，但查表不會讓不同位置交換資訊。本篇對應 Chapter 3，加入 attention，讓每個位置依輸入內容調整資訊混合的比例。

## 1. 先把 attention 想成加權平均

假設某個位置需要參考三個向量，權重分別是 `0.2、0.3、0.5`，輸出就是三個向量乘上各自權重後相加。

重點在於權重不是固定寫死，而是由輸入算出來。不同句子、不同位置，可能產生不同的權重。這讓相同的 token 能得到依上下文改變的表示。

## 2. Q、K、V 是三種可學習投影

對同一份輸入 `X`，使用三個權重矩陣：

```text
Q = XW_Q
K = XW_K
V = XW_V
scores = QKᵀ / sqrt(d_k)
weights = softmax(scores, 沿 key 位置)
output = weights V
```

可以把 Q 當成目前位置用來查詢的表示、K 當成被比較的表示、V 當成實際混合的內容。但這只是協助理解的比喻；三者本質上都是學習而來的向量，不是人工指定的語意欄位。

假設省略 batch，`Q` 和 `K` 都是 `[T, d_k]`，則分數矩陣是 `[T, T]`。第 i 列、第 j 欄代表「位置 i 對位置 j」的分數。Softmax 沿每一列的 key 位置進行，讓該位置的權重總和為 1。

除以 `sqrt(d_k)` 是為了控制內積隨維度增加的尺度；不能因此推論每一批分數都被精確標準化成固定分布。

## 3. Causal mask：訓練時不能看答案

預測下一個 token 時，位置 i 可以參考自己與之前的位置，但不能看見 i 之後的內容。以三個位置為例：

```text
        key 0  key 1  key 2
query 0   ✓      ×      ×
query 1   ✓      ✓      ×
query 2   ✓      ✓      ✓
```

在 softmax 前，把禁止位置的分數改為負無限大，對應的權重就會成為 0。若先 softmax 再只把部分權重歸零，剩下的數字通常不再加總為 1；若採那種方式，還需要重新正規化。

以下是需安裝 PyTorch 的獨立補充範例。它直接準備 Q、K、V，用來觀察遮罩，不含完整可訓練模組：

```python
import torch

q = torch.tensor([[1., 0.], [0., 1.], [1., 1.]])
k = q.clone()
v = torch.tensor([[2., 0.], [0., 4.], [6., 6.]])
t, d = q.shape
scores = q @ k.T / (d ** 0.5)
future = torch.triu(torch.ones(t, t, dtype=torch.bool), diagonal=1)
weights = scores.masked_fill(future, -torch.inf).softmax(dim=-1)
output = weights @ v
print(weights)
print(output.shape)  # torch.Size([3, 2])
```

第一列只能看第 0 個位置，所以權重應為 `[1, 0, 0]`。這是比「輸出看起來合理」更具體的檢查方式。

## 4. Multi-head 如何改變 shape？

一個 head 只提供一組投影與注意力分布。多個 head 讓模型同時使用多組表示空間，之後再把結果合併。

設總輸出維度 `D = H × d_h`，其中 `H` 為 head 數：

| 步驟 | Shape |
| --- | --- |
| 輸入／投影後 | `[B, T, D]` |
| 拆 head、轉置 | `[B, H, T, d_h]` |
| Attention scores | `[B, H, T, T]` |
| 各 head 輸出 | `[B, H, T, d_h]` |
| 轉回、串接 | `[B, T, D]` |
| 輸出投影 | `[B, T, D]` |

拆 head 時要確保 `D` 可被 `H` 整除。矩陣乘法的轉置針對最後兩個維度，不能把 batch 和 token 軸混在一起。

不同 head 可能學到不同模式，但沒有保證某個 head 一定專門負責文法或指代。Attention 權重也不等於模型完整的因果解釋。

## 5. Mask、dropout 與計算成本

Causal mask 規定能看見的範圍；dropout 則在訓練時隨機抑制部分值，兩者目的不同。Attention weights 經 dropout 後，單次結果的列和不一定仍為 1。推論時要切到 `eval()`，停用 dropout。

標準實作會形成 `[T, T]` 的分數矩陣，這部分的空間與運算隨序列長度呈平方成長。序列長度加倍，光是分數元素數量就會變成四倍；實際整體耗時仍受其他層與硬體影響。

## 6. 練習：讓未來資訊無法穿透

把範例第 2 個位置的 V 改成非常大的數字，第 0 個位置的輸出應保持不變。這個檢查直接對應 causal mask 的目的。

再手算：`B=2、T=5、D=12、H=3`，每個 head 的維度是多少？分數矩陣應為 `[2, 3, 5, 5]`，每個 head 的向量長度為 4。

## 延伸：Attention 怎麼用在更快的推論？

[GPT Fast 03：KV Cache](../gpt-fast/GPTFast03KVCache位置與遮罩.md) 利用 causal 結構重用前文 K、V，並解釋單 token query 的絕對位置遮罩；[GPT Fast 05：Attention 核心與 GQA](../gpt-fast/GPTFast05Attention核心與GQA.md) 再區分核心融合和架構改動，說明減少資料搬移的方法。

## 參考資料

對應 [Chapter 3 主程式](https://github.com/rasbt/LLMs-from-scratch/blob/main/ch03/01_main-chapter-code/ch03.ipynb)。本文的三位置範例另行設計，用於展示遮罩的效果。

## 系列導覽

[系列目錄](./LLM從零開始系列.md) · [上一篇](./LLM02文字資料Token與Embedding.md) · [下一篇：組裝 GPT](./LLM04從零組裝GPT模型.md)
