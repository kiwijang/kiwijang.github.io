---
id: o8n23ae0i8b5o5go3ipx4os
title: 0320 JS 小知識(一)
desc: ''
updated: 1647931393974
created: 1647774542471
tags:
 - JavaScript
description: "以範例整理 JavaScript 遞增與遞減運算子，說明前置與後置運算的執行順序和賦值差異。"
---

## 遞增運算子(++)與遞減運算子(--)

```javascript
x++ ←→ x = x + 1
x-- ←→ x = x - 1
```

## 前置運算(Pre Increment)

```javascript
┌─ x 加一後代入 y
│    ↑
↓  ┌───┐
y = │ ++x; │→ x 代入 x+1 的結果
    └───┘
```

前置運算(Pre Increment): 先計算後再給值，y 和 x 的值一致都是計算後的結果(x+1 的值)。

## 後至運算(Post Increment)

```javascript
┌── y 代入 x 的值
│        ↑
│   ┌─ │ ──┐
↓   │ ┌─┐   │
y  = │ │ x│++;│
     │ └─┘   │→ x 後代入 x+1 的結果
     └─────┘
```

後至運算(Post Increment): 先給值後再計算，y 可以保留 x+1 之前的值，x 保留 x+1 的值。

## 差別

```javascript
// Post Increment
var x = 3;
var y = x++;
console.log(x); // 4
console.log(y); // 3
console.log(`上一號: ${y}，目前號碼: ${x}`); // 上一號: 3，目前號碼: 4

// Pre Increment
var x = 3;
var y = ++x;
console.log(x); // 4
console.log(y); // 4
console.log(`目前人數共 ${x}/${y}`); // 目前人數共 4/4
```

總之，

++x 運算符號在前(Pre)，就先進行運算!

x++ 運算符號在後(Post)，先附值到使用運算子的對象上(x)，再運算。
