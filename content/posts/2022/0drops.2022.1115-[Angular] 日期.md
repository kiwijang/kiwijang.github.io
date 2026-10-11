---
id: cl8p533i8it5xfzxq3doe17
title: '1115-[Angular] 日期'
desc: ''
updated: 1668648663693
created: 1668495848211
tags:
  - Angular
description: "比較 JavaScript Date／Intl、Angular DatePipe 與 Material Datepicker，整理台灣語系、時區、日期格式、DateAdapter 及日期送 API 的常見問題。"
---

原筆記記錄的設定是：

```typescript
providers: [{ provide: MAT_DATE_LOCALE, useValue: 'zh-TW' }]
```

這是 **Angular Material 日期語系** 的設定。它不是 JavaScript Date 的時區設定，也不會單獨決定 Angular DatePipe 的顯示格式。

本文於 2026-10-11 依官方文件補充。文中「Angular 原生日期」指 Angular 內建的 DatePipe／formatDate；Angular 沒有另外創造一個通用日期值類型。

## 先分清楚：日期值、語系、格式與時區

| 概念 | 例子 | 解決的問題 |
| --- | --- | --- |
| 日期值 | Date、timestamp、ISO 字串 | 實際表示哪個時間或日期？ |
| 語系 locale | zh-TW、en-US | 月份、星期與呈現慣例用哪種語言？ |
| 格式 format | yyyy/MM/dd | 顯示哪些欄位、如何排列？ |
| 時區 timezone | Asia/Taipei、+0800 | 同一時刻應顯示幾點、哪一天？ |
| 日期解析 parse | 將輸入字串轉成值 | 使用者輸入代表哪個日期？ |

這些設定不能互相替代。`zh-TW` 不代表強制使用台灣時區，顯示為 `yyyy/MM/dd` 也不代表輸入會依這個格式嚴格解析。

## JavaScript 原生 Date：表示時間值

```javascript
const now = new Date();
const localDate = new Date(2026, 9, 11); // 本機時間，月份 0 起算
const instant = new Date('2026-10-11T00:00:00Z'); // 明確 UTC 時刻

console.log(instant.getTime()); // epoch 毫秒
console.log(instant.toISOString()); // UTC 的 ISO 字串
```

Date 保存的是時間戳記，不會把 `Asia/Taipei` 當成物件內永久保存的時區。`getFullYear()` 等方法用本機時區解讀，`getUTCFullYear()` 等則用 UTC。

`new Date('2026-10-11')` 的標準 date-only 字串會按 UTC 解讀；沒有 offset 的日期時間字串則可能採本機時間。不要把不同建構方式當成同一件事。非標準字串更可能有跨環境差異。見 [MDN：Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)。

### 用 Intl 設定語系與時區

```javascript
const formatter = new Intl.DateTimeFormat('zh-TW', {
  timeZone: 'Asia/Taipei',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

console.log(formatter.format(new Date('2026-10-11T00:00:00Z')));
```

Intl 使用 options，不是 Angular DatePipe 的格式 token；locale 輸出也可能含不同標點，不能假設結果永遠等同手工拼出的固定字串。需要命名時區與日光節約時間規則時，`Intl.DateTimeFormat` 的 IANA timezone 支援很有用。見 [Intl.DateTimeFormat 文件](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat)。

## Angular 內建 DatePipe：格式化顯示

```typescript
import { Component } from '@angular/core';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-date-example',
  standalone: true,
  imports: [DatePipe],
  template: `
    <p>{{ createdAt | date:'yyyy/MM/dd HH:mm':'+0800':'zh-TW' }}</p>
  `,
})
export class DateExampleComponent {
  createdAt = new Date('2026-10-11T00:00:00Z');
}
```

參數順序是 `date:format:timezone:locale`。這裡用 `+0800` 明確指定 offset；不要直接假設 DatePipe 的 timezone 能像 Intl 一樣支援所有 IANA 名稱。

DatePipe 是 pure pipe。原地呼叫 `date.setDate(...)` 不會改變 reference，可能不重新執行 pipe；需要更新時建立新 Date。見 [DatePipe API](https://angular.dev/api/common/DatePipe)。

### 註冊台灣語系並設定預設值

以下放在應用程式設定檔；保留專案原有其他 providers：

```typescript
import { ApplicationConfig, LOCALE_ID } from '@angular/core';
import { DATE_PIPE_DEFAULT_OPTIONS, registerLocaleData } from '@angular/common';
import localeZhTw from '@angular/common/locales/zh';

registerLocaleData(localeZhTw, 'zh-TW');

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: LOCALE_ID, useValue: 'zh-TW' },
    {
      provide: DATE_PIPE_DEFAULT_OPTIONS,
      useValue: { dateFormat: 'yyyy/MM/dd', timezone: '+0800' },
    },
  ],
};
```

`LOCALE_ID` 決定 Angular 格式化的預設語系，locale data 則提供相應規則。`DATE_PIPE_DEFAULT_OPTIONS` 設定 DatePipe 預設格式與時區，模板明確提供的參數優先。

設定角色見 [LOCALE_ID](https://angular.dev/api/core/LOCALE_ID)、[registerLocaleData](https://angular.dev/api/common/registerLocaleData) 與 [DATE_PIPE_DEFAULT_OPTIONS](https://angular.dev/api/common/DATE_PIPE_DEFAULT_OPTIONS)。

### 在 TypeScript 裡格式化：formatDate

```typescript
import { formatDate } from '@angular/common';

const label = formatDate(
  new Date('2026-10-11T00:00:00Z'),
  'yyyy/MM/dd HH:mm',
  'zh-TW',
  '+0800',
);
```

`formatDate(value, format, locale, timezone)` 的順序和 pipe 不同；仍需註冊語系資料，也不會自動套用 DatePipe 的注入預設設定。見 [formatDate API](https://angular.dev/api/common/formatDate)。

## Angular Material Datepicker：互動選日期

Material Datepicker 透過 DateAdapter 決定日期類型、解析與顯示。採 NativeDateAdapter 時，表單值使用 JavaScript `Date`。

以下假設專案已安裝並設定 Angular Material 主題：

```typescript
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-date-picker',
  standalone: true,
  imports: [ReactiveFormsModule, MatDatepickerModule, MatFormFieldModule, MatInputModule],
  providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'zh-TW' },
  ],
  template: `
    <mat-form-field>
      <mat-label>日期</mat-label>
      <input matInput [matDatepicker]="picker" [formControl]="selectedDate" />
      <mat-datepicker-toggle matIconSuffix [for]="picker" />
      <mat-datepicker #picker />
    </mat-form-field>
  `,
})
export class DatePickerComponent {
  readonly selectedDate = new FormControl<Date | null>(null);
}
```

`MAT_DATE_LOCALE` 預設繼承 `LOCALE_ID`；單獨提供它可以覆寫 Material adapter 的語系。需要動態切換可透過 `DateAdapter.setLocale()`。見 [Material Datepicker 官方文件](https://material.angular.dev/components/datepicker/overview)。

### MAT_DATE_FORMATS 與 adapter 必須搭配

NativeDateAdapter 的 display formats 使用 `Intl.DateTimeFormat` options，例如：

```typescript
import { MatDateFormats, provideNativeDateAdapter } from '@angular/material/core';

const NATIVE_FORMATS: MatDateFormats = {
  parse: { dateInput: null },
  display: {
    dateInput: { year: 'numeric', month: '2-digit', day: '2-digit' },
    monthYearLabel: { year: 'numeric', month: 'short' },
    dateA11yLabel: { year: 'numeric', month: 'long', day: 'numeric' },
    monthYearA11yLabel: { year: 'numeric', month: 'long' },
  },
};

// 取代上個範例的 provideNativeDateAdapter()
// providers: [provideNativeDateAdapter(NATIVE_FORMATS), ...]
```

不能把 DatePipe 的 `yyyy/MM/dd` 或其他日期函式庫的 `YYYY/MM/DD` 直接套給所有 adapters。格式語法由 adapter 決定。

NativeDateAdapter 的 `parse()` 不使用 parseFormat／locale 進行嚴格解析，而是依原生 Date parsing 行為處理。因此上面只能設定顯示，不能保證使用者輸入符合固定格式。需要嚴格解析時，評估合適的 adapter 或自訂 DateAdapter。這個限制可直接查看 [NativeDateAdapter 原始碼](https://github.com/angular/components/blob/main/src/material/core/datetime/native-date-adapter.ts)。

## 瀏覽器原生 input type=date

```html
<input type="date" min="2026-01-01" max="2026-12-31" />
```

這是 HTML／瀏覽器提供的日期輸入，不是 Angular Material。其 value 使用 `yyyy-mm-dd` 字串，畫面呈現則依瀏覽器與系統語系，不能靠 DatePipe 更改其內部 UI 格式。見 [MDN：input date](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/date)。

## 為什麼送 API 後日期少一天？

如果在台灣本機時間建立午夜日期：

```javascript
const date = new Date(2026, 9, 11);
console.log(date.toISOString());
// 本機時區若為 Asia/Taipei：2026-10-10T16:00:00.000Z
```

轉成 UTC 後是前一天的 16:00，因此 `toISOString().slice(0, 10)` 會取得前一天。這是同一個時刻的時區轉換，不是 Datepicker 隨機改日期。

若資料代表生日、到期日等**純日曆日期**，API 可約定傳送 `2026-10-11`，不經過 UTC 時刻轉換。若表單使用 NativeDateAdapter 的本機 Date，可取本機年月日：

```typescript
function toLocalDateString(date: Date): string {
  if (Number.isNaN(date.getTime())) throw new Error('Invalid date');
  const year = String(date.getFullYear()).padStart(4, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
```

這個 helper 只適用於要取**本機日曆欄位**的情境；若資料是某個真實時刻，就應傳有 offset 的 ISO 字串／UTC timestamp，再明確指定顯示時區。Date 與 ISO 行為見 [MDN Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)。

## 傳給後端，建議用什麼日期格式？

我的建議是：**某個時刻使用帶時區的 RFC 3339 字串，通常統一為 UTC；純日期使用 YYYY-MM-DD。** 不要把畫面格式化的中文日期或 `yyyy/MM/dd` 直接當成 API 格式。

| 資料意義 | 建議 JSON 值 | 例子 |
| --- | --- | --- |
| 建立時間、事件發生時間 | UTC timestamp 字串，帶 Z | `2026-10-11T08:30:00.000Z` |
| 生日、只有日曆日期的欄位 | YYYY-MM-DD 字串 | `2026-10-11` |
| 指定地區的未來預約／重複排程 | 當地日期時間與 IANA 時區分開傳 | `2026-10-11T09:00:00` ＋ `Asia/Taipei` |
| 既有 API 使用數字時間戳 | 明確約定 epoch 秒或毫秒 | 欄位可命名 `occurredAtEpochMs` |

這是依資料語意整理的 API 設計建議。RFC 3339 是 ISO 8601 的常用網路時間格式規範，要求 timestamp 有明確的 UTC 關係；`Z` 表示 UTC，`+08:00` 則是明確 offset。見 [RFC 3339](https://www.rfc-editor.org/rfc/rfc3339)。

### 某個時刻：通常使用 toISOString

```typescript
const occurredAt = new Date('2026-10-11T16:30:00+08:00');

const payload = {
  occurredAt: occurredAt.toISOString(),
};
// { occurredAt: '2026-10-11T08:30:00.000Z' }
```

同一時刻轉成 UTC，不會改變它代表的事件時間。後端再解析成適合的時間型別；回傳也可維持同一規格，前端依使用者時區顯示。`toISOString()` 使用 UTC，無效 Date 會拋出錯誤，送出前仍需驗證。見 [toISOString 文件](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString)。

像 `createdAt`、`updatedAt` 這類稽核時間，通常由後端產生；前端傳入時間適合表示業務上由使用者選擇或外部事件提供的時刻。

### 純日期：不要先轉 UTC

```typescript
const selectedDate = new Date(2026, 9, 11);
const payload = {
  birthday: toLocalDateString(selectedDate),
};
// { birthday: '2026-10-11' }
```

這裡使用前一節的 helper，對應 NativeDateAdapter 的本機日曆日期。若原本就是 `<input type="date">` 的合法 value，可直接沿用日期字串，不必先建 Date 再轉回字串。

後端應把生日當成 date-only 型別或等價資料，而不是擅自補上午夜 UTC。前後端都要驗證日期真的存在，正則符合格式不代表 `2026-02-30` 是合法日期。

### 預約與排程：保留使用者選擇的地區

```json
{
  "localDateTime": "2026-10-11T09:00:00",
  "timeZone": "Asia/Taipei"
}
```

這是自訂 API 契約：`localDateTime` 刻意不當成獨立的 RFC 3339 timestamp，必須和 `timeZone` 一起解析。後端可以換算成 UTC，同時保留原始地區資訊。

固定 offset 不等於命名時區。對採用日光節約時間的地區，未來或重複排程需要依日期套用規則，並約定不存在／重複的當地時間如何處理。如果預約只表示已確定的一次時刻，帶 offset 的 timestamp 也可以；是否另存時區取決於業務需求。

### 前後端應明確約定

- 欄位是 instant、date-only，還是當地排程時間。
- Timestamp 是否統一 UTC，以及小數秒精度。
- 若使用數字，單位是秒還是毫秒；JavaScript `getTime()` 是毫秒。
- 未填寫使用 null、省略欄位，或其他明確規則。
- 後端回傳格式與非法日期的錯誤處理。

對此文章的 Material 日期選擇範例，若只讓使用者選「某一天」，我會傳 **YYYY-MM-DD**；如果選的是事件發生的日期與時間，才傳完整 UTC timestamp。

## 多語系系統怎麼處理日期？以後端為主嗎？

建議**以後端作為資料與業務規則的權威，前端負責使用者看到的日期呈現**。這是系統設計上的分工，不代表所有格式化都必須放在後端。

### 後端與前端的分工

| 工作 | 建議負責端 | 原因 |
| --- | --- | --- |
| 日期語意、API 格式與資料驗證 | 後端定義，前後端共同遵守 | 避免不同客戶端解讀不同 |
| 訂單建立時間、稽核時間 | 後端 | 不能依賴使用者裝置時鐘 |
| 截止時間、有效期限、排程與日期查詢邊界 | 後端 | 業務結果必須一致 |
| 保存使用者語系／時區偏好 | 後端帳號設定，前端讀取 | 跨裝置可保持一致 |
| 畫面上的月份名稱、日期排列與時區顯示 | 前端 | 可隨使用者偏好切換 |
| 後端產生的 Email、報表、通知 | 後端 | 沒有瀏覽器代為格式化 |

API 通常回傳原始日期值，例如 `2026-10-11T08:30:00.000Z`，前端再顯示成中文或英文。後端若另提供 display label，仍建議保留原始值，方便排序、查詢與重新呈現。Timestamp 的互通格式可參考 [RFC 3339](https://www.rfc-editor.org/rfc/rfc3339)。

### 語系與時區必須分開保存

```json
{
  "locale": "en-US",
  "timeZone": "Asia/Taipei"
}
```

使用者可以在台灣看英文介面；換成 `zh-TW` 也不代表人一定在台灣。不要只根據語言、國家或 IP 猜測時區並覆寫使用者選擇。

建議優先順序可以約定為：使用者明確偏好 → 組織／系統預設 → 瀏覽器偵測作為初始建議。需要使用裝置當地時區時，也可以另設「跟隨裝置」選項。

```typescript
const detectedLocale = navigator.language;
const detectedTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
```

以上只能當作初始化資訊；SSR 不能直接使用 navigator，而且登入帳號後應依已保存的偏好顯示。

### IANA timezone 是什麼？

IANA timezone 是 IANA Time Zone Database 使用的時區識別名稱，例如 `Asia/Taipei`、`Asia/Tokyo`、`America/New_York` 與 `Europe/London`。它讓系統依據某個地區的規則，解讀特定日期的當地時間。

| 表示方式 | 意義 | 是否描述日期相關規則？ |
| --- | --- | --- |
| `+08:00` | 固定比 UTC 快 8 小時 | 否，只有 offset |
| `Asia/Taipei` | 台灣地區的時區識別名稱 | 是，依使用的時區資料庫判斷 |
| `America/New_York` | 美國紐約地區的時區識別名稱 | 是，包含日光節約時間等規則 |

例如，依目前規則，紐約冬季通常是 UTC−5，夏季通常是 UTC−4。因此「紐約每天上午 09:00」不能全年只使用固定 `-05:00`。`Asia/Taipei` 現代日期一般使用 UTC+8，但它與固定 offset 在概念上仍不同。

時區規則可能因政策變動而更新；IANA 名稱沒有把規則固定在字串裡，實際換算依賴執行環境的時區資料庫版本。名稱與資料庫說明見 [IANA Time Zone Database](https://www.iana.org/time-zones)。

```javascript
const label = new Intl.DateTimeFormat('zh-TW', {
  timeZone: 'America/New_York',
  dateStyle: 'medium',
  timeStyle: 'short',
}).format(new Date('2026-10-11T08:30:00.000Z'));
```

這裡 `zh-TW` 決定呈現語系，`America/New_York` 決定當地時間。兩者互相獨立，見 [Intl.DateTimeFormat 文件](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat)。

使用時可以這樣判斷：已發生事件通常保存 UTC timestamp；跨地區預約或重複排程若需要保留「當地幾點」的意思，則另保存 IANA timezone。這是依前述資料語意整理的選用建議。

### 同一個時刻，依使用者偏好呈現

```typescript
interface DatePreferences {
  locale: string;
  timeZone: string;
}

function formatInstant(iso: string, preferences: DatePreferences): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) throw new Error('Invalid timestamp');

  return new Intl.DateTimeFormat(preferences.locale, {
    timeZone: preferences.timeZone,
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

const label = formatInstant('2026-10-11T08:30:00.000Z', {
  locale: 'en-US',
  timeZone: 'Asia/Taipei',
});
```

locale 控制文字與格式慣例，timeZone 控制同一時刻對應的當地時間。Intl 支援這兩項獨立設定，見 [Intl.DateTimeFormat 文件](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat)。

如果改變語系或時區，重新格式化原始值即可，不需修改後端保存的事件時間。畫面應標明使用哪個時區，尤其是跨國交易、會議與截止時間。

### Angular 語系切換要注意什麼？

Angular DatePipe 等內建 pipes 以 `LOCALE_ID` 作為預設語系，也可透過參數指定 locale；使用不同語系時，仍需載入對應 locale data。見 [Angular locale 格式化指南](https://angular.dev/guide/i18n/format-data-locale)。

若是執行期間切換偏好，不要把 LOCALE_ID 當成會自動追蹤的 Signal：可以將目前 locale 明確傳給 DatePipe，或用 Intl 配合反應式狀態重新格式化。Material Datepicker 則透過 DateAdapter.setLocale 更新，並同步處理 UI 翻譯。

要支援依日期變化的 IANA 時區規則，可以使用 Intl；DatePipe 的固定 offset 不宜直接當成完整的命名時區方案。

### 純日期仍然是純日期

生日 `2026-10-11` 不應因使用者從台灣移到美國就變成 `2026-10-10`。多語系可以改變它的顯示順序與文字，但要保留原本的年月日語意。

不要直接把 date-only 字串當成 UTC 事件時間，再套使用者時區。可採專門的 date-only 處理方式；若用 Date 作為格式化橋接，就要明確設計建構與時區規則。

### 「今天」與截止日由誰決定？

這要看業務定義。例如「台灣門市今天的營業額」，應以門市的 `Asia/Taipei` 日曆日期建立查詢範圍，而不是每位操作人員裝置上的今天。

前端可傳所選日期與業務時區，後端驗證並換算成開始／結束時刻。建議用半開區間 **開始含、結束不含**，例如查詢 `[當日開始, 次日開始)`；有日光節約時間的地區，一天不一定剛好是 24 小時。

「每日 09:00」的重複排程也應由後端依指定地區的日曆規則計算，不能只把第一次的 UTC 時間固定加 24 小時。

### SSR、Email 與報表保持一致

SSR 與瀏覽器首次顯示應使用相同的原始值、locale 和 timeZone，避免伺服器採 UTC、瀏覽器採本機設定而出現日期差異。把所選偏好一起傳給客戶端，再於使用者切換時更新顯示。

後端產生 Email／報表時，也應明確取得收件人或報表的語系與業務時區。正式匯出可加上 timezone 標示；畫面、通知與資料匯出才不會各用一套隱藏預設。

以上是基於日期語意整理的架構建議：**後端決定哪個日期／時間才符合業務，前端決定如何對使用者清楚呈現。** 多語系改變顯示方式，不能悄悄改變資料代表的事實。

## 設定對照與複習

| 想調整什麼？ | 使用哪個設定？ |
| --- | --- |
| JS 日期的語系與命名時區顯示 | Intl.DateTimeFormat 的 locale／timeZone |
| Angular 模板日期格式 | DatePipe format |
| Angular 日期預設語系 | LOCALE_ID ＋ locale data |
| DatePipe 預設格式與 offset | DATE_PIPE_DEFAULT_OPTIONS |
| Material 日期語系 | MAT_DATE_LOCALE／DateAdapter.setLocale |
| Material 日期值與解析規則 | DateAdapter |
| Material 輸入與日曆顯示格式 | MAT_DATE_FORMATS，配合 adapter |
| 瀏覽器原生日期輸入 | input type=date |

這是依前述 API 職責整理的對照。我會先問資料是「某個時刻」還是「某一天」，再分別設定語系、格式與時區；這樣才能避免只改 MAT_DATE_LOCALE，卻期待所有日期行為一起改變。
