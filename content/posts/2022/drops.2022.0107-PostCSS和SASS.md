---
id: SIdMIFLQNg5jfa6ePoqt5
title: 0107 PostCSS 和 Sass
desc: ''
updated: 1647711602708
created: 1641561592013
tags: CSS
---

## 1. 前言

到底為什麼要用 PostCSS 和 Sass?

本篇筆記目的在搞清楚 CSS 的定義，然後說明 PostCSS 和 Sass 的用途。

## 2. 關於 CSS

不免俗先來權威機構 [W3C](https://zh.wikipedia.org/wiki/%E4%B8%87%E7%BB%B4%E7%BD%91%E8%81%94%E7%9B%9F) 的定義。

https://www.w3.org/standards/webdesign/htmlcss

> What is CSS?
> CSS is the language for describing the presentation of Web pages, including colors, layout, and fonts. It allows one to adapt the presentation to different types of devices, such as large screens, small screens, or printers. CSS is independent of HTML and can be used with any XML-based markup language. The separation of HTML from CSS makes it easier to maintain sites, share style sheets across pages, and tailor pages to different environments. This is referred to as the separation of structure (or: content) from presentation.

> CSS 是啥?
> CSS 是一種描述網頁呈現外觀的語言，包括顏色、排版、字體。它能根據載體來調整不同的呈現類型，譬如大螢幕、小螢幕或印表機。
> CSS 獨立於 HTML 而且可以搭配任何以 XML 為基礎(XML-based) 的標記語言。在 HTML 中將 CSS 區分出來可以更容易地維護一個網站、跨頁分享樣式表和將頁面適應(tailor)於不同環境。這個涉及呈現外觀(presentation)的分離結構(或: 內容)。

感覺起來 CSS 就是拿來定義頁面的樣式的。那命名是還蠻貼切的: CSS (Cascading Style Sheets)，如瀑布般下落的樣式表單。

### 2.1. CSS 版本

https://zh.wikipedia.org/wiki/%E5%B1%82%E5%8F%A0%E6%A0%B7%E5%BC%8F%E8%A1%A8

- CSS Level 1
- CSS Level 2
- CSS Level 3
- CSS Level 4

我就是從 CSS3 入門的! 動畫超有趣!🥰

> CSS3 亦支援動畫（animation）及立體（preserved-3d）。 —— Wikipedia

### 2.2. CSS Syntax (句法)

https://www.w3schools.com/css/css_syntax.asp

![](/assets/images/2022-01-07-22-52-32.png)

> HTML 和 CSS 是建置網頁的核心技術。透過瀏覽器我們可以看到網頁，所以可以透過 [Can I use](https://caniuse.com/) 來確定某個 CSS 的屬性(property)能不能使用。

### 2.3. CSS Specificity (權重)

再次不免俗，MDN 權威定義: https://developer.mozilla.org/en-US/docs/Web/CSS/Specificity

> Specificity is the means by which browsers decide which CSS property values are the most relevant to an element and, therefore, will be applied. Specificity is based on the matching rules which are composed of different sorts of CSS selectors.

> 權重讓瀏覽器決定哪個元素跟屬性最有相關，而最相關的會被賦予樣式。權重依照 CSS 選擇器的排序有一套專屬的比對規則。

```markdown
!important > inline style > ID > Class/psuedo-class/attribute > Element
0, 0, 0, 0, 0
```

有些例外: :is() 和 :not() 不納入權重計算。

跟 js 一樣，css 從前往後讀，相同權重越後面的會覆蓋前面的。

以 HTML 巢狀結構來看，內層會繼承上層樣式，但是如果該元素有被指定樣式，則以自己層的樣式為優先。

所以計算權重指的是 HTML 結構中同一層元素，以該元素的 CSS 選擇器(Selector) 來計算權重。

![](/assets/images/2022-01-07-23-16-39.png)

> 位數概念: 如圖，最上層位數最大。

Selector 計算方式舉例:

```markdown
body h3 a → 0,0,0,0,3
body>h3>a → 0,0,0,0,3
body h3.myClass a → 0,0,0,1,3
body h3.myClass::before → 0,0,0,2,2
body h3 a:hover→ 0,0,0,1,3
body h3 a[href^="https"]→ 0,0,0,1,3
```

這樣看起來我已經好久沒有用過 ID 了，Class/psuedo-class/attribute、 Element 最常用。😳

### 2.4. CSS 效能

[writing-efficient-css-selectors by Harry](https://csswizardry.com/2011/09/writing-efficient-css-selectors/)

使用哪種選擇器效能比較好?(由上而下月上面的 selector 方式越好):

1. ID, e.g. `#header`
2. Class, e.g. `.promo`
3. Type, e.g. `div`
4. Adjacent sibling, e.g. `h2 + p`
5. Child, e.g. `li > ul`
6. Descendant, e.g. `ul a`
7. Universal, i.e. `*`
8. Attribute, e.g. `[type="text"]`
9. Pseudo-classes/-elements, e.g. `a:hover`

看起來就是選得越準確越好。

[css-selector-performance by Steven Bradley](https://vanseodesign.com/css/css-selector-performance/)

- Avoid Universal Rules:

  避免用 `*` (全選很耗效能)。

- Don't qualify ID Rules with tag names or classes:

  不要把 ID 名命名為 tag 名或 class 名。

- Don't qualify Class Rules with tag names

  不要把 class 名命名為 tag 名。

- Use the most specific category possible

  用最明確的類別(指定的越準確效能越好)。

- Avoid the descendant selector

  避免 `ul li` 選，跟全選同概念，很耗效能。

- Tag Category rules should never contain a child selector

  tag 應該永不包含 child selector。

  也就是說不建議這樣 `ul > li`。

  有點難懂...應該跟 `*` 同概念，選越少越好?🙄

- Question all usages of the child selector

  所有的 `ul > li` 都要抱持懷疑，真的有必要這麼多層嗎?

  感覺是可讀性和效能的取捨耶。

- Rely on inheritance

  請倚賴繼承。

- Use scoped stylesheets

  使用區域樣式表單。

  寫 angular 就是都有使用 scoped stylesheets，每一個 conponent 都幫你切好好的一個 scope。

## 3. Sass 和 PostCSS 跟 CSS 的關係

根據上面的介紹，感覺 CSS 那麼多功能又深奧，到底為什麼還需要 Sass 和 PostCSS?

來看一下各自的官網簡介:

### 3.1. Sass

https://sass-lang.com/

> Sass is the most mature, stable, and powerful professional grade CSS extension language in the world.

> Sass 是世上最成熟、穩定、強大的專家級 CSS 擴充語言。

### 3.2. PostCSS

https://postcss.org/

> A tool for transforming CSS with JavaScript

> 一個用 JavaScript 轉換 CSS 的工具。

從字面上看起來它們都是幫助人們撰寫 CSS 的工具。

接下來要來看它們如何幫助開發與其運作原理。

## 4. Sass

### 4.1. Sass 特點

- CSS 兼容性 CSS Compatible

  Sass 可以完全兼容 CSS 的所有版本。Sass 十分看重兼容性，所以可以無縫接軌到任何可用的 CSS library 上。
  Sass is completely compatible with all versions of CSS. We take this compatibility seriously, so that you can seamlessly use any available CSS libraries.

- 功能豐富 Feature Rich

  Sass 自豪擁有比其他 CSS 擴充語言更多的功能和能力。Sass 核心團隊無止境的工作不只是為了維持還包含持續領先。
  Sass boasts more features and abilities than any other CSS extension language out there. The Sass Core Team has worked endlessly to not only keep up, but stay ahead.

- 成熟的 Mature

  Sass 已經被支援 15 年了。
  Sass has been actively supported for about 15 years by its loving Core Team.

- 業界認可 Industry Approved
  業界總是首選 Sass 作為 CSS 擴充語言。
  Over and over again, the industry is choosing Sass as the premier CSS extension language.

- 龐大社群 Large Community

  Sass 被聯營企業、科技公司和上百位開發者共同支持與開發著。
  Sass is actively supported and developed by a consortium of several tech companies and hundreds of developers.

- 框架 Frameworks
  有無數框架使用 Sass 建置而成。如 Compass、Bourbon、Susy...等。
  There are an endless number of frameworks built with Sass. Compass, Bourbon, and Susy just to name a few.

### 4.2. Sass 運作原理(如何變成 CSS)

https://www.w3schools.com/sass/sass_intro.php

瀏覽器看不懂 Sass 程式碼。因此，你會需要 Sass 預處理器將 Sass 程式碼轉換成標準的 CSS。

這個過程稱為轉譯。所以你需要給轉譯器(一種程式) Sass 程式碼然後會得到 CSS 程式碼。

小秘訣: 轉譯是一個取得一個語言的源碼然後將它轉變/轉譯成另一種語言。

> A browser does not understand Sass code. Therefore, you will need a Sass pre-processor to convert Sass code into standard CSS.
>
> This process is called transpiling. So, you need to give a transpiler (some kind of program) some Sass code and then get some CSS code back.
>
> Tip: Transpiling is a term for taking a source code written in one language and transform/translate it into another language.

## 5. PostCSS

### 5.1. PostCSS 特點

- Autoprefixer

  ![](/assets/images/2022-01-17-15-15-09.png)

  增加可讀性
  從 Can I Use 的資料加入廠商前綴詞，[Autoprefixer](https://github.com/postcss/autoprefixer) 會使用目前人氣瀏覽器和屬性支持度來幫你加上前綴。
  Increase code readability
  Add vendor prefixes to CSS rules using values from Can I Use. Autoprefixer will use the data based on current browser popularity and property support to apply prefixes for you.

  ```CSS
  /* CSS input */
  :fullscreen {
  }

  /* CSS output */
  :-webkit-full-screen {
  }
  :-ms-fullscreen {
  }
  :fullscreen {
  }
  ```

- 使用最新的 CSS 語法! Use tomorrow's CSS today!

  [postcss-preset-env](https://github.com/csstools/postcss-preset-env) 讓你可以將現代 CSS 用 [cssdb](https://github.com/csstools/cssdb/blob/main/README.md) 根據你的目標瀏覽器或 runtime 環境來轉換成大多數瀏覽器可以懂、決定用哪種 polyfills 的 CSS。
  PostCSS Preset Env, lets you convert modern CSS into something most browsers can understand, determining the polyfills you need based on your targeted browsers or runtime environments, using [cssdb](https://github.com/csstools/cssdb/blob/main/README.md).

  ```CSS
  /* CSS input */
  body {
      color: lch(53 105 40);
  }

  /* CSS output */
  body {
      color: rgb(250, 0, 4);
  }

  ```

- CSS 模組 CSS Modules

  全域 CSS 的盡頭
  CSS 模組代表你不需要擔心命名太過通用，可以直接使用最具意義的命名。
  The end of global CSS
  CSS Modules means you never need to worry about your names being too generic, just use whatever makes the most sense.

  ```CSS
  /* CSS input */
  .name {
       color: gray;
  }

  /* CSS output */
  .Logo__name__SVK0g {
      color: gray;
  }
  ```

- 避免錯誤 Avoid errors in your CSS

  使用 [stylelint](https://github.com/stylelint/stylelint) 執行一致的常規並避免樣式表的錯誤。[stylelint](https://github.com/stylelint/stylelint) 是一個現代 CSS linter，支援最新的 CSS 語法，也支援如 SCSS 的 CSS-like 語法。
  Enforce consistent conventions and avoid errors in your stylesheets with [stylelint](https://github.com/stylelint/stylelint), a modern CSS linter. It supports the latest CSS syntax, as well as CSS-like syntaxes, such as SCSS.

### 5.2. PostCSS 運作原理(如何變成 CSS)

https://www.youtube.com/watch?v=WhCXiEwdU1A

> ![](/assets/images/2022-01-17-16-12-49.png)
> 可以和 Sass、less 合用，或是如圖用 postCSS 的 plugin 功能取代 Sass 和 less。

https://www.toptal.com/front-end/postcss-sass-new-play-date

> PostCSS is all about plugins. PostCSS 就是 plugins。

https://cythilya.github.io/2018/08/10/postcss/

> Summer 大大的文章。

## 小結

我還是搞不懂 postCSS 和 Sass 的差別xD
但是知道 postCSS 是需要什麼功能時才透過加入 plugin 來使用功能，
而 Sass 是一開始整包就幫你準備好了，照用就好了。

## 6. tailwindcss

https://tailwindcss.com/

> Rapidly build modern websites without ever leaving your HTML.
> 不用離開 HTML 就可以建置現代網頁。

---

## 7. Angular 相關

以下是 Angular 應用 css 套件的相關文章。

https://angular.tw/guide/component-styles

## 8. Angular 已經有 Autoprefixer 了

[Autoprefixer](https://angular.tw/guide/build#configuring-browser-compatibility)

## 9. PurgeCSS with Angular

https://dev.to/dylanvdmerwe/reduce-angular-style-size-using-purgecss-to-remove-unused-styles-3b2k

## 10. webpack Loaders

> sass-loader、postcss-loader

https://stackoverflow.com/questions/59715916/how-to-use-sass-loader-in-angular

## 11. tailwindcss with Angular

https://hsuchihting.github.io/TailwindCSS/20210702/3640682418/

https://medium.com/@JedChou/%E5%A6%82%E4%BD%95%E5%9C%A8-angular-%E5%B0%88%E6%A1%88%E4%B8%AD%E4%BD%BF%E7%94%A8-tailwind-css-e119b6390803

## 12. Nx for Angular and tailwind

https://nx.dev/angular/setup-tailwind

先下載 tailwind

```bash
npm install tailwindcss@latest postcss@latest autoprefixer@latest
```

選擇 .scss

```javascript
@import "tailwindcss/base";
@import "tailwindcss/components";
@import "tailwindcss/utilities";
```

https://nx.dev/guides/using-tailwind-css-in-react#step-1-install-tailwind-dependencies

npm install stylelint-config-recommended --save-dev

13 版後 tailwind.config.js 會放置在 app 裡，預設只會

```javascript
module.exports = {
  content: [
    join(__dirname, 'src/**/*.{html,ts}'),
    ...createGlobPatternsForDependencies(__dirname),
  ],
  //...
};
```
