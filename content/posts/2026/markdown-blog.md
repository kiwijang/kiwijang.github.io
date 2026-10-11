---
title: 用 Markdown，開始寫自己的部落格
date: "2026-10-11"
description: 從一個文字檔開始，把想法整理成文章，讓寫作回到最單純的樣子。
tags: [技術, 寫作]
---
寫文章不需要複雜的工具。這個部落格將 Markdown 轉成完整的 HTML，每篇文章都有獨立的網址。

## 新增一篇文章

在 `content/posts/2026/` 新增 `my-first-post.md`。最上方填寫文章資料，下面就是內文：

```markdown
---
title: 我的第一篇文章
date: "2026-10-11"
description: 這篇文章的簡短介紹。
tags: [日常]
---

## 今天的發現

記下你的想法，也可以加入 **粗體**、清單與圖片。
```

## 圖片也能一起發布

把圖片放在 `content/images/`，文章中使用相對路徑：

```markdown
![恐龍](../../images/landscape.jpg)
```

![恐龍](../../images/landscape.jpg)

建置時，圖片會複製到網站的 `images/` 資料夾。相對連結能在 GitHub Pages 的專案子路徑下正常顯示。

> 文字與圖片一起保存在 Git 裡，每一次修改都有跡可循。

## 建置網站

```sh
npm install
npm run build
npm run preview
```

打開終端機顯示的網址，就能閱讀文章。
