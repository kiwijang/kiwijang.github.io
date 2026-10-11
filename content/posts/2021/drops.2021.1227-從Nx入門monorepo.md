---
id: Ee1iUWT8QmZe4CAuuwQxs
title: 1227 從 Nx 入門 monorepo
desc: ""
updated: 1662620120470
created: 1640615759253
tags:
  - Nx
---

## 前言

> 注意: 此篇文章撰寫時間 Nx 版本為 12，跟目前版本可能有些不一。 (Nx 版號會跟 Angular 版號一樣)

使用 Nx Console 實現一個 Monorepo 架構的專案。

導讀影片: [Monorepos - How the Pros Scale Huge Software Projects // Turborepo vs Nx](https://www.youtube.com/watch?v=9iU_IE6vnJ8)

## 1. 簡介 Monorepo 架構

Monorepo (全名 Monolithic Repository)，符合以下三個條件:

1. **一個 repo** One Repository
2. **多個 projects** Multiple projects (三個 app 加上兩個 libs 共 5 個專案)
3. **共用 libs** Shared Libraries

如下圖，這就是一個 Monorepo:

![MonoRepo](/assets/images/2021-12-27-22-50-05.png)

Monorepo 架構的主要目的是希望**集中管理套件版本**。

只管理**一個** `package.json`，好處是套件版本管理方便、壞處是一個 repo 有多個 projects，檔案容易變非常大，讓 git 版控軟體跑起來較吃力。

另外 Monorepo 讓 apps 之間共用 libs 變得方便簡單，所以可以降低重複程式碼的機率。
也可以讓 Lerna、yarn 等套件管理工具更方便的減少重複的套件安裝。

以 Nx 來說，還有個酷酷的特色:可以在同一個 repo 裡同時使用 react 和 angular 共同開發一個 app。

雖然也可以使用 rollupjs 來達到不同前端框架共同開發一個 app 的效果。

但 Nx 就像 monorepo 全家桶: 提供一個 Nx workspace 讓你的 monorepo 開發更容易。

接下來，在看 Nx 怎麼使用之前，先來一些先備知識。

## 2. 簡介 Nx 工具與專有名詞解釋

### 2-1. 什麼是 Nx ?

官網: https://nx.dev/

![](/assets/images/2021-12-27-23-55-50.png)

> 聰明、可擴充的建置框架，Nx 幫助任何規模的架構、測試、建置。
> (Smart, Extensible Build Framework Nx helps architect, test, build at any scale:)

- 以現代框架進行整合。(integrations with modern frameworks)
- 計算快取。(computation caching)
- 聰明的重新建置被修改過的專案。(smart rebuilds of affected projects)
- 分散式任務執行。(distributed task execution)
- 強大的程式碼產生器。(powerful code generators)
- 支援 VSCode 和 WebStorm 編輯器。(editor support (VSCode, WebStorm))
- (GitHub apps)
- 還有更多。(and more.)

**簡單來說就是: 可以用 Nx 提供的架構去整合程式碼。**

### 2-2. Nx 的製作團隊

narwhal 簡寫 Nrwl，是獨角鯨的英文。

![](/assets/images/2021-12-27-23-57-12.png)

顧問、工程、訓練。
Consulting. Engineering. Training.

Nrwl 創立於 2016 12 月，以 Angular 團隊成員、多位前 Google 員工、Jeff Cross、Victor Savkin 所組成。

如今已有 18 位左右成員 (在美國、加拿大和英國)。

Nrwl 也是開源開發工具們的製作者: 給 monorepo 開發用的 Nx、和 Angular Console。

Nrwl was founded in December 2016 by Angular team members and former Googlers, Jeff Cross and Victor Savkin, and today has around 18 team members in the US, Canada and UK.
Nrwl is also the creator of open-source dev tools: Nx for monorepo development, and Angular Console.

**簡單來說 Nrwl 就是一間科技公司 (Narwhal Technologies Inc.)**

### 2-3. Angular monorepo patterns

這本書說明了 nx 是如何實踐 monerepo 概念。

![](/assets/images/2021-12-27-23-59-52.png)

- https://connect.nrwl.io/app/books
- https://nrwl.io/products

### 2-4. Nx 與 Angular 淵源不淺

![](/assets/images/2021-12-28-00-06-48.png)

> 截圖自 [Monorepos - How the Pros Scale Huge Software Projects // Turborepo vs Nx](https://www.youtube.com/watch?v=9iU_IE6vnJ8)

上面這兩位 Nx 開發的主導者是 Google 的前員工，且對 Angular 都有相當深入的理解。
但 Nx 官網上有不少 react 的開發教學，如果有公司想要從 react 轉到 angular(或是 angular 轉 react 為主)，
感覺透過 Nx 的幫助可以慢慢地移花接木(不然 Nx 也至少可以讓這兩框架和平共處)。😆

### 2-5. Angular 詞彙表

基本上只要知道 Angular 的詞彙就看得懂 Nx 在幹麻了，以下詞彙是在 Nx 也會看到的(取自 Angular 官網):

- [Workspace](https://angular.tw/guide/glossary#workspace) (工作區)

  一個 Angular 所有專案的集合(可以用 Angular CLI 操作這個集合)，通常會在 git 版本控制的 repository 中。

- [Project](https://angular.tw/guide/glossary#project) (專案)

  可以通過 Angular CLI 命令創建或修改的獨立應用程式或函式庫。可在 angular.json 中配置 workspace 中的所有 projects。

- [Library](https://angular.tw/guide/glossary#library) (函式庫)

  一種 Angular 專案。用來讓其它 Angular 應用包含它，以提供各種功能。函式庫不是一個完整的 Angular 應用，不能獨立執行。

- [TypeScript 配置](https://angular.tw/guide/typescript-configuration#configuration-files)

  一個 Angular 工作區中包含多個 TypeScript 配置檔案。在 root，有兩個主要的 TypeScript 配置檔案：tsconfig.json 檔案和 tsconfig.app.json 檔案。[使用 extends 進行配置繼承](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html#tsconfig-bases)。

- [Schematic](https://angular.tw/guide/glossary#schematic) (原理圖)

  Angular CLI 使用原理圖來產生和修改 Angular 專案及其部件。

- Collection (集合)

  在 Angular 中，是指收錄在同一個 [npm 套件](https://angular.tw/guide/glossary#npm-package) 中的一組原理圖（schematics）。

  ![](/assets/images/2021-12-28-00-23-52.png)

### 2-6. Nx 名詞解釋

Nx 的 `[plugin]:[generator-name]` 就是 Angular 的 `[collections]:[schematic]`

以下紀錄這個在 Nx 的說明與使用方式:

- Generators (產生器)
  產生器提供了一種方法，來自動執行您在開發工作流程中，經常執行的許多任務。
  在 Nx 中，可以使用 `@nrwl/devkit` 或 `@angular-devkit` ，來製作產生器。
  使用 `@angular-devkit` 製作的稱為 schematics (原理圖)。

  下圖為 Nx 官網的 sidebar 的一小部分截圖，可以看見 Generator 有不少篇幅介紹。

  ![](/assets/images/2021-12-28-21-51-09.png)

### 2-7. Nx 的 Generators 的使用方式

**Nx 的 `[plugin]:[generator-name]` 就是 Angular 的 `[collections]:[schematic]`。**

所以有用 angular 寫過 schematic 的人有福了，可以更快上手 Nx 的 generator。🎉

以下是關於如何調用 gnerator 的內容(截自 Nx 官網):

- 調用插件產生器 [Invoking Plugin Generators](https://nx.dev/l/a/generators/using-schematics#invoking-plugin-generators)

  產生器可以讓你以簡單和可重複的方式新增修改程式碼。可以使用 `nx generate` 指令來調用 (invoked) 產生器。
  Generators allow you to create or modify your codebase in a simple and repeatable way. Generators are invoked using the nx generate command.

  ```cmd
  nx generate [plugin]:[generator-name] [options]
  nx generate @nrwl/angular:component mycmp --project=myapp
  ```

  在使用產生器前有一個乾淨的 git 工作路徑很重要，因為這樣你能輕易的還原變動 (revert changes)、並使用不一樣的設定來重新調用產生器。
  It is important to have a clean git working directory before invoking a generator so that you can easily revert changes and re-invoke the generator with different inputs.

### 2-8. 小補充: 關於 collection 為何都是「＠xxx/ooo」這樣命名?

這是 npm 的命名規則，詳情可以參考 npm 官網影片: [Working with npm private modules
](https://www.youtube.com/watch?v=O6JoXGnHK_Y)

> ＠後的字稱為 `@scope`，通常是 npm 的帳號名字(尤其要 publish 到 npm 上的話，就是 `@username` 的意思。)

![](/assets/images/2021-12-28-21-53-15.png)

## 3. 感受一下 Nx 的 monorepo 專案

- Angular workspace 的 libs 通常都會有一個自己的 `package.json`

  ![](/assets/images/2021-12-28-00-24-21.png)

- Nx workspace 預設共用一個 `package.json`

  ![](/assets/images/2021-12-28-00-28-00.png)

### 3-1. 產生一個 Nx 的 workspace

可以直接參考 npm 的說明:

https://www.npmjs.com/package/create-nx-workspace

![](/assets/images/2021-12-28-21-48-43.png)

> Nx 12 提供的樣板。

或是看官方 youtube 教學:

[Nx in 100 seconds: Setup a new Nx workspace using its presets](https://youtu.be/XVJIXcC-7Kc)

### 3-2. Nx 的 workspace 圖示

除了圖示裡的這些，Nx workspace 也可以用來整合開發其他框架(最後面會補充)。

![](/assets/images/2021-12-28-22-18-03.png)

> 從靜態網頁框架、後端 nodejs 框架、前端框架到網站建置工具和最基礎的 js、html、css 都可以用 Nx 架構來整合

## 4. 快速上手 Nx Console 操作 (Generate、Run)

### 4-1. Nx Console 簡介

Nx 有提供一個介面讓人**可以用點按方式去執行指令**，就不用硬背一堆指令了，

以下是關於這個套件的一些知識，

因為這個介面有幫指令做分類，

這邊特別有在 4-2 ~ 4-4 的地方對 nx generate 和 nx run 這兩個介面分類做了更深入的說明，

首先，會先說明 Nx Console 是什麼? 並看看介面有什麼?:

- Nx Console 套件安裝

  - [Install from the VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=nrwl.angular-console)
  - [Contribute on GitHub](https://github.com/nrwl/nx-console)

- Nx Console 前生今世

  `Nx Console` 前生為 `Angular Console`，詳情可以看這篇文章:
  https://blog.nrwl.io/re-introducing-nx-console-a21fa9f4f668

  `Angular Console` 是一個桌面應用程式 (Desktop App)。

  最一開始是以 `Electron` 在開發，後來 `Angular Console` 團隊將桌面應用程式移植到 VS Code 的擴充套件上。結果發現效能很糟...

  所以他們就決定打掉重練： 以 VS Code 套件提供的基底重新開發一個擴充套件，

  並且順帶將套件重新命名為 `Nx Console`。

  `Nx Console` 包括 `Angular Console` 和 `Nx` 的功能，最後連 `Nx` 和 `Angular Console` 的製作團隊也整併再一起了。

  ![](/assets/images/2021-12-28-22-21-50.png)

- Nx 套件教學

  如果不小心跳過一開始的新手教學，可以到 github 看，`Nx Console` 套件的也是以 `Nx 架構` 寫成的。😎

  https://github.com/nrwl/nx-console/tree/master/apps/vscode/src/getting-started

- Nx Console 官網主打口號

  - Nx 專用的純 UI 介面。(True UI for Nx)
  - 專家和初學皆適用。(Useful for both experts and beginners)
  - 豐富的文件說明。(Documentation)

- 介面分三個區塊

  - Generate & Run Target
    開發專案時常用到的指令。等等下面會講一下 `Generate` 和 `Run`。
  - Common Nx Commands
    關於被修改過的檔案會有一些功能可以用，另外還有產生專案相依狀態的圖表、依次執行多個指令的指令可以用。
  - Projects
    這裡就是圖示化 `angular.json` 的 `projects` 區塊，可以直接按按鈕執行 script。

    ![](/assets/images/2021-12-28-22-35-51.png)

### 4-2. nx generate (常見的 collection)

> 這裡是 2-6、2-7 定義的應用，如果看不懂可以往回看。

當你按下 `Generate` 的按鈕時，就會幫你執行 `nx generate`，並根據 `generator` (`schematic`) 產生預期的結果。
以下列出常見的 collection:

1. `@angular/cdk`
2. `@angular/material`

   以上兩個都是 Angular Material 相關 collection。

   ![](/assets/images/2021-12-28-22-53-23.png)

3. `@nrwl/storybook`

   Storybook 相關 collection。

4. `@nrwl/angular`

   Nx cli 預設的 collection (1)。

5. `@nrwl/workspace`

   Nx cli 預設的 collection (2)。

6. `@schematics/angular`

   Angular cli 預設的 collection。

### 4-3. 產生 Library 有三個 schematic 可以用

- `@schematics/angular`

  ![](/assets/images/2021-12-28-22-58-21.png)

- `@nrwl/angular`

  ![](/assets/images/2021-12-28-22-59-05.png)

  ![](/assets/images/2021-12-28-23-00-04.png)

  ![](/assets/images/2021-12-28-23-00-23.png)

- `@nrwl/workspace`

  ![](/assets/images/2021-12-28-22-59-20.png)

* collection 偵測方式 (node_module/ 全部偵測):

  https://github.com/nrwl/nx-console/blob/ad3578a1a2/libs/server/src/lib/utils/read-collections.ts

* vscode-angular-schematics collection 偵測方式:

  https://github.com/cyrilletuzi/vscode-angular-schematics/blob/main/src/defaults.ts

### 4-4. nx run

同時 build 所有 projects 內有 build script 的專案。

`nx run-many --target=build --all --parallel`

![](/assets/images/2021-12-28-23-01-03.png)

- https://angular.tw/cli/run
- https://nx.dev/l/a/cli/run-many

## 5. 其他補充

### 5-1. 常見的 Monorepo 架構開發工具

![](/assets/images/2021-12-28-23-03-34.png)

還有更多工具: https://github.com/korfuri/awesome-monorepo

### 5-2. 誤解: Nx 和 Yarn Workspace/Lerna 只能擇一使用?

https://nx.dev/l/n/guides/lerna-and-nx#clarifying-misconceptions

![](/assets/images/2021-12-28-23-05-05.png)

功能沒有重疊，Nx 不是 package manager 也不是 JS-only 的工具。可一起用。

![](/assets/images/2021-12-28-23-05-31.png)

Nx 官方 youtube 頻道相關影片

- [How to Migrate From Lerna to Nx](https://www.youtube.com/watch?v=Edv7ZeI8Bwc)
- [Lerna/Yarn to Nx: Faster Build Times + Better Dev Ergonomics](https://www.youtube.com/watch?v=BO1rwynFBLM)

### 5-3. 查看有哪些 Nx plugin 可以使用

`nx list`

或到官網查看列表:
https://nx.dev/community#community-plugin-list

### 5-4. Nx 13

![](/assets/images/2021-12-28-23-07-16.png)

Webpack 5 Module Federation Plugin

- https://nx.dev/l/a/guides/setup-mfe-with-angular
- Micro Frontends with Angular using Module Federation - Manfred Steyer

### 5-5. Nx 學習資源

- Nx 官網

  https://nx.dev/

- Nx Console for VSCode 介紹

  https://nx.dev/latest/angular/getting-started/console#nx-console-for-vscode

- Github 上用 Nx + Angular 星星數最多的專案 Angular Spotify by Trung Vo

  https://github.com/trungk18/angular-spotify

- Angular Spotify 作者專訪 youtube

  https://youtu.be/w04CfqZI8Xo

- Nx Conf 連結 (2021/9/16-2021/9/17)

  https://youtu.be/oG2QbFquraA

  https://www.youtube.com/watch?v=hlGOaGDsWKg

- 書

  https://connect.nrwl.io/app/books

  https://nrwl.io/products
