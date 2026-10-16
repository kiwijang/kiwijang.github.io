---
title: "CEH 實作索引與實用網址"
date: "2026-10-16"
description: "核對 Lab Manual 的實驗覆蓋、缺頁與章節對應，集中整理官方工具文件、教學靶場及實驗紀錄方式。"
tags: [CEH, 資訊安全, 學習筆記]
---

## 先確認這份 Lab Manual 有哪些內容

提供的 `CEH_PDF/Lab_Manual.pdf` 共 **79 頁**，是部分頁面的集合，**不是完整實驗手冊**。這次先辨識全部頁面文字，再核對目錄、命令與關鍵輸出原圖。下表依檔案內頁次列出可見範圍。

| PDF 檔案內頁次 | 可見內容 | 能確認到什麼程度 |
| --- | --- | --- |
| 1–2 | 封面與出版資訊 | 可辨認為 CEH v13 Lab Manual |
| 3–6 | Module 01–20 目錄 | 可核對主題與印刷起始頁，不代表有實驗正文 |
| 7–9 | 部分實驗機設定 | Windows 11／Server 設定；不是完整環境部署手冊 |
| 10–19 | Module 03 連接埠／服務探索的中後段 | 從步驟 13 開始，前段缺少 |
| 20–24 | Module 03 OS 探索 | 可整理命令、輸出與判讀限制 |
| 25–33 | Module 03 IDS／防火牆相關掃描 | 有實作與封包觀察；不保證適用所有環境 |
| 34–43 | Module 03 多種掃描工具 | 含 Metasploit 探索模組 |
| 44–57 | Module 03 AI 輔助掃描 | 依賴未提供的 ShellGPT 整合設定 |
| 58 | 刻意空白頁 | 不當成辨識失敗 |
| 59–65 | Module 04 開頭、NetBIOS | 可整理查詢，並有參數／輸出解讀需要校正 |
| 66–68 | Module 04 SNMP | 可整理 snmpwalk 查詢與輸出觀察 |
| 69–71 | Module 04 LDAP | 中間缺一頁，不能連續重建操作 |
| 72–77 | Module 04 NFS | 有角色設定與探索；部分工具畫面出現錯誤 |
| 78–79 | Module 04 DNS 開頭 | 只到 NS 查詢，沒有完整區域傳送步驟 |

**PDF 頁次與印刷頁碼不同。** 例如 PDF 第 10 頁印刷為第 76 頁，PDF 第 79 頁印刷為第 146 頁。目錄列到印刷第 750 頁，不代表這份 PDF 有 750 頁。

LDAP 的原始圖片序號由 `CEH_160.jpg` 跳到 `CEH_162.jpg`；這是可確認的來源缺頁，不以工具常見用法推補。其他章節缺正文，也不等同於「只是 OCR 看不清楚」。

## 各章實作如何補充

下列各篇已加入實作節。**03、04 有可見手冊步驟；01 使用環境頁；02、05–20 的手冊正文仍缺少，另附清楚標示的官方資源延伸練習。** 本次再以 `1to3` 課堂照片補充 01 的環境／身分、02 的路徑判讀、03 的掃描觀念與畫面證據；照片不冒充缺失的手冊頁面。另以 `4to6` 的 17 張照片補入 04 的服務與 DNS、05 的弱點研究流程、06 的驗證／權限／日誌與隱寫術。

| Module | 文章 | 手冊資料狀態 |
| --- | --- | --- |
| 01 | [CEH 01：資訊安全與道德駭客入門](./CEH01.md) | 環境頁＋課堂 VM 角色與身分確認照片；沒有完整部署步驟。 |
| 02 | [CEH 02：足跡蒐集與偵察](./CEH02.md) | 手冊只有目錄；另有一張 ping／tracert 課堂照片。 |
| 03 | [CEH 03：網路掃描與服務辨識](./CEH03.md) | 部分正文＋課堂掃描照片；補到部分主機探索，仍非完整連續實驗。 |
| 04 | [CEH 04：列舉與服務資訊曝露](./CEH04.md) | 部分正文＋LDAP／SNMP／NFS／DNS／時間同步照片；手冊 LDAP 中間頁與 DNS 後段仍缺。 |
| 05 | [CEH 05：弱點分析與修復追蹤](./CEH05.md) | 手冊只有目錄；照片補弱點來源與評估流程，沒有掃描結果。 |
| 06 | [CEH 06：系統入侵的階段與防禦](./CEH06.md) | 手冊只有目錄；照片補驗證、權限、日誌與隱寫術；管理員視窗有帳戶操作成功輸出。 |
| 07 | [CEH 07：惡意程式威脅與分析](./CEH07.md) | 只有目錄列名，未收錄本章實驗步驟。 |
| 08 | [CEH 08：封包側錄與區域網路信任](./CEH08.md) | 只有目錄列名，未收錄本章實驗步驟。 |
| 09 | [CEH 09：社交工程與身分信任](./CEH09.md) | 只有目錄列名，未收錄本章實驗步驟。 |
| 10 | [CEH 10：阻斷服務與分散式攻擊](./CEH10.md) | 只有目錄列名，未收錄本章實驗步驟。 |
| 11 | [CEH 11：工作階段劫持與登入狀態保護](./CEH11.md) | 只有目錄列名，未收錄本章實驗步驟。 |
| 12 | [CEH 12：IDS、防火牆與誘捕系統](./CEH12.md) | 只有目錄列名，未收錄本章實驗步驟。 |
| 13 | [CEH 13：網頁伺服器架構與防護](./CEH13.md) | 只有目錄列名，未收錄本章實驗步驟。 |
| 14 | [CEH 14：Web 應用、API 與 Webhook 安全](./CEH14.md) | 只有目錄列名，未收錄本章實驗步驟。 |
| 15 | [CEH 15：SQL 注入與查詢邊界](./CEH15.md) | 只有目錄列名，未收錄本章實驗步驟。 |
| 16 | [CEH 16：無線網路、加密與存取點信任](./CEH16.md) | 只有目錄列名，未收錄本章實驗步驟。 |
| 17 | [CEH 17：行動裝置、應用程式與裝置管理](./CEH17.md) | 只有目錄列名，未收錄本章實驗步驟。 |
| 18 | [CEH 18：IoT 與 OT 的攻擊面與防護](./CEH18.md) | 只有目錄列名，未收錄本章實驗步驟。 |
| 19 | [CEH 19：雲端責任、身分與容器安全](./CEH19.md) | 只有目錄列名，未收錄本章實驗步驟。 |
| 20 | [CEH 20：密碼學、雜湊與金鑰管理](./CEH20.md) | 只有目錄列名，未收錄本章實驗步驟。 |

## 課堂照片補充：1to3 來源對照

本次資料夾有 **22 個 JPG，21 張不同影像**，其中 P18、P19 的 SHA-256 相同。P 代號依檔名排序建立，只用於回查來源，**不是拍攝順序或教材頁碼**。照片未全面標註章節，文章依內容分類，不能因資料夾叫 1to3 就把每張圖分配成指定 module 的原始講義。

下表對照本機 `CEH_PDF/1to3/` 的檔名。照片本身不複製為網站公開圖片；文章保留重新整理的文字、表格與示意圖。完整雜湊及採用範圍另存於本機 `CEH_PDF/1to3圖片核對.json`。

| 代號 | 原檔名 | 可確認主題 | 補充章節／處理 |
| --- | --- | --- | --- |
| P01 | `0bd6fd2d-2086-4bc3-923e-5c984e626bdd.jpg` | VM 層次、角色與服務示意 | 01 |
| P02 | `19eb4d22-7740-4407-824d-6d70ca63acb6.jpg` | 服務、埠與服務名稱對照檔 | 03 |
| P03 | `36c04ed9-484d-46dc-95e5-353f2700b1bd.jpg` | whoami 與 sudo su 身分切換 | 01 |
| P04 | `3b26511a-e396-441d-b1d6-ebe42944be5b.jpg` | SMB OS 探索輸出 | 03 |
| P05 | `41c9d3e6-7f14-42c8-8f21-944a9777572a.jpg` | Banner 與服務互動示意 | 03 |
| P06 | `4eb35932-5f35-4b18-a080-94aee661f9ba.jpg` | 應用資料、TCP 標頭與旗標 | 03 |
| P07 | `50f6ca7c-e6ba-49ae-8224-a9e000674558.jpg` | 身分切換與 ARP 探索命令 | 01、03 |
| P08 | `6289b303-d9c2-4795-a790-cff621427ede.jpg` | FTP 服務探索與歡迎訊息 | 03 |
| P09 | `6656a18e-ca6f-447c-bf26-b7fac8f1c414.jpg` | 非技術性課堂資訊 | 不重複採用／未採用 |
| P10 | `7d0d9c9c-b8cf-4eaf-ad87-47683fbe3012.jpg` | 主機探索、TCP 掃描、OS 與 NSE 白板 | 01、03 |
| P11 | `8d15e2ed-7351-40fd-b6dd-327dd2118611.jpg` | ARP／ICMP 探索結果 | 03 |
| P12 | `8eacb6c6-7e56-49ce-bc54-504f688ff387.jpg` | 掃描方法教材圖 | 03 |
| P13 | `8eda4e9c-ff19-431d-b7b8-583e81e65976.jpg` | Nmap OS 指紋輸出 | 03 |
| P14 | `ac35b0cb-c8cb-40d5-8a43-18516ca1bfab.jpg` | ping、TTL 與 tracert | 02 |
| P15 | `c1267c34-6eaa-4b81-903b-a233150c907c.jpg` | NSE 腳本與路徑白板 | 03 |
| P16 | `c8348d47-5345-4dbc-a43e-54c101a04560.jpg` | 指定埠與服務探索的差異 | 03 |
| P17 | `cf76beef-f00f-41e5-8da8-474e4b5f70dc.jpg` | 另一個 Parrot VM 專案網頁 | 01 |
| P18 | `d7aebb75-7f05-4bf1-90ac-b796c895d414 (1).jpg` | TCP 建立及關閉教材圖 | 03 |
| P19 | `d7aebb75-7f05-4bf1-90ac-b796c895d414.jpg` | P18 的完全重複檔 | 不重複採用／未採用 |
| P20 | `e6d97be8-a82b-4482-89fd-c8672bd8336c.jpg` | TCP 旗標教材圖 | 03 |
| P21 | `f2e94437-e677-426c-b2c9-478cf51f7bcd.jpg` | TCP、ARP、ICMP 與 No Logs 白板 | 03 |
| P22 | `f4d59ca0-e7a8-47f8-8dd9-cf514548d152.jpg` | 與 P21 相近的白板角度 | 03 |

**主要判讀限制：** P11 的未探索到主機不被補成關閉防火牆後成功；P08 停在 FTP 名稱輸入提示，不當成登入成功；P13 與 P04 的 OS 字串不完全一致，分別保存；P21、P22 的「No Logs」以官方 Nmap 文件釐清。被遮住的字、無法確認的網路配置與提示字元異常原因不推補。

Module 02 的新增材料有限，沒有新增足以還原完整搜尋引擎、Whois、郵件或社群足跡實驗的照片。Lab Manual 原有的缺頁說明仍成立。

## 共用實驗環境：先記錄角色，再對照設定

Lab Manual PDF 第 7–9 頁可確認以下主要機器。位址只代表教材實驗環境，操作前必須對照自己的實驗機。

| 教材機器 | 教材範例位址 | 本次可見用途 |
| --- | --- | --- |
| Windows 11 | `10.10.1.11` | 掃描端、NetBIOS 目標與部分工具操作 |
| Windows Server 2022 | `10.10.1.22` | 服務／OS 探索、SNMP、AD／LDAP 目標 |
| Windows Server 2019 | `10.10.1.19` | NetBIOS／LDAP 操作端、NFS 目標 |
| Parrot Security | 此處不另猜位址 | Nmap、SNMP、NFS 與 DNS 操作端 |

本文的環境準備建議是：建立隔離測試網路，記錄角色及位址，建立還原快照，確認授權範圍，再依所選實驗確認工具與服務。這是整理後的準備方式，不聲稱原文列有相同完整步驟。

環境頁有弱密碼、停用防火牆與弱化政策等課程設定；它們是刻意設計的實驗條件，不是日常主機的安全配置建議。本次沒有替使用者變更主機設定或部署這些 VM。

### 手冊中的網站與路徑不是公共練習入口

第 9 頁列有 `http://localhost:8080/DVWA/login.php`。`localhost` 指當時那台實驗機，並非可直接在任何電腦打開的遠端網站；DVWA 需先安裝與啟動。

手冊中的 `goodshopping.com`、`moviescope.com` 及其他示範名稱，不在此整理成可任意操作的公開靶場。課程內的 `Z:` 工具路徑也不代表這個工作資料夾已提供工具。另行準備教學環境時，使用下方 DVWA、Juice Shop 的原作者／官方說明。

## 課堂照片補充：4to6 來源對照

本批有 **17 張不同照片**，已逐張核對原圖。Q 代號依檔名排序，並非拍攝順序；與前批 P 代號分開。依可辨讀主題補入 04–06，不把資料夾名稱當成每張圖的正式章節標籤。原照片不複製為網站公開圖片；本機核對記錄保存在 `CEH_PDF/4to6圖片核對.json`。

| 代號 | 原檔名 | 可確認主題 | 採用章節 |
| --- | --- | --- | --- |
| Q01 | `02bda1ad-0fa9-4f7f-bb54-5651b6ad12a2.jpg` | LDAP、AD 分割與 SNMP | 04 |
| Q02 | `0f1d40a3-5a6b-41f0-9193-02ce3f2212ae.jpg` | 弱點資訊來源、CVE／CVSS／CWE | 05 |
| Q03 | `120190e1-3242-4a2d-a008-68b848649925.jpg` | 課程平台與電子書入口 | 共用 |
| Q04 | `1edfe5e8-1da7-4fd5-92f0-6b22d2144356.jpg` | Kerberos、SAM 與 NTLM 示意 | 06 |
| Q05 | `3052eff9-e00c-4151-9384-a2de92df1ea9.jpg` | Linux／Windows 集中日誌 | 06 |
| Q06 | `31fa0215-e5d6-4d02-be1a-b5534eff0f43.jpg` | DNS zone、查詢與 DNSSEC | 04 |
| Q07 | `5e71bcec-1d4c-47e3-9c49-749889e3b607.jpg` | NFS 教材命令與不同目標 | 04 |
| Q08 | `8e491a0e-4c28-4bcf-8c9c-822c91732156.jpg` | Windows 共享與 SNMP | 04 |
| Q09 | `8e6aa59b-ece7-4aae-b55c-1748993373ec.jpg` | 時間同步、RPC 與 NFS | 04、06 |
| Q10 | `923844da-aee9-48a2-a47d-4926a14809a8.jpg` | 登入權限、部分路徑示意 | 06 |
| Q11 | `95bb409b-e0cf-4629-9ac7-0cd8948d0a1e.jpg` | Zero Trust、評估階段示意 | 05、06 |
| Q12 | `a2da271a-276b-4130-876d-aa502784687e.jpg` | Linux 檔案與程序命令 | 06 |
| Q13 | `a511414f-4be1-43c0-877a-233682a07fe9.jpg` | OpenStego 藏入與取出流程 | 06 |
| Q14 | `ab2077b6-02ce-46f6-9e47-d1e8760f6d32.jpg` | MX 與 SPF 記錄片段 | 04 |
| Q15 | `b537c363-7c82-4a6a-8da0-0d5baf127ef7.jpg` | NTLM 示意與鎖定政策筆記 | 06 |
| Q16 | `f2b1130d-00a6-470c-98d4-4d64e59e62ce.jpg` | 課程平台入口另一角度 | 共用 |
| Q17 | `f913ac7f-b52a-43ff-9644-8c2e3f671e96.jpg` | 已提升權限視窗的本機帳戶管理 | 06 |

Q03、Q16 是同一課程平台說明的不同角度，並非重複檔案。可確認 Aspen 與 VitalSource 入口，以及課程／電子書／實驗入口的操作提示；未登入驗證授權，也沒有補寫訂閱碼。實際選單與可用內容以帳戶權益及目前平台為準。

**未採用的細節：** Q08 的遠端目標、Q10 的部分路徑、Q14 的完整郵件記錄及 Q15 的部分名稱解析手寫字不足以還原。Q15 的鎖定／重試數字不當成通用規則。Q07 與 Q12 是教材範例，Q17 才有可見命令成功輸出；Q17 已是管理員視窗，不能當作提權成功。其餘概念圖沒有補寫成實測結果。

## 官方工具、文件與練習網址

**查核日期：2026-10-16。** 以下已核對來源頁及用途（GNU Findutils 正文載入失敗，僅核對官方搜尋摘要），含需要 JavaScript 的入口與封存版本文件；沒有逐一登入、下載、安裝或驗證整套實驗。文件版本以連結標示為準，不能把「查到官方頁」當成所有步驟都已實測。

| 資源 | 適用章節 | 類型 | 用途 |
| --- | --- | --- | --- |
| [OWASP Web Security Testing Guide](https://owasp.org/projects/web-security-testing-guide) | 01、02、11、13、14 | 官方指南 | 測試方法與範圍、資訊蒐集、Web 測試分類。 |
| [BIND 9 dig 手冊](https://bind9.readthedocs.io/en/stable/manpages.html#dig-dns-lookup-utility) | 02、04 | 官方文件 | 核對 DNS 記錄類型、查詢語法與輸出。 |
| [Nmap Reference Guide](https://nmap.org/book/man.html) | 03、13 | 官方文件 | 核對掃描參數、狀態與輸出選項。 |
| [Zenmap GUI Users Guide](https://nmap.org/book/zenmap.html) | 03 | 官方文件 | 對照圖形介面、掃描設定及結果頁籤。 |
| [Nmap OS Detection](https://nmap.org/book/man-os-detection.html) | 03 | 官方文件 | 理解 OS 指紋、匹配與限制。 |
| [Nmap smb-os-discovery](https://nmap.org/nsedoc/scripts/smb-os-discovery.html) | 03 | 官方文件 | 核對 SMB 探索回傳資訊及條件。 |
| [Microsoft nbtstat](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/nbtstat) | 04 | 官方文件 | 核對 /a、/A 與本機快取 /c，避免大小寫誤用。 |
| [Net-SNMP snmpwalk](https://www.net-snmp.org/docs/man/snmpwalk.html) | 04 | 官方文件 | 查詢 MIB 子樹與了解 OID 輸出。 |
| [Microsoft AD Explorer](https://learn.microsoft.com/en-us/sysinternals/downloads/adexplorer) | 04 | 官方工具 | 了解目錄瀏覽、屬性、搜尋與快照功能。 |
| [Microsoft NFS Overview](https://learn.microsoft.com/en-us/windows-server/storage/nfs/nfs-overview) | 04 | 官方文件 | 理解 Windows Server 的 NFS 角色與用途。 |
| [Rapid7 SMB Version Detection](https://www.rapid7.com/db/modules/auxiliary/scanner/smb/smb_version/) | 03 | 官方模組說明 | 核對手冊中 Metasploit SMB 探索模組。 |
| [ShellGPT 專案](https://github.com/TheR1D/shell_gpt) | 03 | 原作者專案 | 核對 --shell、命令確認與安裝條件；不是教材缺頁的替代品。 |
| [FIRST CVSS](https://www.first.org/cvss/) | 05 | 官方規格 | 查閱評分規格、計算器及例子。 |
| [Microsoft Sysmon](https://learn.microsoft.com/en-us/sysinternals/downloads/sysmon) | 06 | 官方工具 | 閱讀程序等事件的記錄方式與設定。 |
| [Microsoft Process Monitor](https://learn.microsoft.com/en-us/sysinternals/downloads/procmon) | 06、07 | 官方工具 | 觀察檔案、登錄與程序／執行緒活動。 |
| [Wireshark User Guide](https://www.wireshark.org/docs/wsug_html_chunked/) | 03、08、10、12、18 | 官方文件 | 學習封包分析、篩選與統計介面。 |
| [Wireshark SampleCaptures](https://wiki.wireshark.org/SampleCaptures) | 08、16 | 官方 Wiki 樣本 | 取得學習用封包樣本，記錄所選檔案與協定。 |
| [Google／Jigsaw Phishing Quiz](https://phishingquiz.withgoogle.com/) | 09 | 官方互動練習 | 練習判讀釣魚訊息；是另行補充的練習入口。 |
| [Cloudflare DDoS Mitigation](https://www.cloudflare.com/learning/ddos/ddos-mitigation/) | 10 | 供應商第一方解說 | 對照偵測、回應與緩解的位置。 |
| [PortSwigger Authentication](https://portswigger.net/web-security/authentication) | 11 | 官方教學／靶場 | 登入與驗證相關主題及教學實驗。 |
| [PortSwigger Web Security Academy Labs](https://portswigger.net/web-security/all-labs) | 14 | 官方靶場 | 依主題與難度選擇獨立的教學實驗。 |
| [Suricata Quickstart（8.0.1 文件）](https://docs.suricata.io/en/suricata-8.0.1/quickstart.html) | 12 | 官方文件 | 依此文件版本學習設定與告警觀察；不是宣稱最新版本。 |
| [DVWA 原作者專案](https://github.com/digininja/DVWA) | 14、15 | 原作者靶場 | 查看安裝、使用條件及教學用 Web 應用。 |
| [OWASP Juice Shop](https://owasp.org/projects/juice-shop) | 14 | 官方靶場 | 另行補充的 Web 教學應用，與手冊內建網站分開。 |
| [PortSwigger SQL Injection](https://portswigger.net/web-security/sql-injection) | 15 | 官方教學／靶場 | SQL 注入原理、分類與教學實驗。 |
| [Wireshark WLAN Capture Setup](https://wiki.wireshark.org/capturesetup/wlan) | 16 | 官方 Wiki | 了解介面、平台與監聽模式的前提。 |
| [Wireshark WLAN Display Filters](https://www.wireshark.org/docs/dfref/w/wlan.html) | 16 | 官方欄位參考 | 核對 wlan 欄位及可用版本。 |
| [OWASP MASTG](https://mas.owasp.org/MASTG/) | 17 | 官方測試指南 | 行動應用測試方法、測試案例與工具資源。 |
| [OWASP IoT Security Testing Guide](https://owasp.org/owasp-istg/01_introduction/index.html) | 18 | 官方測試指南 | IoT／嵌入式測試範圍與方法；不等於完整 OT 操作手冊。 |
| [AWS IAM Tutorials](https://docs.aws.amazon.com/IAM/latest/UserGuide/tutorials.html) | 19 | 官方教學 | 在自有測試帳戶依教學練習 IAM；需自行確認雲端資源費用。 |
| [Docker Scout](https://docs.docker.com/scout/) | 19 | 官方文件 | 對照容器映像的套件及弱點分析。 |
| [OpenSSL 3.5 req](https://docs.openssl.org/3.5/man1/openssl-req/) | 20 | 官方文件 | 查閱憑證請求及自簽憑證選項。 |
| [OpenSSL 3.5 x509](https://docs.openssl.org/3.5/man1/openssl-x509/) | 20 | 官方文件 | 讀取憑證主體、簽發者、有效期與延伸欄位。 |
| [OpenSSL 3.5 dgst](https://docs.openssl.org/3.5/man1/openssl-dgst/) | 07、20 | 官方文件 | 練習檔案摘要及比較資料異動。 |
| [Microsoft net use（封存文件）](https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-server-2012-r2-and-2012/gg651155%28v%3Dws.11%29) | 04 | 官方封存文件 | 查閱無參數時的連線列表用途；文件屬舊版封存。 |
| [OWASP WSTG Session Management（v4.2）](https://wstg.owasp.org/v4.2/4-Web_Application_Security_Testing/06-Session_Management_Testing/) | 11 | 官方測試指南 | 登入狀態、Cookie、登出與逾時的測試分類。 |
| [Parrot Security](https://parrotsec.org/) | 01 | 官方文件／規範 | 區分安全作業系統與照片中的另一個 Parrot VM 專案。 |
| [Microsoft ping](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/ping) | 02 | 官方文件／規範 | 回應、時間與 TTL 欄位。 |
| [Microsoft tracert](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/tracert) | 02 | 官方文件／規範 | 逐跳探測與未回應節點的限制。 |
| [RFC 9293：TCP](https://datatracker.ietf.org/doc/html/rfc9293) | 03 | 官方文件／規範 | TCP 旗標、連線建立及關閉。 |
| [Nmap Host Discovery](https://nmap.org/book/man-host-discovery.html) | 03 | 官方文件／規範 | -sn、ARP 與 ICMP，以及本地網路的探測前提。 |
| [Nmap SYN Scan](https://nmap.org/book/synscan.html) | 03 | 官方文件／規範 | -sS 的行為，及其可被觀察的限制。 |
| [Nmap TCP Connect Scan](https://nmap.org/book/scan-methods-connect-scan.html) | 03 | 官方文件／規範 | -sT 與作業系統 connect 介面。 |
| [Nmap Service and Version Detection](https://nmap.org/book/man-version-detection.html) | 03 | 官方文件／規範 | 服務名稱與主動辨識結果的差別。 |
| [Nmap nmap-services](https://nmap.org/book/nmap-services.html) | 03 | 官方文件／規範 | 埠與服務名稱資料的用途。 |
| [Nmap NSE](https://nmap.org/book/man-nse.html) | 03 | 官方文件／規範 | 腳本選取與使用方式。 |
| [Microsoft DNS zones](https://learn.microsoft.com/en-us/windows-server/networking/dns/zone-types) | 04 | 官方文件 | 主要／次要 zone 與區域傳送。 |
| [RFC 7208：SPF](https://datatracker.ietf.org/doc/html/rfc7208) | 04 | 官方規範 | SMTP 寄件網域的主機授權，與 MX 用途分開。 |
| [Microsoft MSRC Update Guide](https://msrc.microsoft.com/update-guide) | 05 | 廠商公告入口 | 查受影響產品與修補；需要 JavaScript，未操作查詢介面。 |
| [CVE 官方介紹](https://www.cve.org/About/Overview) | 05 | 官方入口 | CVE 識別與計畫；需要 JavaScript，未操作查詢介面。 |
| [CWE About](https://cwe.mitre.org/about/index.html) | 05 | 官方說明 | 弱點類型分類與用途。 |
| [Microsoft Kerberos 概觀](https://learn.microsoft.com/en-us/windows-server/security/kerberos/kerberos-authentication-overview) | 06 | 官方文件 | TGT 與服務票證的角色。 |
| [Windows 認證處理](https://learn.microsoft.com/en-us/windows-server/security/windows-authentication/credentials-processes-in-windows-authentication) | 06 | 官方文件 | 本機／網域帳戶、SAM 與驗證套件。 |
| [Microsoft NTLM 驗證](https://learn.microsoft.com/en-us/troubleshoot/windows-server/windows-security/ntlm-user-authentication) | 06 | 官方文件 | challenge-response 與認證資料的區別。 |
| [GNU Findutils Mode Bits](https://www.gnu.org/software/findutils/manual/html_node/find_html/Mode-Bits.html) | 06 | 官方文件 | 核對 -perm 位元比對；本次可讀取搜尋摘要，正文載入失敗。 |
| [Windows Event Collector](https://learn.microsoft.com/en-us/windows/win32/wec/windows-event-collector) | 06 | 官方文件 | 事件訂閱與集中收集。 |
| [OpenStego](https://www.openstego.com/) | 06 | 官方工具 | 資料隱藏與取出功能。 |
| [OpenStego 命令列說明](https://www.openstego.com/cmdline.html) | 06 | 官方文件 | 核對功能參數與範例；未安裝實測。 |
| [EC-Council Aspen](https://aspen.eccouncil.org/) | 共用 | 官方課程平台 | 課程與相關資源入口；需帳號與相應權益。 |
| [VitalSource Bookshelf](https://bookshelf.vitalsource.com/) | 共用 | 電子書平台入口 | 課程電子書入口；未登入或驗證書籍授權。 |

### 先從哪裡開始？

- **先重看手冊確實提供的操作：** Module 03 的服務／OS 探索，以及 Module 04 的 NetBIOS、SNMP、NFS。
- **想練習 Web 與 SQL：** 依各篇連到 PortSwigger 官方教學實例，或自行準備 DVWA／Juice Shop；不同靶場的帳號與步驟不混用。
- **想練習封包分析：** 先用 Wireshark 的教學樣本，不需要先製造攻擊流量。
- **想練習雲端或容器：** 分開處理 IAM 與映像評估；雲端資源需自行確認帳戶、權限、費用及清理方式。

以上是依現有資料與官方資源整理的練習路徑，不是原手冊的完整實驗安排。

## 實驗結果怎麼寫，才不會把猜測當成事實？

每次實驗至少記錄以下內容。這個格式是本文整理的筆記模板，沒有預填成功結果。

| 欄位 | 要記錄的內容 |
| --- | --- |
| 來源 | PDF 頁次，或官方教學的網址、版本與題目 |
| 環境 | 操作端／目標、軟體版本、已授權範圍與必要前提 |
| 操作 | 實際命令或介面操作；AI 提示與生成命令分開保存 |
| 觀察 | 原始輸出、封包編號或事件時間；敏感資料遮罩 |
| 判斷 | 已確認的事實、推測與仍需驗證事項分欄 |
| 差異 | 與教材截圖不同之處、錯誤訊息及其影響 |
| 復原 | 本次建立或修改的資源與還原／清理結果 |

例如 `open|filtered` 就照實記錄不確定狀態，`No exact OS matches` 不填成已識別 Windows；工具有錯誤，也不能把其他輸出當成該子步驟成功的證明。細節與官方校正見各章。

## 尚未補齊的部分

手冊仍缺 Module 02、05–20 的實驗正文，Module 03 的起始操作與部分前置部署，以及 Module 04 的 LDAP 中間頁、DNS 後段、SMTP／其他工具／AI 列舉。1to3 課堂照片另外補到了部分主機探索及環境示範；4to6 補到了服務觀念、弱點研究與部分系統操作照片，但兩批照片都沒有讓手冊變成連續完整版本。Module 01 目錄本身沒有列獨立實驗。

要繼續整理成手冊逐步教學，需要對應的完整頁面或原始手冊；目前以可確認的部分及另標來源的官方練習補充，不用推測填滿。

[回到 CEH 系列目錄](./CEH系列.md)
