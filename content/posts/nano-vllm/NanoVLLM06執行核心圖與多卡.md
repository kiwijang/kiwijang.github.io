---
title: "Nano-vLLM 06：批次一直改變，CUDA Graphs 和多卡怎麼配合？"
date: "2026-10-31"
description: "追蹤 ModelRunner 的輸入準備、paged attention、圖捕捉批次分桶和多卡控制路徑，區分排程與核心最佳化。"
tags: [DL, LLM, PyTorch, 推論加速, NanoVLLM, CUDAGraphs]
---

## 排得好，還要把工作有效交給 GPU

Scheduler 決定執行對象；ModelRunner 把選中的請求轉成 GPU 張量與上下文。前者管理機會，後者管理實際執行，兩者不能互相取代。

[LLM 04](../llm-from-scratch/LLM04從零組裝GPT模型.md) 的模型前向仍是核心；[GPT Fast 04](../gpt-fast/GPTFast04編譯與CUDAGraphs.md) 的減少啟動成本，也能用在多請求引擎，只是 shape 不再永遠固定。

## 1. 先準備索引，再執行模型

Prefill 準備 token、positions、序列邊界與 slot mapping；decode 則準備各請求最後 token、context lengths 和 block tables。Context 把這些資訊交給各層 attention，執行後重設。

若 context 留下上一批的表格，即使模型權重完全正確，也可能讀錯資料。批次測試要包含長短交替、同大小但換請求，以及先有 prefix cache 再無命中的情境。[ModelRunner 原碼](https://github.com/GeeeekExplorer/nano-vllm/blob/main/nanovllm/engine/model_runner.py)

## 2. 分頁 attention 連接模型和記憶體管理

Attention 先將本輪 K、V 存到 slot mapping 指定處，再依 prefill／decode 路徑讀取。變長 prefill 使用序列邊界，decode 使用 cache 長度與 block tables。

正確性仍依賴 [LLM 03 的可見範圍](../llm-from-scratch/LLM03實作Attention機制.md)，核心選擇則延續 [GPT Fast 05](../gpt-fast/GPTFast05Attention核心與GQA.md) 的資料搬移觀念。Paged 配置與融合 attention 是兩種可組合的機制，不是同義詞。

## 3. 動態批次可以對應到幾種固定圖

原碼針對多種 decode batch sizes 捕捉 CUDA Graph。實際批次不是剛好那個大小時，找一個足夠大的已捕捉圖，複製有效輸入後 replay，再只取有效輸出。

例如實際 13 筆可能使用 16 的桶。多出列需要安全處理：slot mapping 的無效列設為 −1、context lengths 歸零，避免它們寫進活躍 cache。

這不會讓多餘運算完全消失，而是用一些 padding 工作交換穩定的圖重播與較少啟動成本。原碼的 prefill、enforce_eager 或較大批次另走非圖路徑，不能宣稱整個引擎始終在同一張圖裡執行。

## 4. 圖桶涵蓋範圍也是邊界條件

這份快照用一組小 batch 加上以 16 遞增的桶。若自訂 `max_num_seqs`，仍需確認有效批次都能找到不小於它的捕捉桶；例如非對齊上限不可只看設定可填就認為所有大小都覆蓋。

驗證要跨桶測試，並讓同一張圖先處理大批次再處理小批次。舊表格雖仍在 buffer 中，必須由本輪長度與有效列限制保證不可見。

## 5. 多卡需要一致的排程決定

ModelRunner 以多程序、NCCL 和控制訊息協作。Rank 0 把工作送給其他 rank，所有參與者需以一致順序執行模型與 collective；不是各卡自己從 waiting 取不同請求。

[GPT Fast 08](../gpt-fast/GPTFast08多卡張量平行.md) 解釋張量分片和 all-reduce。這裡再加一層：控制面的 seq metadata、positions 和 block tables 也必須一致，否則每張卡可能對不同邏輯 token 做同一個 collective。

KV head 數在每卡的分配也影響可用 blocks。多卡增加容量或頻寬，不代表通訊與排程管理沒有成本。

## 6. 分開測排程收益與核心收益

先固定請求批次，對比 eager 與 graph 路徑的 logits 和時間；再固定核心設定，改排程或 token 預算。一次更改全部條件，就無法知道改善來自哪裡。

此實作依賴 CUDA、Triton、FlashAttention 與相容分散式環境，不是已在本工作區原生 Windows 驗證的執行配方。本文只完成原碼分析，沒有 GPU 圖捕捉或多卡實測。

## 系列導覽

[系列目錄](./NanoVLLM系列.md) · [上一篇](./NanoVLLM05前綴共享與回收.md) · [下一篇：吞吐量與等待](./NanoVLLM07吞吐量與等待時間.md)
