---
title: "Nano-vLLM 05：相同前文的 KV 能共用嗎？"
date: "2026-10-31"
description: "拆解完整 block 的 prefix cache、鏈式雜湊、引用計數與閒置回收，理解快取命中和實際顯存節省的差別。"
tags: [DL, LLM, 推論加速, NanoVLLM, PrefixCache]
---

## 一樣的系統提示，不必每次從頭算

多個請求可能共享固定系統提示或文件前綴。若模型、token、位置和其他影響計算的條件一致，這部分 K、V 就有重用機會。

這延伸 [GPT Fast 03 的單請求 KV 重用](../gpt-fast/GPTFast03KVCache位置與遮罩.md)，但變成跨請求共享。相同可見文字是否真是相同 token，仍要回到 [LLM 02](../llm-from-scratch/LLM02文字資料Token與Embedding.md) 的 tokenizer 與模板。

## 1. 相同區塊內容，不一定有相同 KV

後面的 hidden states 依賴前面的內容，所以只對目前 block 的 token 雜湊還不夠。原碼把上一段的 hash 納入下一段，表達「整條前綴路徑」。

例如 `甲→共同句` 與 `乙→共同句`，共同句字面一樣，上下文卻不同。不能因為當前 block tokens 相同，就直接共享它的 KV。[BlockManager 原碼](https://github.com/GeeeekExplorer/nano-vllm/blob/main/nanovllm/engine/block_manager.py)

雜湊是加速索引，不是數學上絕無碰撞的證明。快照也比對 token IDs；延伸到多模型、adapter 或租戶系統時，還需把相關計算身分納入快取命名空間與驗證。

## 2. 這份實作重用完整前綴 blocks

接納時，BlockManager 沿前綴尋找可用命中，遇到不匹配就停止。它的掃描保留最後一個邏輯 block 不作這次命中範圍，讓尾段仍有工作可執行，取得生成所需結果。

因此不要把「token 前綴都相同」直接推論成這次模型完全不用執行。也不要假設任意長度的部分 block 都能共享。

已快取的 token 減少 prefill 工作，卻不會自動產生不同請求的新回答；各自的後綴和採樣仍要計算。這接回 [LLM 04 的最後位置 logits](../llm-from-scratch/LLM04從零組裝GPT模型.md)。

## 3. Reference count 管所有權

共享活躍 block 時增加 ref_count。A 結束只移除 A 的引用；如果 B 還在使用，就不能把它放回可配置清單。

```text
A、B 共用 block 7：ref_count = 2
A 完成：ref_count = 1，仍不能覆寫
B 完成：ref_count = 0，可回收到 free 清單
```

這裡的共享以已完成的前綴為核心。不能讓兩個不同後綴同時寫同一個可變尾端 block，再期待引用計數解決內容衝突。更一般的可變共享需要 copy-on-write 等另外設計，不應直接當成這個精簡版本已提供的能力。

## 4. Free 不一定表示資料已消失

原碼 ref_count 歸零後，可把 block 放回 free 清單，但保留 hash 與內容資訊；在尚未被覆寫前，後續請求仍可能重新使用它。

若真的拿來配置成新內容，會處理舊 hash 對應並重設 metadata。這使「可回收空間」與「仍有機會命中的閒置快取」同時成立。

這不是無限制永久保存，也不能僅從使用 deque 就稱為嚴格 LRU。容量壓力下，閒置資料可能被覆寫，後來只能重算。

## 5. 命中率之外，還要看節省了什麼

命中已被其他請求占用的 block，可共享同一實體空間；命中閒置 block，仍需把它從 free 移回使用狀態。兩者都可省 prefill 計算，但對當下可用容量的影響不同。

比較時記錄命中 token 數、未命中 prefill token 數、共享中的實體 blocks，以及請求延遲。只報「命中幾次」無法知道省下的工作量。

[GPT Fast 09](../gpt-fast/GPTFast09效能量測與實驗流程.md) 強調工作量固定；prefix cache 實驗還需明確區分冷快取、熱快取與相同測試集重跑。用熱快取版本比較冷快取對手，不能歸因成純核心速度差。

## 6. 練習：讓共享與回收交錯發生

安排 A、B 共用兩個前綴 blocks；先結束 A，確認 B 輸出不變。再結束 B，加入 C 迫使覆寫，最後重新加入 A。

檢查 ref_count、free／used 集合和 hash 索引一致，再以固定前綴 logits 驗證重用與重算相容。這比只看第二次回答變快，更能證明快取生命週期正確。

## 系列導覽

[系列目錄](./NanoVLLM系列.md) · [上一篇](./NanoVLLM04分頁KVCache.md) · [下一篇：執行核心與圖](./NanoVLLM06執行核心圖與多卡.md)
