---
id: o7mp336qqwyjf1d0jefmg53
title: 0830 在 Windows 使用 MacOS 虛擬機 (使用 WSL2 + OSX-KVM) 
desc: ''
updated: 1673695827983
created: 1662562033027
tags:
  - OS
---

## 1. 簡述過程

想在 Windows 上使用 safari 來檢查網頁畫面是否跑版。

所以要讓開發中的 Angular 網站在開發同時同步顯示在 MacOS 虛擬機中的 safari、IOS 虛擬機中的 safari 中。

使用 WSL2 -> 安裝 Ubuntu -> 在 Ubuntu 裡面安裝 QEMU -> 透過 OSX-KVM 安裝 MacOS -> 透過 OSX-KVM 用 QEMU 開啟 MacOS 的虛擬機 -> 在 MacOS 虛擬機中安裝 Xcode 並使用 IOS 模擬器。

最後設定一些東西，讓此 WSL2 內的虛擬機可以連上電腦本機的 localhost (還有設定螢幕大小和硬體配置)。

## 2. 軟硬體需求

### 2.1. WSL2

Windows 10 2004 版和更新版本， (組建 19041 和更新版本) 或 Windows 11。

### 2.2. Ubuntu

OSX-KVM 需求: Ubuntu 20.04 LTS 64-bit 或更新版本.

> A modern Linux distribution. E.g. Ubuntu 20.04 LTS 64-bit or later.

### 2.3. OSX-KVM

- QEMU >= 4.2.0

- A CPU with Intel VT-x / AMD SVM support is required (grep -e vmx -e svm /proc/cpuinfo)

- A CPU with SSE4.1 support is required for >= macOS Sierra

- A CPU with AVX2 support is required for >= macOS Mojave

Note: Older AMD CPU(s) are known to be problematic. AMD FX-8350 works but Phenom II X3 720 does not. Ryzen processors work just fine.

![](/assets/images/2022-10-20-16-43-25.png)

> 根據此網站以 i7-12700 為例以上硬體需求都有支援: https://openbenchmarking.org/s/Intel+Core+i7-12700

以上需求來自: [OSX-KVM#requirements](https://github.com/kholia/OSX-KVM#requirements)

## 3. Ubuntu

![](/assets/images/2022-09-23-23-42-01.png)

> 到 Microsoft Store 下載 Ubuntu 這邊是安裝 20.04.1 LTS，現在有更新的版號可以下載。

### 3.1. 設定 Windows 功能

(1) `win + R` 在執行視窗輸入 `optionalfeatures` 
![](/assets/images/2022-10-25-09-59-45.png)

(2) 「開啟或關閉 Windows 功能」

![](/assets/images/2022-10-25-10-01-35.png)

確定這幾個功能都有被打勾，並在套用後重開機。

- 虛擬機器平台 (Virtual Machine Platform)
- Windows Hypervisor 平台 (Windows Hypervisor Platform)
- Windows 子系統 Linux 版 (Windows Subsystem for Linux)


## 4. 安裝要用到的套件

主要會使用 WSL2 提供的打開 Linux GUI 的功能來打開 QEMU。  
[在 Windows 子系統 Linux 版上執行 Linux GUI 應用程式](https://learn.microsoft.com/zh-tw/windows/wsl/tutorials/gui-apps)

### 4.1. 所以要先安裝 WSL2:

#### 4.1.1. 之前沒有安裝過 WSL 的話

(1) 以系統管理員身分執行 cmd 或 powershell:

```cmd
wsl --install
```

(2) 電腦要重開機。

#### 4.1.2. 如果現在已經有安裝 WSL 了

(1) 以系統管理員身分執行 cmd 或 powershell:

```cmd
wsl --update
```

(2) 用這指令重開 WSL:

```cmd
wsl --shutdown
```

### 4.2. 用 Ubuntu 打開 Linux GUI:

#### 4.2.1. 打開步驟 3. 下載好的 Ubuntu

![](/assets/images/2022-10-20-15-16-01.png)

![](/assets/images/2022-10-20-15-18-37.png)

> 按下去後會開啟終端機，會自動開始下載 ubuntu 的東西。

注意:

![](/assets/images/2022-10-25-09-51-36.png)
> 如果遇到 `WslRegisterDistribution failed with error: 0x80370102
Please enable the Virtual Machine Platform Windows feature and ensure virtualization is enabled in the BIOS.`  請確認 3.1.(2) 的功能有開啟並重新開機並到 BIOS 做設定，可參考華碩 intel 主機板設定 Virtualization Technology 為 Enabled，如果是 AMD 主機板的話是要檢查 SVM Mode 有沒有 Enabled。

![](/assets/images/2022-10-25-09-54-57.png)
> [圖源華碩官網 - [主機板] Intel 主機板如何通過BIOS開啟虛擬化功能(Virtualization Technology)](https://www.asus.com/tw/support/FAQ/1043786/)


![](/assets/images/2022-10-25-10-39-25.png)
> 可以用 cmd `wsl --list --verbose` 看到發行版的版本是 WLS2。
 
(1) 更新 ubuntu 套件

```bash
sudo apt update
```

(2) 試灌一個套件

```bash
sudo apt install nautilus -y
```

灌好以後輸入:

```bash
nautilus
```

![](/assets/images/2022-10-20-15-26-25.png)

> 彈出視窗就代表在 windows 上成功運行 nautilus 這個 Linux GUI 了。

### 4.3. 在 Ubuntu 安裝 QEMU 前

#### 4.3.1. 設定套嵌化

WSL2 沒有預設套嵌化，要自己設定 `nestedVirtualization=true`。

設定方式:

(1) 在 Windows 中，在用戶文件夾下新建一個 `.wslconfig` 檔案 `C:\Users\%User%\.wslconfig`。（User 是你的 Windows 系统用户名）

檔案內:

```xml
[wsl2]
networkingMode=bridged
vmSwitch=ex
memory=32G
processors=8
swap=32G
localhostForwarding=true
nestedVirtualization=true
pageReporting=true
kernelCommandLine=intel_iommu=on iommu=pt kvm.ignore_msrs=1 kvm-intel.nested=1 kvm-intel.ept=1 kvm-intel.emulate_invalid_guest_state=0 kvm-intel.enable_shadow_vmcs=1 kvm-intel.enable_apicv=1
```

- 設定內容是參照這網站的 [允许 WSL 嵌套虚拟化](https://blog.hal.wang/7afa8fc1/#%E5%85%81%E8%AE%B8-WSL-%E5%B5%8C%E5%A5%97%E8%99%9A%E6%8B%9F%E5%8C%96)

- `.wslconfig` 微軟官網說明:

https://learn.microsoft.com/zh-tw/windows/wsl/wsl-config#wslconfig

> 用來在以 WSL 2 版本執行的所有已安裝 Linux 發行版本之間全域設定設定。WSL 會偵測這些檔案是否存在、讀取內容，並在每次啟動 WSL 時自動套用組態設定。 如果檔案遺失或格式不正確， (不正確的標記格式設定) ，WSL 會繼續正常啟動，而不會套用組態設定。

- `.wslconfig` 的配置及參數，微軟官網說明:

https://learn.microsoft.com/zh-cn/windows/wsl/wsl-config#configuration-setting-for-wslconfig

- kernelCommandLine 是拿來設定設定 QEMU 的東西，相關參考 [怎样设置 QEMU 支持 enable_apicv 和 enable_shadow_vmcs?](https://www.zhihu.com/question/338768967) 

![](/assets/images/2022-10-20-16-06-02.png)
> 根據下面這個網站我的 CPU 是 i7-12700 有支持 APICv 和 shadow_vmcs
> https://openbenchmarking.org/s/Intel+Core+i7-12700

(2) 設定並儲存完後，用這指令重開 WSL:

```cmd
wsl --shutdown
```

### 4.4. 在 Ubuntu 安裝 QEMU 並安裝 MacOS

#### 4.4.1. 安裝 OSX-KVM 與準備安裝 MacOS

使用 OSX-KVM 安装 MacOS VM。

- 參考網址:
  [开始安装 MacOS](https://blog.hal.wang/7afa8fc1/#%E5%BC%80%E5%A7%8B%E5%AE%89%E8%A3%85-MacOS)

- [kholia/OSX-KVM](https://github.com/kholia/OSX-KVM)

(1) 安裝 QEMU 和相關套件

```bash
sudo apt-get install qemu uml-utilities virt-manager git wget libguestfs-tools p7zip-full make -y
```

(2) 設定參數

根據 [這篇](https://www.ptt.cc/bbs/Linux/M.1622355127.A.128.html) Windows 10 會有因 KVM 的 msrs 糾錯導致 BSOD 的問題，因此也將忽略 msrs 的選項也加入

```bash
echo 1 > /sys/module/kvm/parameters/ignore_msrs
```

(3) 設定權限

```bash
sudo usermod -aG kvm $(whoami)
sudo usermod -aG libvirt $(whoami)
sudo usermod -aG input $(whoami)
```

![](/assets/images/2022-10-20-17-37-50.png)

> 註: 用 `vim /etc/group` 可以看到權限已經改變了

相關參考:

- [Linux 修改使用者帳號設定 – usermod](https://www.ltsplus.com/linux/usermod-modify-linux-account)

  > 註: 當使用 “-G” 參數時, usermod 會將帳號從原來加入了的群組退出, 所以在 “-G” 參數前加入 “-a” 參數, 會保留原來的群組設定。

- [Linux 组管理、用户管理、查看用户信息、usermod、which、切换用户、修改文件具体权限](https://www.cnblogs.com/wenshinlee/p/11163346.html)

(4) clone OSX-KVM repo

```bash
git clone https://github.com/kholia/OSX-KVM.git

cd OSX-KVM
```

(5) 取得 macOS 安裝檔

```bash
./fetch-macOS-v2.py
```

執行後畫面如下，可以選取你要的 macOS 版本

```bash
$ ./fetch-macOS-v2.py
1. High Sierra (10.13)
2. Mojave (10.14)
3. Catalina (10.15)
4. Big Sur (11.6) - RECOMMENDED
5. Monterey (latest)

Choose a product to download (1-5): 4
```

> 我是選 5 Monterey

(6) 將下載完的檔案轉檔

```bash
dmg2img BaseSystem.dmg BaseSystem.img
```

(7) 新增一個虛擬 HDD image 將拿來灌 macOS

```bash
qemu-img create -f qcow2 mac_hdd_ng.img 256G
```

> mac_hdd_ng.img 是文件名，可以任意修改

#### 4.4.2. 安裝 MacOS

(1) 修改腳本

先修改 `OpenCore-Boot.sh` 文件，設定 MacOS 的虛擬硬體規格。

```bash
vim ./OpenCore-Boot.sh
```

- `ALLOCATED_RAM` 記憶體，建議至少 8GB
- `CPU_THREADS` CPU 執行緒
- `CPU_CORES` CUP 核心
- `-drive id=MacHDD,if=none,file="$REPO_PATH/mac.img",format=qcow2` 其中的 `$REPO_PATH/mac_hdd_ng.img` 是上一步驟建立的虛擬 HDD。

![](/assets/images/2022-10-20-18-04-53.png)

> 這是我目前的設置

(2) 執行腳本

```bash
./OpenCore-Boot.sh
```

會以設定的規格打開虛擬機。

(3) macOS 安裝畫面

接下來跟安裝 macOS 一樣 ，可以參考這幾篇:

- 這篇的 STEP 14 ~ STEP 28
[10 分鐘學會如何在 VirtualBox 安裝 macOS Monterey！](https://adersaytech.com/practical-software/install-macos-on-virtualbox.html)

- [QEMU-KVM安裝macOS Montery虛擬機 (Manjaro/Arch Linux) by Ivon Huang](https://youtu.be/dOvt5wKh2S4?t=42)

### 4.5. 打開 macOS，並安裝 xcode

```bash
cd OSX-KVM
./OpenCore-Boot.sh
```

選擇你的系統碟
![](/assets/images/2022-10-20-18-31-39.png)

接下來會跑一下一堆白字然後出現 apple icon loading 畫面

最後會看到登入頁面，輸入密碼就會進到系統裡了。

### 4.6. 在 macOS 裡下載 xcode

用 macOS 裡的 safari 到這個網頁 https://developer.apple.com/download/all/

登入開發者帳號後就可以下載所需的版本。

- 參考:
  [如何手動快速下載不同版本的 Xcode - by POY CHANG](https://blog.poychang.net/manually-download-multiple-versions-of-xcode/)

注意: xcode 有對應 mac os 的版本:
https://developer.apple.com/support/xcode/

![](https://i.imgur.com/hilbXM6.png)

自己是用 mac os 12.5.1 配 xcode 13.4.1
這邊備份了 xcode 13.4.1 的 .xip 檔在公司雲端裡，可以在 MacOS 裡直接下載這個檔案，就不用登入後才能下載了:
[公司的人才能檢視此檔案](https://miniasp-my.sharepoint.com/:u:/p/naomi/ERBrYC3PfxJMm6DmnBqSUmoB6OCNSqQUzQTjnzH3Wt2XUw?e=UOEmMf)

![](/assets/images/2022-10-20-20-22-36.png)

> 最後就可以選擇自己需要的模擬器來用了。

![](/assets/images/wsl.gif)
> 每次都這樣打開就可以使用了。

> 我沒有用到 `virt-manager`，如果最後想用 `virt-manager` 可參考 [OSX-KVM#installation](https://github.com/kholia/OSX-KVM#installation) 或 [使用 virt-manager 管理](https://blog.hal.wang/7afa8fc1/#%E4%BD%BF%E7%94%A8-virt-manager-%E7%AE%A1%E7%90%86) 或 [QEMU/KVM for absolute beginners by Veronica Explains](https://youtu.be/BgZHbCDFODk)

## 5. 相關設定

### 5.1. Angular 在 ng serve 設定 `--host 0.0.0.0`

在 `package.json` 設定 `--host 0.0.0.0` 就可以邊開發邊自動刷新模擬器上的畫面。
![](/assets/images/2022-10-20-21-02-37.png)

0.0.0.0 代表[預定閘門(Default Router)](https://zh.wikipedia.org/zh-tw/%E9%BB%98%E8%AE%A4%E8%B7%AF%E7%94%B1) (註: [TCP/IP 協定與 Internet 網路：第五章 網際層協定 by 粘添壽](http://www.tsnien.idv.tw/Internet_WebBook/chap5/5-2%20IP%20%E9%80%9A%E8%A8%8A%E5%8D%94%E5%AE%9A.html))

Default Router 是對 IP 數據包中的目的地址找不到存在的其他路由時，路由器所選擇的路由。


`--host 0.0.0.0` 不知道什麼原理，讓這樣可以以本機 IP host 在網路裡@@
[How to allow access outside localhost](https://stackoverflow.com/questions/43492354/how-to-allow-access-outside-localhost)

本機 IP 要看 wifi 網卡的 IP，如果是用乙太網路的話就看該網卡的 IP (譬如: 網卡 IP 為 `192.168.1.2`，就在網址列輸入 `192.168.1.2:4200` 就可以連線到該網站了)。

如果本機 IP 是固定的會方便很多不用每次都要本機 cmd `ipconfig /all` 查看目前 ip。

另外如果有用 hyper-v 新增內部網路的虛擬交換器也可以用這個虛擬交換器的 ip 去連線(這個 IP 不是固定的，每次電腦重開機都會更新)。
![](/assets/images/2022-10-25-18-21-37.png)


![](/assets/images/2022-10-20-21-32-08.png)

> 以此圖為例，這是用 hyper-v 建立的虛擬交換器，每次重啟電腦都會變，所以要在輸入網址時要先在本機 cmd `ipconfig /all` 查看目前 IP。 在 VM 裡的要測試的 angular 網站網址打上 `192.168.64.1:4200` 就可以連線了。

### 5.1.1 沒辦法在 qemu 成功瀏覽

在本機 windows `ng serve --host 0.0.0.0` 後打開 qemu。

如果在 qemu 裡 `ping <你的網卡ip>` 可以成功，

但在 qemu `http://<你的網卡ip>:4200` 沒辦法成功瀏覽的話，

要到本機 windows 設定開啟 tcp 4200 port 的防火牆輸入/輸出規則。

### 5.2. 畫面大小

選 About This Mac 後選擇 Display
![](/assets/images/2022-10-20-22-33-47.png)

選擇 Displays Preferences
![](/assets/images/2022-10-20-22-34-49.png)

勾選 Show all resources 後就可以選擇自己想要的尺寸了
![](/assets/images/2022-10-20-22-36-13.png)

我是選 1600 x 900。

因為我的螢幕是 27 吋 FHD，此視窗預設 1920 x 1080 會超出我的螢幕範圍(螢幕對這視窗來說太小了)，1600 x 900 大小就很合適。

另外 QEMU 可以從 View > 打勾 Zoom to fit，這樣就可以調整自己想要的視窗大小，內容會等比縮放，所以你的螢幕解析度比較高的話，可以設定較大尺寸，再用這個來調整視窗大小，就不用為了讓視窗變小而讓解析度變低(設定小尺寸)。另外，解析度跟 RAM 有關，要確保自己的 RAM 有足夠空間再開高，不然會容易閃退。
![](/assets/images/2022-10-20-22-40-49.png)

## 6. 關於 Hyper-V 和 WSL

Hyper-V 是 Microsoft 的本機虛擬機器管理程式，它可以在執行 x86-64 位元的 Windows 上建立虛擬機器。(註: [Hyper-V - wiki](https://zh.wikipedia.org/zh-tw/Hyper-V))

Hyper-V 虛擬機器不支援 Hyper-V 以外的虛擬化應用程式。所以在安裝 ubuntu 的 Hyper-V 安裝 QEMU 會閃退。
(註: [第三方虛擬化 App - microsoft](https://learn.microsoft.com/zh-tw/virtualization/hyper-v-on-windows/user-guide/nested-virtualization#3rd-party-virtualization-apps))

WSL 是一個能夠執行原生 Linux 二進位可執行檔（ELF 格式）的相容層。可能就是因為如此才能不用透過 Hyper-V 就能調用硬體資源讓 QEMU 跑起來。 (註: [適用於 Linux 的 Windows 子系統 - wiki](https://zh.wikipedia.org/wiki/%E9%80%82%E7%94%A8%E4%BA%8ELinux%E7%9A%84Windows%E5%AD%90%E7%B3%BB%E7%BB%9F))

另外有聽到 jserv 說 WSL 還沒有完成。

利用 VM 來收費的服務如 [Parallels](https://www.parallels.com/hk/pd/general/?gclid=Cj0KCQjwkt6aBhDKARIsAAyeLJ1gnRx2t_B5JSxFMTQ-TwghqAIBta3I7jjfDYRc0fuu4EMzX3FKOeMaAtGFEALw_wcB) 就是利用 VM 讓 Mac 上可以同時執行 Windows 和 macOS，
付費方式有三種($99.99、$119.99/yr、$149.99/yr)。

或是雲端的 VM 譬如 [Amazon EC2 Mac 執行個體](https://aws.amazon.com/tw/ec2/instance-types/mac/) 也是要收費。

OSX-KVM 作者對合法性有寫了一段說明 [Is This Legal?](https://github.com/kholia/OSX-KVM#is-this-legal)。OSX-KVM 是利用 OpenCore 下載 macOS 的 [Legality of Hackintoshing](https://dortania.github.io/OpenCore-Install-Guide/why-oc.html#common-myths)。

## 7. 這篇筆記的起源與感想

為了測試 Apple 裝置上的 safari 和 IOS 上的 safari 但手邊沒有相關裝置，

用了保哥提過的 [BrowserStack](https://www.browserstack.com/?utm_source=google&utm_medium=cpc&utm_campaign=Search-Brand-Tier2-APAC&utm_adgroup=BrowserStack-Alpha&utm_keyword=browserstack&utm_matchtype=e&gclid=Cj0KCQjw48OaBhDWARIsAMd966DtkC0HouaetqSwwkXJ_BVh1-_-tZO4AZUvrqvR8_jZpaEBuK3yhAwaAm-IEALw_wcB) 但因為 API 有網域限制所以沒辦法使用這個做測試。

所以一開始使用過 VirtualBox、後來有時間才換成使用 OSX-KVM + WSL2。

使用感想是模擬器都會有畫面延遲的感覺，但 OSX-KVM + WSL2 的模擬器畫面延遲相較 virtualBox 還小一點。

另外因為有閃退問題所以硬體從原本 RAM 32GB 擴充到 64GB，這樣邊用 vscode 和這個開發的時候大概會占掉 40GB 的記憶體，感覺是剛好夠用的。

另外 CPU 會在 60~90% 跑來跑去，也是剛好蠻夠用的。

後來買了顯示卡(本來是用內顯)，感覺動畫有比較平順，在模擬器內滑動頁面或切換頁面的時候 GPU 會在 15%~20% 跑，沒顯卡前用內顯只會用 0%~4% 在跑，所以顯示卡會有一點點幫助。

但整體來說，如果要爽用的話 CPU 好一點會更順 xD

另外，下面這個筆記記錄了使用 IIS、VirtualBox、和 android 的 remote debbuging 來測網站。

> [(這篇筆記不公開) IIS、VirtualBox、和 android 的 remote debbuging](https://hackmd.io/vy1TyPnNRESPMTwMqNuPlA)

---

這整篇筆記主要是參考這篇文章，

要是沒有看到這篇文章我也沒機會用用看 OSX-KVM + WSL2，

因為找不到作者的名字所以就只附上網址，感謝這個作者、OSX-KVM 和免費好用的 WSL 還有我的新電腦和網路資源M( _ _)M。

- 主要參考自: [在 Windows 上流畅使用 MacOS 虚拟机](https://blog.hal.wang/7afa8fc1/)
