---
id: ejjb68mdu83hhsukbzr8n6g
title: 1103 Meta 標籤設定 line、fb、twitter 顯示
desc: ''
updated: 1668708420081
created: 1667447309598
tags:
  - HTML
---

## HTML 的 Meta 標籤

主要可以看這篇文章:

[The Essential Meta Tags for Social Media by Adam Coti on Jun 20, 2016](https://css-tricks.com/essential-meta-tags-social-media/)


這篇 FB 寫的文章有介紹每個屬性，可以點進去看看:

[The Open Graph protocol](https://ogp.me/)
> The Open Graph protocol enables any web page to become a rich object in a social graph. For instance, this is used on Facebook to allow any web page to have the same functionality as any other object on Facebook.
> 
> The Open Graph protocol was originally created at Facebook and is inspired by Dublin Core, link-rel canonical, Microformats, and RDFa. The specification described on this page is available under the Open Web Foundation Agreement, Version 0.9. This website is Open Source.

## 預覽在社群網站的呈現 (Facebook / Twitter / LINE)

這篇文章寫得超詳細:

[如何讓 Facebook / Twitter / LINE 正確顯示你的連結預覽？ by Alyssa 2021-02-05](https://blog.alyssachan.space/wp-content/cache/all/update-link-preview-on-social-media/index.html#line)

### 主要是這三個:

- FB 的預覽網站(需登入)
https://developers.facebook.com/tools/debug/

- twitter 的預覽網站(需登入)
https://cards-dev.twitter.com/validator

- line 的預覽網站(無需登入)
https://poker.line.naver.jp/


## 小結

``` html
<!-- 自己以後遇到可以直接這麼用 -->
<meta property="og:title" content="European Travel Destinations">
<meta property="og:type" content="website" />
<meta property="og:description" content="Offering tour packages for individuals or groups.">
<meta property="og:image" content="http://euro-travel-example.com/thumbnail.jpg">
<meta property="og:url" content="http://euro-travel-example.com/index.htm">
<meta name="twitter:card" content="summary_large_image">

<!-- 第一篇 css-tricks 文章整理的 -->
<!--  Essential META Tags -->
<meta property="og:title" content="European Travel Destinations">
<meta property="og:type" content="article" />
<meta property="og:image" content="http://euro-travel-example.com/thumbnail.jpg">
<meta property="og:url" content="http://euro-travel-example.com/index.htm">
<meta name="twitter:card" content="summary_large_image">

<!--  Non-Essential, But Recommended -->
<meta property="og:description" content="Offering tour packages for individuals or groups.">
<meta property="og:site_name" content="European Travel, Inc.">
<meta name="twitter:image:alt" content="Alt text for image">

<!--  Non-Essential, But Required for Analytics -->
<meta property="fb:app_id" content="your_app_id" />
<meta name="twitter:site" content="@website-username">
```