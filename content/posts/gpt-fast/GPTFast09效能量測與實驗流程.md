---
title: "GPT Fast 09：怎麼證明推論真的變快，而且沒有算錯？"
date: "2026-10-31"
description: "建立同步計時、warm-up、TTFT／TPOT、throughput 與記憶體的量測規則，檢查 gpt-fast 統計範圍並設計逐項最佳化實驗。"
tags: [DL, LLM, PyTorch, 推論加速, GPTFast, Benchmark]
---

## 最後交付的應該是一份能解釋的比較

前八篇各自減少不同成本，但最佳化不是把所有旗標打開就結束。最後要同時回答：輸出條件是否一致？哪個階段變快？品質是否符合要求？結果是否能重現？

這接續 [LLM 05 的實驗紀錄](../llm-from-scratch/LLM05預訓練與文字生成.md) 和 [LLM 07 的回答評估](../llm-from-scratch/LLM07指令微調與評估.md)，只是把訓練指標換成推論延遲、流量與品質。

## 1. GPU 非同步，計時前後要定義邊界

CPU 呼叫 GPU 操作時，通常只是提交工作。若立即停止 CPU 計時，可能只量到提交時間。

以下補充片段需要 CUDA 裝置、已 warm-up 的 `run_once`，以及同樣的工作負載。它量主機端觀察到的完成時間，不是完整服務延遲：

```python
import time
import torch

torch.cuda.synchronize()
start = time.perf_counter()
result = run_once()
torch.cuda.synchronize()
elapsed = time.perf_counter() - start
print(elapsed)
```

CUDA Events 適合量裝置 stream 上的區段，但與主機端計時的範圍不同。多 stream 或多卡還需明確管理依賴與各 rank 完成點。[CUDA 非同步與計時文件](https://docs.pytorch.org/docs/2.9/notes/cuda.html#asynchronous-execution)

不要為量測方便，在每個實際 token 中間插入全裝置同步，然後把被改變的流水線當成原本服務表現。

## 2. 冷啟動與穩態分開，warm-up 也要對題

載入模型、配置 cache、編譯、autotuning 和圖捕捉可能發生在第一次呼叫。應分別報告冷啟動與穩態，不把其中一邊的編譯時間混進比較。

Warm-up 要涵蓋實際使用的形狀、dtype、裝置與路徑。先暖過短 prompt，不代表另一個長度或不同 batch 不會重新編譯。記錄多次量測的中位數與分位數，也比只挑最快一次更有意義。

## 3. 檢查 gpt-fast 印出的數字代表什麼

快照的主迴圈包住整次 `generate` 計時，完成後才同步。因此顯示的 generated tokens/s 包含 prefill 等生成內部成本；不是獨立 decode 微基準。[計時原碼](https://github.com/meta-pytorch/gpt-fast/blob/6ecad9b5b6b987d17ac4303965545873d0192086/generate.py)

另外，分子使用 `y.size(-1) - prompt_length`，沒有乘 batch size。對一般固定長度批次，這比較接近每條序列的平均生成速率，而非全 batch 的合計 output throughput。若要計合計值，應按所有序列實際有效輸出 token 加總。

程式的 bandwidth 使用模型大小乘生成速率估算，且模型大小統計排除了 embedding；它不是硬體計數器量到的 HBM 流量。FLOPS 也使用簡化參數估算並納入整段 token 數，不能解讀成精確核心利用率。

這些數字可以輔助理解趨勢，但要帶著公式和範圍閱讀。

## 4. 固定長度測速與實際完成時間分開

基準常固定生成 N 個 token，方便比較相同工作量；實際回答可能遇到 EOS 提前結束。應記錄真正產生的有效 token，並明訂是否包含 EOS。

此快照的非互動路徑按要求長度執行；互動 callback 遇 EOS 主要停止後續顯示，不應直接假設計算也已同步停止。因此畫面上答案結束，不等於測到真正的停止生成延遲。

比較使用者體驗時，還要把 tokenization、排隊、網路、streaming 和文字輸出納入；比較 GPU 核心時則可另外隔離它們。兩種報告都合理，只要範圍寫清楚。

## 5. 用實驗矩陣逐項確認

| 階段 | 只改什麼 | 正確性檢查 | 主要效能觀察 |
| --- | --- | --- | --- |
| 參考路徑 | 不加新最佳化 | 模型／tokenizer／模板相容 | 原始延遲與品質 |
| KV cache | 重用前文 K、V | 固定前綴逐步 logits | Decode、cache 記憶體 |
| 編譯／核心 | 執行安排 | 相同狀態下數值誤差 | Warm-up、穩態、核心空隙 |
| 量化 | 權重表示 | 層輸出、logits、任務品質 | Prefill／decode、顯存 |
| 推測解碼 | 提案與驗證 | 接受／修正分布與 cache | 接受率、每輪有效輸出 |
| 多卡 | 權重分片與 collective | 單卡／多卡輸出 | 通訊時間、成本、容量 |

每階段至少涵蓋短／長 prompt、短／長輸出、需要的 batch，並保留相同 seed 與解碼規則。不同採樣實作消耗亂數不同時，不要求相同字串，改用相應分布與品質標準。

第一篇的分層也提醒我們：量化版和浮點版不必逐字相同，但 cache 或 mask 錯誤不能用「量化本來就有誤差」帶過。

## 6. 記憶體不是只看 checkpoint 大小

至少區分權重、KV cache、activation／workspace，以及配置器的 allocated 與 reserved。PyTorch 的 peak reserved 不等於純模型需要量，也不是整張 GPU 所有程序的占用。

每組實驗需明訂是否重設峰值統計、是否沿用已配置 buffers，必要時使用獨立程序比較，避免上一組的大 cache 影響下一組。量化和編譯也可能用容量交換速度。

## 7. 一份可直接採用的報告欄位

| 類別 | 應記錄內容 |
| --- | --- |
| 版本 | 原始碼 commit、模型版本、tokenizer、PyTorch／Triton／驅動 |
| 硬體 | GPU 型號與數量、顯存、互連、功率設定 |
| 工作量 | 實際 prompt IDs／長度、輸出上限、有效輸出數、batch／並行請求 |
| 推論設定 | Dtype、量化格式與 group size、cache 容量、編譯、採樣與停止規則 |
| 時間 | 載入、首次編譯、TTFT、TPOT、端到端、測量次數與分位數 |
| 產出 | 每序列速度、合計 output throughput、記憶體峰值 |
| 正確性 | 參考路徑、誤差指標／容忍度、測試集品質差異 |

專案 README 的歷史 benchmark 使用特定 A100 環境、batch size 1 與很短提示；不能拿其中一個速度當成所有電腦、長上下文或多使用者服務的預期。[固定版本 benchmark 說明](https://github.com/meta-pytorch/gpt-fast/blob/6ecad9b5b6b987d17ac4303965545873d0192086/README.md#benchmarks)

## 8. 實跑前，先處理這個快照的介面落差

第七篇已指出 `model_forward` 和帶 mask 的模型簽章不一致，這也影響沿用 helper 的評估整合。[eval.py](https://github.com/meta-pytorch/gpt-fast/blob/6ecad9b5b6b987d17ac4303965545873d0192086/eval.py) 還有 optional evaluator 的版本依賴。不能直接把舊 eval 指令當成已驗證的品質檢查。

應先建立可運作且數值可信的最小參考，再逐條整合功能。這份系列的成果是原碼閱讀與實驗方法；沒有實跑 GPU benchmark，也沒有宣稱此快照所有命令均能原樣成功。

理解推論加速，最有用的習慣是追問每一步省掉了哪一種成本，以及拿什麼證據確認模型仍在做預期工作。這樣換模型、硬體或推論引擎時，也能沿用同一套判斷方式。

## 系列導覽

[系列目錄](./GPTFast推論加速系列.md) · [上一篇](./GPTFast08多卡張量平行.md) · [回到 LLM 從零開始系列](../llm-from-scratch/LLM從零開始系列.md)
