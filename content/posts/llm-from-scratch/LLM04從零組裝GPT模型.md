---
title: "LLM 從零開始 04：把 Attention 元件組成 GPT"
date: "2026-10-31"
description: "串起 LayerNorm、GELU、FeedForward、殘差連接與 Transformer block，追蹤 GPT 從 token IDs 到 vocabulary logits 的資料流。"
tags: [DL, LLM, PyTorch, GPT, Transformer]
---

## Attention 只是模型中的一部分

上一章讓 token 交換資訊，現在要把這個機制放進能反覆堆疊的模型。本篇對應 Chapter 4，目標是看懂 GPT 的組裝方式，以及輸出為什麼仍是一大塊數字。

## 1. 先看整條資料流

```text
token IDs [B, T]
  → token embedding + position embedding [B, T, D]
  → embedding dropout
  → 重複 N 次 Transformer block [B, T, D]
  → final LayerNorm [B, T, D]
  → vocabulary projection [B, T, V]
```

`B` 是 batch size、`T` 是序列長度、`D` 是 hidden dimension、`V` 是詞彙表大小。中間各 block 保持相同的輸入與輸出維度，才能堆疊並做殘差相加。

最後一軸的 V 個數字稱為 logits，是各候選 token 的未正規化分數。它們還不是機率，也不是 token ID。

## 2. LayerNorm 沿哪個方向計算？

對 `[B, T, D]` 的輸入，這裡的 LayerNorm 沿最後的 D 維計算平均與變異數：

```text
normalized = (x − mean(x)) / sqrt(var(x) + eps)
y = scale × normalized + shift
```

每個 token 的特徵向量各自正規化，不是把整個 batch 混在一起算。`scale` 和 `shift` 是可學習參數；加入它們之後，輸出不保證仍是平均 0、變異數 1。

自行實作時，也要注意變異數估計方式。使用母體形式計算時，PyTorch 可明確寫 `var(..., unbiased=False)`，避免小維度與權重相容性上的誤差。

## 3. FeedForward 為什麼先擴張再縮回來？

本系列採用的 GPT 類 feed-forward 子層，先把 D 維映射到 4D，經過 GELU，再映射回 D。GELU 提供非線性，避免連續線性層只等同於單一線性轉換。

以下是需安裝 PyTorch 的獨立補充範例，用內建層展示尺寸：

```python
import torch
from torch import nn

x = torch.randn(2, 5, 12)
ffn = nn.Sequential(
    nn.Linear(12, 48),
    nn.GELU(approximate="tanh"),
    nn.Linear(48, 12),
)
y = ffn(nn.LayerNorm(12)(x))
print(y.shape)  # torch.Size([2, 5, 12])
```

這裡每個位置使用同一套網路，位置之間不在此直接混合。跨位置資訊交換主要由 attention 處理，兩個子層各有工作。

## 4. 殘差連接讓子層學習修正量

採用 pre-norm 的 block 可以概括為：

```text
a = x + dropout(attention(layer_norm_1(x)))
y = a + dropout(feed_forward(layer_norm_2(a)))
```

注意第二段從 a 出發，不能又誤用最初的 x。兩次相加都要求尺寸相容。保留原表示的路徑，有助於深層網路中的資訊與梯度傳遞，但不會自動解決所有訓練問題。

完整 block 還包含 attention 內部的投影與 dropout。閱讀實作時，應逐項核對；上面的兩行只描述主要連接關係。

## 5. 生成下一個 token，使用哪個位置？

輸入 T 個 token，模型會產生 T 組 vocabulary logits。要接續整段前文時，取最後位置的那組分數：

```text
logits[:, -1, :] [B, V]
    → 選出 next token [B, 1]
    → 接回原序列 [B, T+1]
```

Greedy decoding 每次選最高分 token。它不需要先 softmax 才能 argmax，因為 softmax 不改變分數排序。若要依機率抽樣，才需要形成適當的機率分布。

超過 context length 時，簡單生成器可以只把最近的固定長度片段送入模型。這代表更早的內容不在這次輸入內；可學習位置 embedding 的索引也必須維持在表格範圍。

## 6. 有輸出，不代表有語言能力

此階段最有價值的成果是：shape 正確、前向計算可執行、生成迴圈可以串接。隨機初始化模型通常只會產生無意義的接續。

先用小設定檢查結構，例如 `D=12、H=3、N=2`。這些是方便理解的教學設定，沒有宣稱等同於任何預訓練模型。若要載入 GPT-2 權重，架構、bias、維度與權重排列都必須相容。

## 7. 練習與自我檢查

若 `B=2、T=5、V=100`，最後 logits 的 shape 是 `[2, 5, 100]`，接續文字使用 `[2, 100]`。試著解釋為什麼訓練時保留全部位置有用，而接續生成時只取最後位置。

另一個檢查是觀察 vocabulary projection：權重大小與 `D × V` 成正比。即使 block 數不多，詞彙表仍可能占用可觀參數與輸出記憶體。

## 延伸：從教學生成迴圈走到推論最佳化

這裡先用完整前文重算來建立觀念；實際增量生成可讀 [GPT Fast 03：KV Cache](../gpt-fast/GPTFast03KVCache位置與遮罩.md)。[GPT Fast 04：編譯](../gpt-fast/GPTFast04編譯與CUDAGraphs.md) 說明如何減少小操作的執行成本；[GPT Fast 05](../gpt-fast/GPTFast05Attention核心與GQA.md) 則特別比較本文 GPT-2 類元件與 Llama 類元件，避免把架構替換誤當等價加速。

## 參考資料

對應 [Chapter 4 主程式](https://github.com/rasbt/LLMs-from-scratch/blob/main/ch04/01_main-chapter-code/ch04.ipynb)。本文補充尺寸追蹤與小型 FFN 範例，完整 GPT 類別請搭配原 notebook 閱讀。

## 系列導覽

[系列目錄](./LLM從零開始系列.md) · [上一篇](./LLM03實作Attention機制.md) · [下一篇：預訓練與生成](./LLM05預訓練與文字生成.md)
