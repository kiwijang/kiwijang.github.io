---
title: Angular 畫面變更偵測的歷史演變：從 digest 到 Signals 與 Zoneless
date: "2026-10-11"
description: 從 AngularJS 的 dirty checking、Angular 的 Zone.js 與 OnPush，到 Ivy、Signals、Zoneless 及 Angular v22 的預設策略，整理畫面更新機制的演變與實際差異。
tags: [Angular, JavaScript, 前端]
---

寫 Angular 時，很容易遇到一個問題：資料明明變了，畫面為什麼還沒變？也可能遇到相反的情況：資料沒變，Angular 卻一直在檢查畫面。

這兩種現象，都和 **Change Detection（變更偵測）** 有關。本文所說的「畫面偵測」，指的是 Angular 檢查模板綁定、讓資料反映到 DOM 的過程；瀏覽器後續的排版與繪製，則是另一個階段。

Angular 的演變，可以沿著兩個問題理解：**何時安排檢查？哪些 view 需要檢查？** 以下依官方文件整理，版本資訊查核日期為 2026-10-11。

## 演變時間軸

| 時期 | 主要機制 | 解決的問題 |
| --- | --- | --- |
| AngularJS 1.x | `$watch`、`$apply`、`$digest` | 將 scope 的資料變動同步到畫面 |
| Angular 2 起 | 元件樹、模板綁定檢查、Zone.js／NgZone | 以元件為單位組織檢查，追蹤可能改變狀態的非同步工作 |
| 早期 Angular 已具備 | OnPush | 跳過沒有更新通知的元件子樹 |
| Angular 9，2020 | Ivy 成為預設編譯與渲染引擎 | 更換底層模板編譯與執行架構 |
| Angular 16，2023 | Signals 開發者預覽 | 用可追蹤的狀態與依賴表達變化 |
| Angular 17，2023 | `signal`、`computed` 等核心 API 穩定 | 讓 Signals 成為可正式採用的狀態工具；`effect` 當時仍為預覽 |
| Angular 18，2024 | 實驗性 Zoneless | 不透過 Zone.js，也能安排畫面更新 |
| Angular 20.2，2025 | Zoneless 穩定 | 將無 Zone.js 的變更偵測正式化 |
| Angular 21，2025 | Zoneless 預設啟用 | 新預設改以 Angular 的更新通知安排檢查 |
| Angular 22，2026 | OnPush 成為預設策略 | 將依通知決定檢查範圍的策略設為預設 |

這些機制有不同職責，不能把它們全部視為互相取代的版本。例如，OnPush 早於 Signals；Ivy 也不等於 Zoneless。版本節點可交叉查閱 [v9 發布公告](https://blog.angular.dev/version-9-of-angular-now-available-project-ivy-has-arrived-23c97b63cfa3)、[v16 發布公告](https://blog.angular.dev/angular-v16-is-here-4d7a28ec680d)、[v17 發布公告](https://blog.angular.dev/introducing-angular-v17-4d7033312e4b)、[官方 Roadmap](https://angular.dev/roadmap) 與 [元件策略文件](https://angular.dev/guide/components/advanced-configuration)。

## AngularJS：用 digest 反覆檢查資料

AngularJS 以 `$scope` 連接資料和畫面。模板中的表達式會建立 watcher；執行 `$digest` 時，再將 watcher 的結果與前一次比較。

若 watcher 的回呼又改了其他值，digest 會繼續檢查，直到資料穩定。這就是 dirty checking：透過比較，發現值是否改變。

```javascript
angular.module('demo', [])
  .controller('CounterController', function ($scope) {
    $scope.count = 0;

    $scope.increment = function () {
      $scope.count += 1;
    };
  });
```

```html
<div ng-controller="CounterController">
  <button ng-click="increment()">加一</button>
  <p>{{ count }}</p>
</div>
```

`ng-click` 會把程式帶進 AngularJS 的執行環境，經由 `$apply` 觸發 digest。若使用框架以外的回呼，則可能需要自行呼叫 `$apply`。

這套做法讓普通 JavaScript 資料也能更新畫面，但 watcher 越多、每次求值越昂貴，檢查的成本就越高。機制說明見 [AngularJS Scope 文件](https://docs.angularjs.org/guide/scope)。

## Angular 2 起：元件樹與 Zone.js

新版 Angular 將應用程式組織成元件樹，檢查各 view 的模板綁定，必要時更新 DOM。它仍會比較綁定值，但不再沿用 AngularJS 的 scope watcher 與 digest 架構。

傳統 Zone-based 應用程式透過 Zone.js 追蹤事件、計時器、Promise 等工作；NgZone 提供 Angular 與這些工作的連接點。當 Angular zone 的微任務佇列清空時，Angular 可以據此啟動檢查。

```text
事件或非同步工作
        ↓
Zone.js／NgZone 提供檢查時機
        ↓
Angular 檢查符合條件的 view
        ↓
更新有差異的 DOM 綁定
```

**Zone.js 不會知道哪一個欄位被改了。** 它提供的是「可能有變化」的訊號，實際比對由 Angular 執行。因此，第三方套件的計時器即使沒有改變畫面資料，也可能造成多餘的檢查。參考 [Zone pollution](https://angular.dev/best-practices/zone-pollution) 與 [NgZone API](https://angular.dev/api/core/NgZone)。

### NgZone：把無須更新畫面的工作移出去

在 Zone-based 應用程式中，可以用 `runOutsideAngular()` 執行高頻工作，再於需要更新狀態時用 `run()` 回到 Angular zone。

這能減少檢查的觸發次數，但不會自動解決昂貴的模板運算。若元件採用 OnPush，重新進入 zone 也不代表所有 OnPush view 都會被標記更新；還是需要合適的更新通知。API 用法見 [NgZone 官方文件](https://angular.dev/api/core/NgZone)。

## OnPush：縮小需要檢查的範圍

OnPush 解決的是檢查範圍。它讓 Angular 可以略過尚未收到更新通知的元件子樹，而不是只要有非同步工作，就把所有元件都重新求值。

觸發條件包含模板綁定帶來的新 input、元件子樹內由 Angular 處理的事件，以及 `markForCheck()` 等通知。`AsyncPipe` 也會協助通知 Angular；模板讀取的 Signal 更新時，同樣能標記使用它的 view。

因此，「OnPush 只會在 input reference 改變時更新」並不完整。物件維持同一個 reference 而直接修改屬性，確實可能無法透過 input 比較觸發更新；但事件等其他條件仍可能讓畫面被檢查。詳見 [跳過元件子樹](https://angular.dev/best-practices/skipping-subtrees)。

```typescript
// 原地修改，物件 reference 沒有改變。
this.user.name = 'Kiwi';

// 建立新物件，讓 input 的 reference 產生變化。
this.user = { ...this.user, name: 'Kiwi' };
```

不可變更新讓資料變化更容易判斷。它也能減少「某次點擊後畫面突然才更新」這種難以追查的情況。

## Ivy：更新底層引擎，尚未移除 Zone.js

Angular 9 將 Ivy 設為預設編譯與渲染引擎。模板會被編譯成執行所需的指令，並由新的底層架構管理 view 與綁定更新。

這是編譯和執行架構的重要改變，但 **Ivy 上線不代表應用程式已經不用 Zone.js**。當時的應用程式仍可依賴 NgZone，也仍有 Default 與 OnPush 策略。

理解這個分界很有用：渲染引擎決定模板如何執行，排程機制決定何時執行檢查。詳見 [Angular v9 官方公告](https://blog.angular.dev/version-9-of-angular-now-available-project-ivy-has-arrived-23c97b63cfa3)。

## Signals：讓狀態與依賴變得可追蹤

Angular 16 引入 Signals 開發者預覽。Angular 17 將 `signal`、`computed` 等核心 API 提升為穩定；不能把這理解為所有相關 API 都在 v17 同時穩定，`effect` 當時仍在預覽階段。見 [v16 公告](https://blog.angular.dev/angular-v16-is-here-4d7a28ec680d) 與 [v17 公告](https://blog.angular.dev/introducing-angular-v17-4d7033312e4b)。

普通欄位的指定沒有直接描述誰依賴它；Signal 則透過讀取與更新建立可追蹤的關係。模板讀取 Signal 後，Angular 能在值變化時標記相關 view。`computed` 用來表達衍生值，會快取結果，並在依賴改變後於需要時重新計算。

```typescript
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

@Component({
  selector: 'app-counter',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button (click)="increment()">加一</button>
    <p>次數：{{ count() }}</p>
    <p>兩倍：{{ doubleCount() }}</p>
  `,
})
export class CounterComponent {
  readonly count = signal(0);
  readonly doubleCount = computed(() => this.count() * 2);

  increment(): void {
    this.count.update(value => value + 1);
  }
}
```

這裡呼叫 `count()` 是讀取 Signal，不是每次都自行建立新的狀態。`count.update()` 改變數值後，模板的使用關係會成為更新依據。

Signals 仍透過 Angular 的 view 與模板更新流程反映画面；它不表示每次寫入都直接、同步地修改單一 DOM 節點。也不需要為了顯示 `doubleCount` 再用 `effect` 複製一份狀態。詳見 [Signals 官方指南](https://angular.dev/guide/signals)。

## Zoneless：透過明確通知安排檢查

Signals 提供了狀態的更新訊號，讓 Angular 逐步降低對「攔截所有非同步工作」的依賴。

官方 Roadmap 記錄：v18 引入實驗性 Zoneless，v19 補強 SSR 等支援，v20.2 正式穩定。[Zoneless API](https://angular.dev/api/core/provideZonelessChangeDetection) 則註明，v21 起預設啟用。

Zoneless 依靠 Angular 知道的更新通知安排檢查，包括模板使用的 Signal 更新、`markForCheck()`、`AsyncPipe`、`ComponentRef.setInput()` 與已綁定的事件回呼等。

```text
狀態更新或 Angular 事件通知
              ↓
標記相關 view，安排檢查
              ↓
檢查模板並更新 DOM
```

**移除 Zone.js 並不等於移除 Change Detection。** 只是安排檢查的依據改了。Zoneless 也不要求所有資料都改成 Signal；既有 Observable 可以透過 `AsyncPipe` 或其他明確通知連接畫面。詳見 [Zoneless 指南](https://angular.dev/guide/zoneless)。

### 同樣是 setTimeout，通知方式會影響畫面更新

以下是元件內的示意片段：

```typescript
count = 0;

incrementLater(): void {
  setTimeout(() => {
    this.count += 1;
  }, 1000);
}
```

在傳統 Zone-based 且使用舊 Default 策略的情境中，zone 內的計時器完成後通常會帶來檢查時機。Zoneless 下，計時器內只改普通欄位，沒有提供新的更新通知，畫面可能不會即時反映。

若模板讀取 Signal，可以改成：

```typescript
readonly count = signal(0);

incrementLater(): void {
  setTimeout(() => {
    this.count.update(value => value + 1);
  }, 1000);
}
```

這個差異不是計時器失效，而是 Angular 是否收到足以安排畫面檢查的通知。

## Angular 22：OnPush 成為預設策略

閱讀舊文章時，要特別注意 Default 這個名稱。

Angular v22 起，沒有指定 `changeDetection` 的元件，預設使用 OnPush。現行 API 使用 `Eager` 表示積極檢查的策略；舊名稱 `Default` 與它等價，但已標記棄用。詳見 [元件進階設定](https://angular.dev/guide/components/advanced-configuration) 與 [ChangeDetectionStrategy API](https://angular.dev/api/core/ChangeDetectionStrategy)。

因此，舊教學中的「預設會檢查」不能直接套用到所有新版專案。判斷實際行為時，應一起確認 Angular 版本、是否使用 Zone.js，以及元件的策略設定。上面的 Signal 範例明寫 OnPush，也讓策略在不同版本中保持清楚。

## 手動 API：markForCheck 與 detectChanges

遇到畫面沒更新，先找出缺少的是哪一種通知，再選擇 API。

| API | 用途 |
| --- | --- |
| `markForCheck()` | 標記 view 需要檢查，交給後續更新流程處理 |
| `detectChanges()` | 主動執行該 view 與其子 view 的檢查 |
| `detach()` | 將 view 從正常檢查樹中分離 |
| `reattach()` | 將分離的 view 接回檢查樹 |

兩者不能完全互換：`markForCheck()` 表達需要更新，`detectChanges()` 則直接進行一次檢查。若每次訂閱資料都必須手動呼叫後者，可以先評估 `AsyncPipe`、Signals 或明確標記是否更符合資料流。API 定義見 [ChangeDetectorRef 文件](https://angular.dev/api/core/ChangeDetectorRef)。

## 我如何理解這段演變

以下是我根據上述機制整理的理解：Angular 的畫面更新，逐步從廣泛尋找可能的變化，走向由狀態與框架 API 提供更明確的通知。

AngularJS 使用 watcher 與 digest；傳統 Angular 用元件樹與 NgZone 組織檢查；OnPush 控制檢查範圍；Signals 表達狀態依賴；Zoneless 將通知作為排程依據。它們各自處理不同層面的問題。

下次遇到畫面沒有更新，我會依序確認：資料是否真的改變、Angular 是否收到通知、目標 view 是否符合檢查條件，以及模板最後讀到什麼值。這比直接加上一個 `detectChanges()` 更能解釋問題的來源。