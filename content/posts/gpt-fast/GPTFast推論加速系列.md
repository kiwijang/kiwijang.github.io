---
title: "[目錄]GPT Fast 推論加速：理解正確的推論怎麼變快"
date: "2026-10-31"
description: "以 gpt-fast 拆解 prefill、decode、KV cache、編譯、Attention、量化、推測解碼與多卡推論，同時建立正確性及效能驗證方式。"
tags: [DL, LLM, PyTorch, 推論加速, GPTFast]
---

## 從「模型怎麼運作」走到「推論怎麼變快」

[LLM 從零開始系列](../llm-from-scratch/LLM從零開始系列.md) 建立了文字、Attention、GPT 和訓練的資料流。這次沿著 [meta-pytorch/gpt-fast](https://github.com/meta-pytorch/gpt-fast) 研究另一個問題：已經有模型權重後，怎麼減少產生答案的時間，而且知道自己沒有把推論算錯？

本系列依加速機制安排九篇，並非專案原有章節。每篇都交代瓶頸、改動、正確性條件與適用範圍；與前一系列相關的地方，直接放在該篇正文中。

## 系列文章

| 篇次 | 文章 | 核心問題 |
| --- | --- | --- |
| 01 | [推論基準與正確性的三種層次](./GPTFast01推論基準與正確性.md) | 變快前，究竟要保留什麼？ |
| 02 | [Prefill、Decode 與記憶體頻寬](./GPTFast02PrefillDecode與頻寬.md) | 首字慢與逐字慢，是同一個瓶頸嗎？ |
| 03 | [KV Cache、位置與遮罩](./GPTFast03KVCache位置與遮罩.md) | 如何省掉前文重算，又不讀到錯誤快取？ |
| 04 | [torch.compile 與 CUDA Graphs](./GPTFast04編譯與CUDAGraphs.md) | 如何減少 Python 和核心啟動的成本？ |
| 05 | [Attention 核心、GQA 與模型差異](./GPTFast05Attention核心與GQA.md) | 哪些是運算實作改進，哪些會改變架構？ |
| 06 | [INT8、INT4 與量化誤差](./GPTFast06量化與品質驗證.md) | 少搬權重為什麼可能更快，品質如何確認？ |
| 07 | [Speculative Decoding 的接受與修正](./GPTFast07推測解碼與分布.md) | 小模型先猜，如何仍保留目標分布？ |
| 08 | [Tensor Parallelism 與通訊成本](./GPTFast08多卡張量平行.md) | 多張卡為什麼不保證等比例加速？ |
| 09 | [建立可重現的效能與品質報告](./GPTFast09效能量測與實驗流程.md) | 如何證明改動有用，而且比較公平？ |

## 閱讀版本與來源範圍

查閱日期為 2026-10-31。為避免 main 更新造成敘述漂移，原始碼連結固定在 [commit 6ecad9b5b6b987d17ac4303965545873d0192086](https://github.com/meta-pytorch/gpt-fast/tree/6ecad9b5b6b987d17ac4303965545873d0192086)。這是本系列的閱讀快照，並非宣稱所有功能都已通過本機測試。

搭配閱讀的 [PyTorch 官方介紹](https://pytorch.org/blog/accelerating-generative-ai-2/) 最初發表於 2023 年；它說明設計脈絡，但與此快照並非完全相同的程式。尤其快照中的 Attention 已使用 FlexAttention，不能照舊文章推論它仍是同一條 SDPA 實作路徑。

API 語意補充引用可查閱的 PyTorch 2.9 版文件；那是文件參考版本，不代表此專案已驗證的完整環境配方。程式包含內部 API 與版本相依設定，執行前需固定 PyTorch、Triton、驅動和模型版本。

## 原始碼閱讀入口

| 檔案 | 先找的地方 |
| --- | --- |
| `generate.py` | `prefill`、`decode_one_token`、`generate`、計時迴圈 |
| `model.py` | `KVCache`、`setup_caches`、`Attention.forward` |
| `quantize.py` | weight-only INT8 與 INT4 的儲存和運算 |
| `tp.py` | 權重切分與 all-reduce |
| `eval.py` | 評估整合與版本相容性 |

這個專案提供精簡的效能示範。多使用者服務所需的排程、continuous batching、隔離與完整請求生命週期，不是本系列從原碼直接推得的既有能力。

## 一個需要先知道的版本落差

快照中 `Transformer.forward(mask, idx, input_pos)` 需要 mask，但 `generate.py` 的 `model_forward` 仍呼叫 `model(x, input_pos)`。這會影響沿用該 helper 的推測驗證與評估路徑。第七、九篇會具體說明，不能把 README 的功能清單當作這個快照每條路徑都能直接執行的證據。

文章內的小範例為另行編寫。純 Python 算例可以獨立執行；有 PyTorch、CUDA 或模型需求的片段會註明前提。本文未下載大模型或實跑 GPU 效能，不把推估值與原作者 benchmark 寫成本機實測。
