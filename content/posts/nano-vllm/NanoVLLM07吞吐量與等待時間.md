---
title: "Nano-vLLM 07：吞吐量提高，為什麼個別請求反而等更久？"
date: "2026-10-31"
description: "以批次算例區分合計 throughput、TTFT、TPOT 與排隊時間，分析 nano-vllm benchmark 的離線範圍並設計線上負載實驗。"
tags: [DL, LLM, 推論加速, NanoVLLM, Benchmark]
---

## 整體完成得多，不等於每個人都等得少

若 GPU 一次處理更多序列，能攤提權重讀取與啟動成本，合計 tokens/s 可能提高；但每一步本身可能更久，請求還可能花時間等待進入批次。

[GPT Fast 02](../gpt-fast/GPTFast02PrefillDecode與頻寬.md) 已區分合計吞吐量和逐字延遲；這裡加入到達、排隊、搶占和服務競爭。[LLM 05](../llm-from-scratch/LLM05預訓練與文字生成.md) 的固定實驗條件仍然適用，輸出長度與停止規則不能偷偷變更。

## 1. 一個算例，同時看到收益和代價

假設一條序列單獨 decode 每步 10 ms，四條一起每步 20 ms，每條各產生一個 token。忽略其他成本：

| 情境 | 每步時間 | 每步合計輸出 | 合計速度 | 每條 token 間隔 |
| --- | --- | --- | --- | --- |
| 單序列 | 10 ms | 1 | 100 token/s | 10 ms |
| 四序列批次 | 20 ms | 4 | 200 token/s | 20 ms |

合計吞吐量加倍，但每個人的 token 間隔也加倍。這些是假設值，不是 nano-vllm 實測。

獨立純 Python 核對：

```python
for batch, step_ms in [(1, 10), (4, 20)]:
    throughput = batch / (step_ms / 1000)
    print(batch, throughput, step_ms)
# 1 100.0 10
# 4 200.0 20
```

反過來，批次過小導致系統處理不完到達工作，排隊時間也可能大增。因此目標不是一律縮小批次，而是在負載下找到延遲與容量的平衡。

## 2. 把請求時間拆開記錄

```text
到達 → 等待接納 → prefill／可能分段與等待 → 第一個 token
     → decode／可能被其他工作延後或搶占 → 最後 token
```

TTFT 從到達算到首 token；TPOT 通常排除首 token，描述後續平均間隔；端到端則是整個請求完成時間。只量模型 prefill，不包含排隊，就不是使用者觀察的完整 TTFT。

分段 prefill 可能改善單次工作的可控性，卻不保證更小 TTFT；prefill 優先也可能讓 running 請求的 decode 暫停。這些必須用本系列第二篇的實際政策解釋。

## 3. 看分位數，別只看平均值

平均快，仍可能少數請求等很久。應報告 p50、p95、p99，並依 prompt 長度、輸出長度與是否被搶占分組。

若長請求一直被延後，短請求的漂亮平均數不能證明公平。也應記錄每筆等待輪數、搶占次數和重算 token 數，幫助辨認容量壓力與政策影響。

穩定系統可用平均在途請求數、到達率和平均停留時間的關係協助檢查；但系統已過載、佇列持續成長時，不該拿穩態假設硬算正常延遲。

## 4. bench.py 測的是離線整批完成

原 benchmark 產生一批隨機 token prompts，設定每筆輸出上限並忽略 EOS，warm-up 後計時整批 generate，以要求輸出總數除完成時間。[benchmark 原碼](https://github.com/GeeeekExplorer/nano-vllm/blob/main/bench.py)

這適合觀察固定工作量的離線 throughput，但沒有到達時間分布、逐請求首 token 時戳與串流交付。不能從這一個總數推得線上 p99 TTFT 或承諾多少使用者都不會超時。

隨機 token 也不是語意品質測試。與 vLLM 比較時需固定模型、dtype、版本、輸入與輸出長度、prefix cache 狀態和硬體設定；README 的特定硬體結果不能當作所有工作負載的排名。

## 5. 設計兩類不同的實驗

| 離線容量實驗 | 線上延遲實驗 |
| --- | --- |
| 一開始放入固定請求集 | 依時戳逐筆到達 |
| 量整批完成時間和 output tokens/s | 量排隊、TTFT、TPOT 和完成時間 |
| 固定生成數方便比較 | 明訂 EOS、逾時和取消規則 |
| 檢查冷／熱 prefix cache | 記錄到達率、突發與持續負載 |

線上實驗還需說明送出策略：固定速率到達，和前一筆完成才送下一筆，會產生不同壓力。只測後者可能掩蓋過載時的佇列增長。

[GPT Fast 09](../gpt-fast/GPTFast09效能量測與實驗流程.md) 的 GPU 同步、warm-up 和 allocated／reserved 區別繼續使用，另外增加排程與快取指標。

## 6. 品質也需要在資源壓力下檢查

用固定前綴 logits 比較獨立執行、混批、共享、被搶占後重算和 graph replay。這些情境不應讓請求讀到別人的上下文。

再依 [LLM 07 的任務評估](../llm-from-scratch/LLM07指令微調與評估.md) 檢查答案品質。效能測試的隨機 prompt 不能取代這一步；同 seed 在不同批次順序下也不保證抽到同字串，應先排除亂數順序影響。

## 7. 回到最初四個問題

誰先處理，由排程政策和資源可用性決定；誰能一起算，由執行路徑、預算與記憶體限制決定；KV 放哪裡，由 block table 和 slot mapping 決定；總量和等待的矛盾，則來自資源攤提、單步時間與排隊的共同作用。

理解引擎之後，觀察單位不再只是一個模型或一段回答，而是許多請求在同一組硬體上交錯前進的過程。

## 系列導覽

[系列目錄](./NanoVLLM系列.md) · [上一篇](./NanoVLLM06執行核心圖與多卡.md) · [LLM 系列](../llm-from-scratch/LLM從零開始系列.md) · [GPT Fast 系列](../gpt-fast/GPTFast推論加速系列.md)
