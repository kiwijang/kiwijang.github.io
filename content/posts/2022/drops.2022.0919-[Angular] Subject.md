---
id: j4z39p3vfjvc2ge3lktqajs
title: '0919 [Angular] Subject'
desc: ''
updated: 1663606956437
created: 1663604952261
tags:
  - Angular
description: "整理 Angular 元件溝通與 RxJS Subject 的觀念，記錄 EventEmitter、BehaviorSubject、Observable 與 Observer 的關係。"
---
<!-- 
date: 2020-05-16 09:34:52
 -->
## 初探 Angular Subject
從 Angular Subject 看到 RxJS Subject
<!-- more -->
### Angular Subject
> Every Subject is an Observable. Every Subject is an Observer.
> subject 是 observable 也是 observer。

EventEmitter 是繼承 Subject 的 Class，之前有用到 EventEmitter 的地方在元件的溝通。
![](https://i.imgur.com/6bjsuRk.png)

## Angular 元件的溝通
資料來源: https://stackoverflow.com/questions/37587732/how-to-call-another-components-function-in-angular2
元件溝通有四種，父傳子、子傳父、相鄰子元件、不相關的元件
![](https://i.imgur.com/8RYwc55.png)
## 子傳父
用到 EventEmitter。
![](https://i.imgur.com/ZHZMY5h.png)

## 元件傳元件
用到 BehaviorSubject。
![](https://i.imgur.com/XJGFBXh.png)

---
# RxJS Subject
## 什麼是 Subject ?
Subject 是 Observable 也是 Observer 。
### Observable(可觀察的物件)
代表一組未來即將產生的事件資料(被觀察的物件)

### Observer (觀察者物件)
代表一個用來接收「**觀察結果**」的物件(收到的就是**事件資料**)
觀察者物件就是一個物件包含 **3** 個含有**回呼函式**的屬性(**next, error, complete**)

### Subscription (訂閱物件)
代表正在執行 Observable/Observer 的執行個體(可用來**取消訂閱**)

### Subject (主體物件)
如同 EventEmitter 一樣，主要用來**廣播**收到的事件資料給多位 Observer (觀察者) 

## 什麼是 Subject ?
Subject 是 Observable 也是 Observer 。
> observable.subscribe(observer); 

![](https://i.imgur.com/RJYMCHW.png)

RxJS 裡的 Subject 有 4 種類型，Subject、BehaviorSubject、ReplaySubject 、 AsyncSubject

參考來源:
https://rxjs.dev/guide/subject
http://reactivex.io/documentation/subject.html
https://medium.com/angular-in-depth/mastering-rxjs-operators-and-functions-that-can-bite-you-when-you-dont-expect-cb2047cf5d4c

## Subject、BehaviorSubject
回傳訂閱前後到complete()前的範圍
![](https://i.imgur.com/H0Jty8h.png)
回傳訂閱後到complete()前的範圍
![](https://i.imgur.com/is3H2L9.png)
[Subject、BehaviorSubject Demo](https://codepen.io/kiwijang/pen/abvGGwy?editors=0012)

## ReplaySubject、 AsyncSubject
![](https://i.imgur.com/HNrqWS5.png)
第一次訂閱:回傳訂閱前後到complete()前的範圍
之後訂閱:回傳訂閱前所有值(無視complete())

回傳complete()前一個值
![](https://i.imgur.com/Vp7NzCY.png)
![](https://i.imgur.com/zeniMhc.png)
[ReplaySubject、 AsyncSubject Demo](https://codepen.io/kiwijang/pen/vYNjrBw)

### 小結
![](https://i.imgur.com/WHqXqic.png)
* observable 被 subscribe 以後會有一個 observer 物件
* observer 這個物件具有三個方法，分別是 next, error, complete
* subscribe 會 return subscription(訂閱物件)
---
### 簡寫 observer
![](https://i.imgur.com/DDj8Wrd.png)

---

參考資料:
* [rxjs 官網](https://rxjs.dev/)
* [RxJS 6 新手入門 - 保哥 youtube](https://www.youtube.com/watch?v=BA1vSZwzkK8&t=)
* [reactive.how](https://reactive.how/)
* [RxJS Marbles: Built on RxJS v5.0.3](https://rxmarbles.com/)
* [[S05E04]RxJS 基本介紹 - Subject](https://www.youtube.com/watch?v=9udVLO947kk&t=1224s)
* [What is the difference between Subject and BehaviorSubject?](https://stackoverflow.com/questions/43348463/what-is-the-difference-between-subject-and-behaviorsubject)
* [30 天精通 RxJS(23): Subject, BehaviorSubject, ReplaySubject, AsyncSubject](https://ithelp.ithome.com.tw/articles/10188677)
* [深入浅出RxJS.pdf](https://github.com/kekeqy/ebook/blob/master/%E6%B7%B1%E5%85%A5%E6%B5%85%E5%87%BARxJS.pdf)