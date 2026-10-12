---
title: IoT 短暫斷線怎麼辦？Angular 使用 RxJS 重試 API 與參數設定
date: "2026-10-12"
description: 從 IoT 網路不穩的情境出發，說明 Angular HttpClient 搭配 RxJS retry 的 count、delay、resetOnSuccess，並實作錯誤篩選、指數退避、逾時與取消訂閱。
tags: [Angular, RxJS, IoT, API]
---

IoT 設備偶爾會因 Wi-Fi 訊號不佳、網路切換或閘道器暫時無法連線，出現短暫斷線。Angular 畫面在這時讀取設備狀態，可能剛好遇到 API 失敗；如果稍等一下再試，連線可能已經恢復。

這類情境可以使用 RxJS 的 `retry()`：請求失敗後，依設定重新嘗試。但要同時決定**最多重試幾次、每次等待多久，以及哪些錯誤值得重試**，才能避免持續增加設備與伺服器負擔。

本文使用 RxJS 7.8.x 的設定物件寫法，於 2026-10-12 核對官方文件與原始碼。以下 API 路徑與設備資料是示範，Angular 專案需先完成 HttpClient 的注入設定。

## 1. 先分清楚是哪一段網路中斷

常見的資料流是：

```text
Angular 畫面 → 後端 API → IoT 閘道器／設備
```

如果瀏覽器到 API 的連線失敗，Angular 會收到 HTTP 錯誤；如果 API 能正常回應，但設備離線，後端可能回傳 `503`，也可能回傳 `200` 搭配 `{ online: false }`。

`retry()` 只處理 Observable 的 **error 通知**。成功回傳的 `{ online: false }` 不會自動觸發重試，應由畫面顯示離線狀態，或依業務規則安排下一次查詢。前端重送 API，也不等於已讓 IoT 設備重新連上網路。

## 2. 最基本的 retry 寫法

```ts
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { retry } from 'rxjs';

interface DeviceStatus {
  deviceId: string;
  online: boolean;
  temperature: number | null;
}

@Injectable({ providedIn: 'root' })
export class DeviceService {
  private readonly http = inject(HttpClient);

  getStatus(deviceId: string) {
    return this.http
      .get<DeviceStatus>(
        `/api/devices/${encodeURIComponent(deviceId)}/status`
      )
      .pipe(
        retry({
          count: 3,
          delay: 1000,
          resetOnSuccess: false,
        })
      );
  }
}
```

呼叫端訂閱後才會發出請求。`retry` 會重新訂閱上游，而 HttpClient 每次被訂閱都會發出新的 HTTP 請求。因此 `count: 3` 表示「第一次失敗後，最多再試 3 次」，合計最多 **4 次請求**。參考 [Angular HTTP 請求說明](https://angular.dev/guide/http/making-requests) 與 [RxJS retry](https://rxjs.dev/api/operators/retry)。

```text
第 1 次請求失敗
  → 等 1 秒 → 第 2 次請求失敗
  → 等 1 秒 → 第 3 次請求失敗
  → 等 1 秒 → 第 4 次請求
                 ├─ 成功：回傳結果
                 └─ 失敗：將最後一次錯誤交給下游
```

一旦成功就不會再重試；上述 1 秒是失敗後的等待時間，不包含 HTTP 請求本身耗時。這個基本版本會重試所有錯誤，實務上應再加入錯誤篩選。

## 3. 細看 retry 的參數

設定型別如下，定義見 [RetryConfig](https://rxjs.dev/api/operators/RetryConfig)：

```ts
interface RetryConfig {
  count?: number;
  delay?: number | ((error: any, retryCount: number) => ObservableInput<any>);
  resetOnSuccess?: boolean;
}
```

| 參數 | 預設行為 | 設定重點 |
| --- | --- | --- |
| `count` | 未設定時無限重試 | 設定有限的非負整數；不包含第一次請求 |
| `delay` | 未設定時立即重試 | 數值單位為毫秒，也可以傳入回傳 ObservableInput 的函式 |
| `resetOnSuccess` | `false` | 設為 `true` 時，上游每次發出 next 值都會重設重試計數 |

### count：重試次數，並非總請求次數

```ts
retry(3);                    // 最多重試 3 次，沒有等待設定
retry({ count: 3 });          // 同上
retry({ count: 0 });          // 不重試
retry({ count: 3, delay: 1000 });
```

不要只寫 `retry()` 或 `retry({ delay: 1000 })` 來處理一般畫面查詢：省略 `count` 會無限重試。若網路一直無法恢復，使用者可能長時間看不到最終失敗訊息。

### delay：固定等待，或依錯誤決定何時再試

固定等待可以寫 `delay: 1000`，表示每次錯誤後等待 1,000 毫秒。

函式寫法則可以讀取錯誤與目前重試序號：

```ts
import { retry, timer } from 'rxjs';

retry({
  count: 3,
  delay: (error, retryCount) => {
    // 第一次重試 retryCount = 1，接著為 2、3。
    const waitMs = retryCount * 1000;
    console.warn(`第 ${retryCount} 次重試，等待 ${waitMs} ms`, error);
    return timer(waitMs);
  },
});
```

這會依序等待 1、2、3 秒。`delay` 函式須回傳 ObservableInput，例如 Observable 或 Promise，不能直接回傳數字 `1000`。`timer(waitMs)` 在時間到時發出值，讓 `retry` 再次訂閱上游。

回傳的通知來源若發出值，就觸發重試；若拋出錯誤，就把該錯誤傳給下游。若直接回傳 `EMPTY`，它會在沒有發出值的情況下完成，導致整個流程完成，**不會進入 error handler**。因此「不符合重試條件」通常應回傳 `throwError(() => error)`，保留失敗訊息。這些行為可在 [RxJS 7.8.2 retry 原始碼](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/retry.ts) 核對。

### resetOnSuccess：收到值，就重設計數

名稱中的 Success 指的是上游發出 `next` 值，並非一定要等到 HTTP 完整成功或 Observable 完成。

一般 `http.get()` 使用預設的 response body 模式，成功回傳資料後通常就完成，保留 `false` 即可。長時間運作、可能多次發出值再失敗的串流，才需要依需求考慮 `true`。

尤其使用 `observe: 'events'` 時，送出或進度事件也算 next；如果設為 `true`，每次新請求發出的事件可能重設計數，讓原本預期的重試上限失效。若希望一次查詢最多只重試 3 次，使用 `resetOnSuccess: false`。依據同一份 [retry 實作](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/operators/retry.ts)，重設發生在 next 處理時。

## 4. 實務範例：錯誤篩選、指數退避與逾時

設備短暫不可用時，可以逐漸增加等待時間，給網路恢復的機會。以下是本文示範的策略，實際數值需依設備回應速度與 API 契約調整：

- 最多重試 3 次。
- 每次請求最多等 5 秒。
- 基礎等待為 1 秒，指數退避的上限為 8 秒。
- 每次等待額外加入 0～299 毫秒的隨機時間，避免多個畫面一起重送。
- 僅重試選定的暫時性錯誤。

```ts
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  Observable,
  retry,
  throwError,
  timer,
  timeout,
  TimeoutError,
} from 'rxjs';

interface DeviceStatus {
  deviceId: string;
  online: boolean;
  temperature: number | null;
}

const RETRYABLE_STATUS = new Set([0, 408, 502, 503, 504]);

function isTransientError(error: unknown): boolean {
  return error instanceof TimeoutError ||
    (error instanceof HttpErrorResponse &&
      RETRYABLE_STATUS.has(error.status));
}

@Injectable({ providedIn: 'root' })
export class DeviceService {
  private readonly http = inject(HttpClient);

  getStatus(deviceId: string): Observable<DeviceStatus> {
    return this.http
      .get<DeviceStatus>(
        `/api/devices/${encodeURIComponent(deviceId)}/status`
      )
      .pipe(
        // 放在 retry 前：每次重新訂閱都重新計算 5 秒期限。
        timeout({ first: 5000 }),
        retry({
          count: 3,
          resetOnSuccess: false,
          delay: (error: unknown, retryCount: number) => {
            if (!isTransientError(error)) {
              return throwError(() => error);
            }

            const baseDelayMs = 1000;
            const maxDelayMs = 8000;
            const backoffMs = Math.min(
              baseDelayMs * 2 ** (retryCount - 1),
              maxDelayMs
            );
            const jitterMs = Math.floor(Math.random() * 300);

            return timer(backoffMs + jitterMs);
          },
        })
      );
  }
}
```

這段程式可取代前面的基本 Service。指數公式使用 `retryCount - 1`，因此第 1 次重試從 `1000 × 2⁰` 開始，而非直接等 2 秒。

| 重試序號 | 指數退避時間 | 加上隨機時間後 |
| --- | --- | --- |
| 1 | 1,000 ms | 1,000～1,299 ms |
| 2 | 2,000 ms | 2,000～2,299 ms |
| 3 | 4,000 ms | 4,000～4,299 ms |

在 `count: 3` 下，8 秒的退避上限還不會用到；若提高重試次數，第 4 次起基礎等待才會到達上限。此處上限只限制退避部分，包含 jitter 的等待最多可達 8,299 毫秒。

`timeout({ first: 5000 })` 是等待第一個 next 值的期限，適用於這裡的預設 body 模式。若改成 `observe: 'events'`，第一個事件可能很快就發出，不能把它當作整個 HTTP 回應的 5 秒期限。

請求逾時、重試等待與總等待是不同概念。這個範例最多會執行 4 次各 5 秒的嘗試，再加上約 7 秒的退避與最多 897 毫秒的 jitter；理論預算約為 **27.9 秒**，瀏覽器計時排程可能讓實際時間更長。若需要限制使用者整次查詢等待時間，在 body 模式下可以於 `retry(...)` 後再加 `timeout({ first: 15000 })`；此時 15 秒會涵蓋前面的嘗試與等待，且該逾時不會被前面的 retry 重試。

### 哪些錯誤可以重試？

| 狀況 | 本文策略 | 原因與限制 |
| --- | --- | --- |
| `status: 0` | 有限次重試 | 可能是網路問題，也可能是 CORS 等設定問題，不能直接判定設備離線 |
| RxJS `TimeoutError` | 有限次重試 | 本次等待超時，下一次可能恢復 |
| `408`、`502`、`503`、`504` | 有限次重試 | 示範視為可能暫時恢復的錯誤，仍需確認後端契約 |
| `400`、`401`、`403`、`404` | 直接回報 | 通常需修正參數、登入或權限，而非原樣重送 |
| `500` | 本文不重試 | 需確認是否為可恢復錯誤，再決定要不要加入 |
| `429` | 另訂策略 | 應依伺服器限流規則與 `Retry-After` 安排等待 |

Angular 將 HTTP 失敗交由 `HttpErrorResponse` 表示，網路層失敗可能呈現 `status: 0`；參考 [Angular 錯誤處理說明](https://angular.dev/guide/http/making-requests#handling-request-failure)。上表的重試清單是本文的應用策略，不是 RxJS 預設規則。

若伺服器提供 `Retry-After`，應辨識秒數或 HTTP 日期，依其要求延後重試；超出畫面可接受的等待預算時，可停止並提示稍後再試。跨來源 API 若要讓 Angular 讀取這個 header，後端也需允許瀏覽器暴露它。

## 5. 重試結束後顯示錯誤，離開畫面時取消

重試期間可以保留載入狀態，全部失敗後再告知使用者。以下元件沿用實務版本的 `DeviceService`：

```ts
import { Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { DeviceService } from './device.service';

@Component({
  selector: 'app-device-status',
  standalone: true,
  template: `
    @if (loading) {
      <p>正在讀取設備狀態，連線不穩時會自動重試…</p>
    }
    @if (errorMessage) {
      <p role="alert">{{ errorMessage }}</p>
    }
    @if (status; as device) {
      <p>設備：{{ device.deviceId }}</p>
      <p>狀態：{{ device.online ? '在線' : '離線' }}</p>
    }
  `,
})
export class DeviceStatusComponent {
  private readonly deviceService = inject(DeviceService);

  loading = true;
  errorMessage = '';
  status: { deviceId: string; online: boolean; temperature: number | null } | null = null;

  constructor() {
    this.deviceService.getStatus('sensor-001').pipe(
      takeUntilDestroyed(),
      finalize(() => { this.loading = false; })
    ).subscribe({
      next: status => { this.status = status; },
      error: () => {
        this.errorMessage = '暫時無法取得設備狀態，請稍後再試。';
      },
    });
  }
}
```

範例使用 Angular 17+ 的控制流程模板。`takeUntilDestroyed()` 在建構子注入環境中使用，元件銷毀時會取消訂閱，包括進行中的 HTTP 請求與等待重試的 timer。取消前端請求不保證後端已開始的工作也會停止。相關行為見 [takeUntilDestroyed API](https://angular.dev/api/core/rxjs-interop/takeUntilDestroyed) 與 [Angular HTTP Observable 說明](https://angular.dev/guide/http/making-requests#http-observables)。

若使用 `catchError()` 轉換成替代資料，通常要放在 `retry()` 後面。放在前面並回傳 `of(...)`，錯誤就被轉成正常值，後面的 retry 無法收到該錯誤。`finalize()` 放在整個重試流程之後，才能在整體完成、失敗或取消時結束載入狀態。

## 6. IoT 控制指令不能直接照搬讀取策略

讀取溫度或設備狀態通常適合有限重試。但「開啟馬達」、「增加投料量」等指令可能已經被設備執行，只是回應在網路途中遺失。前端若原樣重送，可能造成指令執行兩次。

因此，對會改變設備狀態的 API，必須先確認重複執行是否安全。若後端支援冪等鍵或 command ID，同一次操作的所有重試應沿用相同 ID，由後端與設備端共同確保去重；僅在前端加上 header 並不會自動產生這個保障。

也要確認重試位於哪一層：若 Service 與全域 HTTP interceptor 都各自設定重試，次數可能疊加。這篇先把策略放在設備查詢 Service，便於依 API 特性控制。

`retry` 用於失敗後再試；成功後持續查詢屬於輪詢，需要另外安排週期。重試也不會自行重新建立 MQTT 或 WebSocket 連線，那些連線需要各自的重連策略。

## 7. 驗證重試設定時，觀察這些情境

- 前兩次回傳 `503`、第三次成功：應共送出 3 次請求，取得資料後停止。
- 持續回傳 `503`：`count: 3` 應共送出 4 次請求，再顯示錯誤。
- 第一次回傳 `401`：應只送出 1 次請求，直接回報失敗。
- 回傳 `200` 與 `online: false`：應顯示離線，不觸發 retry。
- 請求持續不回應：應依逾時設定中止本次等待，再進入重試策略。
- 等待重試時離開畫面：取消訂閱後不應再送出下一次請求。

可以從瀏覽器 Network 面板確認實際請求次數與間隔；若使用 Angular HTTP 測試工具，則可搭配虛擬計時驗證退避等待，不必真的等待數秒。

對短暫斷線的 IoT 狀態查詢，先用有限次數、明確逾時與錯誤篩選建立可預期的行為，再依設備恢復時間調整等待參數。重試耗盡後，仍要讓使用者看見狀態與下一步。
