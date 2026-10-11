---
id: 1FrZXjCCHfkMyZZeBnoL2
title: 0101 Server建置與管理
desc: ''
updated: 1669082046753
created: 1641043042173
tags: Server
status: w
---



## 前言

打算伺服器入門一下。

策略: 入門先求廣，這篇筆記會記錄我讀這本書的每章節主旨，看完之後找到有興趣或不懂的地方再開坑深挖。

## 書名: [MIS 一定要懂的伺服器建置與管理知識](https://www.books.com.tw/products/0010807048)

作者: きはし まさひろ | 譯者： 陳禹豪, 黃瑋婷 | 出版社：旗標

共八章節。

## Ch01 【序章】

- 定義 Server: 對企業內部或網際網路上的用戶端(Client)提供各種服務的電腦。
- 用戶端和伺服器之間的關係: 由伺服器和用戶端架構而成的系統就稱為「用戶端/伺服器系統(Client/Server System)，或稱為主從式架構」，是網路世界最常見的服務架構。
- Server 會提供不同服務，所謂的伺服器其實就是一部安裝了「伺服器軟體」的電腦，不同的伺服器軟體提供不同的服務。
- 因應各種需求而生伺服器功能:

## Ch02 【伺服器管理者必備的網路基礎知識】

OSI 參考模型及通訊協定 / 交換 (Switching) 技術 / IP 和 IP 位址 / 路由 (Routing) / ARP 協定 / TCP 和 UDP 協定 / NAT 和 NAPT

## Ch03 【從七大面向建立架設前置知識】

On-premise / 雲端 / 混合雲 / IaaS / PaaS / SaaS / 資料中心 / 虛擬化 / 即時移轉 / 容錯系統 / Host OS 型態 / Hypervisor 型態 / 直立式 (Tower) / 機架式 (Rack) / 刀鋒式 (Blade)

## Ch04 【企業內部的伺服器】

DHCP 伺服器 / 位址池 / DNS 伺服器 / 工作群組 / AD 網域 / 網域主控站 / 檔案伺服器 / NAS / 列印伺服器 / SSO 伺服器 / SSO 代理型 / SSO 反向代理型 / MFA 多重驗證 / SIP 伺服器 / Proxy 伺服器 / SMTP 伺服器 / POP3 伺服器 / SMTP AUTH / POP before SMTP / MS Exchange Server / Exchange Online / 私有雲

## Ch05 【對外營運的伺服器】

網頁伺服器 / Apache / IIS / SSL 伺服器 / 數位憑證 / 對稱金鑰加密 / 公開金鑰加密 / FTP 伺服器 / 網頁應用程式伺服器 / Java EE / .NET Framework / 資料庫伺服器 / RDBMS / VPN 伺服器 / IPSec VPN / SSL-VPN

## Ch06 【預防伺服器發生故障】

RAID1 / RAID5 / RAID0+1 / Teaming / 容錯 / 叢集 / 儲存共享架構 / 資料鏡像架構 / 伺服器負載平衡技術 / 廣域負載平衡技術 / UPS

## Ch07 【伺服器的資安防護】

傳統式防火牆 / UTM 整合式威脅管理設備 / NGFW 次世代防火牆 / WAF 網頁應用程式防火牆 / SQL 注入攻擊 / 跨網站指令碼 (XSS) / 跨網站偽造請求 (CSRF) / Security Zone / Untrust Zone / DMZ / Trust Zone / IDS 與 IPS

## Ch08 【伺服器的維運管理】

遠端管控 / SSH / 系統更新及 Bug 修復 / WSUS 伺服器 / 備份與還原 / ipconfig 等常用指令 / NTP 伺服器 / Syslog 伺服器 / SNMP 伺服器

## 小結
