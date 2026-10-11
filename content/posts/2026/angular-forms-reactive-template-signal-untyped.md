---
title: Angular 表單比較：Reactive Forms、Template-driven Forms、Signal Forms 與 Untyped
date: "2026-10-11"
description: 用相同的 Email 表單比較 Reactive、Template-driven 與最新 Signal Forms，介紹 Typed／Untyped、驗證、reset、停用欄位、資料流及漸進遷移方式。
tags: [Angular, Forms, Signals, 前端]
---

Angular 的表單不只要取得輸入值，還需要處理驗證、錯誤、使用者是否碰過欄位，以及送出時的狀態。選擇表單 API，其實是在選擇：**資料放在哪裡，規則寫在哪裡，如何讓畫面與資料同步。**

本文用同一個 Email 表單比較 Reactive Forms、Template-driven Forms 和 Signal Forms，再說明 Typed／Untyped 的差別。版本資訊於 2026-10-11 查核；Signal Forms 範例採 Angular v22 的穩定 API。

## 三種表單與 Untyped 的關係

| 項目 | Reactive Forms | Template-driven Forms | Signal Forms |
| --- | --- | --- | --- |
| 資料來源 | FormControl／FormGroup 控制項模型 | 元件資料配合模板指令 | WritableSignal 資料模型 |
| 建立表單 | 在 TypeScript 建立控制項 | 由 ngModel／NgForm 指令建立 | `form(model, schema)` 建立 field tree |
| 模板連接 | `[formGroup]`、`formControlName` | `[(ngModel)]`、`name` | `[formField]` |
| 驗證規則 | Validators／自訂 ValidatorFn | required 等驗證指令 | schema 中的 required 等規則 |
| 觀察變化 | valueChanges／statusChanges | ngModelChange／表單狀態 | Signal／computed |
| 型別 | Typed 或 Untyped | 元件模型可有型別，表單 API 不具相同的 Typed controls 保證 | 從資料模型推導 field 型別 |

**Untyped 不是第四種表單架構。** 它是 Reactive Forms 中保留舊型別行為的一組 API，例如 `UntypedFormGroup`。

表格是依 API 職責整理的比較，架構可參考 [Reactive Forms](https://angular.dev/guide/forms/reactive-forms)、[Template-driven Forms](https://angular.dev/guide/forms/template-driven-forms) 與 [Signal Forms 比較指南](https://angular.dev/guide/forms/signals/comparison)。

## Reactive Forms：在程式中明確建立控制項

Reactive Forms 以控制項模型描述表單。以下範例使用非 nullable 的字串控制項，並在送出前檢查有效性：

```typescript
import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-reactive-email',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="emailForm" (ngSubmit)="save()">
      <label>
        Email
        <input type="email" formControlName="email" />
      </label>
      @if (emailForm.controls.email.touched && emailForm.controls.email.invalid) {
        <p>請填寫有效的 Email。</p>
      }
      <button type="submit">儲存</button>
    </form>
  `,
})
export class ReactiveEmailComponent {
  readonly emailForm = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
  });

  save(): void {
    this.emailForm.markAllAsTouched();
    if (!this.emailForm.valid) return;
    const payload = this.emailForm.getRawValue();
    console.log(payload.email);
  }
}
```

目前值可同步讀取；變化則可以透過 Observable 處理。`FormArray` 適合重複欄位，`FormGroup` 適合巢狀結構。因控制項能在 TypeScript 直接操作，驗證與更新邏輯也容易獨立測試。見 [Reactive Forms 官方指南](https://angular.dev/guide/forms/reactive-forms)。

### setValue 與 patchValue

以下是上面元件內的用法：

```typescript
this.emailForm.setValue({ email: 'kiwi@example.com' });
this.emailForm.patchValue({ email: 'hello@example.com' });
```

`setValue` 要求符合完整控制項結構；`patchValue` 允許只更新部分欄位。從 API 回填資料時，應先確認 DTO 與表單模型是否相同，避免用寬鬆更新掩蓋欄位拼錯或資料缺漏。定義見 [FormGroup API](https://angular.dev/api/forms/FormGroup)。

## Template-driven Forms：讓模板描述表單

通常口語說的 Template Form，正式名稱是 Template-driven Forms。它用 `FormsModule`、`ngModel` 和模板上的驗證指令管理表單：

```typescript
import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';

@Component({
  selector: 'app-template-email',
  standalone: true,
  imports: [FormsModule],
  template: `
    <form #emailForm="ngForm" (ngSubmit)="save(emailForm)">
      <label>
        Email
        <input type="email" name="email"
          [(ngModel)]="email" #emailField="ngModel"
          required email />
      </label>
      @if ((emailField.touched || emailForm.submitted) && emailField.invalid) {
        <p>請填寫有效的 Email。</p>
      }
      <button type="submit">儲存</button>
    </form>
  `,
})
export class TemplateEmailComponent {
  email = '';

  save(form: NgForm): void {
    if (!form.valid) return;
    console.log({ email: this.email });
  }
}
```

在 `<form>` 裡，`name` 用來註冊欄位。`#emailField="ngModel"` 取得欄位狀態，`#emailForm="ngForm"` 則取得整體表單狀態。

簡單表單可以直接從模板看出規則；當欄位越多、跨欄位條件越複雜，規則也可能逐漸分散。Template-driven Forms 底層仍有控制項，只是由指令代為建立與同步，並非完全沒有 FormControl。詳見 [Template-driven Forms 文件](https://angular.dev/guide/forms/template-driven-forms)。

## Typed Forms：控制項的型別也是模型的一部分

Angular v14 起，Reactive Forms 預設提供嚴格型別。這個改變主要讓錯誤的欄位存取或值指定能在編譯時被發現，沒有增加新的表單架構。見 [Typed Forms 指南](https://angular.dev/guide/forms/typed-forms)。

```typescript
import { FormControl } from '@angular/forms';

const email = new FormControl('');
// 推導為 FormControl<string | null>
email.setValue('kiwi@example.com');
// email.setValue(123); // 型別錯誤

const nickname = new FormControl<string | null>(null);
nickname.setValue('Kiwi');
```

型別描述的是資料形狀，不代表驗證一定通過。`FormControl<string>` 仍可能含有格式錯誤的 Email；`Validators.email` 處理的是執行時有效性。Control 的型別定義見 [FormControl API](https://angular.dev/api/forms/FormControl)。

### 為什麼 reset 後會變成 null？

一般控制項呼叫不帶值的 `reset()`，預設會回到 `null`。`nonNullable: true` 則讓它回到初始值；這個選項會改變實際行為，並非只改 TypeScript 宣告。

```typescript
const nullable = new FormControl('Kiwi');
nullable.reset(); // value 是 null

const nonNullable = new FormControl('Kiwi', { nonNullable: true });
nonNullable.reset(); // value 是 'Kiwi'
```

對整個 group，可使用 `FormBuilder.nonNullable.group()` 減少重複設定。nullable 與 reset 的規則見 [FormControl API](https://angular.dev/api/forms/FormControl)。

### value 和 getRawValue 不完全相同

當 FormGroup 啟用時，停用的子控制項不會出現在 `group.value` 中，因此 Typed group 的 value 通常是 `Partial`，欄位可能為 `undefined`。`getRawValue()` 則包含停用控制項。

```typescript
this.emailForm.controls.email.disable();
const editableValues = this.emailForm.value;
const allValues = this.emailForm.getRawValue();
```

若整個 group 都被停用，`value` 的聚合行為另有差異，不能簡化成「任何情況都排除 disabled 欄位」。送 API 前應明確選擇要送哪些資料。細節見 [FormGroup API](https://angular.dev/api/forms/FormGroup)。

## Untyped Forms：保留行為，放寬型別

常見 API 包含 `UntypedFormControl`、`UntypedFormGroup`、`UntypedFormArray` 和 `UntypedFormBuilder`，都來自 `@angular/forms`。

```typescript
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';

const legacyForm = new UntypedFormGroup({
  email: new UntypedFormControl('', [Validators.required, Validators.email]),
});

legacyForm.controls['email'].setValue(123);
// 型別系統不會阻止這種指定；仍可能違反業務需求或驗證規則。
```

Untyped 的值 API 使用 `any`，驗證、dirty、touched 和狀態管理仍然存在。**Untyped 不等於沒有驗證。** `UntypedFormControl` 本質上對應 `FormControl<any>`，見 [UntypedFormControl API](https://angular.dev/api/forms/UntypedFormControl)。

既有專案可以逐步轉為 Typed，不需要一次改完。如果動態欄位的 key 未知但值型別一致，可考慮 `FormRecord`；同型別的重複項目可用 `FormArray`。真正無法預先描述的異質結構，才可能需要 Untyped。這些使用邊界見 [Typed Forms 指南](https://angular.dev/guide/forms/typed-forms)。

## Signal Forms：以 Signal 資料作為來源

Signal Forms 在 Angular v21 引入，`form()` 官方 API 標示 **v22.0 起穩定**。目前從 `@angular/forms/signals` 匯入 `form`、`FormField` 和驗證函式；範例使用 `[formField]`，避免混用早期教學的命名。見 [Signal Forms 概覽](https://angular.dev/guide/forms/signals/overview) 與 [form API](https://angular.dev/api/forms/signals/form)。

```typescript
import { Component, signal } from '@angular/core';
import { email, form, FormField, FormRoot, required } from '@angular/forms/signals';

interface EmailModel {
  email: string;
}

@Component({
  selector: 'app-signal-email',
  standalone: true,
  imports: [FormField, FormRoot],
  template: `
    <form [formRoot]="emailForm">
      <label>
        Email
        <input type="email" [formField]="emailForm.email" />
      </label>
      @if (emailForm.email().touched() && emailForm.email().invalid()) {
        @for (error of emailForm.email().errors(); track $index) {
          <p>{{ error.message }}</p>
        }
      }
      <button type="submit" [disabled]="emailForm().submitting()">儲存</button>
    </form>
  `,
})
export class SignalEmailComponent {
  readonly model = signal<EmailModel>({ email: '' });

  readonly emailForm = form(
    this.model,
    path => {
      required(path.email, { message: '請填寫 Email。' });
      email(path.email, { message: 'Email 格式不正確。' });
    },
    {
      submission: {
        action: async field => {
          const payload = field().value();
          // 示範取得資料；實際儲存時在此 await 呼叫服務。
          console.log(payload.email);
        },
      },
    },
  );
}
```

`model` 保存實際資料，`form()` 依資料結構建立 field tree，並加上驗證與互動狀態。`emailForm.email` 是欄位的連接入口；呼叫 `emailForm.email()` 取得狀態，再以 `touched()`、`invalid()` 等 Signal 讀取。

FormField 讓輸入與模型同步，form 不另外保存一份獨立資料副本。規則見 [form API](https://angular.dev/api/forms/signals/form) 與 [FormField API](https://angular.dev/api/forms/signals/FormField)。

### 送出流程也有專用 API

上述 `FormRoot` 會阻止瀏覽器預設送出，並觸發 Signal Forms 的 submit 流程。它會標記互動欄位、檢查驗證，再執行 action，期間提供 `submitting()` 狀態。

如果加入非同步驗證且必須等待全部完成，可在 submission 設定 `ignoreValidators: 'none'`；現行預設並非一律等待 pending validators。也可手動呼叫 `submit()`。完整流程見 [Signal Forms 送出指南](https://angular.dev/guide/forms/signals/form-submission)。

### 衍生狀態可以用 computed

```typescript
import { computed } from '@angular/core';

// SignalEmailComponent 內，在 model 宣告之後加入
readonly emailDomain = computed(() => {
  return this.model().email.split('@')[1] ?? '';
});
```

更新模型可用 `model.update()`，或欄位的 `value.set()`。單純把 Reactive Forms 的 `valueChanges` 轉成 Signal，仍然是在使用 Reactive Forms；它不會自動變成 Signal Forms，也不會改用 schema 驗證。這是依資料模型職責整理的區分，參考 [表單系統比較](https://angular.dev/guide/forms/signals/comparison)。

## 表單狀態與驗證規則

| 狀態 | 意義 |
| --- | --- |
| touched | 欄位曾經失去焦點，或被程式標記為 touched |
| dirty | 使用者互動造成值變更，或被程式標記為 dirty |
| valid／invalid | 驗證結果 |
| pending | 非同步驗證尚在進行 |

程式回填值不一定等同使用者操作，因此「有值」不代表 dirty，「無效」也不代表要立即顯示錯誤。範例在 touched 或送出後才顯示提示。

Reactive／Template-driven Forms 的錯誤常以 `errors?.['required']` 讀取；Signal Forms 則提供錯誤集合與 schema 規則。跨欄位、條件驗證也應依各自 API 撰寫，不宜直接把 ValidatorFn 原封不動當成 Signal Forms schema。見 [Signal Forms 驗證指南](https://angular.dev/guide/forms/signals/validation)。

## 如何選擇與遷移？

以下是依上述差異整理的實務判斷：

- 欄位少、規則簡單，而且團隊習慣模板寫法：Template-driven Forms 可以很直接。
- 複雜表單、既有 RxJS 資料流和大量自訂控制項：Typed Reactive Forms 是成熟的選擇。
- 新專案以 Signals 為主要狀態工具，且表單元件支援相應介面：可以評估 Signal Forms。
- 舊專案依賴 any 或結構暫時無法完整描述：保留 Untyped，再逐區建立型別。

遷移前先盤點欄位型別、reset 行為、disabled 值是否要提交，以及自訂元件的表單介面。驗證規則與 UI 整合也需要重新確認，不能只替換匯入名稱。官方也明確表示，既有 Reactive Forms 應用程式仍可持續使用它。見 [Signal Forms 概覽](https://angular.dev/guide/forms/signals/overview)。

我會先讓資料模型與驗證規則清楚，再選擇 API。型別能提早發現程式錯誤，驗證處理使用者輸入，表單狀態則決定畫面提示與送出流程；這三件事需要一起考慮。