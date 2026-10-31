---
title: "LLM 從零開始 05：預訓練、Loss 與文字生成"
date: "2026-10-31"
description: "理解 next-token cross-entropy、訓練與驗證迴圈、perplexity、temperature 和 top-k，並區分從零預訓練與載入既有權重。"
tags: [DL, LLM, PyTorch, GPT, 預訓練]
---

## 模型怎麼知道自己猜錯了？

現在 GPT 能輸出 logits，但還需要把分數和正確答案比對，才能更新權重。本篇對應 Chapter 5，串起 loss、反向傳播與評估，並討論生成設定如何影響輸出。

## 1. Cross-entropy 關心正確答案的機率

假設正確 token 被模型分配的機率是 p，該位置的負對數似然為 `−log(p)`。p 越小，懲罰越大；把所有有效位置的值平均，就是常見的 next-token loss。

以下是可獨立執行的 Python 補充範例：

```python
import math

for p in (0.8, 0.2):
    print(p, round(-math.log(p), 4))
# 0.8 0.2231
# 0.2 1.6094
```

這個目標不只問「最高分是不是答案」，也會考慮分配給答案的機率。因此兩個模型即使 argmax 都猜對，loss 仍可能不同。

## 2. 先對齊 shape，再計算 loss

模型輸出是 `[B, T, V]`，標籤是 `[B, T]`。把 batch 和時間軸攤平後，每一列就對應一次 V 類分類：

```text
logits  [B, T, V] → [B×T, V]
targets [B, T]    → [B×T]
```

以下片段需要已有的 `model`、`input_ids` 與 `target_ids`：

```python
import torch.nn.functional as F

logits = model(input_ids)
loss = F.cross_entropy(
    logits.flatten(0, 1),
    target_ids.flatten(),
)
```

`target_ids` 是整數類別索引。交叉熵直接接收 logits，不要先自行 softmax 再當成 logits 傳入。

另一個常見錯誤是重複位移：如果 Dataset 已經產生向後一格的標籤，loss 階段就不該再移一次，否則會變成預測後兩格。

## 3. 訓練迴圈的四個核心動作

以下片段假設已建立模型、optimizer 與 train_loader，且所有張量和模型都在相同裝置：

```python
model.train()
for input_ids, target_ids in train_loader:
    optimizer.zero_grad()
    logits = model(input_ids)
    loss = F.cross_entropy(logits.flatten(0, 1), target_ids.flatten())
    loss.backward()
    optimizer.step()
```

清梯度、前向計算、反向傳播、更新參數，構成一次學習步驟。PyTorch 會累加梯度，若不是有意做 gradient accumulation，就需要在合適時機清除。

評估時則使用 `model.eval()` 與 `torch.no_grad()`。前者切換 dropout 等層的行為，後者停止記錄梯度，兩者用途不同。評估後回到訓練前，記得恢復 `train()`。

## 4. Training loss 下降，還要看什麼？

訓練集上的 loss 下降，代表模型更能擬合那些資料。若驗證 loss 反而升高，可能出現過度擬合，或訓練與驗證資料分布不同，需要回頭檢查。

用自然對數交叉熵計算時，`perplexity = exp(loss)`。它可以幫助理解平均預測的不確定程度，但比較時要固定 tokenizer、資料與計分方式。換了切分單位，數值就不再適合直接橫向比較。

如果每個 batch 大小或有效 token 數不同，整體平均 loss 應依有效 token 數加權，而非不加思索地平均每個 batch 的平均值。

## 5. Temperature 和 top-k 改變的是解碼

Temperature 為正數時，先把 logits 除以它再 softmax。小於 1 通常使分布更集中，大於 1 使分布更平坦。`temperature=0` 不能直接套除法，實作需另行使用 greedy 分支等處理。

Top-k 則只保留分數最高的 k 個候選，再對保留候選抽樣。它和 temperature 可以一起使用，但都不會更新模型權重，也不保證答案更正確。

評估訓練效果時，應固定提示、seed 與解碼設定。否則文字差異可能來自抽樣，未必來自模型進步。

## 6. 從零訓練與載入權重，要分開紀錄

原章節也示範載入既有 GPT-2 權重。這能把「我寫的架構」和「已有語言能力的參數」接起來，但載入後的能力不能歸因於前面的小語料實驗。

儲存實驗時，除了模型權重，也應保留設定與 tokenizer 資訊。若要接續訓練，還要考慮 optimizer、scheduler 和隨機狀態；只存模型通常不足以精確還原中斷點。

## 7. 練習：設計一次能解釋的實驗

固定資料切分與生成提示，只改一個條件，例如訓練步數。比較訓練 loss、驗證 loss 與生成樣本，不要只挑最好看的一段。

再想一題：如果調低 temperature 後文字比較順，能否說模型學得更好？不能，因為這次改動發生在解碼階段，權重沒有更新。

## 延伸：解碼規則固定後，如何量測加速？

[GPT Fast 02：Prefill 與 Decode](../gpt-fast/GPTFast02PrefillDecode與頻寬.md) 拆解生成的兩種成本；[GPT Fast 06：量化](../gpt-fast/GPTFast06量化與品質驗證.md) 延用 loss／品質評估；[GPT Fast 07：推測解碼](../gpt-fast/GPTFast07推測解碼與分布.md) 解釋如何在保留目標採樣分布的條件下加速。最後可用 [GPT Fast 09](../gpt-fast/GPTFast09效能量測與實驗流程.md) 的欄位記錄公平比較。

## 參考資料

對應 [Chapter 5 主程式](https://github.com/rasbt/LLMs-from-scratch/blob/main/ch05/01_main-chapter-code/ch05.ipynb)。本文的數值例子與實驗判讀為補充，未重現原作者的訓練數據。

## 系列導覽

[系列目錄](./LLM從零開始系列.md) · [上一篇](./LLM04從零組裝GPT模型.md) · [下一篇：分類微調](./LLM06文字分類微調.md)
