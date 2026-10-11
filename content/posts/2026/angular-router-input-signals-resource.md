---
title: Angular 路由與資料載入：withComponentInputBinding、Signals、resource 和 Input setter／ngOnChanges 的差別
date: "2026-10-11"
description: 用使用者詳情頁比較路由 input 綁定、Signal inputs、computed 與 resource，對照傳統 Input getter／setter 和 ngOnChanges，整理更新時機、衍生狀態、請求取消及選用方式。
tags: [Angular, Signals, 前端]
---

以前寫 Angular，常在 `@Input` 的 setter 或 `ngOnChanges` 裡處理傳入資料：轉換格式、更新另一個欄位，甚至呼叫 API。現在看到 `withComponentInputBinding`、`input()` 和 `resource()`，很容易以為它們是同一件事情的新寫法。

其實它們分別負責**資料來源、元件輸入、衍生狀態和非同步載入**。把職責分清楚，才知道哪些舊程式可以改寫，哪些仍然有保留的理由。

本文依 2026-10-11 查閱的官方文件撰寫，主要範例採現行 Angular API。早期 resource 範例可能使用 `request`，本文使用目前的 `params`；採用前請確認專案版本。

## 先看各自負責什麼

| 工具 | 職責 | 是否自行載入 API 資料 |
| --- | --- | --- |
| `withComponentInputBinding()` | 將 Router state 綁定到路由元件的 inputs | 否 |
| `@Input()` | 宣告元件接收的資料 | 否 |
| Input setter | 在該屬性被指定時執行處理 | 需自行撰寫 |
| Input getter | 在屬性被讀取時回傳值 | 不適合用來發出請求 |
| `ngOnChanges()` | 接收 Angular 記錄的 input 變更資訊 | 需自行撰寫 |
| `input()` | 宣告唯讀的 Signal input | 否 |
| `signal()` | 宣告可由元件自行更新的狀態 | 否 |
| `computed()` | 依 Signal 計算同步衍生值 | 否 |
| `resource()` | 依反應式參數管理非同步讀取與狀態 | 透過 loader |

這張表是依各 API 職責整理的比較。Router、Input 與 Resource 的定義分別見 [路由綁定 API](https://angular.dev/api/router/withComponentInputBinding)、[Input API](https://angular.dev/api/core/input) 與 [Resource API](https://angular.dev/api/core/resource)。

## withComponentInputBinding：把路由資料送進 input

假設網址是 `/users/42`，路由設定如下：

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideRouter, Routes, withComponentInputBinding } from '@angular/router';
import { UserDetailComponent } from './user-detail.component';

const routes: Routes = [
  { path: 'users/:id', component: UserDetailComponent },
];

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes, withComponentInputBinding())],
};
```

Router 會把 `id` 對應到元件同名的公開 input。這個功能可以搭配傳統 `@Input()`，也可以搭配 Signal 的 `input()`，不要求一定使用 Signals。

它能綁定 path／matrix parameters、query parameters、靜態 route data 與 resolver 資料。同名鍵有優先順序，例如 path parameter 會優先於 query parameter；resolver 資料又有更高優先權。現行路由另有 route resources 功能，本文的基本範例不使用它。

預設行為下，沒有匹配的 input 會被設為 `undefined`，避免移除參數後留下舊值。因此，`input('預設值')` 的初始值不代表路由永遠不會覆寫它。詳見 [Router 常見任務](https://angular.dev/guide/routing/common-router-tasks)。

## 傳統 setter：處理單一 input 的指定

如果只是整理一個字串，以前可能這樣寫。以下是元件類別中的片段：

```typescript
import { Input } from '@angular/core';

private internalId: string | undefined;

@Input()
set id(value: string | undefined) {
  this.internalId = value?.trim() || undefined;
}

get id(): string | undefined {
  return this.internalId;
}
```

setter 在 JavaScript 屬性被指定時執行，getter 則在讀取時執行。兩者不等於深層資料監聽，也不會自動提供前一次值。

例如 `user.name` 被原地修改，但沒有重新指定 `user`，setter 不會因為內部屬性變了就自動執行。若 getter 在模板中被讀取，昂貴運算也可能隨檢查反覆發生。

官方仍支援這種寫法，但建議單純轉換優先使用 input transform，避免在 getter／setter 放入複雜或昂貴行為。見 [Input getter 與 setter 文件](https://angular.dev/guide/components/inputs)。

### 單純正規化，可以改成 transform

```typescript
import { input } from '@angular/core';

function normalizeId(value: string | undefined): string | undefined {
  return value?.trim() || undefined;
}

// 元件欄位
readonly id = input<string | undefined, string | undefined>(undefined, {
  transform: normalizeId,
});
```

transform 處理輸入格式，例如去除空白或轉型；它應保持純粹，不要順便發 HTTP 請求或修改其他狀態。傳統 `@Input` 也支援 transform，因此不必為了轉換格式就重寫整個元件。選項定義見 [Input 宣告指南](https://angular.dev/guide/components/inputs)。

## ngOnChanges：查看一批 input 的變更資訊

setter 看的是個別指定；`ngOnChanges` 則讓元件查看 Angular 在該次檢查中記錄的 inputs 變更，包含 `previousValue`、`currentValue` 和 `firstChange`。

```typescript
import { Input, OnChanges, SimpleChanges } from '@angular/core';

export class UserQueryComponent implements OnChanges {
  @Input() id: string | undefined;
  @Input() locale = 'zh-TW';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['id'] || changes['locale']) {
      console.log('目前條件', this.id, this.locale);
    }
  }
}
```

這適合需要前後值、首次變更資訊，或協調多個 inputs 的情境。初始化時，第一次 `ngOnChanges` 在 `ngOnInit` 之前執行，且在元件模板檢查前執行。

它也不是物件的深層監聽器。直接透過元件 instance 指定普通欄位，不等於經由 Angular 的 input 更新流程，因此不能期待自動產生 `SimpleChanges`。另外，**Signal inputs 仍可搭配 ngOnChanges**，不是用了 Signals 就不能使用 hook。見 [生命週期文件](https://angular.dev/guide/components/lifecycle)。

## input 與 computed：直接描述衍生關係

`signal()` 是元件可自行 `.set()`／`.update()` 的狀態；`input()` 是 Angular 寫入、元件讀取的 InputSignal，不能自行呼叫 `.set()`。

若原本用 setter 或 `ngOnChanges` 把 inputs 組合成另一個欄位，可以考慮 `computed()`：

```typescript
import { computed, input } from '@angular/core';

// 元件欄位
readonly id = input<string | undefined>();
readonly locale = input('zh-TW');

readonly queryLabel = computed(() => {
  return `${this.id() ?? '尚未選擇'} / ${this.locale()}`;
});
```

這裡不需要手動同步 `queryLabel`。它依實際讀取的 Signals 建立依賴，並快取同步計算結果。這是根據資料關係整理的改寫方式；Signal 的依賴與快取行為見 [Signals 指南](https://angular.dev/guide/signals)。

`computed(async () => ...)` 的結果會是 Promise，不會自動變成 loading／error／value 管理器。當下一步是非同步載入，就需要另外處理。

## resource：根據 input 載入資料

下面將前面的路由設定接到完整元件。假設後端提供 `/api/users/:id`，回傳 `{ id, name }`：

```typescript
import { ChangeDetectionStrategy, Component, input, resource } from '@angular/core';

interface User {
  id: string;
  name: string;
}

@Component({
  selector: 'app-user-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (user.isLoading()) {
      <p>載入中...</p>
    } @else if (user.error()) {
      <p>讀取失敗，請稍後重試。</p>
      <button (click)="user.reload()">重試</button>
    } @else if (user.hasValue()) {
      <h2>{{ user.value().name }}</h2>
    } @else {
      <p>請提供使用者 ID。</p>
    }
  `,
})
export class UserDetailComponent {
  readonly id = input<string | undefined>();

  readonly user = resource({
    params: () => {
      const id = this.id()?.trim();
      return id ? { id } : undefined;
    },
    loader: async ({ params, abortSignal }): Promise<User> => {
      const response = await fetch(
        `/api/users/${encodeURIComponent(params.id)}`,
        { signal: abortSignal },
      );
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.json() as Promise<User>;
    },
  });
}
```

資料流是：

```text
/users/42
    ↓ Router input binding
id InputSignal
    ↓ resource params
loader 讀取 API
    ↓
value／isLoading／error
    ↓ 模板
畫面
```

`params` 回傳 `undefined` 時不執行 loader，適合處理路由 input 尚未就緒或缺少參數的情況。若使用 `input.required()`，也不要在欄位初始化時直接讀取尚未被 Angular 指定的 required input。本文用可選 input 和 idle 狀態處理這個邊界。參數與 Input 的規則見 [Resource 指南](https://angular.dev/guide/signals/resource) 和 [Input API](https://angular.dev/api/core/input)。

## 舊的非同步寫法，要自己處理哪些事？

在 setter 或 `ngOnChanges` 裡呼叫 API 並非不可行，但 input 更新、非同步工作的生命週期是兩件事。hook 不會自動管理請求取消、loading 或錯誤。

例如，先讀取使用者 42，接著快速切換到 43：

```text
42 的請求開始 ───────────────→ 最後才回來
43 的請求開始 ───→ 先回來
```

若每個回呼都直接寫入同一個 `user` 欄位，舊結果可能蓋過新結果。傳統方案可以使用 RxJS `switchMap`，或自己用 AbortController／請求識別碼處理。這是非同步競態問題，不是 `ngOnChanges` 本身的缺陷。

Resource 會在參數改變或被銷毀時中止正在載入的工作；範例把提供的 `abortSignal` 傳給 `fetch`，才能讓 fetch 配合取消。若 loader 呼叫的外部 API 不支援取消，已開始的實際工作不會因此保證停止。生命週期見 [Resource API](https://angular.dev/api/core/resource)。

另外，resource 適合讀取資料。儲存、刪除、付款等寫入操作不應因參數改變就被重複觸發或取消，應由明確操作流程處理。

## resource 與 httpResource 怎麼選？

上面的 `fetch` 不會經過 Angular HttpClient interceptors。如果專案依賴攔截器加 token、統一記錄或 HTTP 處理，可以評估 `httpResource()`，並設定 `provideHttpClient()`。

`httpResource` 將 HttpClient 的請求能力接到 Resource 狀態模型；自訂非同步來源則可以用 `resource` 的 loader。若既有服務以 Observable 提供資料，也可評估 `rxResource`，或保留適合的 RxJS 資料流。HTTP 特性與設定見 [httpResource 指南](https://angular.dev/guide/http/http-resource)。

## 實際改寫時的選擇

以下是我依上述職責整理的選用方式：

| 需求 | 可採用的方式 |
| --- | --- |
| 路由參數對應元件 inputs | `withComponentInputBinding`，新舊 inputs 都能使用 |
| 去除空白、轉型等純輸入轉換 | input transform |
| 多個 inputs 推導同步顯示值 | Signal inputs ＋ `computed` |
| 需要前後值、首次變更資訊 | `ngOnChanges` |
| 根據反應式條件讀取非同步資料 | `resource`／`httpResource`，或既有 RxJS 流程 |
| 與外部非反應式 API 同步 | 評估 `effect` 與清理機制 |
| 既有元件的簡單屬性封裝 | 保留輕量 getter／setter 也可以 |

改寫的重點是減少人工同步的狀態：路由負責輸入來源，input 負責接收，computed 負責衍生值，resource 負責載入狀態。`@Input` 仍受官方支援，`ngOnChanges` 也仍有明確用途；不必為了使用新 API，把所有舊寫法一次移除。