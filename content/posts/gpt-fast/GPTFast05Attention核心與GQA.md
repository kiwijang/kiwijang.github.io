---
title: "GPT Fast 05：Attention 核心、GQA，哪些改動保留同一個模型？"
date: "2026-10-31"
description: "比較手寫 attention、融合核心與 FlexAttention，理解 GQA 的 KV 節省，並區分 GPT-2 類與 Llama 類模型的架構差異。"
tags: [DL, LLM, PyTorch, 推論加速, GPTFast, Attention, GQA]
---

## 公式相同，不代表資料搬移方式相同

[LLM 03](../llm-from-scratch/LLM03實作Attention機制.md) 用 `softmax(QKᵀ / sqrt(d))V` 幫助理解。直接照式子建立完整中間張量很清楚，但不一定最有效率。這一篇先看運算核心，再區分會改變架構的 GQA。

## 1. FlashAttention 改善資料搬移，不是省略必要的關聯

完整 prefill 的分數矩陣有 token × token 的大小。一般實作若反覆把分數與權重寫入顯存，會產生很大流量。

FlashAttention 類方法透過分塊與線上 softmax 統計，減少中間矩陣的顯存讀寫。它針對 exact attention 的運算安排做改進，並不因此把完整 attention 的算術量變成線性，也不是預設只保留少數高分位置。[FlashAttention 原論文](https://arxiv.org/abs/2205.14135)

浮點重排仍可能帶來數值差異。驗證時先固定 Q、K、V 和遮罩，比較核心輸出；再把它放回模型檢查 logits，較容易定位問題。

## 2. SDPA 是介面，實際核心要看條件

PyTorch 的 `scaled_dot_product_attention` 提供高階介面，實際後端取決於裝置、dtype、shape、mask 與版本。呼叫這個函式，不代表每一種輸入都會走到同一個 FlashAttention 核心。

其布林 attention mask 中，True 表示允許參與，這和有些 API 的「True 代表要遮住」相反。`dropout_p` 也要明確設定，函式不會因為外層模組已 eval 就自動把非零 dropout 改成零。[SDPA 官方定義](https://docs.pytorch.org/docs/2.9/generated/torch.nn.functional.scaled_dot_product_attention.html)

這正好接續前一系列的遮罩範例：換 API 時要翻譯語意，不能原封不動搬一塊布林張量就認定相同。

## 3. 閱讀快照使用的是 FlexAttention

本系列固定版本的 `Attention.forward` 使用 `flex_attention` 搭配 `BlockMask`，並依 Q／KV head 數啟用 GQA。它不是把歷史介紹中的 SDPA 路徑直接保留到現在。[模型原碼](https://github.com/meta-pytorch/gpt-fast/blob/6ecad9b5b6b987d17ac4303965545873d0192086/model.py)

FlexAttention 讓遮罩與分數規則參與核心生成；BlockMask 描述可跳過或需計算的區塊。可表達稀疏規則，不表示任何稀疏寫法都會更快，建立遮罩本身也有成本。[FlexAttention 文件](https://docs.pytorch.org/docs/2.9/nn.attention.flex_attention.html)

在短序列或單步 decode，mask 準備和呼叫成本可能很顯眼；長 prefill 的主要收益則可能來自減少中間流量。仍需分階段量測。

## 4. GQA 減少的是 KV heads

標準 MHA 通常讓 Q、K、V 有相同 head 數。GQA 則讓多個 Q heads 共用較少的 K、V heads，MQA 可視為 KV 只有一個 head 的端點。[GQA 原論文](https://arxiv.org/abs/2305.13245)

```text
假設 Q heads = 32，KV heads = 8：
每 4 個 Q heads 共用一組 K、V
Q: [B, 32, T_query, d]
K: [B,  8, T_key,   d]
V: [B,  8, T_key,   d]
```

對相同層數、batch、長度、head dimension 和 dtype，KV 元素量會是 32 KV heads 設計的四分之一。這是 KV 部分的比例，不是整個模型記憶體或總耗時都變成四分之一。

如果為了相容運算，先把 K、V 實體複製回 32 heads，也可能吃掉流量優勢。應確認核心如何使用共享 KV，而不只看輸入宣告。

## 5. 不能把 MHA 權重直接刪成 GQA

GQA 是架構選擇。若 checkpoint 原本使用 MHA，直接刪除 K、V heads 會改變模型，不屬於單純的等價核心替換。模型轉換需要對應方法與品質驗證，不能宣稱免代價。

前一系列 [LLM 04](../llm-from-scratch/LLM04從零組裝GPT模型.md) 的 GPT-2 類設計與這裡的 Llama 類設計，還有以下差別：

| 元件 | 前一系列教學主線 | gpt-fast 閱讀快照 |
| --- | --- | --- |
| 位置資訊 | 可學習絕對位置 embedding | Q、K 上的 RoPE |
| Normalization | LayerNorm | RMSNorm |
| FFN | GELU 兩層投影 | SiLU 門控與三個投影 |
| KV heads | 多頭範例採相同數量 | 依設定採 MHA 或 GQA |

這些不是把原 GPT-2 改幾行就能無損加速的選項，而是載入不同模型時必須對齊的計算定義。

## 6. 正確性檢查從位置與 mask 開始

RoPE 要使用和 cache 位置一致的旋轉角度；通常先對新 K 施加位置旋轉再保存，不能下一步重複旋轉已保存的 K。也要檢查 Q／KV head 的分組、causal 可見範圍和 padding。

練習時，把同一組小 Q、K、V 交給手寫參考與目標核心。先測完整 causal prefill，再測帶絕對位置的單 token decode，最後測 GQA。逐項改動，比一次替換所有模型元件更容易找到差異來源。

## 系列導覽

[系列目錄](./GPTFast推論加速系列.md) · [上一篇](./GPTFast04編譯與CUDAGraphs.md) · [下一篇：量化與品質](./GPTFast06量化與品質驗證.md)
