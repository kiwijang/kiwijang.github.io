---
title: "Nano-vLLM 02：多個請求來了，先處理誰？"
date: "2026-10-31"
description: "依 scheduler 原碼分析 prefill 優先、token 預算、分段 prefill、decode 選擇與記憶體不足時的搶占重算。"
tags: [DL, LLM, 推論加速, NanoVLLM, 排程]
---

## 先確認能算，再決定輪到誰

排程器不只是把前幾筆請求湊成清單。它還要確認本輪 token 工作量與 KV 容量。這把 [LLM 01 的逐步生成](../llm-from-scratch/LLM01認識大型語言模型.md) 和 [GPT Fast 03 的 cache 容量](../gpt-fast/GPTFast03KVCache位置與遮罩.md) 接成資源競爭問題。

## 1. 原碼先看 waiting，再看 running

查閱快照的 `schedule` 先從 waiting 頭部嘗試安排 prefill，只要選到任何 prefill，就直接回傳該批。沒有安排 prefill 才進入 decode 分支。[排程器原碼](https://github.com/GeeeekExplorer/nano-vllm/blob/main/nanovllm/engine/scheduler.py)

因此這不是同一步混合兩種工作，也不是無條件公平輪詢。持續有可接納的 prefill 時，既有 decode 可能延後，影響 inter-token latency。這是政策的可能結果，不是宣稱離線 benchmark 已測得特定飢餓時間。

Waiting 通常從隊首取，但搶占後的序列會放回隊首；不能把整個系統簡稱為嚴格依原始到達順序的 FCFS。

## 2. 序列數、token 數、block 數是三個限制

| 限制 | 管理的東西 |
| --- | --- |
| `max_num_seqs` | 本輪最多選多少序列 |
| `max_num_batched_tokens` | Prefill 分支安排的 token 工作量 |
| 可用 KV blocks | 請求能否配置或繼續延伸 |

這個快照的 decode 分支主要依序列上限與 `can_append` 選擇，不能把 prefill 的 token 預算敘述成兩個分支完全相同的檢查。

長 prompt 不一定能放進剩餘 token 預算，但「本輪算得下」和「整段 KV 配置得下」仍不同。BlockManager 接納時會檢查當前整段序列所需 blocks，而非只配置本輪 chunk 的空間。

## 3. 分段 prefill 如何前進？

若本輪第一個候選所需 token 超過剩餘預算，可先處理其中一段。後處理更新已快取長度，未處理完時不把本輪採樣結果當成正式輸出，下一輪繼續。

若本輪已有其他序列，遇到放不下的下一個候選則停止選擇。這是這份原碼的具體規則，並非任意請求都會被切成小段塞滿所有空隙。

分段可限制一次 prefill 的運算量，但本排程仍優先 prefill，所以不能自動宣稱它已改善所有 decode 等待問題。[GPT Fast 02](../gpt-fast/GPTFast02PrefillDecode與頻寬.md) 的階段差異，在這裡成為排程取捨。

## 4. 隊首放不下，可能擋住後面

Waiting 頭部若無法配置，該分支會 break，沒有一路掃描後面所有較小候選。這是 head-of-line blocking 的可能來源。

假設隊首 A 需要 5 個新 blocks，但只剩 3 個，後方 B 只需 2 個；選擇不跳過 A 可維持簡單隊列規則，卻可能少用部分容量。改成跳過也不是免費改善：大請求可能反覆被小請求超越，需要另訂公平性。

## 5. Decode 缺空間時，透過搶占回收

排程器從 running 頭部取請求，若無法 append，會優先從 running 尾部搶占其他序列；沒有其他候選時，可能搶占當前序列。被搶占者釋放 blocks、回到 waiting，之後重新 prefill。

這不是把 KV 自動交換到 CPU。保留的 token 歷史讓它可以重算；前綴快取若仍有效，可能省下一部分，但不能假設被釋放的所有 KV 永遠存在。

搶占提高容量周轉，代價可能是重算與尾端延遲。它也不是最短剩餘時間或最少重算成本的全域最佳選擇。

## 6. 練習與正確性

列出 A、B、C 的到達順序、prompt 長度、需要 blocks 與輸出上限，逐輪手算誰能進入批次。加入一個 block 不足事件，追蹤被搶占者是否保留正確 token 歷史。

重算後用 [GPT Fast 01](../gpt-fast/GPTFast01推論基準與正確性.md) 的 logits 方法比較相同前綴；用 [LLM 04](../llm-from-scratch/LLM04從零組裝GPT模型.md) 的位置概念確認沒有跳過尚未通過模型的 token。

## 系列導覽

[系列目錄](./NanoVLLM系列.md) · [上一篇](./NanoVLLM01請求生命週期.md) · [下一篇：動態批次](./NanoVLLM03動態批次與變長輸入.md)
