---
title: "LLM 從零開始 06：把 GPT 微調成文字分類器"
date: "2026-10-31"
description: "以垃圾簡訊分類理解 GPT 分類微調，拆解輸出頭、參數凍結、padding、讀取位置與 precision／recall 的判讀。"
tags: [DL, LLM, PyTorch, 微調, 文字分類]
---

## 不接下一個字，也能使用 GPT

語言模型已學會處理序列，我們可以把這種表示能力用在分類。本篇對應 Chapter 6：輸入一則簡訊，輸出垃圾訊息或正常訊息的分數。

這次改變的不只是訓練資料，連輸出頭和標籤的意義也不同。先把這些差別弄清楚，後面的訓練程式就容易理解。

## 1. 從 V 個 token 改成 C 個類別

原本模型把 D 維表示投影到 V 維詞彙表；分類任務把最後的投影改成 C 維。二元分類若使用 cross-entropy，可以輸出兩個 logits，搭配標籤 0 或 1。

```text
語言模型：hidden [B, T, D] → logits [B, T, V]
分類模型：hidden [B, T, D] → logits [B, T, C]
選定讀取位置後：classification logits [B, C]
標籤：每則文字一個類別 [B]
```

輸出兩個 logits 搭配 cross-entropy 是一種做法；單一 logit 搭配 binary cross-entropy 是另一種。不能把兩種標籤格式與 loss 任意混用。

## 2. 要讀哪個位置的表示？

在 causal 模型中，最後一個有效 token 可以參考整段有效前文；第一個位置則無法看見後面的內容。因此讀取位置本身就是模型設計的一部分。

右側 padding 後，`logits[:, -1, :]` 取到的是統一長度的最後位置，對短樣本可能是 padding 位置。原章節以這種固定末端位置建立分類流程；它可透過 causal attention 參考前文，但與「最後一個有效 token」不是同一種讀法。

若改成最後有效位置，必須依每筆長度 gather，並保持訓練和推論一致。以下是獨立的 PyTorch 補充範例，只展示取值：

```python
import torch

logits = torch.randn(2, 5, 2)  # [B, T, C]
lengths = torch.tensor([3, 5])  # 不含右側 padding，且皆大於 0
rows = torch.arange(logits.shape[0])
selected = logits[rows, lengths - 1]
print(selected.shape)  # torch.Size([2, 2])
```

這段假設是右側 padding，且長度已正確計算。左側 padding 或空字串需要另外處理，不能直接沿用索引。

## 3. 凍結哪些參數？

常見起點是先凍結骨幹，只訓練新分類頭，再依資源與驗證結果解凍部分層。原章節後續也更新最後一個 Transformer block 與 final normalization，讓高層表示適應分類任務。

以下片段需要原專案風格的 `model` 和對應設定，不能單獨執行：

```python
from torch import nn

for p in model.parameters():
    p.requires_grad = False

model.out_head = nn.Linear(embedding_dim, 2)
for p in model.trf_blocks[-1].parameters():
    p.requires_grad = True
for p in model.final_norm.parameters():
    p.requires_grad = True
```

新建立的分類頭預設可訓練。替換後應把模型移到目標裝置，並在參數集合確定後建立 optimizer，避免 optimizer 還持有舊輸出頭。凍結參數也不等於呼叫 `eval()`；兩者分別控制梯度與層的訓練行為。

## 4. 資料處理可能比多訓練幾輪更重要

同一則訊息的重複版本若跨越訓練與測試集，測試分數可能高估泛化能力。應先去重、檢查近似樣本，再依任務需求切分。

類別比例也會影響判讀。若資料九成是正常訊息，全部猜正常就有九成 accuracy，卻完全抓不到垃圾訊息。實際使用時要保留符合部署情境的測試分布。

長度截斷也是一種取捨。截得太短可能刪掉判斷線索；過長則增加計算與 padding。選擇上限時，應先看長度分布，再用驗證集比較。

## 5. Accuracy 之外，看誤判的代價

把垃圾訊息視為正類：

| 指標 | 問題 | 公式 |
| --- | --- | --- |
| Precision | 被判垃圾的訊息，有多少真的是垃圾？ | `TP / (TP + FP)` |
| Recall | 真正垃圾訊息，有多少被抓到？ | `TP / (TP + FN)` |
| F1 | Precision 和 recall 的調和平均 | `2PR / (P + R)` |

把重要通知誤判為垃圾，與漏掉一則廣告，成本未必相同。選門檻和模型時，應看混淆矩陣與錯誤樣本；門檻使用驗證集選擇，測試集留到最後報告。

## 6. 練習與自我檢查

固定資料與 seed，比較「只訓練分類頭」和「分類頭加最後一個 block」。記錄可訓練參數量、驗證 F1 與訓練時間，不預設解凍越多就一定更好。

再檢查同一則短訊息在訓練與推論時，是否使用相同 tokenizer、截斷長度、padding 和讀取位置。這些不一致，即使權重正確也會改變結果。

## 參考資料

對應 [Chapter 6 主程式](https://github.com/rasbt/LLMs-from-scratch/blob/main/ch06/01_main-chapter-code/ch06.ipynb)。最後有效 token 的 gather 與評估指標說明是本文補充，應和原章節固定末端讀取方式區別。

## 系列導覽

[系列目錄](./LLM從零開始系列.md) · [上一篇](./LLM05預訓練與文字生成.md) · [下一篇：指令微調](./LLM07指令微調與評估.md)
