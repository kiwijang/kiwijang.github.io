---
id: 3nppj8b00bsdzmbhem8ppe9
title: '1115 [Angular] 讓 mainjs 變小'
desc: ''
updated: 1675332833044
created: 1668496095203
tags:
  - Angular
description: "記錄 Angular main.js 的體積優化思路，使用 lazy loading、tree shaking 與套件分析工具檢查建置內容。"
---

## 讓 main.js 變小

1. 將 main.js 內的元件抽出去變成 lazyload 的。
2. 使用 esm 讓 angular 幫忙 tree-shake，最終只會包含你有使用的部分。

## 視覺化工具

主要是參考這篇文章:

[How To Analyze Angular App Bundle Sizes with webpack Bundle Analyzer or source-map-explorer by Alligator.io](https://www.digitalocean.com/community/tutorials/angular-bundle-size)

主要參考這篇文章: https://www.digitalocean.com/community/tutorials/angular-bundle-size

## 加入四個指令到 package.json:

```
"build:stats": "ng run client:build --configuration=sit --base-href=/xxx/ --stats-json",
"analyze": "webpack-bundle-analyzer dist/apps/xxx/stats.json",
"client:build:sourcemap": "ng run client:build --configuration=sit --base-href=/xxx/ --build-optimizer --source-map",
"sourcemap:analyze": "npx source-map-explorer dist/apps/xxx/main.*.js"
```

## 並有安裝套件到 devDependencies:

```
"source-map-explorer": "^2.5.2",
"webpack-bundle-analyzer": "^4.4.2"
```

● 記得先更新套件:

```
npm i
```

● webpack-bundle-analyzer 套件依序使用這兩個指令:

```
npm run build:stats
npm run analyze
```

● source-map-explorer 套件依序使用這兩個指令:

```
npm run client:build:sourcemap
npm run sourcemap:analyze
```
