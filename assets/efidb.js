/* 冷月技术网 · EFI 平台数据库
 * 数据依据：OpenCore 官方配置文档、Dortania OpenCore Install Guide、Acidanthera 各驱动 README、本站实机记录。
 * 边界机型（魔改 BIOS、非标芯片组、移动端特例）一律以实机为准，本文件不给绝对结论。
 * 版本 2026.11.23
 */
window.EFIDB = {
  v: '2026.11.23',

  /* ---------- Intel 代际 ---------- */
  /* igpu: true=核显可驱动 / false=无解
     ssdtD=台式 ACPI 清单, ssdtL=笔记本 ACPI 清单
     q=必须开的 Quirks, qo=按情况
     boot=建议 boot-args, note=这一代最容易咬人的地方 */
  intel: {
    6: {
      name: 'Skylake', chipD: '100 / 200 系（Z170、B150、H110）', chipL: '100 系移动端',
      smbiosD: 'iMac17,1', smbiosL: 'MacBookPro13,1',
      igpuD: 'HD 530', igpuL: 'HD 530 / Iris 540', igpuOK: true,
      ssdtD: ['SSDT-PLUG', 'SSDT-EC-USBX', 'SSDT-PMC(可选)'],
      ssdtL: ['SSDT-PLUG', 'SSDT-EC-USBX-LAPTOP', 'SSDT-PNLF', 'SSDT-ALS0', 'SSDT-GPRW', 'SSDT-XOSI'],
      q: ['AppleXcpmCfgLock', 'DisableIoMapper'],
      qo: ['AvoidRuntimeDefrag（默认开，别关）'],
      boot: '-v keepsyms=1 alcid=1',
      note: '6 代是最省事的一档，核显有完整驱动。台式注意 Skylake 的 SSDT-PLUG 用 _PR.CPU0，部分主板要 SSDT-PLUG-ALT。',
      macMin: '10.12'
    },
    7: {
      name: 'Kaby Lake', chipD: '200 系（Z270、B250、H270）', chipL: '200 系移动端',
      smbiosD: 'iMac18,1', smbiosL: 'MacBookPro14,1',
      igpuD: 'HD 630', igpuL: 'HD 620', igpuOK: true,
      ssdtD: ['SSDT-PLUG', 'SSDT-EC-USBX'],
      ssdtL: ['SSDT-PLUG', 'SSDT-EC-USBX-LAPTOP', 'SSDT-PNLF', 'SSDT-ALS0', 'SSDT-GPRW', 'SSDT-XOSI'],
      q: ['AppleXcpmCfgLock', 'DisableIoMapper'],
      qo: [],
      boot: '-v keepsyms=1 alcid=11',
      note: '7 代核显只要 ig-platform-id 填对就能点亮（HD620 用 0x59160000 一类），笔记本还要 SSDT-PNLF 才调得了亮度。',
      macMin: '10.12'
    },
    8: {
      name: 'Coffee Lake', chipD: '300 系（Z370、B360、H370）', chipL: '300 系移动端',
      smbiosD: 'iMac19,1', smbiosL: 'MacBookPro15,2',
      igpuD: 'UHD 630', igpuL: 'UHD 620', igpuOK: true,
      ssdtD: ['SSDT-PLUG', 'SSDT-EC-USBX', 'SSDT-AWAC(部分主板)', 'SSDT-RHUB(可选)'],
      ssdtL: ['SSDT-PLUG', 'SSDT-EC-USBX-LAPTOP', 'SSDT-PNLF', 'SSDT-ALS0', 'SSDT-GPRW', 'SSDT-XOSI'],
      q: ['AppleXcpmCfgLock', 'DisableIoMapper'],
      qo: ['DevirtualiseMmio（雷电机型）'],
      boot: '-v keepsyms=1 alcid=11',
      note: '300 系开始部分主板 RTC 是 AWAC 不是传统 RTC，要 SSDT-AWAC，不然装完重启就会卡。',
      macMin: '10.13'
    },
    9: {
      name: 'Coffee Lake Refresh', chipD: '300 系（Z390、B365）', chipL: '300 系移动端',
      smbiosD: 'iMac19,1', smbiosL: 'MacBookPro15,3',
      igpuD: 'UHD 630', igpuL: 'UHD 630', igpuOK: true,
      ssdtD: ['SSDT-PLUG', 'SSDT-EC-USBX', 'SSDT-AWAC(部分主板)'],
      ssdtL: ['SSDT-PLUG', 'SSDT-EC-USBX-LAPTOP', 'SSDT-PNLF', 'SSDT-ALS0', 'SSDT-GPRW', 'SSDT-XOSI'],
      q: ['AppleXcpmCfgLock', 'DisableIoMapper'],
      qo: [],
      boot: '-v keepsyms=1 alcid=11',
      note: '9 代跟 8 代同一套骨架，SMBIOS 也共用 iMac19,1。9900K 这类要确认 BIOS 关了 CFG Lock。',
      macMin: '10.14'
    },
    10: {
      name: 'Comet Lake', chipD: '400 系（Z490、B460、H410）', chipL: '400 系移动端 / Ice Lake',
      smbiosD: 'iMac20,1', smbiosL: 'MacBookPro16,2',
      igpuD: 'UHD 630（需 device-id 仿冒 0x9BC5）', igpuL: 'UHD 630 / Iris Plus', igpuOK: true,
      ssdtD: ['SSDT-PLUG', 'SSDT-EC-USBX', 'SSDT-AWAC', 'SSDT-RHUB'],
      ssdtL: ['SSDT-PLUG', 'SSDT-EC-USBX-LAPTOP', 'SSDT-PNLF', 'SSDT-ALS0', 'SSDT-GPRW', 'SSDT-XOSI'],
      q: ['AppleXcpmCfgLock', 'DisableIoMapper', 'ProvideCurrentCpuInfo'],
      qo: ['DevirtualiseMmio（雷电 / Z490 部分板）'],
      boot: '-v keepsyms=1 alcid=11',
      note: '10 代台式核显要仿冒成 0x9BC5 才认，DeviceProperties 里写 device-id + ig-platform-id，本站 Device Properties 工具能直接出这段。10 代是最后一档核显有解的 Intel。',
      macMin: '10.15'
    },
    11: {
      name: 'Rocket Lake', chipD: '500 系（Z590、B560、H510）', chipL: 'Tiger Lake（Iris Xe）',
      smbiosD: 'MacPro7,1', smbiosL: 'MacBookPro16,2',
      igpuD: 'UHD 750 —— 无驱动', igpuL: 'Iris Xe —— 无驱动', igpuOK: false,
      ssdtD: ['SSDT-PLUG', 'SSDT-EC-USBX', 'SSDT-AWAC', 'SSDT-RHUB'],
      ssdtL: ['SSDT-PLUG', 'SSDT-EC-USBX-LAPTOP', 'SSDT-PNLF', 'SSDT-GPRW', 'SSDT-XOSI'],
      q: ['AppleXcpmCfgLock', 'DisableIoMapper', 'ProvideCurrentCpuInfo'],
      qo: ['ResizeAppleGpuBars=-1（10 代起建议）'],
      boot: 'alcid=11 -igfxvesa（无加速直出时）',
      note: '从这一代起核显彻底没驱动。台式想有图形只能插 AMD 独显并设 MacPro7,1；笔记本只能走无加速直出（亮屏能用，没图形性能）。',
      macMin: '11'
    },
    12: {
      name: 'Alder Lake', chipD: '600 系（Z690、B660、H610）', chipL: 'Alder Lake-P/H',
      smbiosD: 'MacPro7,1', smbiosL: 'MacBookPro16,2',
      igpuD: 'UHD 770 —— 无驱动', igpuL: 'Iris Xe —— 无驱动', igpuOK: false,
      ssdtD: ['SSDT-PLUG', 'SSDT-EC-USBX', 'SSDT-AWAC', 'SSDT-RHUB'],
      ssdtL: ['SSDT-PLUG', 'SSDT-EC-USBX-LAPTOP', 'SSDT-PNLF', 'SSDT-GPRW', 'SSDT-XOSI'],
      q: ['AppleXcpmCfgLock', 'DisableIoMapper', 'ProvideCurrentCpuInfo'],
      qo: ['ResizeAppleGpuBars=-1'],
      boot: 'alcid=11 -igfxvesa',
      note: '12 代开始大小核，必须开 CpuTopologyRebuild 才认全核心，ProvideCurrentCpuInfo 也必须 true，否则频率和拓扑全乱。',
      macMin: '12'
    },
    13: {
      name: 'Raptor Lake', chipD: '700 系（Z790、B760、H610 改款）', chipL: 'Raptor Lake-P/H',
      smbiosD: 'MacPro7,1', smbiosL: 'MacBookPro16,2',
      igpuD: 'UHD 770 —— 无驱动', igpuL: 'Iris Xe —— 无驱动', igpuOK: false,
      ssdtD: ['SSDT-PLUG', 'SSDT-EC-USBX', 'SSDT-AWAC', 'SSDT-RHUB'],
      ssdtL: ['SSDT-PLUG', 'SSDT-EC-USBX-LAPTOP', 'SSDT-PNLF', 'SSDT-GPRW', 'SSDT-XOSI'],
      q: ['AppleXcpmCfgLock', 'DisableIoMapper', 'ProvideCurrentCpuInfo'],
      qo: ['ResizeAppleGpuBars=-1'],
      boot: 'alcid=11 -igfxvesa',
      note: '13 代是本站实机跑通过的一档（i5-13500H）。笔记本那台走的是 WhateverXe 无加速直出 + I2C 触控板 + AX211 无线。',
      macMin: '12'
    },
    14: {
      name: 'Raptor Lake Refresh', chipD: '700 系（Z790 改款、B760）', chipL: 'Raptor Lake Refresh-H',
      smbiosD: 'MacPro7,1', smbiosL: 'MacBookPro16,2',
      igpuD: 'UHD 770 —— 无驱动', igpuL: 'Iris Xe —— 无驱动', igpuOK: false,
      ssdtD: ['SSDT-PLUG', 'SSDT-EC-USBX', 'SSDT-AWAC', 'SSDT-RHUB'],
      ssdtL: ['SSDT-PLUG', 'SSDT-EC-USBX-LAPTOP', 'SSDT-PNLF', 'SSDT-GPRW', 'SSDT-XOSI'],
      q: ['AppleXcpmCfgLock', 'DisableIoMapper', 'ProvideCurrentCpuInfo'],
      qo: ['ResizeAppleGpuBars=-1'],
      boot: 'alcid=11 -igfxvesa',
      note: '14 代跟 13 代同一套骨架，PlatformInfo 与大小核处理不用改。没有实机记录，按参数化处理。',
      macMin: '12'
    },
    15: {
      name: 'Arrow Lake', chipD: '800 系（Z890、B860）', chipL: 'Arrow Lake-H / Lunar Lake',
      smbiosD: '暂无可靠方案', smbiosL: '暂无可靠方案',
      igpuD: 'Arc 核显 —— 无驱动', igpuL: 'Arc 核显 —— 无驱动', igpuOK: false,
      ssdtD: [], ssdtL: [],
      q: ['ProvideCurrentCpuInfo'],
      qo: [],
      boot: '',
      note: '15 代换了架构（Lion Cove + Skymont），macOS 没有对应平台，社区验证极少。能装也基本是纯独显 + 一堆待调项，不建议当客户方案接。',
      macMin: '—'
    }
  },

  /* ---------- AMD ---------- */
  amd: {
    ryzen1: {
      name: 'Ryzen 1000 / 2000（Zen、Zen+）', socket: 'AM4', chip: '300/400 系（X370、B450）',
      smbios: 'MacPro7,1', igpuOK: false,
      ssdt: ['SSDT-PLUG', 'SSDT-EC-USBX', 'SSDT-AWAC', 'SSDT-RHUB'],
      q: ['AppleXcpmCfgLock', 'DisableIoMapper', 'ProvideCurrentCpuInfo'],
      boot: 'agdpmod=pikera alcid=11',
      note: 'AMD 平台必须加内核补丁（Algrye 的 AMD Kernel Patches，逐内核版本不同）。核显不存在，独显必须。',
      macMin: '10.13'
    },
    ryzen3: {
      name: 'Ryzen 3000 / 5000（Zen2、Zen3）', socket: 'AM4', chip: '400/500 系（B450、B550、X570）',
      smbios: 'MacPro7,1', igpuOK: false,
      ssdt: ['SSDT-PLUG', 'SSDT-EC-USBX', 'SSDT-AWAC', 'SSDT-RHUB'],
      q: ['AppleXcpmCfgLock', 'DisableIoMapper', 'ProvideCurrentCpuInfo'],
      boot: 'agdpmod=pikera alcid=11',
      note: '5000 系是目前 AMD 里最成熟的一档（5600X / 5800X3D 这类）。仍需内核补丁 + 独显。',
      macMin: '10.15'
    },
    ryzenApu: {
      name: 'Ryzen APU（4000G / 5000G / 8000G 核显）', socket: 'AM4 / AM5', chip: '400/500/600 系',
      smbios: 'MacPro7,1', igpuOK: 'partial',
      ssdt: ['SSDT-PLUG', 'SSDT-EC-USBX', 'SSDT-AWAC', 'SSDT-RHUB'],
      q: ['AppleXcpmCfgLock', 'DisableIoMapper', 'ProvideCurrentCpuInfo'],
      boot: 'agdpmod=pikera alcid=11',
      note: 'APU 的 Vega / RDNA2 核显靠 NootedRed 驱动，能出画面但加速有限、部分系统版本不稳；作为客户方案风险偏高。',
      macMin: '12'
    },
    am5: {
      name: 'Ryzen 7000 / 9000（Zen4、Zen5）', socket: 'AM5', chip: '600/800 系（B650、X670、B850）',
      smbios: 'MacPro7,1', igpuOK: false,
      ssdt: ['SSDT-PLUG', 'SSDT-EC-USBX', 'SSDT-AWAC', 'SSDT-RHUB'],
      q: ['AppleXcpmCfgLock', 'DisableIoMapper', 'ProvideCurrentCpuInfo'],
      boot: 'agdpmod=pikera alcid=11',
      note: 'AM5 平台社区验证比 AM4 少很多（Zen4 的内核补丁要跟内核版本对齐）。核显（RDNA2 2CU）无驱动。',
      macMin: '13'
    },
    threadripper: {
      name: 'Threadripper（TR4 / sTRX4 / sTR5）', socket: 'TR4 / sTRX4 / sTR5', chip: 'X399 / TRX40 / WRX90',
      smbios: 'MacPro7,1', igpuOK: false,
      ssdt: ['SSDT-PLUG', 'SSDT-EC-USBX', 'SSDT-RHUB'],
      q: ['AppleXcpmCfgLock', 'DisableIoMapper', 'ProvideCurrentCpuInfo'],
      boot: 'agdpmod=pikera',
      note: '线程撕裂者内核补丁与核心数处理更麻烦，NUMA 与内存通道识别常出问题，不建议接单。',
      macMin: '10.15'
    }
  },

  /* ---------- HEDT（Intel 服务器/发烧平台） ---------- */
  hedt: {
    x58: { name: 'X58 · LGA1366', smbios: 'MacPro5,1', note: '十多年老平台，只能靠 OCLP 跑较新系统，核显不存在。', macMin: '10.13(OCLP)' },
    x79: { name: 'X79 · LGA2011', smbios: 'MacPro6,1', note: '需要专门的电源管理与补丁，社区资料少，能装但坑多。', macMin: '10.13(OCLP)' },
    x99: { name: 'X99 · LGA2011-3', smbios: 'iMacPro1,1', note: 'X99 要 SSDT 修 CPU 电源管理，Haswell-E/Broadwell-E 均可，独显必须。', macMin: '10.14' },
    x299: { name: 'X299 · LGA2066', smbios: 'MacPro7,1', note: '本站交付过 i9-10980XE 一台，内存通道与多核调度识别正常。', macMin: '10.15' },
    x599: { name: 'X599 · LGA3647', smbios: 'MacPro7,1', note: '至强 W 平台，资料少，建议实机验证再谈。', macMin: '10.15' }
  },

  /* ---------- 核显 ig-platform-id（台式 / 笔记本各一个代表值，要给实际输出口调） ---------- */
  igp: {
    6:  { d: '0x19120000', l: '0x19160000' },
    7:  { d: '0x59120000', l: '0x591B0000' },
    8:  { d: '0x3E9B0007', l: '0x3E9B0009' },
    9:  { d: '0x3E9B0007', l: '0x3EA50009' },
    10: { d: '0x9BC50003', l: '0x9B3E0009', devid: '0x9BC5' }
  },

  /* ---------- 显卡 ---------- */
  gpu: {
    igpu: { name: '核显直出', note: '按代际判断，11 代往后无驱动' },
    rx5000: { name: 'AMD RX 5000 系（5500XT / 5700XT）', kext: 'WhateverGreen', boot: 'agdpmod=pikera', ok: true },
    rx6000: { name: 'AMD RX 6000 系（6600 / 6800 / 6900XT）', kext: 'WhateverGreen', boot: 'agdpmod=pikera', ok: true },
    rx7000: { name: 'AMD RX 7000 系（7600 / 7800XT / 7900）', kext: 'NootRX + WhateverGreen', boot: 'agdpmod=pikera', ok: 'partial', note: '需要 NootRX，且部分型号在新系统上仍不稳' },
    navi23: { name: 'AMD RX 6600 / 6650XT（Navi23）', kext: 'WhateverGreen', boot: 'agdpmod=pikera', ok: true, note: '性价比最高的免驱独显之一' },
    nvidia: { name: 'NVIDIA 独显', kext: '', ok: false, note: '10.13 之后无 Web Driver，必须屏蔽（-wegnoegpu 或 DeviceProperties 里 disable）' },
    none: { name: '不用独显 / 无独显', kext: '', ok: true }
  },

  /* ---------- 网卡 ---------- */
  wifi: {
    intel: { name: 'Intel 无线（AX200 / AX211 等）', kext: ['IntelBluetoothFirmware', 'BlueToolFixup', 'BTLEAdvFixup', 'ForbiddenItlwm'], note: '走 Itlwm 系驱动，隔空投送和接力没有；蓝牙要 USB 端口映射正确' },
    broadcom: { name: '博通（BCM94360 等）', kext: ['AirportBrcmFixup(可选)'], note: '多数免驱，隔空投送可用；新系统部分型号要 OCLP 补丁' },
    none: { name: '不带无线 / 用有线', kext: ['IntelMausiEthernet', 'RealtekRTL8111(按板)'], note: '' }
  },

  /* ---------- 声卡 ---------- */
  codecs: {
    'ALC256': { layouts: '11 / 13 / 21 / 66 / 69', note: '轻薄本最常见' },
    'ALC257': { layouts: '11 / 13 / 21 / 66', note: '与 256 基本共用布局' },
    'ALC295': { layouts: '11 / 21 / 28 / 99', note: '' },
    'ALC294': { layouts: '11 / 21 / 99', note: '' },
    'ALC298': { layouts: '11 / 13 / 28', note: '' },
    'ALC887': { layouts: '11 / 50 / 87 / 99', note: '台式常见' },
    'ALC892': { layouts: '11 / 92 / 99', note: '台式常见' },
    'ALC897': { layouts: '11 / 66 / 99', note: '台式常见' },
    'ALC1200': { layouts: '11 / 69 / 99', note: '400/500 系板载' },
    'ALC1220': { layouts: '11 / 34 / 99', note: '高端板载' },
    'ALC269': { layouts: '11 / 20 / 29', note: '老笔记本' }
  },

  /* ---------- 基础 kext 顺序（Intel 通用骨架） ---------- */
  kextBase: [
    { n: 'Lilu', why: '所有插件的底座，必须第一个' },
    { n: 'VirtualSMC', why: 'SMC 仿真，没有它进不了系统' },
    { n: 'SMCProcessor', why: 'CPU 温度与频率' },
    { n: 'SMCSuperIO', why: '风扇与电压（笔记本常要）' },
    { n: 'WhateverGreen', why: '显卡修补与 framebuffer' },
    { n: 'AppleALC', why: '声卡' },
    { n: 'NVMeFix', why: '非苹果 NVMe 电源管理' },
    { n: 'RestrictEvents', why: '压掉内存警告与 CPU 名称' },
    { n: 'USBToolBox + UTBMap', why: 'USB 端口映射，15 口限制的正解' }
  ],
  kextLaptop: [
    { n: 'SMCBatteryManager', why: '电池电量' },
    { n: 'ECEnabler', why: '读电池寄存器' },
    { n: 'BrightnessKeys', why: '亮度快捷键' },
    { n: 'VoodooPS2Controller', why: 'PS2 键盘/触控板' },
    { n: 'VoodooI2C + VoodooI2CHID', why: 'I2C 触控板' },
    { n: 'NoTouchID', why: '压掉指纹提示' }
  ],

  /* ---------- 社区参考仓库（外链，仅作参考，本站不托管） ---------- */
  repos: [
    { n: '5T33Z0/OC-Little-Translated', u: 'https://github.com/5T33Z0/OC-Little-Translated', d: 'ACPI 热补丁与 SSDT 大全，中文资料里最值得反复翻的一本' },
    { n: '5T33Z0/Gigabyte-Z490-Vision-G-Hackintosh-OpenCore', u: 'https://github.com/5T33Z0/Gigabyte-Z490-Vision-G-Hackintosh-OpenCore', d: 'Z490 + i9-10850K 台式完整 EFI，配置写得干净' },
    { n: 'scotthowson/ROG-STRIX-Z790-A-GAMING-WIFI-i9-13900k-RX-6800-XT', u: 'https://github.com/scotthowson/ROG-STRIX-Z790-A-GAMING-WIFI-Intel-i9-13900k-RX-6800-XT-OpenCore-1.0.2', d: '13 代台式 + RX 6800XT，Sonoma/Sequoia 方向' },
    { n: 'musatDev/MSI-MAG-B460-TORPEDO-EFI', u: 'https://github.com/musatDev/MSI-MAG-B460-TORPEDO-EFI', d: 'B460（10 代）台式，含 USB 映射与 XHCI 修正笔记' },
    { n: 'StarsAC/tx4-macOS-EFI', u: 'https://github.com/StarsAC/tx4-macOS-EFI', d: '华硕天选 4 锐龙版，AMD 笔记本中文案例' },
    { n: 'iAmStiv/Ryzen-7600X-RX6800-Ryzentosh', u: 'https://github.com/iAmStiv/Ryzen-7600X-RX6800-Ryzentosh', d: 'AM5 Ryzen 7600X + RX6800，新平台参考' },
    { n: 'dortania/OpenCore-Install-Guide', u: 'https://github.com/dortania/OpenCore-Install-Guide', d: '所有配置的原始依据，遇到分歧先回这里' },
    { n: 'acidanthera/OpenCorePkg', u: 'https://github.com/acidanthera/OpenCorePkg', d: 'OpenCore 本体与官方配置文档（Docs 目录）' }
  ]
};
