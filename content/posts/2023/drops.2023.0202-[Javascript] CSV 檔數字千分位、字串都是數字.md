---
id: gx16d7c6i4t6nj34zen2bu6
title: '0202 [Javascript] CSV 檔數字千分位、字串都是數字'
desc: ''
updated: 1675332833043
created: 1675303666200
---

## CSV 檔數字千分位、字串都是數字

### Demo

[Demo](https://kiwijang.github.io/csvDemo/)

![](/assets/images/2023-02-02-16-25-57.png)

### csv

[CSV - wiki](https://zh.wikipedia.org/zh-tw/%E9%80%97%E5%8F%B7%E5%88%86%E9%9A%94%E5%80%BC)

逗號分隔值（Comma-Separated Values，CSV，有時也稱為字元分隔值，因為分隔字元也可以不是逗號），其檔案以純文字形式儲存表格資料（數字和文字）。純文字意味著該檔案是一個字元序列，不含必須像二進位數字那樣被解讀的資料。

[MIME text - MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types)

> Text-only data including any human-readable content, source code, or textual data such as comma-separated value (CSV) formatted data. Examples include: text/plain, text/csv, and text/html. (Registration at IANA)

所以 csv 是人類可讀的純文字。

以 Demo 的內容為例，用逗號 `,` 分隔，可以看出這是一個表格:

```javascript
代號,時間,貨幣 // 表頭 
="123",2023-02-02,"TWD 19,832,391,293" // 第1行 
="000004324",2023-03-01,"TWD 0.231123"  // 第2行  
Bfwer123213f,2023-05-09,"TWD -291,032,903.12312" // 第3行  
```

備註:

- `="000004324"` 代號用 excel SUM 公式去寫是因為用 excel 打開有可能會變成數字，造成 0 消失...

- `"TWD 19,832,391,293"` 貨幣有千分號所以要多加 `"` 去做區隔，不然會被 csv 誤解。

### 下載 csv

```typescript

// 我自訂的表格資料格式，要將這些資料轉換成上方用逗號個開的格式
demoData = [
{
    demoSeq: '123',
    demoDate: '2023-02-02T00:00:00',
    demoCurrency: 'TWD',
    demoTotal: 19832391293,
},
{
    demoSeq: '000004324',
    demoDate: '2023-03-01T19:00:00',
    demoCurrency: 'TWD',
    demoTotal: 0.231123,
},
{
    demoSeq: 'Bfwer123213f',
    demoDate: '2023-05-09T00:00:00',
    demoCurrency: 'TWD',
    demoTotal: -291032903.12312,
},
];

// 下載 csv
downloadCSV2() {
    const headerKey = ['demoSeq', 'demoDate', 'demoTotal'];
    const headerName = ['代號', '時間', '貨幣'];

    // 轉換為我自訂的 tbody 資料格式:
    // [[代號,時間,貨幣], [代號,時間,貨幣], [代號,時間,貨幣]]
    const csvFileData = this.demoData.map((x) => {
        const arr: (string | number)[] = [];
        headerKey.forEach((key) => {
        if (key === 'demoTotal') {
            arr.push(
            '"' +
                x.demoCurrency +
                ' ' +
                this._formateThousand((x as any)[key]) +
                '"'
            );
        } else if (key === 'demoDate') {
            arr.push((x as any)[key].split('T')[0]);
        } else {
            arr.push((x as any)[key]);
        }
        });

        return arr;
    });
    
    // csv 表頭格式
    let csv = headerName.join(',') + '\n';

    // 將自訂的 tbody 格式轉換為 csv 格式
    csvFileData.forEach((row) => {
        row = row.map((r, idx) => {
        // idx !== 0 是指不是 [代號] 欄位才要加千分位，
        // 其餘欄位若是數字就加千分位
        if (idx !== 0 && (typeof r === 'number' || !isNaN(+r))) {
            let result = '';

            // 加千分位
            result = this._formateThousand(r);

            return '"' + String(result) + '"';
        } else {
            // [代號] 有可能都是數字 要顯示成字串
            if (!isNaN(+r)) {
            return '="' + String(r) + '"';
            }
            return String(r);
        }
        });
        csv += row.join(',');
        csv += '\n';
    });

    if (this.downloadRef2?.nativeElement) {
        // 設定 html <a> 屬性讓他可下載 csv
        this.downloadRef2.nativeElement.setAttribute(
        'href',
        'data:text/csv;charset=utf-8,\ufeff' + encodeURI(csv)
        );
        this.downloadRef2.nativeElement.setAttribute(
        'download',
        `匯出報表_${formatDate(Date.now(), 'yyyyMMdd', this.localeId)}.csv`
        );
    }
}
```

備註:

- `data:text/csv;charset=utf-8,\ufeff` 是 data URIs，代表 `text/csv` MIME 類型、以 `utf-8` 編碼、`\ufeff` 避免亂碼。更多詳情請參閱 [data URIs - MDN](https://developer.mozilla.org/zh-TW/docs/Web/HTTP/Basics_of_HTTP/Data_URLs)。

    > data URIs, 由 RFC 2397 文件定義, 允許作者在文件中嵌入檔案.

- 要加 `\ufeff` 是為了避免 excel 開啟為亂碼，參考自 [JavaScript 瀏覽器端產生 csv 檔案 by jimmy8646](https://bonze.tw/javascript-client-generate-csv/)。

- [位元組順序記號](https://zh.wikipedia.org/zh-hant/%E4%BD%8D%E5%85%83%E7%B5%84%E9%A0%86%E5%BA%8F%E8%A8%98%E8%99%9F)

    > 位元組順序記號（英語：byte-order mark，BOM）是位於碼點U+FEFF的統一碼字符的名稱。當以UTF-16或UTF-32來將UCS/統一碼字符所組成的字串編碼時，這個字符被用來標示其位元組序。它常被用來當做標示文件是以UTF-8、UTF-16或UTF-32編碼的記號。

### 千分位加逗號

```typescript
  /**
   * 千分位加逗號
   * @param numberStr string | number
   * @returns string
   */
  private _formateThousand(numberStr: string | number): string {
    let result = '';
    let numStr = String(numberStr);

    const isMinus = numStr[0] === '-' ? true : false;
    if (isMinus) {
      const numStrArr = numStr.split('');
      numStrArr.shift();
      numStr = numStrArr.join('');
    }
    const arr = numStr.split('.');
    // 整數位
    const int = arr[0];
    const intArr = int.split('');
    const len = intArr.length;
    // 總共會有幾個千分位逗號
    let commasCount = Math.floor(len / 3);

    // 被整除的話要減一(第一位不用千分逗號)
    if (len % 3 === 0) {
      commasCount = commasCount - 1;
    }
    // 千分位加逗號
    for (let i = 1; i <= commasCount; i++) {
      intArr.splice(len - 3 * i, 0, ',');
    }

    if (arr.length <= 1) {
      // 沒有小數點以下
      result = intArr.join('');
    } else {
      const point = arr[1];
      // 小數點以下加回
      result = intArr.join('') + '.' + point;
    }

    // 負數要把-加回
    return isMinus ? '-' + result : result;
  }
```

## 小結

- 設定格式的 Data URIs `data:text/csv;charset=utf-8,\ufeff` 包含 MIME 類型、編碼、`utf-8` 的十六進位用 `\ufeff` 表示。

- Math.floor() 無條件捨去，正負都會往右移(變小)。

```javascript

 // 正→負排列圖:
 → [1.4] →  → → [0] → [-1.4] → 

 // 無條件捨去
              ↓                      ↓
 → [1.4] → [1] → [0] → [-1.4] → [-2] →
```
