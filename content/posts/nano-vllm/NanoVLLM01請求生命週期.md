---
title: "Nano-vLLM 01：從生成迴圈到多請求引擎"
date: "2026-10-31"
description: "追蹤 Sequence、Scheduler、ModelRunner 與 postprocess，理解 token 已產生與 KV 已計算的差異，以及離線生成和線上服務的界線。"
tags: [DL, LLM, 推論加速, NanoVLLM]
---

## 模型之外，開始需要一份工作清單

[LLM 04](../llm-from-scratch/LLM04從零組裝GPT模型.md) 的生成迴圈關心下一個 token；[GPT Fast 02](../gpt-fast/GPTFast02PrefillDecode與頻寬.md) 再把工作分成 prefill 和 decode。多請求引擎把這兩種工作，放到許多獨立序列的生命週期中。

一個請求還沒結束，不代表每一輪都輪到它。引擎需要保存狀態，讓排程器決定本輪選誰，再交給模型執行。

## 1. 從 add_request 走到 step

`LLMEngine.add_request` 將文字編碼成 token，建立 Sequence 並加入等待佇列。`step` 選出一組序列、交給 ModelRunner、更新狀態，再收集完成的結果。[引擎原碼](https://github.com/GeeeekExplorer/nano-vllm/blob/main/nanovllm/engine/llm_engine.py)

```text
輸入 → token IDs → Sequence → waiting
                  ↓ scheduler
          本輪序列與 prefill/decode 類型
                  ↓ ModelRunner
                token IDs
                  ↓ postprocess
       更新進度／繼續執行／完成及釋放
```

模型不知道「這個使用者已經等了很久」。如果希望等待時間影響選擇，必須在排程政策和狀態中明確表達。

## 2. Sequence 保存的不只有字串

應特別區分三個欄位：`num_tokens` 是目前序列長度；`num_cached_tokens` 是已完成 KV 的前綴長度；`num_scheduled_tokens` 是本輪將處理多少 token。

剛採樣出的 token 已加入序列，但還沒當作下一輪輸入通過模型，因此不一定已有自己的 KV。這正是 [GPT Fast 03 的位置進度問題](../gpt-fast/GPTFast03KVCache位置與遮罩.md)，現在變成每個請求各自要保存的狀態。

`block_table` 指向實體 KV blocks；`seq_id` 則識別請求。批次順序改變後，不能拿 batch row 當成永久身分。[Sequence 定義](https://github.com/GeeeekExplorer/nano-vllm/blob/main/nanovllm/engine/sequence.py)

## 3. 狀態轉移比名稱更重要

主要狀態是 WAITING、RUNNING 和 FINISHED。WAITING 可能是新請求，也可能是記憶體不足後被搶占、等待重算的舊請求。

分段 prefill 尚未完成時，序列可能已經配置 blocks，卻仍在 waiting。不能把 waiting 解讀成「完全沒做過任何運算」，也不能把 running 解讀成「每一步一定執行」。

完成條件包含 EOS 與輸出長度上限。輸出 token 先更新，再檢查完成與釋放，這些操作的先後會影響 cache 邊界和結果長度。

## 4. 離線 generate 不等於線上串流

`generate` 先加入整批 prompts，再反覆呼叫 step，直到全部完成，最後依請求 ID 排序回傳。先完成的短請求，不代表呼叫端立刻從這個同步 API 收到結果。

若改建線上服務，需額外定義到達時間、結果交付、串流、取消和背壓。這些是延伸工程，不應從有 waiting queue 就推論它們已完整存在。

## 5. 練習：追蹤兩個長度不同的請求

讓 A 生成兩個 token、B 生成五個 token，逐輪記錄請求 ID、狀態、已採樣長度與已快取長度。A 完成後，確認 B 不會因批次列號改變而收到 A 的 token。

核對模型輸入時，延用 [LLM 02 的 token 邊界](../llm-from-scratch/LLM02文字資料Token與Embedding.md)；核對 logits 時，延用 [GPT Fast 01 的固定前綴比較](../gpt-fast/GPTFast01推論基準與正確性.md)。排程可改變執行順序，但不應改變請求身分和條件前文。

## 系列導覽

[系列目錄](./NanoVLLM系列.md) · [下一篇：排程與搶占](./NanoVLLM02排程與搶占.md)
