/* 冷月技术网 · EFI 方案生成器前端逻辑（依赖 assets/efidb.js） */
(function(){
  var root = document.documentElement, btn = document.getElementById('themeBtn');
  var sun = document.getElementById('iconSun'), moon = document.getElementById('iconMoon');
  var stored = null;
  try { stored = localStorage.getItem('ly-theme'); } catch(e){}
  function apply(t){
    root.setAttribute('data-theme', t);
    var dark = t === 'dark';
    sun.style.display = dark ? 'block' : 'none';
    moon.style.display = dark ? 'none' : 'block';
  }
  function sys(){ return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'; }
  apply(stored || sys());
  btn.addEventListener('click', function(){
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    apply(next);
    try { localStorage.setItem('ly-theme', next); } catch(e){}
  });
  var mq = window.matchMedia('(prefers-color-scheme: light)');
  if(mq.addEventListener) mq.addEventListener('change', function(){ if(!stored) apply(sys()); });

  var DB = window.EFIDB;
  if(!DB) return;
  document.getElementById('ver').textContent = DB.v;

  function esc(s){
    return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function chips(list, on){
    return list.map(function(x){ return '<span class="chip' + (on ? ' on' : '') + '">' + esc(x) + '</span>'; }).join('');
  }
  function igName(s){ return String(s || '').replace(/\s*——\s*无驱动/, ''); }

  var gpuSel = document.getElementById('gpuSel'), wifiSel = document.getElementById('wifiSel'), codecSel = document.getElementById('codecSel');
  Object.keys(DB.gpu).forEach(function(k){
    gpuSel.insertAdjacentHTML('beforeend', '<option value="' + k + '">' + esc(DB.gpu[k].name) + '</option>');
  });
  gpuSel.value = 'igpu';
  Object.keys(DB.wifi).forEach(function(k){
    wifiSel.insertAdjacentHTML('beforeend', '<option value="' + k + '">' + esc(DB.wifi[k].name) + '</option>');
  });
  wifiSel.value = 'intel';
  Object.keys(DB.codecs).forEach(function(k){
    codecSel.insertAdjacentHTML('beforeend', '<option value="' + k + '">' + esc(k) + '（layout ' + esc(DB.codecs[k].layouts) + '）</option>');
  });
  codecSel.value = 'ALC256';

  /* ---------- CPU 解析 ---------- */
  var HEDT_RE = /(980xe|10980|10900x|10920x|10940x|9960x|9920x|9820x|9900x|w-3|w-2|e5-\d|xeon)/i;
  function parseCpu(raw){
    var s = (raw || '').trim();
    if(!s) return null;
    var low = s.toLowerCase().replace(/\s+/g, ' ').replace(/[()]/g, '');

    if(HEDT_RE.test(low)){
      var hid = 'x299';
      if(/w-3/.test(low)) hid = 'x599';
      else if(/e5-\d/.test(low)) hid = /e5-26/.test(low) ? 'x99' : 'x79';
      return { brand: 'hedt', id: hid, label: s };
    }

    if(/ryzen|amd|threadripper|athlon/.test(low)){
      var id = 'ryzen3';
      if(/threadripper/.test(low)){ id = 'threadripper'; }
      else if(/5600g|5700g|8600g|8700g|4750g|4650g|4350g|2400g|2200g/.test(low)){ id = 'ryzenApu'; }
      else {
        var num = (low.match(/(\d{4})/) || [])[1];
        if(num){
          var n = parseInt(num, 10);
          if(n >= 7000) id = 'am5';
          else if(n >= 3000) id = 'ryzen3';
          else id = 'ryzen1';
        }
        if(/(g[ee]?|gt)\b/.test(low)) id = 'ryzenApu';
      }
      return { brand: 'amd', id: id, label: s };
    }

    var m = low.match(/i([3579])-(\d{3,5})([a-z]{0,3})/);
    if(!m) return null;
    var dg = m[2], gen;
    if(dg.length >= 5){ gen = parseInt(dg.slice(0, 2), 10); }
    else if(dg.length === 4){
      var n4 = parseInt(dg, 10);
      gen = (n4 >= 1100 && n4 < 1200) ? 11 : (n4 >= 1000 && n4 < 1100) ? 10 : parseInt(dg.charAt(0), 10);
    } else { gen = 1; }
    var suffix = m[3] || '';
    return { brand: 'intel', gen: gen, suffix: suffix, laptop: /^(h|hk|hx|hs|p|u|g|y)/.test(suffix), label: s };
  }

  /* ---------- 形态 ---------- */
  var formSel = 'auto';
  document.getElementById('form').addEventListener('click', function(e){
    var b = e.target.closest('button'); if(!b) return;
    formSel = b.getAttribute('data-form');
    [].forEach.call(this.querySelectorAll('button'), function(x){ x.classList.toggle('on', x === b); });
    if(document.getElementById('cpu').value.trim()) render();
  });

  /* ---------- 方案构建 ---------- */
  function pickGpu(){ return DB.gpu[gpuSel.value] || DB.gpu.igpu; }
  function layoutOf(codec){ return (DB.codecs[codec] || { layouts: '11' }).layouts; }

  function planIntel(p){
    var d = DB.intel[p.gen];
    if(!d) return null;
    var isLap = formSel === 'auto' ? p.laptop : formSel === 'laptop';
    var g = pickGpu(), ig = DB.igp[p.gen] || {}, useIgpu = (gpuSel.value === 'igpu');
    var noIgpu = /f$/.test(p.suffix) || /kf$/.test(p.suffix);
    var v, ssdt, kx = DB.kextBase.slice();

    if(p.gen >= 15){
      v = { cls: 'bad', ic: '▲', title: '不建议当客户方案', text: '15 代换了架构（Lion Cove + Skymont），macOS 没有对应平台，社区验证极少。要装也只能纯独显加一堆待调项。' };
    } else if(useIgpu && noIgpu){
      v = { cls: 'bad', ic: '▲', title: '这颗 CPU 没有核显', text: '型号带 F（或 KF），Intel 出厂就砍了核显，没有显示输出可用。必须插一张免驱 AMD 独显，显卡选「AMD 独显」重算。' };
    } else if(gpuSel.value === 'nvidia'){
      v = { cls: 'bad', ic: '▲', title: 'NVIDIA 在 macOS 里没有驱动', text: '10.13 之后没有 Web Driver，必须屏蔽（-wegnoegpu 或 DeviceProperties 里把显卡 disable），不屏蔽会黑屏。屏蔽之后如果这代核显也无解，就等于没显卡可用。' };
    } else if(useIgpu && !d.igpuOK){
      v = isLap
        ? { cls: 'warn', ic: '△', title: '能装，但核显没有硬件加速', text: p.gen + ' 代移动端核显（' + d.igpuL + '）在 macOS 里没有驱动。走无加速直出能亮屏、能出声、能上网、能睡，界面会偏卡，图形任务别指望。' }
        : { cls: 'warn', ic: '△', title: '核显无解，必须加免驱独显', text: '台式可以插一张 RX 5500 / 6600 / 6800 这类免驱卡，显卡选「AMD 独显」重算一次，会补上 agdpmod 与 framebuffer 处理。不加独显这台机器装了也没图形性能。' };
    } else if(!useIgpu && g.ok !== false && gpuSel.value !== 'none'){
      v = { cls: 'ok', ic: '●', title: '可行：核显放一边，独显干活', text: p.gen + ' 代配 ' + g.name + ' 是当前最稳的组合。' + (g.note ? g.note + '。' : '') + '核显要么屏蔽、要么只留作计算，图形走独显。' };
    } else if(useIgpu && d.igpuOK){
      v = { cls: 'ok', ic: '●', title: '可行：核显有驱动', text: p.gen + ' 代的 ' + (isLap ? d.igpuL : d.igpuD) + ' 在 macOS 里有驱动，ig-platform-id 填对就能点亮。' + (p.gen === 10 && !isLap ? '10 代台式还要把 device-id 仿冒成 0x9BC5。' : '') };
    } else {
      v = { cls: 'warn', ic: '△', title: '可以起步，有几项要按实机调', text: '这组合能进系统，但显卡是「无独显」状态，图形加速要看你是否另接独显。' };
    }

    ssdt = isLap ? d.ssdtL : d.ssdtD;
    if(isLap) kx = kx.concat(DB.kextLaptop);
    if(g.kext) kx.push({ n: g.kext, why: '显卡：' + g.name });
    DB.wifi[wifiSel.value].kext.forEach(function(k){ kx.push({ n: k, why: '网络：' + DB.wifi[wifiSel.value].name }); });

    var boot = [];
    if(isLap && /^(h|hk|hx|hs|p|u)/.test(p.suffix)) boot.push('-vi2c-force-polling');
    boot.push('alcid=11');
    if(g.boot) boot.push(g.boot);
    if(!d.igpuOK && useIgpu) boot.push('-igfxvesa');
    if(gpuSel.value === 'nvidia') boot.push('-wegnoegpu');

    var dp = [];
    if(useIgpu && d.igpuOK && !noIgpu){
      var igv = isLap ? ig.l : ig.d;
      if(igv) dp.push(['AAPL,ig-platform-id（PciRoot(0x0)/Pci(0x2,0x0)）', '<code>' + esc(igv) + '</code>　' + (isLap ? '笔记本代表值，按实际输出口调' : '台式代表值，HDMI / DP 要换')]);
      if(ig.devid && !isLap) dp.push(['device-id（同一节点）', '<code>' + esc(ig.devid) + '</code>　10 代台式必须仿冒']);
    }
    dp.push(['声卡 layout-id', '<code>' + esc(layoutOf(codecSel.value)) + '</code>　' + esc(codecSel.value)]);

    var dl = null;
    if(p.gen >= 11 && p.gen <= 14 && !useIgpu && gpuSel.value !== 'nvidia') dl = 'EFI-Intel-' + ['11th','12th','13th','14th'][p.gen - 11] + '-Common.zip';

    return {
      head: p.label + ' → ' + p.gen + ' 代 · ' + (isLap ? '笔记本' : '台式'),
      sub: esc(d.name) + ' · ' + esc(isLap ? d.chipL : d.chipD) + ' · SMBIOS ' + (isLap ? d.smbiosL : d.smbiosD),
      verdict: v,
      rows: [
        ['SMBIOS', '<code>' + esc(isLap ? d.smbiosL : d.smbiosD) + '</code>'],
        ['核显状态', noIgpu ? '<span class="chip">无核显</span> 型号带 F / KF，Intel 出厂砍掉了' : ((d.igpuOK ? '<span class="chip on">有驱动</span>' : '<span class="chip">无驱动</span>') + ' ' + esc(igName(isLap ? d.igpuL : d.igpuD)))],
        ['CPU 补丁', p.gen >= 12 ? 'CpuTopologyRebuild 必须开（大小核）' : '不需要（无大小核）'],
        ['必须开的 Quirks', chips(d.q, true)],
        ['按情况', d.qo.length ? chips(d.qo, false) : '—'],
        ['这一代', esc(d.note)]
      ],
      ssdt: ssdt, kext: kx, boot: boot.filter(Boolean).join(' '), dp: dp, download: dl
    };
  }

  function planAmd(p){
    var d = DB.amd[p.id];
    if(!d) return null;
    var g = pickGpu(), v;
    if(gpuSel.value === 'igpu'){
      v = d.igpuOK === 'partial'
        ? { cls: 'warn', ic: '△', title: 'APU 核显要靠 NootedRed', text: d.note }
        : { cls: 'bad', ic: '▲', title: '这个平台没有核显，必须插独显', text: 'Ryzen 非 APU 没有核显，macOS 也没有对应方案。显卡选一张免驱 AMD 独显再算一次。' };
    } else if(gpuSel.value === 'nvidia'){
      v = { cls: 'bad', ic: '▲', title: 'NVIDIA 这条路走不通', text: 'NVIDIA 在 macOS 无驱动，AMD 平台又没有核显兜底。' };
    } else {
      v = { cls: p.id === 'ryzen3' ? 'ok' : 'warn', ic: p.id === 'ryzen3' ? '●' : '△', title: '可行：独显路线', text: d.note };
    }
    var kx = DB.kextBase.concat([{ n: 'AMD Kernel Patches（Algrye）', why: 'AMD 平台必需的内核补丁，按内核版本对齐' }]);
    if(g.kext) kx.push({ n: g.kext, why: '显卡：' + g.name });
    DB.wifi[wifiSel.value].kext.forEach(function(k){ kx.push({ n: k, why: '网络：' + DB.wifi[wifiSel.value].name }); });
    return {
      head: p.label + ' → ' + d.name,
      sub: esc(d.socket) + ' · ' + esc(d.chip) + ' · SMBIOS ' + esc(d.smbios),
      verdict: v,
      rows: [
        ['SMBIOS', '<code>' + esc(d.smbios) + '</code>'],
        ['内核补丁', '必须：Algrye AMD Kernel Patches（内核版本不对会直接卡开机）'],
        ['必须开的 Quirks', chips(d.q, true)],
        ['核显', d.igpuOK === 'partial' ? 'APU：靠 NootedRed，稳不稳看机型' : '无核显，独显必须'],
        ['这一代', esc(d.note)]
      ],
      ssdt: d.ssdt, kext: kx,
      boot: [d.boot, gpuSel.value === 'nvidia' ? '-wegnoegpu' : ''].filter(Boolean).join(' '),
      dp: [['声卡 layout-id', '<code>' + esc(layoutOf(codecSel.value)) + '</code>　' + esc(codecSel.value)]],
      download: null
    };
  }

  function planHedt(p){
    var d = DB.hedt[p.id];
    if(!d) return null;
    var g = pickGpu();
    var v = (gpuSel.value === 'igpu' || gpuSel.value === 'nvidia')
      ? { cls: 'bad', ic: '▲', title: '这条路不通', text: 'HEDT 平台没有核显，NVIDIA 在 macOS 无驱动。必须换免驱 AMD 独显。' }
      : { cls: 'warn', ic: '△', title: '老平台，先看结论再接', text: d.note };
    var kx = DB.kextBase.slice();
    if(g.kext) kx.push({ n: g.kext, why: '显卡：' + g.name });
    DB.wifi[wifiSel.value].kext.forEach(function(k){ kx.push({ n: k, why: '网络：' + DB.wifi[wifiSel.value].name }); });
    return {
      head: p.label + ' → ' + d.name,
      sub: 'SMBIOS ' + esc(d.smbios) + ' · 目标系统不低于 ' + esc(d.macMin),
      verdict: v,
      rows: [
        ['SMBIOS', '<code>' + esc(d.smbios) + '</code>'],
        ['目标系统', '不低于 ' + esc(d.macMin) + '，越新的系统越依赖 OCLP'],
        ['CPU 补丁', (p.id === 'x299' || p.id === 'x599') ? 'AppleXcpmExtraMsrs 建议开（HEDT 电源管理）' : '按平台补丁，老平台多半还要 OCLP'],
        ['必须开的 Quirks', chips(['AppleXcpmCfgLock', 'DisableIoMapper'], true) + (p.id === 'x299' || p.id === 'x599' ? chips(['AppleXcpmExtraMsrs'], false) : '')],
        ['核显', '无核显，独显必须'],
        ['这一平台', esc(d.note)]
      ],
      ssdt: ['SSDT-PLUG', 'SSDT-EC-USBX', 'SSDT-AWAC（部分主板）', 'SSDT-RHUB（按主板）'],
      kext: kx,
      boot: ['alcid=11', g.boot || ''].filter(Boolean).join(' '),
      dp: [['声卡 layout-id', '<code>' + esc(layoutOf(codecSel.value)) + '</code>　' + esc(codecSel.value)]],
      download: null
    };
  }

  /* ---------- 渲染 ---------- */
  var last = null;
  function render(){
    var raw = document.getElementById('cpu').value.trim();
    var out = document.getElementById('out');
    if(!raw){ out.innerHTML = '<div class="vd warn"><div class="ic">△</div><div class="tx"><b>先填个型号</b>比如 i5-13500H、Ryzen 5 5600X、i9-10980XE。不确定后缀怎么分就先点下面那几个标签试试。</div></div>'; return; }
    var p = parseCpu(raw);
    if(!p){
      out.innerHTML = '<div class="vd bad"><div class="ic">▲</div><div class="tx"><b>认不出这个型号</b>' + esc(raw) + ' —— 写完整型号，Intel 形如 i5-13500H / i7-12700K，AMD 形如 Ryzen 5 5600X / 7600X，HEDT 形如 i9-10980XE / W-3175X。</div></div>';
      return;
    }
    if(p.brand === 'intel' && !DB.intel[p.gen]){
      out.innerHTML = '<div class="vd bad"><div class="ic">▲</div><div class="tx"><b>' + p.gen + ' 代不在覆盖范围</b>这个页面覆盖 Intel 6–15 代。' + (p.gen <= 5 ? '5 代及更早（Haswell、Broadwell）要走 OCLP 那条路，方案不一样。' : '') + '</div></div>';
      return;
    }
    var plan = p.brand === 'intel' ? planIntel(p) : (p.brand === 'amd' ? planAmd(p) : planHedt(p));
    if(!plan) return;
    last = plan;

    var h = '';
    h += '<div class="vd ' + plan.verdict.cls + '"><div class="ic">' + plan.verdict.ic + '</div><div class="tx"><b>' + esc(plan.verdict.title) + '</b>' + esc(plan.verdict.text) + '</div></div>';
    h += '<div class="card"><h3>平台档 · ' + esc(plan.head) + '</h3><div class="sub" style="margin-top:0">' + plan.sub + '</div><dl class="kv" style="margin-top:14px">';
    plan.rows.forEach(function(r){ h += '<dt>' + esc(r[0]) + '</dt><dd>' + r[1] + '</dd>'; });
    h += '</dl></div>';

    var osv = +document.getElementById('osSel').value;
    if(p.brand === 'intel' && p.gen <= 10 && osv >= 26){
      h += '<div class="vd warn" style="margin-top:12px"><div class="ic">△</div><div class="tx"><b>目标系统是 Tahoe 26，这台要过 OCLP</b>6–10 代的核显驱动在 Tahoe 里被移除了，原生装进去只有基本显示。要图形加速得走 OpenCore Legacy Patcher 打补丁，代价是系统更新要重新打、稳定性打折。</div></div>';
    }
    if(p.brand === 'intel' && p.gen <= 10 && osv <= 12){
      h += '<div class="vd warn" style="margin-top:12px"><div class="ic">△</div><div class="tx"><b>目标系统偏老</b>Monterey 及更早版本已经停止安全更新，能装但不建议给客户交付。桌面 6–10 代跑 Ventura / Sonoma 都还在合理区间。</div></div>';
    }

    h += '<div class="card"><h3>ACPI 要放的 SSDT</h3><ul class="cl">';
    plan.ssdt.forEach(function(x){ h += '<li><code>' + esc(x) + '</code></li>'; });
    h += '</ul><div class="note" style="margin-top:10px">顺序按列表放，同名的放在前面。写完记得在 config 的 <code>ACPI → Add</code> 里逐条登记并设 Enabled。</div></div>';

    h += '<div class="card"><h3>kext 顺序</h3><table><tr><th>#</th><th>驱动</th><th>为什么</th></tr>';
    plan.kext.forEach(function(k, i){ h += '<tr><td>' + (i + 1) + '</td><td><code>' + esc(k.n) + '</code></td><td>' + esc(k.why) + '</td></tr>'; });
    h += '</table><div class="note" style="margin-top:10px">Lilu 永远第一个，VirtualSMC 紧跟；显卡驱动放在 AppleALC 之前；USB 映射（USBToolBox + 你的 UTBMap）放最后。顺序错了会直接卡开机。</div></div>';

    h += '<div class="card"><h3>关键参数</h3><dl class="kv">';
    h += '<dt>boot-args</dt><dd><div class="code" style="margin-top:4px">' + esc(plan.boot || '(空)') + '</div></dd>';
    plan.dp.forEach(function(d){ h += '<dt>' + esc(d[0]) + '</dt><dd>' + d[1] + '</dd>'; });
    h += '</dl><div class="note" style="margin-top:10px">写进去的位置：<b>NVRAM → Add → 7C436110-AB2A-4BBB-A880-FE41995C9F82 → boot-args</b>；显卡与声卡在 <b>DeviceProperties → Add → 对应 PCI 路径</b>。本站 <a href="../device-props/index.html" style="color:var(--accent)">Device Properties 生成器</a>能把这些片段直接拼出来，<a href="../boot-args/index.html" style="color:var(--accent)">boot-args 生成器</a>能查每个参数的副作用。</div></div>';

    h += '<div class="card"><h3>下一步</h3><dl class="kv">';
    h += '<dt>三码</dt><dd>用 GenSMBIOS 选 <code>' + esc((plan.rows[0] || ['',''])[1].replace(/<[^>]+>/g, '')) + '</code> 生成 Serial / MLB / SystemUUID / ROM，填进 PlatformInfo → Generic。不填上不了 iCloud。</dd>';
    if(plan.download){
      h += '<dt>成品骨架</dt><dd><a class="btn btn-primary" href="' + plan.download + '" download>下载 ' + esc(plan.download) + '</a><div class="note" style="margin-top:8px">这份是本站实机跑过的那套扒掉个人化配置后的通用包，台式记得把 config-desktop.plist 改名覆盖。</div></dd>';
    } else {
      h += '<dt>成品骨架</dt><dd>这一档本站没有现成包（只有 11–14 代的通用包），上面这套参数就是照单配置的依据。要做成品 EFI 走 <a href="tencent://message/?uin=1102962755" style="color:var(--accent)">QQ 1102962755</a>。</dd>';
    }
    h += '</dl></div>';
    out.innerHTML = h;
  }

  /* ---------- 交互 ---------- */
  document.getElementById('tags').addEventListener('click', function(e){
    var b = e.target.closest('button'); if(!b) return;
    document.getElementById('cpu').value = b.getAttribute('data-cpu');
    render();
  });
  document.getElementById('go').addEventListener('click', render);
  document.getElementById('cpu').addEventListener('keydown', function(e){ if(e.key === 'Enter') render(); });
  ['gpuSel','wifiSel','codecSel','osSel'].forEach(function(id){
    document.getElementById(id).addEventListener('change', function(){ if(document.getElementById('cpu').value.trim()) render(); });
  });
  document.getElementById('reset').addEventListener('click', function(){
    document.getElementById('cpu').value = '';
    document.getElementById('out').innerHTML = '';
    last = null;
  });
  document.getElementById('copyAll').addEventListener('click', function(){
    if(!last) return;
    var txt = '【' + last.head + '】\n' + last.sub.replace(/<[^>]+>/g, '') + '\n\n';
    last.rows.forEach(function(r){ txt += r[0] + '：' + r[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() + '\n'; });
    txt += '\nACPI：' + last.ssdt.join(' / ') + '\n';
    txt += 'kext 顺序：' + last.kext.map(function(k, i){ return (i + 1) + '.' + k.n; }).join(' ') + '\n';
    txt += 'boot-args：' + (last.boot || '(空)') + '\n';
    last.dp.forEach(function(d){ txt += d[0] + '：' + d[1].replace(/<[^>]+>/g, '').trim() + '\n'; });
    txt += '\n数据来源：冷月技术网 EFI 方案生成器（OpenCore 官方文档 / Dortania 指南整理）';
    var done = function(){ var b = document.getElementById('copyAll'); var o = b.textContent; b.textContent = '已复制'; setTimeout(function(){ b.textContent = o; }, 1600); };
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(txt).then(done, function(){ fallback(txt, done); });
    } else { fallback(txt, done); }
  });
  function fallback(txt, done){
    var ta = document.createElement('textarea'); ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); done(); } catch(e){}
    document.body.removeChild(ta);
  }

  /* ---------- 矩阵表 ---------- */
  (function(){
    var h = '<table><tr><th>代际</th><th>平台</th><th>台式核显</th><th>笔记本核显</th><th>SMBIOS（台/笔）</th></tr>';
    Object.keys(DB.intel).sort(function(a, b){ return (+a) - (+b); }).forEach(function(g){
      var d = DB.intel[g];
      h += '<tr><td><b>' + g + ' 代</b></td><td>' + esc(d.name) + '</td><td>' + (d.igpuOK ? '<span class="chip on">有解</span>' : '<span class="chip">无解</span>') + ' ' + esc(igName(d.igpuD)) + '</td><td>' + (d.igpuOK ? '<span class="chip on">有解</span>' : '<span class="chip">无解</span>') + ' ' + esc(igName(d.igpuL)) + '</td><td><code>' + esc(d.smbiosD) + '</code> / <code>' + esc(d.smbiosL) + '</code></td></tr>';
    });
    Object.keys(DB.amd).forEach(function(k){
      var d = DB.amd[k];
      h += '<tr><td><b>AMD</b></td><td>' + esc(d.name) + '</td><td colspan="2">' + (d.igpuOK === 'partial' ? 'APU 靠 NootedRed' : '无核显，独显必须') + '</td><td><code>' + esc(d.smbios) + '</code></td></tr>';
    });
    Object.keys(DB.hedt).forEach(function(k){
      var d = DB.hedt[k];
      h += '<tr><td><b>HEDT</b></td><td>' + esc(d.name) + '</td><td colspan="2">无核显，独显必须</td><td><code>' + esc(d.smbios) + '</code></td></tr>';
    });
    h += '</table>';
    document.getElementById('matrix').innerHTML = h;
  })();

  /* ---------- 参考仓库 ---------- */
  (function(){
    var h = '';
    DB.repos.forEach(function(r){
      h += '<div class="repo"><div><a href="' + r.u + '" target="_blank" rel="noopener">' + esc(r.n) + '</a><div class="d">' + esc(r.d) + '</div></div></div>';
    });
    document.getElementById('repos').innerHTML = h;
  })();

  /* ---------- URL 参数 ---------- */
  try {
    var qs = new URLSearchParams(location.search);
    if(qs.get('cpu')){
      document.getElementById('cpu').value = qs.get('cpu');
      var f = qs.get('form');
      if(f === 'laptop' || f === 'desktop'){
        formSel = f;
        [].forEach.call(document.querySelectorAll('#form button'), function(x){ x.classList.toggle('on', x.getAttribute('data-form') === f); });
      }
      setTimeout(render, 60);
      if(qs.get('fold')){
        setTimeout(function(){
          [].forEach.call(document.querySelectorAll('.crumb, h1, .lead, .dbline, .panel'), function(el){ el.style.display = 'none'; });
          var o = document.getElementById('out');
          if(o && o.scrollIntoView) o.scrollIntoView({ block: 'start' });
        }, 200);
      }
    }
  } catch(e){}
})();
