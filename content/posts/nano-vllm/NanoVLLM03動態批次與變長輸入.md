---
title: "Nano-vLLM 03：哪些請求可以一起運算？"
date: "2026-10-31"
description: "理解迭代層級動態批次、變長 prefill 的 cumulative lengths，以及 decode 的位置、長度和 block table 如何隔離不同請求。"
tags: [DL, LLM, 推論加速, NanoVLLM, Batching]
---

## 批次不必等最長的請求結束才重組

靜態批次常把一組序列綁到整批完成；迭代層級動態批次則可在每輪重新選擇，移除完成者並接納其他工作。這通常稱為 continuous batching 的核心觀念。

但不要因此推論本專案的 `generate` 自帶持續網路流量：它的離線入口先加入整批請求。排程可逐輪變動，線上到達模型仍需另外建立。

[LLM 02](../llm-from-scratch/LLM02文字資料Token與Embedding.md) 用 `[B,T]` 理解批次；[GPT Fast 02](../gpt-fast/GPTFast02PrefillDecode與頻寬.md) 說明批次可攤提權重讀取。現在要處理的是 T 不同、進度也不同的序列。

## 1. 一起算，不代表彼此能看見

能使用相同模型和相容執行路徑的請求，還需通過序列數、token 預算與 KV 容量限制。不同 temperature 可以用每序列參數處理，不必因此各跑一次模型。

同批輸入的 token 可在記憶體中相鄰，但 attention 必須依序列邊界隔離。把 A 和 B 直接拼成一個普通 causal 序列，會讓 B 看見 A，是計算錯誤，不是 batching。

## 2. Prefill 使用壓平 token 與邊界資訊

ModelRunner 把本輪需處理的各段 token 壓成一列，另提供 cumulative sequence lengths。獨立純 Python 示意：

```python
segments = [[10, 11, 12], [20, 21]]
flat, offsets = [], [0]
for segment in segments:
    flat.extend(segment)
    offsets.append(len(flat))
print(flat)     # [10, 11, 12, 20, 21]
print(offsets)  # [0, 3, 5]
```

Offsets 告訴變長 attention 每個 query 段落的範圍。已有 prefix cache 時，新 Q 的長度和可讀 K 的長度不同，原碼分別準備 `cu_seqlens_q`、`cu_seqlens_k` 與 block tables。[輸入準備原碼](https://github.com/GeeeekExplorer/nano-vllm/blob/main/nanovllm/engine/model_runner.py)

這接回 [LLM 03 的 causal mask](../llm-from-scratch/LLM03實作Attention機制.md)：遮住未來之外，還需要隔離請求，並正確對齊已快取前綴的位置。

## 3. Decode 一列一個 token，歷史可以不同長

本輪 decode 對每個選中的請求取最後 token；positions 使用各序列的 `len(seq)-1`，context length 也各自保存。它們可以同批執行，但不是共享一個位置值。

例如 A 正在位置 10、B 正在位置 100，各自寫入不同實體 slot，讀取各自 block table。Batch row 的改變不應改變它們的 RoPE 位置和 KV 所有權。

[GPT Fast 03](../gpt-fast/GPTFast03KVCache位置與遮罩.md) 說明單序列絕對位置；這裡的延伸是同一輪有很多套獨立座標。

## 4. Prefill 與 decode 不必採同一種打包法

Prefill 可能一次處理很多新位置，decode 通常每序列一個新位置。原碼呼叫不同 attention 路徑，選擇也由 scheduler 的回傳旗標決定。[Attention 路徑](https://github.com/GeeeekExplorer/nano-vllm/blob/main/nanovllm/layers/attention.py)

混合 prefill／decode 批次是可研究的替代設計，但不應直接套在此快照上描述。本系列第二篇已說明它以 prefill 優先且分開回傳的方式安排。

## 5. 如何確認批次沒有改變語意？

用固定 token 前綴，比較單獨執行 A 與 A、B 同批時 A 的 logits；再交換順序、改變 B 的內容，檢查 A 不受其他請求語意影響。

不同核心 shape 可能有浮點誤差，採樣亂數順序也可能改變。因此先比較 logits，而非要求同 seed 的自由生成字串一定相同。這沿用 [GPT Fast 01 的正確性分層](../gpt-fast/GPTFast01推論基準與正確性.md)。

另外測一個請求剛完成、批次縮小、另一個新請求加入的邊界。最容易出錯的不是固定大 batch，而是列號與 cache 所有權改變的那一步。

## 系列導覽

[系列目錄](./NanoVLLM系列.md) · [上一篇](./NanoVLLM02排程與搶占.md) · [下一篇：分頁 KV Cache](./NanoVLLM04分頁KVCache.md)
