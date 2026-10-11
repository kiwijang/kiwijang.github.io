# 沿途筆記

使用 HTML、CSS、JavaScript 的 GitHub Pages 靜態部落格。Markdown 建置為獨立 HTML，不需要後端。

## 本機使用

需要 Node.js 20.11 以上。

    npm install
    npm run build
    npm run preview

開啟 http://localhost:4173。修改來源後重新執行 build。

## 文章與年份

文章放在 content/posts/YYYY/，例如 content/posts/2026/2026_1011.md。
YAML front matter 包含 title、date、description、tags。date 使用引號包住 YYYY-MM-DD，年份須與資料夾一致。
檔名支援英文小寫、數字、底線、連字號；不同年份可使用同名文章。
輸出為 posts/2026/2026_1011.html，首頁依日期由新到舊排序。
相容直接放在 content/posts 的舊文章，年份取自 date。

Markdown 可包含 HTML，只應建置信任的作者內容。

## 圖片輸出

來源圖片放在 content/images，來源原圖保留不修改。
每次建置會清除並重新產生 dist/images，該資料夾只輸出 WebP 和 SVG，不複製來源 PNG/JPG。

- SVG：原樣複製。
- JPG、JPEG、PNG、WebP、AVIF、TIFF、靜態 GIF：以 Sharp 轉成 WebP。
- 動畫／多頁或不支援的檔案：建置報錯，避免輸出失效的文章圖片。
- 已是 WebP 的來源維持相同檔名；其他格式保留原副檔名再加 .webp，避免同名 JPG/PNG 衝突。
- Markdown 圖片與 HTML img 的 src 自動更新；外部網址不處理。
- srcset、CSS 背景圖片及一般下載連結不自動更新，需自行使用輸出路徑。

文章使用來源檔名即可：

    ![圖片描述](../../images/photo.png)

產生的 HTML 會使用 ../../images/photo.png.webp。
舊的 ../images 圖片寫法也相容。

HTML 可指定顯示大小：

    <img src="../../images/photo.png" width="400" alt="圖片描述">

CSS 不強制圖片縮放，未指定寬高時顯示轉檔後的像素大小。

## Sharp 設定

image.config.json：

    {
      "format": "webp",
      "quality": 80,
      "ppi": 350,
      "lossless": true,
      "maxWidth": 400
    }

Sharp 將圖片按比例縮至最大寬度 400px，不放大小圖，高度自動計算。
輸出使用無損 WebP，並寫入 350 PPI 的 EXIF 解析度資料。
此流程以像素寬度決定縮放，不再依原圖 DPI 放大，也不要求來源圖片具有 DPI 資料。
SVG 維持原樣。
來源 744 × 859 px 的圖片輸出為 400 × 462 px。
無損是指轉檔不再引入有損壓縮；縮小尺寸本身會重新取樣，像素不會與原圖完全相同。
## GitHub Pages

將專案（含 package-lock.json）推送到 GitHub 的 main 分支。
Settings → Pages → Build and deployment → Source 選 GitHub Actions。
.github/workflows/pages.yml 會安裝依賴、建置並部署 dist。
若預設分支不是 main，請修改工作流程的 branches。
站內連結使用相對路徑，支援 GitHub Pages 專案子路徑。

## 檔案位置

- content/posts/YYYY/：文章來源
- content/images/：圖片來源
- src/style.css：版面與樣式
- src/app.js：搜尋、篩選、深色模式
- scripts/build.mjs：文章與首頁建置
- scripts/images.mjs：圖片轉檔及網址改寫
- dist/：建置產物，不提交 Git

GCC 本身不會轉換 Markdown；此專案使用 JavaScript 的 marked 完成轉換。


## 程式碼語法上色

使用 Highlight.js 在建置時上色，瀏覽器不需要另外載入套件或 CDN。
Markdown 程式碼區塊的三個反引號後填入語言，例如 c、cpp、js、python、bash、json。
未指定語言會在常用語言範圍內自動辨識；未知語言以純文字顯示。
可用 text 或 plaintext 明確指定純文字。
配色位於 src/style.css 的 Highlight.js 區段。
