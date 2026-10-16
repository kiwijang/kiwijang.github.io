---
title: "CEH 04：列舉與服務資訊曝露"
date: "2026-10-16"
description: "從「服務存在」走向「服務透露什麼」，理解帳號、分享資源與目錄資訊的列舉。"
tags: [CEH, 資訊安全, 學習筆記]
---

## 前言

從「服務存在」走向「服務透露什麼」，理解帳號、分享資源與目錄資訊的列舉。

這篇依 EC-Council 教材 `module04.pdf` 整理，聚焦可確認的主要觀念，並非逐頁翻譯或完整操作手冊。各節頁碼指 **PDF 檔案內頁次**，包含封面及空白頁，不是書中印刷頁碼。實際測試以取得授權的範圍為前提。

## 1. 列舉比掃描更接近服務內容

Enumeration 透過服務互動取得帳號、資源名稱或組態等資訊。掃描可能只確認某個服務可連線，列舉則進一步分析它提供的內容。因此風險不只取決於連接埠是否開放，也取決於身分驗證與可查詢範圍。

*來源：本章 PDF 第 4–10 頁；以摘要及觀念解說重新整理。*

## 2. 檔案分享與目錄服務的資訊價值

教材涵蓋 NetBIOS、LDAP 與 SMB。名稱、使用者、群組或分享目錄若曝露過多，可能協助攻擊者理解組織及權限關係。不是所有查詢都應被禁止，而是要確認查詢者的權限與業務需要是否一致。

*來源：本章 PDF 第 11–44、99–104 頁；以摘要及觀念解說重新整理。*

## 3. 管理協定也需要存取控制

SNMP 用於網路管理，NTP 與 NFS 分別與時間服務、檔案分享有關。這些服務可能回傳管理資訊或資源資訊。教材將它們納入列舉，提醒管理用途不代表可以讓任何來源任意查詢。

*來源：本章 PDF 第 25–55 頁；以摘要及觀念解說重新整理。*

## 4. 郵件、DNS 與其他服務要分別檢查

本章另介紹 SMTP、DNS、IPsec、VoIP 與 RPC 等資訊來源。不同協定的回應透露不同線索，不能用同一份檢查表直接代替所有服務的評估。DNS 資料的可見範圍與區域傳送等設定，也需要依用途審查。

*來源：本章 PDF 第 56–98 頁；以摘要及觀念解說重新整理。*

## 5. 降低曝露，並保留可追查性

列舉對策包括限制服務存取、避免不必要的匿名查詢、強化身分驗證，以及保留紀錄。目標是減少未授權使用者能取得的資訊，同時維持正常管理與營運。只修改服務橫幅不足以取代真正的權限控制。

*來源：本章 PDF 第 111–119 頁；以摘要及觀念解說重新整理。*

## 重要名詞

| 名詞 | 這篇的理解重點 |
| --- | --- |
| Enumeration | 向服務查詢並整理更具體的資源與身分資訊。 |
| LDAP | 存取目錄資料的協定。 |
| SNMP | 網路設備管理協定。 |

## 理解用例（本文自擬）

兩台主機都提供檔案分享，但一台只讓授權群組存取指定資料夾，另一台讓匿名使用者列出全部分享名稱。兩者連接埠相同，資訊曝露與權限風險卻不同。

這個例子用於解釋觀念，不是教材案例、實測結果或作者經歷。

<!-- ceh-lab-start -->
## 實作：服務列舉（Lab Manual 可見步驟）

本節來源是 `Lab_Manual.pdf` **PDF 第 59–79 頁**。NetBIOS、SNMP 與 NFS 有連續步驟；LDAP 中間缺頁；DNS 只有開頭。SMTP、其他工具及 AI 列舉僅出現在目錄。這些範圍不能混稱為已補齊整章實驗。

環境與原始頁碼對照見[實作與資源總表](./CEH實作與資源.md)。以下 IP 為教材實驗例子，實際執行時要換成自己已備妥、獲准的實驗主機。本節尚未在教材 VM 上實測。

### 1. NetBIOS：分辨遠端名稱表與本機快取

來源：Lab Manual PDF 第 62–65 頁。

教材由 Windows Server 2019 觀察 Windows 11。這個實驗要分辨三種輸出：目標的名稱表、目前電腦的名稱快取，以及目前電腦既有的網路連線。

在 Windows 命令提示字元，可依官方語法使用：

```text
nbtstat /A 10.10.1.11
nbtstat /c
net use
```

**官方文件校正：** 原圖第 63 頁把 IP 配在小寫 `-a` 後，這裡改採 Microsoft 文件的 `/A IP`。`/a` 接遠端名稱，`/A` 接 IP，大小寫有區別。`/c` 顯示的是**執行端本機快取**，不能當作讀取了目標機的快取。[Microsoft nbtstat](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/nbtstat)

`net use` 無參數時列出目前電腦的網路連線，不能據此宣稱已列出遠端所有共享目錄。[Microsoft net use（封存文件）](https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-server-2012-r2-and-2012/gg651155%28v%3Dws.11%29)

**練習紀錄：** 每個命令在哪台機器執行、讀取哪一類資訊、回傳的名稱與位址，以及哪些遠端資源仍未確認。

### 2. SNMP：比較版本與可讀取的 MIB 資料

來源：Lab Manual PDF 第 66–68 頁。

前提是測試目標已啟用 SNMP，且你知道允許使用的版本與 Community。手冊在指定環境使用 `public`，不是保證任意設備都能這樣查詢。

```text
snmpwalk -v1 -c public 10.10.1.22
snmpwalk -v2c -c public 10.10.1.22
```

1. 先確認實驗目標與 SNMP 設定，再分別執行手冊可見的兩種版本查詢。
2. 記錄 OID、回傳型別與值，尤其是系統描述、名稱及管理資訊。
3. 將「有回應」、「得到哪些資料」與「哪些資料無法讀取」分開。沒有回應時，記下逾時或錯誤，不照截圖補值。

本實驗證明的是當前條件下可讀取的管理資料；不能只因手冊泛稱「credentials」，就寫成已取得使用者密碼。OID 遍歷與工具行為可查 [Net-SNMP snmpwalk](https://www.net-snmp.org/docs/man/snmpwalk.html)。

### 3. LDAP：先做有憑證的目錄觀察，缺頁不補寫

來源：Lab Manual PDF 第 69–71 頁。

可確認手冊使用 AD Explorer 連線 Windows Server 2022，並在後段示範修改使用者屬性。但原始圖片序號由 `CEH_160.jpg` 跳到 `CEH_162.jpg`，中間的頁面沒有收錄；本文不重建遺失的步驟 5–7。

目前可整理的流程是：準備測試 AD 與有讀取權限的身分、開啟 AD Explorer、連到指定目錄，再觀察可讀取的物件與屬性。後半段修改操作會改變目錄，並非單純列舉；本篇先以讀取及紀錄為練習範圍。操作能力見 [Microsoft AD Explorer](https://learn.microsoft.com/en-us/sysinternals/downloads/adexplorer)。

**練習紀錄：** 連線身分、目錄／命名內容、物件路徑、可讀欄位與限制。不能由這個使用既有登入身分的畫面，推論目標允許任意匿名讀取。

### 4. NFS：從角色設定走到服務確認

來源：Lab Manual PDF 第 72–77 頁。

手冊先在 Windows Server 2019 的 Add Roles and Features 安裝 **Server for NFS**，再從 Parrot 探索。以下保留可確認流程：

1. 在測試伺服器確認是否要安裝 Server for NFS，記錄安裝前後狀態。這不是在一般電腦上無條件新增角色。
2. 從實驗掃描端檢查教材指定的服務埠。
3. 若已備妥課程內的 SuperEnum／RPCScan，再核對工具結果及錯誤；這份 PDF 沒有提供可核對的工具安裝與版本清單，不自行補下載位置。

```text
nmap -p 2049 10.10.1.19
```

2049 開放是服務探索的線索，**不等於已證明任何路徑可掛載或任何檔案可讀寫**。還需要另外確認匯出設定、身分與權限。[Microsoft NFS Overview](https://learn.microsoft.com/en-us/windows-server/storage/nfs/nfs-overview)

第 76 頁的 SuperEnum 截圖包含 `expect`、`showmount` 找不到的錯誤。因此紀錄應區分「掃描找到埠」與「部分子工具未成功」，不能把畫面寫成每項列舉都完成。

### 5. DNS：目前只到 NS 查詢，不是完整區域傳送

來源：Lab Manual PDF 第 78–79 頁。

實驗標題是 Zone Transfer，但目前最後一頁只看到 `dig ns` 查詢名稱伺服器；後續操作沒有收錄。**NS 記錄查詢不等於 AXFR 已成功。**

可用自己已配置的實驗 DNS 做同型查詢。以下 `lab.example` 是本文替換的測試區域名稱，必須先在自己的實驗環境建立，並向對應 DNS 伺服器查詢：

```text
dig @10.10.1.22 lab.example NS
```

這個命令是依官方語法調整的補充例子，不是聲稱手冊採用此網域。記錄回應狀態、查詢伺服器、ANSWER／AUTHORITY 與實際記錄；不預填教材中的公開名稱伺服器，也不把查無資料當成區域傳送被拒絕。[BIND dig 文件](https://bind9.readthedocs.io/en/stable/manpages.html#dig-dns-lookup-utility)

### 6. 本章還缺少哪些實驗？

- LDAP 的中間頁及連續操作。
- DNS 區域傳送後續步驟及結果。
- SMTP、其他列舉工具與 AI 列舉：目前只有目錄中的名稱，沒有實作正文。

這些屬於**缺頁**，不是單純圖片模糊。本篇不依工具常見用法自行補成教材步驟。[查看完整來源覆蓋與網址](./CEH實作與資源.md)。

### 目錄中的本章實驗

| 目錄可確認的實驗主題（中文整理） | 手冊印刷起始頁 |
| --- | ---: |
| NetBIOS 列舉 | 128 |
| SNMP 列舉 | 132 |
| LDAP 列舉 | 135 |
| NFS 列舉 | 139 |
| DNS 列舉 | 145 |
| SMTP 列舉 | 149 |
| 其他列舉工具 | 153 |
| AI 輔助列舉 | 161 |

### 實用網址

- [Microsoft nbtstat](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/nbtstat)：核對 /a、/A 與本機快取 /c，避免大小寫誤用。
- [Net-SNMP snmpwalk](https://www.net-snmp.org/docs/man/snmpwalk.html)：查詢 MIB 子樹與了解 OID 輸出。
- [Microsoft AD Explorer](https://learn.microsoft.com/en-us/sysinternals/downloads/adexplorer)：了解目錄瀏覽、屬性、搜尋與快照功能。
- [Microsoft NFS Overview](https://learn.microsoft.com/en-us/windows-server/storage/nfs/nfs-overview)：理解 Windows Server 的 NFS 角色與用途。
- [BIND 9 dig 手冊](https://bind9.readthedocs.io/en/stable/manpages.html#dig-dns-lookup-utility)：核對 DNS 記錄類型、查詢語法與輸出。
- [Microsoft net use（封存文件）](https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-server-2012-r2-and-2012/gg651155%28v%3Dws.11%29)：查閱無參數時的連線列表用途；文件屬舊版封存。

網址的來源與用途於 **2026-10-16** 查核；登入、安裝、所有靶場及完整實驗流程未逐一實測。[查看全系列實作與網址總表](./CEH實作與資源.md)。

<!-- ceh-lab-end -->

<!-- ceh-class-photos-4to6-start -->

## 課堂照片補充：目錄服務、共享與 DNS

本節依 `CEH_PDF/4to6/` 的照片整理；Q 代號與檔名見[來源對照表](./CEH實作與資源.md)。白板屬概念示意，投影片命令屬教材範例，不能當成本機已執行的紀錄。

### LDAP、SNMP 與 Windows 共享各在查什麼？

Q01 畫出 AD 資料庫、DC 與不同作業系統用戶端，並列出 Schema、Configuration、Domain、Application。可把它們理解為目錄資料的分割與用途，不能解讀成四層權限。LDAP 是存取目錄的協定，照片標示 TCP 389；能看哪些物件與屬性仍取決於驗證、授權與服務設定。這張圖沒有補上手冊缺失的 LDAP 操作頁。

Q01、Q08 的 SNMP 圖包含 manager、agent、MIB 與 community `Public`。MIB 描述管理物件及 OID；community 是 SNMP v1／v2c 的存取字串，不是 MIB 檔，也不是 SNMPv3 的使用者身分。白板上的 Public 是示例，不能推定任一設備都使用它，或一定允許寫入。查詢範圍與回傳欄位可對照 [Net-SNMP snmpwalk 文件](https://www.net-snmp.org/docs/man/snmpwalk.html)。

Q08 也比較 Windows 命令用途：

| 照片內容 | 學習重點 | 判讀限制 |
| --- | --- | --- |
| `net use` 搭配遠端路徑與 `/user:` | 建立指定身分的資源連線；無參數時列出連線 | 白板的目標不完整，不補成可執行命令，也不抄寫示範密碼。 |
| `net view` 搭配遠端電腦與 `/all` | 查看該電腦的共享資源列表 | 資源列得出來，不代表目前身分可讀寫其內容。 |

### NFS：先把主機與證據分開

Q07 是教材的 NFS Enumeration 投影片，兩個視窗查詢的是**不同 IP**：

```sh
showmount -e 10.10.1.9
rpcinfo -p 10.10.1.13
```

上列是照片中的範例目標，僅供對照；重新練習時應使用自己的授權實驗主機。左側輸出為 `Export list for 10.10.1.9:`，包含 `/home *`；右側列出另一台主機的 RPC 程式、版本、傳輸協定與埠，包含 portmapper 111、NFS 2049。Q09 的白板再用 `/share` 示意共享目錄。

可確認的是「教材列出了 export」與「另一台主機回報 RPC／NFS 服務」。`*` 表示該 export 所列的廣泛用戶端範圍，不能單憑它宣稱已成功掛載、可讀取敏感檔案或可寫入。實作紀錄要分開記錄目標、原始輸出、實際權限及未完成的驗證；本次沒有進行掛載。

### DNS：查詢、區域傳送與郵件記錄

Q06 畫出 primary／secondary zone、zone transfer、遞迴與反覆查詢，以及 DNSSEC。同一台伺服器可對不同 zone 扮演不同角色；不能把兩個 zone 的相反角色誤讀為「同一 zone 兩端任意互寫」。一般 secondary zone 是透過傳送取得副本，詳見 [Microsoft DNS zone 文件](https://learn.microsoft.com/en-us/windows-server/networking/dns/zone-types)。

用戶端請遞迴解析器取得結果，解析器再向其他 DNS 伺服器查詢，是白板想區分的兩段流程；快取也會影響是否需要逐層查詢。DNSSEC 著重資料來源驗證與完整性，不能當作 DNS 查詢內容加密。Q06 左側 HTTPS／IPsec 的對照僅用來提醒保護作用位置不同，沒有提供任何部署設定。

手冊目前只提供 NS 查詢；**NS 結果不是 AXFR 區域傳送成功的證據**。Q06 也是示意，沒有實際 AXFR 輸出，因此仍保留手冊 DNS 後段缺漏。

Q14 的郵件 DNS 白板可補充：

| 記錄 | 用途 | 不應延伸成的結論 |
| --- | --- | --- |
| MX，含優先值 10 的片段 | 指向接收郵件的郵件交換主機 | 不是授權寄件主機的完整政策；照片沒有完整主機名稱。 |
| TXT，開頭 `v=spf1` | SPF 宣告哪些主機可使用指定網域寄送 SMTP 郵件 | 不是郵件內容簽章；片段不足以重建有效 SPF 政策。 |

SPF 檢查 MAIL FROM／HELO 身分的授權，細節參照 [RFC 7208](https://datatracker.ietf.org/doc/html/rfc7208)。這裡沒有自行補入 `include`、IP 範圍或結尾政策。

### 時間同步也是驗證與調查的基礎

Q09 將時間伺服器連到 Windows Time 與 Linux Chrony，並註記驗證、Logs。跨主機比較登入與服務事件前，應先記錄時區、時間來源及偏差，避免錯排事件順序。照片沒有提供設定指令、容許誤差或查詢結果，不能補成已完成 NTP 部署，也不能推定 NTP 查詢會列出所有用戶端。

<!-- ceh-class-photos-4to6-end -->

## 複習問題

1. 列舉結果與掃描結果的差別是什麼？
2. 管理協定為什麼也可能成為資訊曝露來源？
3. 如何保留必要查詢，同時限制匿名存取？

## 來源與判讀限制

來源：`module04.pdf`，共 120 頁，位於本機 `CEH_PDF/`。本篇參照上述頁次的可辨識正文與主題，重要概念另以原圖抽樣核對；沒有宣稱逐頁圖表或每個操作都已完整還原。

原理論 PDF 的協定指令與輸出表格未逐字還原；新增實作節採用另經 Lab Manual 原圖及官方文件核對的內容，並標明參數校正與缺頁。不同環境的預設行為不由截圖直接推定。

圖片辨識可能出現錯字，辨識不清的命令、參數、位址、數字與圖表細節均不憑上下文補寫。原理論筆記沒有全面更新工具、產品、法律或標準；新增實作節僅對所附官方文件及明列的校正進行查核。

## 系列導覽

- 上一篇：[CEH 03：網路掃描與服務辨識](./CEH03.md)
- [回到 CEH 系列目錄](./CEH系列.md)
- 下一篇：[CEH 05：弱點分析與修復追蹤](./CEH05.md)
