---
id: sy14xjjozy0n9ustvre7tbo
title: "0907 [C#] 從 List 到 IEnumerable 和 IQueryable"
desc: ""
updated: 1662567583552
created: 1662559527764
tags:
  - C#
---

## IEnumerable vs List - 如何使用? 他們是如何運作的?

以下取自: https://stackoverflow.com/questions/3628425/ienumerable-vs-list-what-to-use-how-do-they-work/3628465

- 一個類別實作 `IEnumerable` 的話，可以讓你使用 `foreach` 語法。

  > A class that implement `IEnumerable` allows you to use the `foreach` syntax.

- 一個 `IEnumerable` linq 陳述式，當你在使用 `foreach` 的時候會執行迭代，但你可以使用 `.ToList()` 強迫他馬上迭代。

  > An `IEnumerable` linq statement executes when you iterate the `foreach`, but you can force it to iterate sooner using `.ToList()`.

- `IEnumerable` 是唯獨的，而 `List` 並不是.

  > `IEnumerable` is read-only and `List` is not.

- 當你使用 `IEnumerable` 你給編譯器一個機會推遲執行，在這期間可能有所優化。

  > When you use `IEnumerable`, you give the compiler a chance to defer work until later, possibly optimizing along the way.

- 如果你使用 `ToList()` 你強迫編譯器馬上實體化出結果。
  > If you use `ToList()` you force the compiler to reify(實體化) the results right away.

## LINQ 不會產生 Sql 去查詢(query)資料庫，直到你列舉(enumerate)他

    > LINQ doesn't generate the SQL to query the database until you enumerate it

- `IEnumerable` 可以放置(stacking) LINQ expressions。

- e.g 當你用 `foreach` 列舉，或者使用 `ToList()` 才會執行查詢資料庫的動作。

# 小結

因為 linq 在你列舉他之前，不會去馬上去資料庫抓資料。
列舉就是指 foreach 和 toList()
他說 IEnumerable 可以拿來放 LINQ expressions。
最後要拿資料再 toList() 就好

## IEnumberable 的大缺點

- [最全数据结构详述: List VS IEnumerable VS IQueryable VS ICollection VS IDictionary](https://www.cnblogs.com/powertoolsteam/p/4936818.html)

  > 使用 IEnumberable 會從服務器端將所有數據拷貝到客戶端，並進行一定的過濾，如果服務器端有大量數據會造成內存負載超重。

## `IEnumerable` vs `IQueryable`

- [Returning `IEnumerable<T>` vs. `IQueryable<T>`](https://stackoverflow.com/questions/2876616/returning-ienumerablet-vs-iqueryablet)

  > The difference is that `IQueryable<T>` is the interface that allows LINQ-to-SQL (LINQ.-to-anything really) to work. So if you further refine your query on an `IQueryable<T>`, that query will be executed in the database, if possible.

  > For the `IEnumerable<T>` case, it will be LINQ-to-object, meaning that all objects matching the original query will have to be loaded into memory from the database.

## 小結

- 先備觀念:
  linq 在列舉後才會到資料庫撈資料。

- 問題: `IEnumerable<T>` 和 `IQuertable<T>` 差別

  - `IEnumerable<T>`

  1. LINQ-to-object 可以放置(stacking) LINQ expressions
  2. 但無法修改(新增刪除)。
  3. 列舉時，無論有無下查詢條件，都會從 server 將所有數據拷貝到 client (`select * from [dbo.xxx]`)。

  - `IQuertable<T>`

  1. allows LINQ-to-SQL (LINQ-to-anything really)
  2. 可以放置(stacking) LINQ expressions。
  3. 在列舉前都可對查詢條件做修改。

### 可以看這兩篇範例，會更清楚

- [關於`IQueryable<T>`特性的小實驗](https://blog.darkthread.net/blog/iqueryable-experiment/)

- [最全数据结构详述: List VS IEnumerable VS IQueryable VS ICollection VS IDictionary](https://www.cnblogs.com/powertoolsteam/p/4936818.html)
  > ![](/assets/images/2022-09-07-22-36-54.png)

## 參考資料

- [關於 `IQueryable<T>` 特性的小實驗](https://blog.darkthread.net/blog/iqueryable-experiment/)

- [最全数据结构详述: List VS IEnumerable VS IQueryable VS ICollection VS IDictionary](https://www.cnblogs.com/powertoolsteam/p/4936818.html)

- [IEnumerable v.s IQueryable](https://dotblogs.com.tw/UgiYo/2019/08/10/001704)

- [[Web API] 讓 Web API 支援 OData 查詢](https://dotblogs.com.tw/joysdw12/2013/06/07/web-api-odata)
