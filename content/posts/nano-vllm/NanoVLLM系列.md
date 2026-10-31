---
title: "[目錄]Nano-vLLM：從單模型生成走向多請求推論"
date: "2026-10-31"
description: "以 nano-vllm 理解請求生命週期、排程、動態批次、分頁 KV cache、前綴共享與吞吐量和等待時間的取捨。"
tags: [DL, LLM, PyTorch, 推論加速, NanoVLLM]
---

## 三個系列，三個觀察尺度

[LLM 從零開始](../llm-from-scratch/LLM從零開始系列.md) 問的是模型如何把前文變成下一個 token；[GPT Fast](../gpt-fast/GPTFast推論加速系列.md) 問的是一次推論如何減少計算、搬移與啟動成本。這個系列以 [nano-vllm](https://github.com/GeeeekExplorer/nano-vllm) 為例，接著問：很多請求一起來時，誰能使用這些運算資源？

單次前向變快，不代表每個使用者都更快拿到答案。請求還會排隊，批次會變動，KV cache 會互相競爭容量。系統必須同時管理時間與記憶體。

## 系列文章

| 篇次 | 文章 | 學習問題 |
| --- | --- | --- |
| 01 | [請求生命週期與引擎](./NanoVLLM01請求生命週期.md) | 生成迴圈如何變成處理多請求的引擎？ |
| 02 | [排程、預算與搶占](./NanoVLLM02排程與搶占.md) | 多個請求來了，先處理誰？ |
| 03 | [動態批次與變長輸入](./NanoVLLM03動態批次與變長輸入.md) | 不同長度、不同位置的請求如何一起算？ |
| 04 | [分頁 KV Cache 與 Block Table](./NanoVLLM04分頁KVCache.md) | 每個請求的 KV 要放在哪裡？ |
| 05 | [Prefix Cache 與共享生命週期](./NanoVLLM05前綴共享與回收.md) | 相同前文能省下什麼，何時可回收？ |
| 06 | [動態批次下的 CUDA Graphs 與多卡](./NanoVLLM06執行核心圖與多卡.md) | 排程改變之後，如何仍有效執行？ |
| 07 | [吞吐量、等待時間與公平量測](./NanoVLLM07吞吐量與等待時間.md) | 為什麼總量提高，個別請求卻可能更慢？ |

## 原始碼與版本範圍

本文依 2026-10-31 查閱的 main 原碼整理，連結可能隨上游更新改變；不是固定 commit 的重現報告。實跑時應另存 `git rev-parse HEAD`、套件、驅動與模型版本，並核對本文提到的函式是否相同。

閱讀入口依序為 `llm_engine.py`、`sequence.py`、`scheduler.py`、`block_manager.py`、`model_runner.py` 和 `layers/attention.py`。這些檔案分別管理請求、進度、執行機會、記憶體所有權和實際運算，不能只讀 attention 核心就理解整個系統。

本快照支援分段 prefill；scheduler 優先選 prefill，該步有 prefill 就先返回，沒有在同一步混合 prefill 與 decode。本文把這個策略和一般可設計的替代策略分開說明。

## 怎麼閱讀與練習？

每篇先建立資料流，再追實際欄位，最後設計正確性或量測檢查。小算例另行編寫，主要使用純 Python，不是原專案 GPU 執行結果。各篇直接放入與前兩個系列的相關連結，不需另查對照表。

專案以精簡離線推論為主要入口；`add_request` 和 `step` 提供排程操作，不代表已具備 HTTP、串流回應、取消、租戶公平與完整服務監控。本文未部署服務、未下載權重，也未實跑 GPU benchmark。
