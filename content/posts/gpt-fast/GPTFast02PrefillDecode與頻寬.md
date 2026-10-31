---
title: "GPT Fast 02：Prefill、Decode，先找出推論慢在哪裡"
date: "2026-10-31"
description: "區分首字延遲與逐字解碼，使用算術強度及頻寬下界理解小 batch 的 decode 瓶頸，避免以單一 tokens/s 解讀所有情境。"
tags: [DL, LLM, PyTorch, 推論加速, GPTFast]
---

## 同一個模型，兩種不同的工作量

[LLM 04](../llm-from-scratch/LLM04從零組裝GPT模型.md) 描述「讀前文、預測下一個 token、再接回去」的生成流程。gpt-fast 把它拆成 `prefill` 和 `decode_one_token`：先處理提示，再逐步接續。這個拆分是理解瓶頸的起點。[生成流程原碼](https://github.com/meta-pytorch/gpt-fast/blob/6ecad9b5b6b987d17ac4303965545873d0192086/generate.py)

## 1. Prefill 把整段提示轉成可延用狀態

提示有 P 個 token 時，prefill 一次處理這 P 個位置，建立各層 K、V，並從最後位置的 logits 取出第一個新 token。

多個位置可共享一次權重讀取所支持的矩陣運算，通常比一次只算一個位置更能發揮 GPU 的矩陣吞吐。長提示也會增加 attention 工作，因此不能把 prefill 當成固定成本。

使用者感受到的 TTFT（time to first token）還可能包含排隊、tokenization、資料搬移與首次編譯。要說清楚是在量模型 prefill，還是在量完整服務的首字延遲。

## 2. Decode 通常一次只加入一個位置

有 KV cache 後，每個 decode step 只對新輸入 token 做投影與各層計算，再讀取先前 K、V。自迴歸依賴仍然存在：一般解碼要先取得上一個輸出，才知道下一步輸入。

batch size 很小時，線性層的工作接近矩陣乘向量。雖然 FLOPs 比長 prefill 少，仍可能需要大量讀取權重；GPU 的運算單元不見得能一直滿載。

因此「GPU 算力很高，為什麼一秒只產生這些 token？」可能問錯了限制：瓶頸有時在資料搬移、核心啟動或同步，而不是乘加能力。

## 3. 用下界估算，不把估算當實測

設每步實際需要從顯存搬移的資料為 W bytes，有效頻寬為 BW bytes/s，單看這部分：

```text
搬移時間至少約為 W / BW
步驟時間下界約為 max(必要 FLOPs / 有效算力, 必要 bytes / 有效頻寬)
```

這是簡化的 roofline 思考。還沒計入核心啟動、通訊、採樣、KV 存取與無法重疊的成本；快取命中也會影響真正的顯存流量。

以下為獨立純 Python 算例，數值刻意假設，不對應任何實測 GPU：

```python
bytes_per_step = 14e9
effective_bandwidth = 1e12
seconds = bytes_per_step / effective_bandwidth
print(round(seconds * 1000, 2), "ms")  # 14.0 ms
print(round(1 / seconds, 2), "steps/s")  # 71.43 steps/s
```

這能解釋少搬權重的動機，但不能拿 71.43 當成裝置保證值。量化後每步流量可能降低，也會增加解包與縮放成本。

## 4. Batch 變大，限制可能跟著改變

同時處理多條序列，可以攤提權重讀取，增加算術強度；但 KV cache、activation 與排程需求也會增加。總 throughput 變高，不代表單一使用者的下一個 token 等待時間一定降低。

長上下文 decode 則會讀取更多 KV。當上下文越來越長，原本主要受權重頻寬限制的工作，也可能逐漸受到 KV 流量與 attention 計算影響。

不能把「decode 常受頻寬限制」簡化成所有模型、硬體與 batch 下都只受頻寬限制。[官方加速文章](https://pytorch.org/blog/accelerating-generative-ai-2/) 提供了這類瓶頸分析的歷史脈絡。

## 5. 用不同指標描述不同感受

| 指標 | 想知道什麼 |
| --- | --- |
| TTFT | 多久看到第一個輸出？ |
| Inter-token latency | 之後每個 token 等多久？ |
| TPOT | 第一個 token 之後，平均每個輸出 token 花多久？ |
| End-to-end latency | 整段回答多久完成？ |
| Aggregate output throughput | 所有請求合計每秒輸出多少 token？ |

若一個請求產生 N 個 token，可用 `(總生成時間 − 首 token 時間)/(N−1)` 估算 TPOT，但要確保兩個時間的起點與範圍一致，且 N 大於 1。

gpt-fast 的示範計時包住整次 `generate`，包括 prefill；不能把顯示的 tokens/s 直接反推成純 decode latency。第九篇會回頭拆解這段統計。

## 6. 練習：同一個最佳化，為什麼兩種結果？

設計短提示／長提示、短回答／長回答四組工作負載。若最佳化只改善 decode，長回答通常更容易看見整體收益；短回答且長提示的任務，改善可能被 prefill 蓋過。

這也接回 [LLM 05 的實驗觀念](../llm-from-scratch/LLM05預訓練與文字生成.md)：固定問題與生成規則後，才能判斷改動的效果。

## 系列導覽

[系列目錄](./GPTFast推論加速系列.md) · [上一篇](./GPTFast01推論基準與正確性.md) · [下一篇：KV Cache](./GPTFast03KVCache位置與遮罩.md)
