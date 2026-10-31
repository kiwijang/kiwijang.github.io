---
title: "GPT Fast 06：INT8、INT4，少搬權重如何換取速度？"
date: "2026-10-31"
description: "理解 weight-only 量化、scale、group size 與打包核心，區分儲存縮小和真正加速，建立量化誤差與任務品質的驗證方法。"
tags: [DL, LLM, PyTorch, 推論加速, GPTFast, 量化]
---

## 權重更小，先改善的是資料流量

第二篇提到，小 batch decode 常需要反覆讀大量權重。若把部分權重從 BF16 存成 INT8 或 INT4，就有機會少搬資料；但實際能否變快，還取決於解包、縮放和核心支援。

這和 [LLM 04 的參數矩陣](../llm-from-scratch/LLM04從零組裝GPT模型.md) 直接相關：線性層仍在做相同用途的投影，只是權重表示被近似。它不像編譯那樣主要重新安排運算，而會引入量化誤差。

## 1. 最簡單的量化與還原

對一組權重選 scale s，可用下列對稱形式理解：

```text
q = clamp(round(w / s), q_min, q_max)
w_hat = s × q
```

不同的浮點數可能落入同一個整數格，因此還原的 `w_hat` 通常不等於原始 w。Scale 太大，格子太粗；太小，較大的值會被截斷。

獨立純 Python 示意，刻意使用小整數範圍方便觀察，並非 gpt-fast 的完整量化格式：

```python
weights = [-1.0, -0.23, 0.42, 0.9]
scale = max(abs(w) for w in weights) / 7
quantized = [max(-7, min(7, round(w / scale))) for w in weights]
restored = [q * scale for q in quantized]
error = max(abs(a - b) for a, b in zip(weights, restored))
print(quantized)  # [-7, -2, 3, 6]
print(round(error, 4))  # 0.0557
```

本例只描述量化格點，沒有把兩個 4-bit 數字打包進一個 byte。存成 Python int 清單，並不會得到 INT4 的儲存優勢。

## 2. Weight-only 不是所有運算都變整數

Weight-only 量化主要壓縮權重，activation 可以維持 BF16 等浮點形式，運算時再處理權重還原與縮放。

gpt-fast 的 INT8 路徑採每輸出通道的 scale，INT4 則有分組參數與打包矩陣乘核心。從 Python 層看到權重 dtype 轉換，不代表編譯後一定完整展開一份大浮點權重；也不能反過來假設核心必定把所有還原工作完美融合。應以實際核心和 profiler 查證。[量化原碼](https://github.com/meta-pytorch/gpt-fast/blob/6ecad9b5b6b987d17ac4303965545873d0192086/quantize.py)

INT4 路徑使用底層打包 API，格式、對齊條件與可用裝置受版本影響。把 checkpoint 檔名改成 int4，不會自動產生正確的量化權重或運算模組。

## 3. Group size 在精度與中繼資料間取捨

如果一整列權重共用同一個 scale，少數離群值可能讓其他值的有效解析度變差。分組量化讓較小區塊各用自己的參數，通常能更貼合局部分布，但需要保存更多 scale／offset。

只看權重 payload，BF16 為每值 2 bytes，INT8 約 1 byte，INT4 約 0.5 byte。實際總量還包含 scales、zeros、padding、未量化層和打包格式，不能直接把整個模型記憶體除以二或四。

較小 group size 也不保證總是更快：中繼資料變多、讀取模式與核心效率都會改變。

## 4. 儲存縮小，為什麼仍可能變慢？

若目前瓶頸主要是核心啟動，權重縮小未必解決它；如果批次很大，浮點矩陣乘已能有效使用硬體，解包或不同核心也可能抵銷收益。

應至少分別比較 prefill 和 decode，再查看 batch、context 與裝置。第八篇的多卡也會改變每卡資料量與通訊占比，因此不能把單卡量化收益直接複製到多卡。

權重量化也不代表 KV cache 一起量化。第三篇的 cache 公式仍要帶入它實際的 dtype，否則會低估長上下文記憶體。

## 5. GPTQ 額外使用校準資訊

單純 round-to-nearest 主要根據權重範圍決定量化；GPTQ 類方法還使用校準輸入，協助減少量化造成的層輸出誤差。專案的 `GPTQ.py` 與相關 handler 提供這條延伸路徑。[GPTQ 實作入口](https://github.com/meta-pytorch/gpt-fast/blob/6ecad9b5b6b987d17ac4303965545873d0192086/GPTQ.py)

校準資料應與任務有合理關聯，且與最後品質測試分開。校準不是把原始精度全部找回來的保證，也不該用測試答案來挑選最漂亮的量化設定。

## 6. 量化驗證分成三層

先在小張量檢查打包、還原與線性層輸出，排除程式錯誤。再固定 token 前綴，比較完整模型的 logits 差異。最後在獨立任務資料測品質，必要時看 perplexity、格式符合率或人工評分。

這接回 [LLM 05 的 loss／perplexity](../llm-from-scratch/LLM05預訓練與文字生成.md) 和 [LLM 07 的回答評估](../llm-from-scratch/LLM07指令微調與評估.md)。要固定 tokenizer、資料與評分方式，並在任務容許的誤差內談加速。

不要要求量化模型逐 token 與浮點模型完全一致，也不要用「文字仍然通順」取代任務正確率。最後的報告應同時列出延遲、顯存與品質差異，才能做有根據的選擇。

## 系列導覽

[系列目錄](./GPTFast推論加速系列.md) · [上一篇](./GPTFast05Attention核心與GQA.md) · [下一篇：推測解碼](./GPTFast07推測解碼與分布.md)
