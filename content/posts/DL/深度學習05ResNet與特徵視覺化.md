---
title: "深度學習 05：ResNet 與特徵視覺化"
date: "2026-10-14"
description: "理解深層網路退化、residual block 與 pre-activation，並整理 embedding、Grad-CAM 與 neural style transfer 的用途。"
tags: [深度學習, DL, ResNet, 電腦視覺]
---

## 前言

網路變深，訓練誤差卻變高，這和 overfitting 一樣嗎？ResNet 先從這個問題出發，讓網路學「對輸入還要做什麼調整」。後半段再用已訓練 CNN 的特徵來看 embedding、Grad-CAM 與風格轉移。

## 1. Degradation 不等於 overfitting

簡報對照較淺與較深網路: 如果深層網路連 training error 都比較高，代表優化本身就遇到困難。這和 training 很好、validation 卻很差的 overfitting 不同。

[ResNet 論文](https://arxiv.org/abs/1512.03385) 提出 residual learning 來處理這類深度增加後的訓練問題。

## 2. Residual block 的核心

```text
y = F(x) + x
```

原本想學 H(x)，改成學 `F(x)=H(x)−x`。如果這個 block 不需要改太多，F 可以接近 0，保留原輸入。

這裡的 x 通常是 feature tensor，不一定是原始圖片。模糊圖變清晰的例子是直覺類比，不是 ResNet 只能處理去模糊任務。

相加需要 shape 相容。如果空間尺寸或 channel 數量不同，可用 projection shortcut，例如 1×1 卷積與適當 stride，將輸入轉為可相加的形狀。

## 3. Shortcut 如何影響梯度？

對簡化的 residual block:

```text
∂y/∂x = I + ∂F/∂x
```

梯度多了一條 identity 路徑，不必完全依賴殘差分支的連乘。這有助於訊號與梯度傳遞，但不保證梯度永不消失、爆炸或互相抵消。

簡報也介紹 shattered gradients (破碎梯度)，討論深度增加後梯度相關性減弱的現象。它是理解部分架構訓練問題的研究角度，不是所有退化問題唯一的定論，見 [Shattered Gradients 論文](https://arxiv.org/abs/1702.08591)。

## 4. ResNet v1 與 pre-activation

Residual 分支最後若只允許正值，就會限制能對輸入做的修正。不同 block 會安排卷積、BN、ReLU 與 addition 的位置。

Pre-activation 在卷積前使用 BN／ReLU，保留較直接的 identity 路徑。[Identity Mappings 論文](https://arxiv.org/abs/1603.05027) 討論了這個設計。

He initialization 和 BN 常一起使用，但 shortcut 的尺度仍需要留意。簡報用變異數成長做說明；實際成長取決於分支相關性與 normalization，不能把每個 block 都必然倍增當成普遍公式。

## 5. ResNet 和 U-Net 的 skip 不完全一樣

ResNet 常做相加，U-Net 原始架構則把 feature maps 串接。兩者都提供跨層資訊，但運算與 shape 要求不同。

Transformer 也常有 residual connections。看到 shortcut 可以先問: 這邊是 add 還是 concatenate？用來保留什麼資訊？不用只靠箭頭長相判斷。

## 6. Embedding 看特徵空間

取出分類 head 前的表示，可以把每張圖片轉成向量，再用 PCA／UMAP 等方法看分布。

相似內容可能在表示空間靠近，但二維投影會扭曲距離。投影看起來有群集，不等於原模型的決策一定正確，也不能只靠這張圖證明泛化能力。

課程提供 `Chapter_5_Embedding.ipynb` 的練習方向。

## 7. Grad-CAM 看類別相關區域

Grad-CAM 的基本流程:

1. 選定類別分數與卷積 feature maps。
2. 計算分數對 feature maps 的梯度。
3. 對梯度做空間平均，得到每個 channel 的權重。
4. 加權合併 feature maps，通常套用 ReLU。
5. 放大熱圖，疊回圖片查看。

熱圖能輔助觀察模型使用的區域，但不是完整的因果解釋，也不是物件分割標註。換類別或選不同層，結果都可能不同。

## 8. Style transfer 更新的是圖片

風格轉移準備 content image、style image 與 generated image。使用固定的特徵擷取網路，調整 generated image，使內容與風格損失降低。

```text
L_total = α L_content + β L_style
```

Content loss 比較 feature maps 中對應位置的差異。Style loss 常比較 Gram matrices；若 `F` shape 為 `(channels, spatial_positions)`，`G=FFᵀ` 表示 channel 的共現統計。

Gram matrix 不直接保存各特徵在什麼位置，所以適合描述紋理統計。內容與風格不必硬限定成某一個淺層／深層，實際選層與權重會影響結果。

這邊固定 CNN 權重，求的是 loss 對圖片的梯度。不要和前面更新模型參數的訓練搞混。

## 9. 自我檢查

- Training error 較高，為什麼不能直接判定 overfitting？
- Residual addition 的兩個 tensor 要符合什麼條件？
- Style transfer、模型訓練與 Grad-CAM，各自在對誰求梯度？

## 資料來源

課程簡報: `Chapter 5 ResNet.pptx`，第 1–45 頁。包含 ResNet、特徵投影、Grad-CAM 與 `Lab_5_Style_Transfer.ipynb` 的概念；未將視覺化示範當成因果證明。

## 系列導覽

[系列目錄](./深度學習系列.md) · [上一篇](./深度學習04卷積神經網路與影像任務.md) · [下一篇](./深度學習06NLP與Transformer入門.md)
