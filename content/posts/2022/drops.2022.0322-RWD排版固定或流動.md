---
id: 0c40o7nje4ye5vu97b7iwaj
title: 0322 RWD 排版固定或流動
desc: ''
updated: 1649072749829
created: 1647931558726
tags:
  - CSS
---

因為設計稿給了三種尺寸 pc/pad/phone，

然後程式裡有三個用 min-width 分開的中斷點 1170px/768px/320px

(同事說:所以中斷點吃不到的地方就吃預設值)

如下圖:

``` javascript
┌──────────────────┐
│          sm      md      lg        │
│          320     768     1170      │
│ 預設值   │→    │→    │→      │
└──────────────────┘
  liquid 流動排版 ←│→ 固定排版 fixed
```

一開始想說應該是到中斷點就換版型的排版，結果好像是 pad(768px) 以下要變流動(Liquid)的排版。

機會難得想把這篇文章的東西英翻中，記錄一下xD (文章作者是:Steven Bradley / May 30, 2006)

https://vanseodesign.com/web-design/fixed-or-liquid-design/

## Fixed Design 固定設計

### 優點

- 給予設計師控制 the control it gives the designer

- 通常可以快速開發 generally quicker to develop

- 適合使用背景圖片(background-images) easier to use background images which by nature will have fixed dimensions
  > background-images 大小固定，不會像 `<img>` 可隨螢幕大小伸縮。[註1]

### 缺點

- 在中斷點以上會有很多空白 leave a lot of empty space when viewed at higher resolutions

- 固定寬度很難讓所有內容顯示在小尺寸的裝置 It can also be difficult to fit everything into the smaller screen real estate of a fixed width layout.3 columns can seem very tight at 800p.


![](/assets/images/2022-04-04-16-11-38.png)

> 圖源: [3 Popular Types of Web Design LayoutsSEPTEMBER 11, 2017 by CRYSTAL MATEO](https://linkage.ph/3-popular-types-web-design-layouts/)

## 流動設計 Liquid Designs

### 優點

- 排版會填滿畫面，不會有空白 layout will adjust to fill a variety of resolutions. work well at both low and high resolutions without all the empty space outside of the design.

- 使用 `rem`[註2] 或 `%` 而不是 `px`，讓眼睛不好的人可以更簡單的調整字體大小 A liquid layout with it's use of 'em' or percents instead of pixels will be more accessible to viewers with poor eyesight as they can more easily resize the text. It can also be easier to fit all of your content into the design for those viewers with higher resolution monitors.

### 缺點

- 寬度太寬導致一行字太長、難以閱讀 line length growing to wide which will make you text difficult to read.

- 可以使用 `max-width` 解決太寬問題，但 IE 要用別的方式要特別注意一下 (這個感覺用 pollyfill 就可以解決) Using max-width is an option for browsers outside of Internet Explorer.IE will need it's own workaround to keep your lines of text from becoming too wide. A liquid layout can often be more difficult and time consuming to develop and test.

![](/assets/images/2022-04-04-16-12-25.png)

> 圖源: [3 Popular Types of Web Design LayoutsSEPTEMBER 11, 2017 by CRYSTAL MATEO](https://linkage.ph/3-popular-types-web-design-layouts/)


## 半流動:混合式 Semi-Liquid: A Hybrid Approach

在一個頁面裡，可以讓 header 在瀏覽器邊緣左右延伸 (stretch to the edges of the browser)，其他部分在視窗中心保持固定尺寸 (fixed size)。

> The third design option is the hybrid approach where certain parts of the page are fixed and there's enough liquidity in other elements to keep the whitespace from looking too empty.


半流動網頁可以在特定尺存讓排版流動 (fluid)。

> semi-liquid design where the site will be fluid within a given range of resolutions

舉例:一個網站設計了 800x600 的尺寸、並以流動方式排版放大到 1600×1200 為止，
1600×1200 之後更大的尺寸網站保持在視窗中心，超過設計範圍的地方就空白。

> The site for example might be designed to work at a minimum 800×600 resolution and expand fluidly until it reaches some upper maximum resolution such as 1600×1200. For larger resolutions the site remains in the center of the browser window and space is created outside the design。

如此就可解決流動排版 (fluid design) 尺寸太大時一行字太多、固定排版 (fixed design) 螢幕較小時空白太多的問題。

## 作者建議

固定排版 (fixed design): 如果需要精準控制尺寸。建議讓頁面置中，空白處才會平均。

流動排版 (fluid design): 如果使用者使用多元的尺寸，特別是大尺寸。建議以 1024×768 著手設計、
並確定更小或更大的尺寸看此來好不好。

>  If you're constrained by time or need precise control over your design then a fixed layout is probably the way to go. If accessibility is more important or your visitors use a variety of resolutions, particularly higher resolutions, the liquid approach will most likely the better option. With fixed designs I highly recommend centering the overall page in the browser window to balance the empty space on both sides of the layout. With liquid designs I recommend designing the site to look it's best at the common 1024×768 resolution while making sure the site still looks good at lower and higher resolutions.

作者傾向半流動或混合式 (semi-liquid or hybrid design)。也在這篇文章 (2016) 時說這種寫法應該會變成主流。

> For my own site I'll be using the semi-liquid or hybrid design more and more where I can. I think it's a very good compromise and allows enough of the benefits of both fixed and liquid designs while minimizing the cons of each. suspect too that hybrid designs will become more common and popular with designers given the wide variety of monitor resolutions.

---

## 小結

感覺固定排版 (fixed design) 就是 AWD 常用的方式、流動排版 (fluid design) 就是 RWD 常用的方式。

固定排版 (fixed design): 最強調 Mobile-First 行動優先 (在 RWD 還沒如現在盛行前)。

流動排版 (fluid design): RWD。

這篇文章定義得很清楚:

[行動網站傻傻搞不清？RWD響應式網站 vs AWD自適應式網站 by Nadine Li](https://medium.com/nadine-mase/the-different-about-responsive-website-design-adaptive-web-design-92712d2ba7ab)

> ➜ 若網站的資訊量很大，並想使用者做很多事
> 選擇 AWD 自適應式網站佳，因能客製化手機上的使用體驗。像是網路書店、購物商城…等。
>
> ➜ 若網站資訊量沒那麼多，也只希望使用者做很少事
> 選擇 RWD 響應式方式佳，因維護起來最方便，也能讓視覺上有一致的體驗。像是品牌官網、小型的購物商城。

**整個看完才發現混著用才聰明😓 一不小心又非黑即白思考了...**

總之目前知道差別就好，分類出來比較好記憶 xD

另外還是不太清楚 `px` 和字體大小和瀏覽器放大縮小百分比到底有什麼關係，要找時間補一下。

---

- 註一: 關於瀏覽器如何顯示圖片可以參考這一篇文章

  [Optimising Largest Contentful Paint by Harry](https://csswizardry.com/2022/03/optimising-largest-contentful-paint/)

  > The reason these resources (in this specific case, background images) are slow is because they aren't requested until the browser is ready to paint the DOM node that needs them.
  > we can sidestep this issue by adding an invisible `<img />`.

- 註二: 關於 em 與 rem 可參考這篇: (自己覺得用 `rem` 會比較方便控制+好記)

  [實際展示 EM 與 REM 的差異 by 卡斯伯](https://www.hexschool.com/2016/01/02/2016-08-08-em-vs-rem/)
