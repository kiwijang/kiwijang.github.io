---
title: "深度學習 07：GAN、VAE 與擴散模型"
date: "2026-10-14"
description: "比較 GAN 的對抗訓練、VAE 的潛在分布與 diffusion 的去噪學習，整理條件生成、常見變體與 FGSM 的不同目的。"
tags: [深度學習, DL, 生成模型]
---

## 前言

模型不只可以判斷這是不是貓，也能產生一張新的貓圖片。這篇先看三種生成方式，再看看它們各自學習什麼、從哪裡開始產生新資料。

## 1. 判別與生成

判別模型常學輸入到標籤的關係，例如 `p(y|x)`；生成模型則描述或學習資料分布，從中產生樣本，也可以在條件 y 下生成 x。

| 方法 | 訓練的核心 | 生成方式 |
| --- | --- | --- |
| GAN | 生成器與判別器對抗 | 噪音／條件經生成器輸出 |
| VAE | 重建目標與潛在分布正則化 | 從 prior 抽樣，再解碼 |
| Diffusion | 帶噪樣本的去噪目標 | 由噪音反覆採樣更新 |
| Autoregressive | 預測下一個元素 | 逐步生成序列 |

生成的樣本像真的，不等於包含的內容或細節都是真實資料。

## 2. GAN 讓兩個網路交替訓練

Generator G 接收 z，產生樣本；discriminator D 判斷是真實資料還是生成資料。

更新 D 時，使用真實與生成樣本，固定 G 的參數。更新 G 時，固定 D 的參數，但仍需要把梯度穿過 D 傳回 G，不能把整段計算圖切斷。

生成器常用 non-saturating 目標 `−log D(G(z))`。它與原始 minimax 目標相關，但訓練梯度不同；不能只看 sigmoid 飽和，就說所有 GAN loss 都必然沒有有效梯度。原始架構見 [GAN 論文](https://arxiv.org/abs/1406.2661)。

## 3. GAN 的困難與變體

Mode dropping 是未涵蓋部分資料模式；mode collapse 則可能讓不同 z 都產生少數相似結果。D 與 G 的平衡、目標和架構都會影響訓練。

簡報介紹 Wasserstein 目標、progressive growing、mini-batch discrimination、truncation 與 latent interpolation。這些是不同方法的設計，不是每種 GAN 都要一起套用。

| 變體 | 用途／設計重點 |
| --- | --- |
| DCGAN | 使用卷積架構生成影像 |
| Conditional GAN | 把指定條件交給生成器與判別器 |
| InfoGAN | 鼓勵 latent codes 對應可解釋變化 |
| Pix2Pix | 使用成對資料做影像轉換 |
| CycleGAN | 以循環一致性等目標處理不成對領域 |
| SRGAN | 超解析度與感知品質 |
| StyleGAN | Mapping 與 synthesis 中的風格控制 |

看變體時先確認資料是否成對、條件怎麼提供，以及 loss 包含哪些項目。不能只看生成器都用卷積，就把全部方法當成同一種訓練。

## 4. Autoencoder 與 VAE

Autoencoder 把輸入編碼成低維表示，再重建輸入。但普通 autoencoder 不保證 latent space 每個位置都能解碼成合理樣本。

VAE 的 encoder 定義近似 posterior `q(z|x)`，例如對角高斯的 mean 與 variance。透過抽樣取得 z，再用 decoder 定義重建資料的分布。

```text
z = μ(x) + σ(x) ⊙ ε，ε ~ N(0,I)
ELBO = E_q[log p(x|z)] − KL(q(z|x) || p(z))
```

第一項鼓勵重建，第二項讓 posterior 與選定 prior 接近。訓練常最小化負 ELBO；reparameterization 讓抽樣步驟能配合梯度計算，見 [VAE 原始論文](https://arxiv.org/abs/1312.6114)。

從 prior 抽樣是生成入口，不代表每次都保證自然，也不代表所有 encoder 輸出會精確成為同一個高斯分布。

## 5. Diffusion 的加噪與去噪

Forward process 依 noise schedule 漸漸加入噪音。對 DDPM 常用記號:

```text
α_t = 1 − β_t
ᾱ_t = ∏_(s=1)^t α_s
x_t = sqrt(ᾱ_t)x_0 + sqrt(1−ᾱ_t)ε
```

訓練時可以隨機抽時間步 t，直接生成該程度的 noisy sample，不必從第一步慢慢加噪。

```text
簡化的噪音預測目標: E[||ε − ε_θ(x_t,t)||²]
```

模型學習預測加入的 noise。生成時使用特定 sampler 與 schedule 從噪音逐步更新，不是直接減一次 noise prediction 就一定還原原圖。上述是 [DDPM](https://arxiv.org/abs/2006.11239) 的常見表達方式。

Forward noise schedule 通常沒有要訓練的網路參數；denoiser 可使用同一個有時間條件的 U-Net，不必每個 t 各訓練一個網路。這和 VAE 兩側都有可學習模型不同。

## 6. 條件生成與 classifier-free guidance

訓練時部分樣本移除條件，讓同一個模型學到有條件與無條件的預測。生成時再把兩者組合，調整條件引導強度。

較大的 guidance 不代表永遠更好，可能增加條件符合程度，也犧牲多樣性或產生失真。這個取捨需要看模型與採樣設定。

本篇保留文字條件生成的概念，不把簡報中某個產品的舊版架構，直接套用成今天所有生成產品的規格。

## 7. FGSM 是另一種目的的輸入更新

簡報最後用 FGSM 說明對抗樣本。它利用已訓練分類器的輸入梯度，增加 loss:

```text
x_adv = x + ε sign(∇_x L(x,y))
```

這裡固定模型權重、修改輸入，並依資料範圍裁剪。FGSM 是對抗擾動方法，不是與 GAN／VAE 同類的資料分布生成模型。是否誤分類與擾動尺度相關，不是每次都一定成功。

## 8. 課程練習與自我檢查

本章有 GAN／VAE／Diffusion 的 MNIST 練習、conditional generation 與 FGSM。看結果時不只看單張圖片，也要看生成多樣性、條件符合程度與訓練穩定性。

- 更新 G 時，為什麼仍要讓梯度穿過固定參數的 D？
- VAE 的 latent posterior 與 prior 各是什麼？
- Diffusion 訓練的時間抽樣和生成的多步採樣一樣嗎？

## 資料來源

課程簡報: `Chapter 7 Generative Models.pptx`，第 1–71 頁。本文統一 DDPM 記號、補充分布與梯度的角色；未將所有 GAN 設計混成共同規格。

## 系列導覽

[系列目錄](./深度學習系列.md) · [上一篇](./深度學習06NLP與Transformer入門.md) · [下一篇](./深度學習08強化學習與模型部署議題.md)
