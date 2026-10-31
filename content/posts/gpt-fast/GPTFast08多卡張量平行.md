---
title: "GPT Fast 08：Tensor Parallelism，多張 GPU 如何共同產生一個 token？"
date: "2026-10-31"
description: "拆解線性層的輸出與輸入維度切分、all-reduce、QKV／FFN 分片和通訊成本，理解多卡容量與延遲的取捨。"
tags: [DL, LLM, PyTorch, 推論加速, GPTFast, TensorParallelism]
---

## 一個請求，也能由多張卡共同計算

資料平行把不同工作分給不同模型副本；tensor parallelism 則把同一層的矩陣切開，讓多張 GPU 合作完成一次前向。

先回顧 [LLM 04：模型組裝](../llm-from-scratch/LLM04從零組裝GPT模型.md) 的線性投影與 FFN。Tensor parallelism 改的是這些矩陣的儲存和計算分工，模型的邏輯維度與權重內容應維持一致。

## 1. 沿輸出維度切：每卡算不同特徵

用 PyTorch 的權重排列寫線性層：`Y = XWᵀ`，W 的 shape 是 `[out_features, in_features]`。

沿 W 的第 0 軸切分，各卡取得不同輸出特徵，輸入 X 可以相同。概念上把各卡結果串接，能還原完整 Y；若下一層能接著使用分片，則不必立刻實體串接。

gpt-fast 將這種切法稱為 colwise。名字容易和儲存軸混淆，因此讀程式時最好直接標註「切輸出維度」。[張量平行實作](https://github.com/meta-pytorch/gpt-fast/blob/6ecad9b5b6b987d17ac4303965545873d0192086/tp.py)

## 2. 沿輸入維度切：每卡算部分和

若沿 W 的第 1 軸切，X 也依輸入特徵切成相對應片段，各卡計算同一組輸出維度的部分和：

```text
Y = X0 W0ᵀ + X1 W1ᵀ
```

因此要用加總還原輸出，常見方式是 all-reduce。gpt-fast 稱這種切法為 rowwise。

獨立純 Python 算例，以一個輸出神經元展示部分和：

```python
x = [1, 2, 3, 4]
w = [5, 6, 7, 8]
full = sum(a * b for a, b in zip(x, w))
rank0 = sum(a * b for a, b in zip(x[:2], w[:2]))
rank1 = sum(a * b for a, b in zip(x[2:], w[2:]))
print(full, rank0 + rank1)  # 70 70
```

這是代數示意，沒有啟動分散式程序。真正實作還需同步、裝置和 dtype 正確。

## 3. Attention 與 FFN 怎麼接？

Attention 可把 Q、K、V 投影依 heads／輸出特徵切分，各卡先做自己的 attention，再於輸出投影後合併部分和。

FFN 的擴張層切輸出，縮回 hidden dimension 的層切輸入，能讓中間 activation 保持分片。對門控 FFN，兩個分支必須採相容切法，才能逐元素相乘。

第五篇提到 GQA；多卡切分時，不只 Q heads，KV heads 也要能符合分片條件。不能任意增加 GPU 數量，再假設每個 head 都能平均分。

量化模型更需要同步處理 scales、打包權重與分組邊界。只有浮點 weight shape 切對，不代表 INT4 的實體格式也正確。

## 4. 多卡省下權重流量，也增加通訊

單步時間可用下列方式思考：

```text
每卡本地計算與讀取 + 無法隱藏的 collective 通訊 + 其他同步成本
```

模型較大時，每卡只讀部分權重可能有幫助，也能讓原本放不下的模型執行。模型較小或單步工作很短時，all-reduce 的啟動與同步可能占很大比例。

NVLink、PCIe、跨機網路與拓樸都會影響結果。GPU 數量相同，不代表通訊成本相同；也不能用一台高速互連機器的結果，推論另一台的加速倍數。

## 5. 速度與效率要分開看

若單卡時間為 t1、n 卡時間為 tn，speedup 為 `t1/tn`，簡單平行效率為 `speedup/n`。

獨立純 Python 假設算例：

```python
single_ms, multi_ms, gpus = 20, 8, 4
speedup = single_ms / multi_ms
print(speedup, speedup / gpus)  # 2.5 0.625
```

四卡快了 2.5 倍，效率為 62.5%；還要考慮每請求 GPU 時間與成本。若單卡 OOM，就沒有這個單卡時間可當分母，應報告容量改善，不能捏造 speedup。

## 6. 驗證分片，先比較同一份權重

先在小模型上檢查切分後的權重能否重組回原值，再比較單卡和多卡的逐層輸出或 logits。Collective 的加總順序會影響浮點捨入，但 batch 軸消失或 head 對錯組，不是可用容忍度忽略的差異。

此快照還有需要檢查的具體位置：attention 的 forward 回傳 Tensor，但 TP hook 使用 `output[0]` 做 all-reduce，會先索引掉 batch 軸。Batch=1 時 broadcasting 可能掩蓋 shape 問題，不能因此當成一般 batch 的正確實作。

這是靜態閱讀發現的介面風險，並非本機多卡重現結果。若要實跑，應先對齊 hook 輸出 shape、模型設定與 cache 分片，再做數值測試。

## 7. 這個示範不等於完整分散式服務

原碼透過 torchrun 環境資訊與 NCCL 初始化。還使用 `os.uname` 等平台相依介面，因此不能把本工作區的 Windows PowerShell 當成已驗證可直接執行環境。

服務的請求排程、故障恢復與多租戶管理是後續工程；本篇先把單次前向中的矩陣分工說清楚。先有正確分片，再談多卡數字，才不會把多用了硬體誤當成必然收益。

## 系列導覽

[系列目錄](./GPTFast推論加速系列.md) · [上一篇](./GPTFast07推測解碼與分布.md) · [下一篇：量測與實驗流程](./GPTFast09效能量測與實驗流程.md)
