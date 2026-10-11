---
title: 把網站放上 GitHub Pages
date: "2026-10-09"
description: 讓每一篇筆記擁有自己的網址，用靜態網站分享你的文字與圖片。
tags: [技術]
---
這個專案沒有資料庫，發布後只需要 HTML、CSS、JavaScript 與圖片。

## 發布流程

1. 在 GitHub 建立儲存庫，將這個資料夾的檔案推送到 main 分支。
2. 到儲存庫的 Settings → Pages。
3. 在 Build and deployment 的 Source 選擇 GitHub Actions。
4. 推送變更後，等待 Pages 工作流程完成。

工作流程會安裝依賴、執行 Markdown 建置，然後部署 dist 資料夾。

## 文章更新

修改或新增 Markdown 檔案並推送，GitHub Actions 就會重新產生網站。

圖片請使用相對路徑，例如 `../../images/photo.jpg`。這樣網站放在帳號首頁或專案子路徑，都不需要修改連結。
