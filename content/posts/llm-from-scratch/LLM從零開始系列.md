---
title: "[目錄]LLM 從零開始：用 PyTorch 拆解 GPT"
date: "2026-10-31"
description: "依 LLMs-from-scratch 七章主線，從 token、Attention 與 GPT 架構，學到預訓練、文字分類及指令微調。"
tags: [DL, LLM, PyTorch, Transformer]
---

## 為什麼想從零做一次 LLM？

呼叫模型產生文字，只需要準備提示；理解模型怎麼產生文字，卻得一路追到資料、矩陣與梯度。這個系列以 Sebastian Raschka 的 [LLMs-from-scratch](https://github.com/rasbt/LLMs-from-scratch) 為學習路線，用繁體中文重新整理每一章要解決的問題。

文章是原創概念筆記與補充範例，並非原書逐段翻譯，也不取代原書和完整 notebook。主線依序對應原專案 Chapter 1–7；附錄和 bonus material 留作延伸閱讀。

## 系列文章

| 章節 | 文章 | 讀完要能回答的問題 |
| --- | --- | --- |
| 01 | [認識大型語言模型與學習路線](./LLM01認識大型語言模型.md) | 預測下一個 token，為什麼能變成文字生成？ |
| 02 | [文字資料、Token 與 Embedding](./LLM02文字資料Token與Embedding.md) | 一篇文章如何變成模型的輸入和標籤？ |
| 03 | [從 Self-Attention 到 Multi-Head Attention](./LLM03實作Attention機制.md) | Q、K、V 怎麼混合上下文，又如何遮住未來？ |
| 04 | [把元件組成 GPT](./LLM04從零組裝GPT模型.md) | Attention 之外，一個 GPT 還需要哪些元件？ |
| 05 | [預訓練、Loss 與文字生成](./LLM05預訓練與文字生成.md) | 模型如何從文字學習，又如何衡量進步？ |
| 06 | [把 GPT 微調成文字分類器](./LLM06文字分類微調.md) | 同一個骨幹怎麼從接龍改成分類？ |
| 07 | [指令微調與回答評估](./LLM07指令微調與評估.md) | 如何讓模型學會依照指令輸出回答？ |

## 先備知識與環境

建議先熟悉 Python 函式、類別與陣列操作，再補上矩陣乘法、導數與梯度下降。PyTorch 至少要知道 `Tensor`、`nn.Module`、`backward()` 和 optimizer 的關係。需要回顧時，可以先讀站內的[深度學習系列](../DL/深度學習系列.md)。

環境安裝依原專案的 [setup](https://github.com/rasbt/LLMs-from-scratch/tree/main/setup) 進行；先確認 Python、PyTorch 與裝置相容，再執行所需章節。不同章節的下載和相依套件不同，不必一開始就把所有延伸實驗都跑完。

學習時建議保留以下紀錄：

- 原始碼版本：下載日期及 Git commit，避免後續更新讓結果對不上。
- 執行環境：Python、PyTorch 版本、CPU／GPU 和可用記憶體。
- 實驗設定：資料切分、seed、batch size、context length 與 learning rate。
- 判讀依據：訓練與驗證 loss，以及固定提示的生成結果。

小張量與小模型適合先在 CPU 驗證流程。載入預訓練權重或執行較大的微調實驗時，仍須依模型、序列長度與 batch size 估算記憶體及時間。

## 怎麼搭配原始碼閱讀？

每一章先讀本文的問題與資料流程，再開原專案對應的 `01_main-chapter-code` notebook。遇到程式碼時，先寫出輸入與輸出的 shape，再追計算，而不是只看變數名稱猜用途。

本文的小範例另外編寫，主要用來隔離一個觀念；標為「片段」的程式需要前文或原專案物件，不能單獨執行。文章未宣稱已在本機重跑模型訓練，亦不把原 notebook 的輸出當成本機實測。

## 接著讀：推論怎麼變快？

理解這七章後，可接續 [GPT Fast 推論加速系列](../gpt-fast/GPTFast推論加速系列.md)，研究 prefill／decode、KV cache、編譯、量化、推測解碼和多卡。它以另一個專案分析推論效率，也會區分 GPT-2 類與 Llama 類架構，並建立正確性與效能驗證方式。

## 來源與延伸

章節對應依據：[官方專案目錄](https://github.com/rasbt/LLMs-from-scratch#table-of-contents)，查閱日期為 2026-10-31。原著為 Sebastian Raschka，*Build a Large Language Model (From Scratch)*，Manning，2024。

完成主線後，可回頭補 [Appendix A：PyTorch](https://github.com/rasbt/LLMs-from-scratch/tree/main/appendix-A)、[Appendix D：訓練迴圈延伸](https://github.com/rasbt/LLMs-from-scratch/tree/main/appendix-D) 與 [Appendix E：LoRA](https://github.com/rasbt/LLMs-from-scratch/tree/main/appendix-E)。LoRA、DPO 和其他模型架構不是本系列七章的必要步驟。
