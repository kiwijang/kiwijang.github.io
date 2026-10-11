---
id: h8cp4furnmhkdr2wzwn825j
title: '1210 [Flutter] 使用 VS Code 在 Windows 上開發 Android App'
desc: ''
updated: 1670685054617
created: 1670674322860
tags:
  - Flutter
  - Android
---

## Flutter

[Flutter - wiki](https://zh.wikipedia.org/zh-tw/Flutter)

### Dart

> Flutter是使用Dart語言編寫，並利用該語言的許多進階功能。
> 在Windows、macOS和Linux上，Flutter在Dart虛擬機器中執行，該虛擬機器具有即時編譯執行引擎。
> 在編寫和除錯應用程式時，Flutter使用即時編譯功能進行「熱重載」(Hot Reload)，可以將對原始檔的修改注入正在執行的應用程式中。

### Flutter 引擎

> Flutter的引擎主要使用C++開發，透過Google的Skia圖形函式庫提供底層彩現支援，亦提供平台相關的SDK，例如Android和iOS。
> Flutter引擎是用於代管Flutter應用程式的可移植的執行環境。它實現了Flutter的核心程式庫，包括動畫和圖形、檔案和網路I/O、可存取性支援、外掛程式架構以及Dart執行環境和編譯工具鏈。
> 大多數開發人員將透過Flutter框架與Flutter進行互動，該框架提供了一個現代、回應式的框架，以及一組豐富的平台、版面配置和基礎元件。

### Flutter’s Compilation Patterns 編譯方式

[Flutter’s Compilation Patterns by stephenwzl](https://proandroiddev.com/flutters-compilation-patterns-24e139d14177)
> 開發時用 Kernel Snapshot，發布時則根據不同平台用不一樣的編譯方式。

### 安裝 Flutter

[Windows install - Flutter 官網](https://docs.flutter.dev/get-started/install/windows)

#### 下載 flutter SDK

> Warning: Do not install Flutter to a path that contains special characters or spaces.
> Warning: Do not install Flutter in a directory like C:\Program Files\ that requires elevated privileges.

#### 將 flutter 加入使用者環境變數

![](/assets/images/2022-12-10-21-22-03.png)


### 設定 VS code(安裝 Flutter extention)

[Set up an editor - Flutter 官網](https://docs.flutter.dev/get-started/editor)

### 設定 Android

[Android setup](https://docs.flutter.dev/get-started/install/windows#android-setup)

Android App 是以 Java 撰寫而成，故要有 Java 開發環境與安裝 Android SDK。

無論你用 Android Studio 還 VS Code 開發都要安裝:

1. 安裝 Java SDK
   
  `C:\Program Files\Java\jdk-18.0.1.1` 在這個路徑可以找到你安裝的 Java SDK 版本。

2. 讓編輯器找的到你的 Java SDK 位置，設定 `JAVA_HOME`
   
   ![](/assets/images/2022-12-10-21-56-42.png)

3. 安裝 Android SDK

    `C:\Users\使用者名稱\AppData\Local\Android\Sdk` 可以看到你安裝的 Android SDK。

    ![](/assets/images/2022-12-10-22-23-30.png)
    > 可以直接用 Android Studio 管理 Android SDK。
   
4. 如果想使用 cmd 管理 Android SDK，安裝 sdkmanager 並設定環境變數(可略過這步直接用 Android Studio 管理 Android SDK 就好)

    #### 用 cmd 管理 Android SDK

    ##### 關於 sdkmanager
    [sdkmanager](https://developer.android.com/studio/command-line/sdkmanager)

    ##### sdkmanager 下載頁面與安裝和設定 cmd 環境變數

    ![](/assets/images/2022-12-10-21-27-03.png)
    ![](/assets/images/2022-12-10-21-27-23.png)

    根據 [sdkmanager](https://developer.android.com/studio/command-line/sdkmanager) 裡的安裝步驟。
    > 下載完解壓縮後，要創建一個 `latest` 資料夾，將檔案移入。

    ![](/assets/images/2022-12-10-21-35-01.png)
    > 因為以前有安裝過 Android Studio 所以有安裝 Android SDK 了，我是放在這: `C:\Users\使用者名稱\AppData\Local\Android\Sdk\cmdline-tools\latest`
   
    #### 將 sdkmanager cmdline-tools 加入使用者環境變數

    ![](/assets/images/2022-12-10-22-09-18.png)


### 檢查環境是否可跑 flutter

`flutter doctor` 可以幫你檢查你的環境有那些沒安裝，沒安裝的照指示安裝就好了。

![](/assets/images/2022-12-10-21-42-41.png)

> 譬如這個就是 Visual Studio 沒有安裝 C++ 的東西。(如果沒要用 Visual Studio 開發 Flutter 可以忽略xD)

### 新增一個 Flutter App

[Test drive - Flutter 官網](https://docs.flutter.dev/get-started/test-drive)

> 注意檔案的所有路徑都不可以有中文，不然 `flutter run` 會失敗...

### 使用 ADV Manager 新增 Android 模擬器

直接用 Android Studio 新增最方便xD

![](/assets/images/2022-12-10-22-25-34.png)
> 選擇裝置

![](/assets/images/2022-12-10-22-26-38.png)
> 選擇 API 版本

![](/assets/images/2022-12-10-22-27-28.png)
> 設定些東西(這邊使用預設)，按 Finish

![](/assets/images/2022-12-10-22-28-32.png)
> 剛剛新增的 AVD

![](/assets/images/2022-12-10-22-31-19.png)
> 到 VS Code 就可以看到了!

![](/assets/images/2022-12-10-22-33-11.png)

![](/assets/images/2022-12-10-22-35-21.png)
> 打開 `main.dart` 檔案後按 `F5` 或點菜單 `Run > Start Debugging`，App 就可以成功跑在模擬器上了!

![](/assets/images/2022-12-10-22-38-39.png)
> Widgets Inspector 超酷的...[inspector - Flutter 官網](https://docs.flutter.dev/development/tools/devtools/inspector)


### Flutter Devtools in VS Code
[devtools(vscode) - Flutter 官網](https://docs.flutter.dev/development/tools/devtools/vscode)

![](/assets/images/2022-12-10-22-46-02.png)
> 可在 VS Code 裡打開 devtool

![](/assets/images/2022-12-10-22-42-55.png)
> 在瀏覽器中打開 devtool


## 小結

Flutter 很好用的感覺!! 之後就是來寫寫看應用程式了!!