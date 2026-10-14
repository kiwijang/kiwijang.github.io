---
description: "沿途筆記靜態部落格的使用說明，涵蓋 Markdown 文章、年份分類、Sharp 圖片轉檔、語法上色與 GitHub Pages 部署。"
---
# 沿途筆記

使用 HTML、CSS、JavaScript 的 GitHub Pages 靜態部落格。Markdown 建置為獨立 HTML，不需要後端。

## 本機使用

需要 Node.js 20.11 以上。

    npm install
    npm run build
    npm run preview

開啟 http://localhost:4173。修改來源後重新執行 build。

## 文章與年份

文章放在 content/posts/YYYY/，例如 content/posts/2026/2026_1011.md，也可依系列放在 content/posts/ds-series/ 等子資料夾；建置會遞迴掃描 Markdown。
YAML front matter 包含 title、date、description、tags。date 使用引號包住 YYYY-MM-DD；年份資料夾須與 date 一致，系列資料夾則由 date 決定輸出年份。
檔名支援中文字等 Unicode 文字、數字、底線、連字號；不同來源資料夾若在同一年輸出相同檔名，建置會報錯。
輸出為 posts/2026/2026_1011.html，首頁依日期由新到舊排序。
相容直接放在 content/posts 的舊文章，年份取自 date。
站內相對 Markdown 文章連結會改寫為對應 HTML 網址。系列目錄也需提供 front matter。

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

### 首頁照片與最低解析度

image.config.json 的 overrides 可針對特定來源檔設定尺寸與品質。
目前 landscape.jpg 使用 maxWidth: 1200、quality: 85、lossless: false。
其他圖片維持最大寬度 400px 與無損 WebP；來源原圖保留。
所有轉檔圖片寫入至少 350 PPI，來源 density 較高時保留較高值。
PPI 是解析度中繼資料，不代表網頁顯示清晰度；照片使用適當像素尺寸與壓縮品質平衡容量。
### 較大文章圖片自動處理

largeImages 規則：校正方向後寬度至少 1200px，或原檔至少 1 MiB 時，採用最大寬度 1200px、品質 85。
JPEG 使用有損 WebP；PNG 等其他來源沿用預設無損設定，避免文字截圖產生壓縮痕跡。
這是依尺寸、容量與格式分類，不會自動辨識照片或文字內容；若需指定個別圖片，使用 overrides。
其他較小圖片仍使用預設最大寬度 400px。所有圖片不放大，並保留至少 350 PPI。

## 主題專區

修改根目錄 topics.config.json 的 topics 陣列，每個主題包含 id、title、tags。

```json
{
  "topics": [
    { "id": "angular", "title": "Angular", "tags": ["Angular"] },
    { "id": "os", "title": "作業系統", "tags": ["OS", "作業系統"] }
  ]
}
```

文章 tags 只要符合主題中的任一標籤就會歸類，忽略英文大小寫及前後空白。
同一文章可以出現在多個主題；未匹配的文章仍保留於年份區。
主題依設定檔順序顯示，文章由新到舊；空主題顯示提示，搜尋時隱藏沒有符合文章的主題。
主題專區預設展開，各主題預設摺疊，支援卡片／文字列表及搜尋、標籤篩選。
修改設定或文章後執行 npm run build。

### 主題子分類

主題可加上 children，例如「前端 → Angular」：

```json
{
  "id": "frontend",
  "title": "前端",
  "tags": ["前端", "JavaScript", "TypeScript"],
  "children": [
    { "id": "angular", "title": "Angular", "tags": ["Angular"] }
  ]
}
```

父分類包含子分類文章，篇數去除重複；已在子分類顯示的文章不再重複列於父分類的直接文章區。
只有符合父分類、未符合子分類的文章仍列在父分類底下。所有 id（含子分類）須唯一。
