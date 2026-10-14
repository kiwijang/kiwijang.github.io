---
title: "深度學習 06：NLP 與 Transformer 入門"
date: "2026-10-14"
description: "從 Bag of Words、TF-IDF 和詞向量認識文字表示，整理 RNN、LSTM、GRU、Transformer、BERT、GPT 與 CLIP 的分工。"
tags: [深度學習, DL, NLP, Transformer]
---

## 前言

圖片是像素，文字要怎麼放進神經網路？這篇先看文字的數值表示，再介紹序列模型與 attention。這邊是課程概念筆記，不是最新模型排行榜。

## 1. 文字表示先處理什麼？

NLP (Natural Language Processing) 面對的是有順序、上下文、多義與不同語言習慣的資料。同一個字出現在不同句子，意思可能不一樣。

Tokenization 把文字切成模型使用的單位。Token 可能是詞、子詞或其他片段，不一定等於中文字或英文單字。

## 2. Bag of Words 與 TF-IDF

Bag of Words 建立詞彙表，使用出現次數表示文件，通常忽略順序。「我不喜歡你」與相同詞集合的另一種排列，可能得到一樣的表示。

TF-IDF 再把文件內頻率與整個語料的稀有程度結合。常見基本概念為 `TF × IDF`，但 TF、平滑和 normalization 有不同定義。

例如 scikit-learn 的預設平滑 IDF 為:

```text
idf(t) = log((1+n)/(1+df(t))) + 1
```

加 1 等處理是具體實作的平滑方式，不是「為了避免 log(1)=0」這種普遍理由。應以工具使用的定義為準，見 [Feature extraction 官方文件](https://scikit-learn.org/stable/modules/feature_extraction.html#tfidf-term-weighting)。

清理文本時也要看任務。停用詞、標點與否定詞可能含有重要訊息，不必一律刪除。

## 3. Word2Vec、GloVe 與 embedding layer

| 方法 | 學習方式 |
| --- | --- |
| CBOW | 用附近上下文預測中心詞 |
| Skip-gram | 用中心詞預測附近上下文 |
| GloVe | 利用語料中的詞彙共現統計 |
| Embedding layer | 將 token ID 對應到可訓練向量 |

Word2Vec 和 GloVe 產生密集詞向量。相似語境的詞可能靠近，但每個詞通常有固定表示，尚未區分它在這一句的意思。

GloVe 的訓練會讓詞向量內積與偏置擬合 log 共現次數，不是直接用內積等於機率比值。簡報用機率比值說明設計動機，實際目標還要回到公式。

Transformer 的 token embedding 經過 contextual layers 後，才會得到依上下文改變的表示；單獨 embedding 查表本身不會理解整句。

## 4. RNN、LSTM 與 GRU

RNN 在時間步 t 使用本次輸入與前次 hidden state:

```text
h_t = f(W_x x_t + W_h h_(t−1) + b)
```

這讓模型有跨時間步的資訊，但長序列容易遇到梯度與記憶問題，計算也具有序列依賴。

LSTM 加入 cell state 與 forget／input／output gates。核心 cell 更新可以看成:

```text
c_t = f_t ⊙ c_(t−1) + i_t ⊙ g_t
h_t = o_t ⊙ tanh(c_t)
```

GRU 使用較簡化的門控結構。哪個比較快、效果比較好，要依資料、維度與實作測量，不是 GRU 永遠比 LSTM 差。

堆疊 recurrent layers 時，前一層通常需回傳完整時間序列，才能交給下一層。簡報中的 `return_sequences=True` 就是在處理這件事。

## 5. Transformer 與 attention

Attention 讓每個位置依相關性整合其他位置的資訊。常見 scaled dot-product attention 為:

```text
Attention(Q,K,V) = softmax(QKᵀ / sqrt(d_k))V
```

Q、K、V 由輸入投影而來。Multi-head attention 使用不同投影，再合併結果。沒有 recurrent 順序並不表示不需要位置資訊，模型仍須透過位置表示等設計取得序列結構。

原始 Transformer 的 encoder 產生一串位置相關表示，decoder 透過 cross-attention 使用它們，不是把整句硬壓成唯一一個 context vector。訓練的並行計算和自迴歸生成的逐步輸出也要分開，見 [Attention Is All You Need](https://arxiv.org/abs/1706.03762)。

## 6. BERT 與 GPT 的差異

| 模型家族 | 常見結構 | 本章介紹的訓練目標 |
| --- | --- | --- |
| 原始 BERT | Encoder | Masked LM、next sentence prediction |
| GPT 類自迴歸模型 | Decoder-only、causal attention | 預測下一個 token |

BERT 可用於分類、NER 等任務；GPT 類模型透過前文產生下一個 token，再把結果接回序列繼續生成。

BERT-base 的 hidden size 為 768，這不是所有 BERT 變體都固定的維度。原始 `[CLS]` 表示也不保證直接做 cosine similarity 就是良好的句子相似度工具，還要看是否為該任務訓練。

簡報列出的模型參數量有不同版本與未公開資訊，這裡不把未確認的規模當成規格，也不依參數量直接判定模型品質。

## 7. 生成採樣與 CLIP

Temperature 調整機率分布的尖銳程度；top-p 以累積機率選擇候選集合；是否抽樣則決定從分布取樣，還是採取其他解碼方式。它們影響輸出多樣性，不會讓模型知識自動變正確。

CLIP 將圖片和文字投影到可比較的向量空間。訓練提高配對圖文的相似度，並以同 batch 的其他配對作為對照，使用雙向對比損失。

相似度矩陣的目標是配對分數比不配對分數更有優勢，不是要求原始分數精確成為 identity matrix。原始 CLIP 的 text encoder 是 Transformer；不能把「可設計成 BERT」當成原論文實作，見 [CLIP 論文](https://arxiv.org/abs/2103.00020)。

可將類別名稱寫成提示文本，再與圖片比對做 zero-shot classification，也能做圖文檢索。Zero-shot 是對目標任務不另外訓練，不是模型從未看過圖文資料。

## 8. 課程練習與自我檢查

本章包含 embedding、RNN／LSTM／GRU、BERT／GPT 與序列資料 notebook。讀範例時先看 tokenizer、sequence length、padding／mask 與輸出 shape。

- Token embedding 和 contextual embedding 差在哪裡？
- Encoder 和 decoder 的 attention 可看範圍一樣嗎？
- CLIP 的向量比對和生成圖片是同一件事嗎？

## 資料來源

課程簡報: `Chapter 6 Intro to NLP.pptx`，第 1–63 頁。本文補充 IDF 實作差異與 Transformer／CLIP 的精確分工，未使用未公開模型參數量。

## 系列導覽

[系列目錄](./深度學習系列.md) · [上一篇](./深度學習05ResNet與特徵視覺化.md) · [下一篇](./深度學習07GAN與VAE及擴散模型.md)
