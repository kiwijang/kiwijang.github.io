---
title: "LLM 從零開始 02：文字資料、Token 與 Embedding"
date: "2026-10-31"
description: "拆解 tokenizer、BPE、滑動視窗、Dataset 與 embedding，透過 token ID 小範例理解 next-token 標籤與張量尺寸。"
tags: [DL, LLM, PyTorch, Tokenization]
---

## 模型看到的不是一篇文章

一篇文章要送進 GPT，會先經過切分、編號、分段與查表。本篇對應 Chapter 2，重點是把這條資料管線說清楚：我們不是把文字直接轉成「意義」，而是建立能透過訓練調整的數值表示。

## 1. Tokenizer 決定切法，也決定編號

最直覺的 tokenizer 可以先按空白與標點切分，再建立字串到整數的字典。但新文字可能含有字典裡沒有的詞，這時就需要未知 token 或更細的切分方式。

BPE 的基本想法，是反覆合併常見的相鄰單位，形成可重複使用的片段。GPT-2 使用 byte-level BPE；實際切分還涉及預處理與合併規則，不等於把所有文字直接照空白切開。

Token ID 只是查表索引。假設「雨」的 ID 比「晴」大，不代表雨比較強，也不代表兩者的語意距離可用 ID 相減求得。

Tokenizer 必須和模型使用的詞彙表相容。換一套 tokenizer，即使詞彙表大小相同，ID 的意義也可能不同。

## 2. 下一個 token 的標籤怎麼產生？

先不用真實文字，假設 tokenizer 已產生這串 ID：

```text
10, 21, 32, 43, 54, 65
```

取長度 4 的輸入，標籤就取向後移動一格的四個 ID：

```text
input:   10, 21, 32, 43
target:  21, 32, 43, 54
```

每個位置都提供一個預測任務。第一格根據 `10` 預測 `21`，第二格根據 `10, 21` 預測 `32`。模型是否真的只能看見前文，還要靠下一章的 causal mask 保證。

以下是可獨立執行的 Python 補充範例，不需要下載資料或安裝 PyTorch：

```python
ids = [10, 21, 32, 43, 54, 65]
length, stride = 4, 1

for start in range(0, len(ids) - length, stride):
    x = ids[start:start + length]
    y = ids[start + 1:start + length + 1]
    print(x, "->", y)
```

預期會得到兩組樣本，起點分別為 0 和 1。尾端不足 `length + 1` 的部分在這個例子中直接略過。

## 3. Context length、stride 與 batch size

| 設定 | 改變的東西 | 容易誤會的地方 |
| --- | --- | --- |
| Context length | 每組輸入包含多少位置 | 不等於模型的總知識量 |
| Stride | 下一個視窗的起點移動幾格 | 越小代表重疊越多，不保證更好 |
| Batch size | 一次送入多少組樣本 | 不會增加單一樣本可看見的前文 |

`Dataset` 定義如何取出一組輸入與標籤；`DataLoader` 再負責分批、洗牌等工作。設 `B` 為 batch size、`T` 為序列長度，輸入和標籤通常都是 `[B, T]`。

切分訓練集與驗證集時，要留意重複和視窗重疊。若先做高度重疊的視窗再隨機切分，相似內容可能流入兩邊，讓驗證結果過度樂觀。較穩妥的起點是先依文件或文字區段切分，再分別建立視窗。

## 4. Embedding 是可訓練的查表

詞彙表有 `V` 個 token、每個向量長度為 `D`，token embedding 的權重形狀就是 `[V, D]`。把 `[B, T]` 的 ID 送進去，得到 `[B, T, D]`。

```text
token IDs          [B, T]
token embedding    [B, T, D]
position embedding [T, D]
兩者相加後          [B, T, D]
```

同一個 token 在查表這一步會取得同一個向量。經過後續 attention 層，它的表示才會依上下文而改變。

位置向量則提供順序資訊。這裡採用 GPT-2 類的可學習絕對位置 embedding；其他架構也可能採用不同設計，不宜把這種加法視為所有 LLM 的共同規格。

## 5. 動手檢查 shape

以下是需安裝 PyTorch 的獨立補充範例，使用虛構 ID，沒有真實 tokenizer：

```python
import torch
from torch import nn

ids = torch.tensor([[10, 21, 32, 43], [21, 32, 43, 54]])
token_table = nn.Embedding(100, 8)
position_table = nn.Embedding(4, 8)
positions = torch.arange(ids.shape[1])
x = token_table(ids) + position_table(positions)
print(x.shape)  # torch.Size([2, 4, 8])
```

這裡的向量是隨機初始化值。列出 shape 可以驗證資料接得起來，不能證明它已學會語意。

## 6. 練習與自我檢查

把第一個範例的 stride 改成 2，手算還有幾個完整視窗；再試著把輸入長度改成 3。若希望得到 4 個 token 的輸入與 4 個標籤，原資料至少需要 5 個 token。

最後問自己：當 tokenizer 切法改變，哪些部分需要一起檢查？至少包括 ID 對應、embedding 詞彙表、輸出頭和解碼方式。

## 延伸：Tokenizer 一致，推論比較才有意義

[GPT Fast 01](../gpt-fast/GPTFast01推論基準與正確性.md) 說明為什麼相同可見文字未必代表相同模型輸入；[GPT Fast 07：推測解碼](../gpt-fast/GPTFast07推測解碼與分布.md) 則進一步要求 draft 與 target 使用相容 token 空間，才能對同一事件比較機率。

## 參考資料

對應 [Chapter 2 主程式](https://github.com/rasbt/LLMs-from-scratch/blob/main/ch02/01_main-chapter-code/ch02.ipynb) 的文字資料處理流程。本文的數字視窗與小型 embedding 範例為額外編寫。

## 系列導覽

[系列目錄](./LLM從零開始系列.md) · [上一篇](./LLM01認識大型語言模型.md) · [下一篇：Attention 機制](./LLM03實作Attention機制.md)
