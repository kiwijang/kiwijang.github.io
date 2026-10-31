---
title: "GPT Fast 04：torch.compile 與 CUDA Graphs 怎麼縮短逐字等待？"
date: "2026-10-31"
description: "拆解 Python dispatch、核心融合與 CUDA Graph replay，說明固定形狀、同步點、首次編譯成本與 eager／compiled 正確性比較。"
tags: [DL, LLM, PyTorch, 推論加速, GPTFast, torchcompile]
---

## 運算很小時，叫 GPU 開始做事也要時間

[LLM 04](../llm-from-scratch/LLM04從零組裝GPT模型.md) 的 Transformer block 包含 normalization、投影、activation 和殘差相加。若每個小操作都由 Python 分別呼叫 GPU，逐 token 的小工作可能夾雜許多啟動空隙。

編譯和 CUDA Graphs 主要改善運算安排與啟動成本。它們不讓自迴歸依賴消失，也不自動減少模型層數。

## 1. torch.compile 可以改變哪些執行成本？

可把流程粗略理解為：擷取可追蹤的運算圖，再交給後端產生較有效率的執行方式。可能的收益包括減少 Python dispatch、融合逐元素操作、減少中間張量讀寫，以及挑選合適的核心。

例如 normalization、縮放和殘差附近的操作，若能融合，可能少寫幾次中間結果回顯存。但不是所有相鄰程式都會融合，更不是整個模型最後只剩一個核心。

`fullgraph=True` 要求被編譯區段能完整擷取，遇到無法處理的 graph break 時會失敗，而不是保證所有模型都可編譯。Shape、dtype、device 或程式條件改變，也可能觸發重新編譯。[PyTorch 2.9 compile 文件](https://docs.pytorch.org/docs/2.9/generated/torch.compile.html)

## 2. 為什麼先編譯單 token decode？

Prefill 的提示長度可能每次不同；單 token decode 的 token 軸通常固定為 1。若 KV buffer 容量也固定，反覆執行的運算更容易重用編譯結果。

gpt-fast 對 `decode_one_token` 使用 `mode="reduce-overhead"` 與 `fullgraph=True`，prefill 則有獨立的編譯選項。它把兩類工作分開處理，而非只對整個生成迴圈加一個裝飾器。[編譯入口原碼](https://github.com/meta-pytorch/gpt-fast/blob/6ecad9b5b6b987d17ac4303965545873d0192086/generate.py)

以下是示意片段，需要事先定義、且可被該環境編譯的 `decode_step`：

```python
import torch

compiled_step = torch.compile(
    decode_step,
    mode="reduce-overhead",
    fullgraph=True,
)
```

這不是可直接替換 gpt-fast 函式的完整程式；cache、mask 和位置仍要由呼叫端正確管理。

## 3. CUDA Graphs 重播的是什麼？

CUDA Graphs 可以記錄適合捕捉的一組 GPU 工作，再重播，以降低 CPU 逐項提交的成本。適合重複而穩定的工作，但需要遵守記憶體位址、形狀與控制流程等捕捉條件。

`reduce-overhead` 在條件允許時會使用 CUDA Graphs；不能只看到參數就宣稱一定捕捉成功。靜態 cache 有助於穩定儲存位置，但輸入 mutation、分支與其他操作仍可能影響捕捉。[CUDA Graphs 語意](https://docs.pytorch.org/docs/2.9/notes/cuda.html#cuda-graphs)

輸出 buffer 也可能被後續 replay 重用。若要保留每步結果，需確認生命週期，必要時在適當位置複製。原生成迴圈中的 clone 不能未經檢查就全部刪掉。

## 4. 把 GPU 數字拿回 Python，可能打斷流水線

GPU 操作通常非同步。若 Python 需要 `cuda_tensor.item()` 的值才能決定下一步，常要等待 GPU 算完。每步印出 token、搬回 CPU 解碼，也可能增加同步和輸出成本。

gpt-fast 使用不額外取回 CPU 標量的取樣技巧。對機率 p，各自抽獨立 `Exp(1)` 變數 e，再取 `argmax(p/e)`，可得到 categorical 樣本。它保留分布，但不保證與另一採樣器消耗同樣亂數或產生同樣序列。

這和 [LLM 05 的採樣設定](../llm-from-scratch/LLM05預訓練與文字生成.md) 有直接關係：換執行方式時，要先保留 temperature、候選篩選等機率規則，再討論採樣器的效率。

## 5. 首次編譯成本不能消失在報告裡

至少分開記錄載入、首次編譯／warm-up、穩態執行。若編譯成本是 C，每次請求省下 Δt，簡化回本請求數約為 `C / Δt`。

獨立純 Python 算例：

```python
import math

compile_seconds = 20
saved_seconds_per_request = 0.1
print(math.ceil(compile_seconds / saved_seconds_per_request))  # 200
```

這個估算未包含多種 shape 的重新編譯。只跑一次短工作，可能還沒回本；長時間固定工作負載則更容易攤提。

## 6. 怎麼驗證編譯版？

固定輸入 token 與狀態，比較 eager 和 compiled logits，並確認 cache 寫入內容。測試不同位置、長度邊界和重複請求，避免只在剛 warm-up 的那個形狀成功。

另外，快照中 `create_block_mask` 在模組層級就被 `torch.compile` 包裝。因此 `--no-compile` 不代表整個程序完全沒有編譯。若要建立完全 eager 的微基準，應另外明確設計參考路徑，而非直接替旗標取名字就當作實驗定義。

如果輸出與速度都符合預期，再用 profiler 看核心間空隙是否縮短。沒有這一步，也可能把頻寬瓶頸誤認成 Python 問題。

## 系列導覽

[系列目錄](./GPTFast推論加速系列.md) · [上一篇](./GPTFast03KVCache位置與遮罩.md) · [下一篇：Attention 核心與 GQA](./GPTFast05Attention核心與GQA.md)
