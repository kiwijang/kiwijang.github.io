---
id: 7vo9q7rwhx3xyyg8auxb22s
title: '0919-[Angular] 驗證與共用元件'
desc: ''
updated: 1663607028791
created: 1663605967730
tags:
  - Angular
status: w
description: "比較 Angular 新增與編輯表單的共用元件設計，整理 Reactive Forms、欄位驗證與 API 職責的拆分思路。"
---

<!-- title: tag0418-2021-表單驗證心得記錄
date: 2021-04-18 18:24:14
categories: 學習日記 -->

關於共用表單頁面、表單驗證的 ui 的一些想法...

<!-- more -->

## 共用元件

通常新增和編輯的頁面會需要共用

### 法 1: 蒐集資料用的表單(包含打 api 功能)

##### 📌 新增時

1. 要給 api 用的資料會要在共用元件裡蒐集起來，打 api

##### 📌 編輯時

1. 要先在編輯頁打 api 拿到資料 input 到共用元件
2. 給 api 用的資料會要在共用元件裡蒐集起來，打 api
   (編輯比新增多一步驟)

新增頁面和編輯頁面的送出按鈕都會寫在共用元件裡，
這樣需要多 input 一個參數來看現在是在編輯狀態還是新增狀態，
然後打 api 會跟著按鈕走，所以打新增和修改的 api 的動作會寫在共用元件裡...

所以共用元件除了欄位驗證邏輯會寫裡面，還要 input 狀態進去判斷現在是要新增還編輯，還要根據狀態打不同的 api
那這樣拆成新增編輯 component 就只是為了 routing 比較方便了

### 法 2: ReactiveForm 同步雙向綁定

如果我是用 ReactiveForm 做共用元件的話就可以把按鈕放到各自新增和編輯的 component、也可以各自注入 service 打 api
這樣共用元件的功能就單純很多: 欄位驗證、蒐集資料、角色判斷、控制欄位 disable
不用幫畫面的按鈕做狀態判斷是否顯示
然後打 API 前的資料的檢查(轉成字串、是否要吃使用者輸入的資料還是寫死)就是在各自的 component 裡判斷、注入 api 的 service
**相對法 1 ，法 2 可以讓共用元件更專注在驗證邏輯和資料的邏輯(就不用去在意 input 和新增編輯狀態的管理)**
所以我從頭到尾只用在意輸入的資料，完全不用去管什麼時候要 input output、 input output 的值變化後什麼時候被什麼事件觸發去改變值
我只要輸入資料，資料就在共用元件裡經過驗證，並根據傳入的資料做介面的變化
其他打 api 的動作也拆出去在共用元件以外的地方做，讓共用元件真的就只用做 ui 與資料驗證的控制就好

所以我是比較喜歡用 ReactiveForm 來做共用元件 xD

#### 法 2 demo

[⚡stackblitz ReactiveForm 共用元件](https://stackblitz.com/edit/angular-ivy-qaqscf?file=src/app/app.component.ts)

> 此 demo 參考自 [Building Reusable Forms in Angular - Cory Rylan](https://coryrylan.com/blog/building-reusable-forms-in-angular)

#### 參考資料

[[功能介紹-10] Reactive Forms (Model-Driven Forms)](https://ithelp.ithome.com.tw/articles/10195280)

---

## 欄位驗證

[Angular Forms: Useful Tips - Armen Vardanyan](https://indepth.dev/posts/1224/angular-forms-useful-tips)

> Forms are not type-safe

- 可以使用 Pipes 做 ui 顯示轉換的處理
- 可以使用 Directives 做表單的驗證處理

### 欄位驗證的方式

- 只能輸入...: 只能輸入中英、只能輸入英文、只能輸入數字、只能輸入特定幾個字
  => 直接讓使用者不能敲除了規定以外的字就不用做錯誤提示了!(使用者在輸入時將不符合規定的都置換成空字串'')

- 限制字數
  => 使用 html `<input type="text">` 的 `maxlength` 去限制字數
  不要用 `type="number"` 不然沒辦法精準控制輸入的字數...

- 錯誤提示: 達到特定條件要提示錯誤，如. 必須大於 0、起訖日有誤
  => 用 (input) 和 (change) 去綁事件判斷不符合條件時 formControl 要 setErrors() 並加入 html 提示
  可以將事件方法和錯誤 dom 抽出來寫成 directive

#### 錯誤題示 directive demo

[⚡stackblitz 將錯誤題示寫成 directive](https://stackblitz.com/edit/angular-ivy-bsunxe?file=src/app/app.component.html)
