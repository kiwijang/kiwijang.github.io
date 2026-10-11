---
id: tjo1srktkmfjj2wz4e5bn7c
title: 0419 [Ch1]作業系統簡介與常見系統類型(二)
desc: ""
updated: 1663165644718
created: 1650381132068
tags:
  - OS
description: "整理作業系統的基礎概念與常見系統類型，作為作業系統學習的入門筆記。"
---

## 電腦系統概論 computer system structure

### 組成電腦的五大單元

![](/assets/images/2022-05-02-22-40-17.png)

> 圖源: [第零章、計算機概論 - 鳥哥](https://linux.vbird.org/linux_basic/centos7/0105computers.php#ps4)

![](/assets/images/2022-05-02-22-46-40.png)

> 圖源: [馮紐曼架構 Von Neumann architecture](https://zh-yue.wikipedia.org/wiki/%E9%A6%AE%E7%B4%90%E6%9B%BC%E6%9E%B6%E6%A7%8B)/[Computer Organisation](https://en.wikibooks.org/wiki/IB/Group_4/Computer_Science/Computer_Organisation)

1. 輸入單元 input device
2. 輸出單元 output device
3. CPU 內部的控制單元 control unit
4. CPU 內部的算數邏輯單元 arithmetic/logic unit (ALU)
5. 主記憶體 memory unit

### 電腦系統粗分為四元件

![](/assets/images/2022-05-02-23-43-42.png)

1. 硬體 hardware

   例如: cpu、disk、memory...

2. 作業系統 operating system

3. 應用程式與系統程式 application programs and sys programs

4. 使用者 users

   例如: 人、其他機器、其他系統...

## 作業系統概述 OS Structure

### OS 的目的

1. user 與硬體之介面(方便使用者易於操作電腦)
2. 提供一個讓 app 易於執行之環境，即很多底層硬體控制不需 app 來直接運作 => 委託 os 來執行
3. 資源有限 => 作為資源調派者(resource allocator) (eg cpu, memory, I/O Device etc)

   => 希望有效運用資源，甚至公平使用。

4. 監督應用程式執行之角色，防止他們有意或無意之操作

### 電腦系統架構

1. 多處理器系統 Multiprocessor System / Parallel System / Tightly Coupled System- 又叫 Multiprocessing 或 paraller 或 tightly-coupled system。

   - 主要 features 如下:
     - 一部機器(或主機板)內置多顆處理器，均共享此一機器的 memory、bus、I/O devices, power-supply etc。
     - 通常所有 CPUs 均受同一個 clock 之時脈控制。
     - 通常由同一個 OS 管控所有 CPU。
     - 這些處理器之間的溝通大都採共享記憶體方式。 [CH6]
   - 優點
     - 增加產能(Increased Throughput)
     - 增加可靠性 (Increased Reliability)
     - 規模經濟 (Economy of scale)
   - 分述如下:
     - 產能增加: 所以支持 parallel computing，同一時內可有多個工作在不同 CPUs 上平行執行。
       - N 顆 CPUs 之產能絕對小於: 1 顆 CPU 產能\* N 倍。
       - 理由: 因為 (1) Resource Condition(資源競爭)。 (2) 處理器之間的溝通導致不見得工作可以平行執行
         所以效能會被抵減。
     - 提升可靠度: 萬一某 CPU 壞了，其他 CPU 仍可執行工作。
       - 所以統不至於因而停頓。
       - 名詞:
         - graceful degradation 漸進式毀滅
           系統不會因某些元件(e.g.硬體或軟體)的故障而停頓，仍保有持續運作的能力。
         - Fault Tolerant system (容錯系統)
           具有 graceful degradation 能力之系統。
     - 運算能力之規模擴充比較具有經濟效益
       - 這些多顆 CPUs 是共享此機器之記憶體、匯流排等其他資源，所以會比較省錢。

   1. 最常見為 SMP(Symmetric Multi-Processing)

      對稱式多處理器記憶體資源是共享的又稱 UMA(Uniform Memory Access)，所以會有資源競爭的問題。可用 CPU 排程和同步工具來解決遇到的問題(CH5、CH6)。

      雙核(dual-core)設計的處理器將多個 CPU 放置同一晶片(chips)上，會比個放在不同晶片上更有效率且更省電(省電對筆電和手機來說很重要)。

      快取級數越小代表體積越小、速度越快。

      這種共用資源的 CPU 架構讓 OS 設計及程式設計變得很重要(CH4 執行緒與並行)。

      ![](/assets/images/2022-05-03-22-41-34.png)

      > 圖源: [Cache Memory | L1, L2 and L3 Caches in Computers | L1 L2 L3 Cache Explained in Hindi](https://www.youtube.com/watch?v=IU9cB5g4eZU&ab_channel=ITSimplifiedinHINDI)

      當 CPU 變多，處理器和記憶體間的匯流排將會成為資料存取的瓶頸，會嚴重地影響到系統效能。[註 1]

      為了解決多 CPU 的資源競爭問題，NUMA (Non-Uniform Memory Access) 的設計簡化了匯流排的複雜程度，NUMA 將處理器切成不同節點，每個處理器都有各自的連結，當要用到別的節點的記憶體時速度會變慢，但只用到自己的記憶體時不只速度快、也不會有資源競爭的問題(因為自己用自己的，去用別人的也只會有一條路)。

      ![](/assets/images/2022-05-03-23-52-25.png)

      > 圖源: [A NUMA architecture with 4 nodes - uploaded by Li Wang](https://www.researchgate.net/figure/A-NUMA-architecture-with-4-nodes_fig2_273393420)

   2. ASMP(Asymmetric MultiProcessors) 非對稱式多處理器:通常採主從式架構。比 SMP 效能還差，主 CPU 易有效能瓶頸，且可靠度也差(主 CPU 壞了就全不能用)。

   3. 叢集式系統 clustered system

      1. 也是一種多處理器系統(Multiprocessor System)

2. 分散式系統 Distributed System / Loosely Coupled system

   多部機器彼此以網路相互串聯。機器間硬體資源不共享、各 CPU 時脈(clock)控制不一定相同、各 CPU 上的 OS 也不一定相同、處理器之間的溝通大都採 Message Passing 方式 (CH6)。

   增加吞吐量(throughput)和可靠性(reliability)、減少資源共享、可滿足遠端通訊的需求。

   可分成主從式架構與 P2P 架構。(就像 ASMP 和 NUMA 概念的差別，不是主從就是平權欸...)

### 作業系統執行

1. 多元程式設計系統 Multiprogramming

   允許多個程序 (processes/jobs) 在記憶體裡同時執行。

   - 主要目的: 提高 CPU 利用度 (utilization)。

   - Mulitiprogramming degree 代表系統內執行的程序 (processes) 數目。

     一般而言，若值愈高，CPU 利用度 (utilzation) 愈高。

   - 多個工作 (processes/jobs) 同時執行的方法有兩種:

     - 並行 Concurrent execution
       通常發生在單核(一顆 CPU 時)

     - 平行 Parallel execution
       多顆 CPUs 或 MultiCores

   1. 分時系統 Time-Sharing / Multitasking
      又叫 multitasking，是一種多元程式的邏輯擴充 (logical extension)。
      - 強調
        - 回應時間要短。
        - 對每個使用者工作要公平對待。
        - 讓每個使用者覺得有自己專屬的電腦的感覺。
      - 技術
        - CPU 排班採用 RR 排班。[CH4]
        - 有 Swapping 技術，即虛擬記憶體技術。[CH8]
        - 有 SPOOLing 技術，讓每個使用者有自己的 I/O 設備的感覺，同時也有 Buffering 技術(使用記憶體)一併使用。

2. Dual-Mode and Multimode Operation

3. Timer

4. 批次系統 Batch System

---

6. 即時系統 Real-Time System

   1. Hard
   2. Soft

7. 手持系統 handheld system

## 參考資料

- 註一 [多核心計算環境—NUMA 與 CPUSET 簡介 by 周秉誼](https://www.cc.ntu.edu.tw/chinese/epaper/0015/20101220_1508.htm)

#### 名詞解釋

- CPU

  執行指令(instructions)的硬體。

- 處理器 Processor

  包含一或多個 CPU 的物理晶片(chip)。

- 核心 Core

  CPU 的基本數量單位。

- 多核心 Multicore

  同 CPU 上包含多個運算核心。

- Multiprocessor

  包含多個處理器。
