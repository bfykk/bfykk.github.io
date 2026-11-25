/* 冷月技术网 · 站点控制：全站菜单 + 新建/删除页面 */
(function () {
  var WORKER = 'https://ps.lyjsw.dpdns.org';
  var BRANCH = 'main';
  var SITE = 'https://lyjsw.dpdns.org';
  var pass = '', navRows = [], navText = '', navSha = '';

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function msg(el, text, kind) {
    if (!el) return;
    el.textContent = text || '';
    el.className = 'msg' + (kind ? ' ' + kind : '');
  }
  function b64(str) {
    var bytes = new TextEncoder().encode(str), bin = '';
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }
  function unb64(s) {
    var bin = atob(String(s).replace(/\s/g, ''));
    var a = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(a);
  }
  function encPath(p) {
    return String(p || '').split('/').filter(Boolean).map(encodeURIComponent).join('/');
  }

  function api(ghPath, opt) {
    opt = opt || {};
    opt.headers = Object.assign({ 'Accept': 'application/vnd.github+json', 'x-pass': pass }, opt.headers || {});
    return fetch(WORKER + '/api' + ghPath, opt).then(function (r) {
      if (!r.ok) {
        return r.text().then(function (t) {
          var e = new Error('HTTP ' + r.status);
          e.status = r.status; e.body = t;
          throw e;
        });
      }
      return r.json();
    });
  }
  function getFile(p) { return api('/contents/' + encPath(p) + '?ref=' + BRANCH); }
  function putFile(p, text, sha, message) {
    var body = { message: message || ('edit: ' + p), content: b64(text), branch: BRANCH };
    if (sha) body.sha = sha;
    return api('/contents/' + encPath(p), { method: 'PUT', body: JSON.stringify(body) });
  }
  function delFile(p, sha) {
    return api('/contents/' + encPath(p), {
      method: 'DELETE',
      body: JSON.stringify({ message: 'delete: ' + p, branch: BRANCH, sha: sha })
    });
  }

  /* ================= 菜单 ================= */
  function renderNav() {
    var rows = $('navRows'), html = '';
    if (!navRows.length) html = '<div class="msg">还没有菜单项，点下面的 ＋ 加一个。</div>';
    navRows.forEach(function (it, i) {
      html += '<div class="navrow" data-i="' + i + '">' +
        '<input class="inp" data-f="t" value="' + esc(it.t) + '" placeholder="菜单文字">' +
        '<input class="inp" data-f="h" value="' + esc(it.h) + '" placeholder="/xxx/index.html">' +
        '<button class="iconbtn" data-act="up" title="上移">↑</button>' +
        '<button class="iconbtn" data-act="down" title="下移">↓</button>' +
        '<button class="iconbtn xbtn" data-act="del" title="删除">✕</button>' +
        '<label class="chk" style="grid-column:1/-1"><input type="checkbox" data-f="n"' + (it.n ? ' checked' : '') + '> 新窗口打开（外站链接用）</label>' +
        '</div>';
    });
    rows.innerHTML = html;
  }
  function collectNav() {
    var rows = $('navRows').querySelectorAll('.navrow');
    var out = [];
    rows.forEach(function (r) {
      var t = r.querySelector('[data-f="t"]').value.trim();
      var h = r.querySelector('[data-f="h"]').value.trim();
      if (!t && !h) return;
      out.push({ t: t || h, h: h || '/index.html', n: r.querySelector('[data-f="n"]').checked ? 1 : 0 });
    });
    return out;
  }
  function navLiteral(list) {
    var lines = list.map(function (it) {
      return '    { "t": ' + JSON.stringify(it.t) + ', "h": ' + JSON.stringify(it.h) + ', "n": ' + (it.n ? 1 : 0) + ' }';
    });
    return 'var NAV = [\n' + lines.join(',\n') + '\n  ];';
  }
  function bindNavEvents() {
    $('navRows').addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]');
      if (!b) return;
      navRows = collectNav();
      var i = Number(b.closest('.navrow').dataset.i);
      var a = b.dataset.act;
      if (a === 'del') navRows.splice(i, 1);
      if (a === 'up' && i > 0) { var x = navRows[i - 1]; navRows[i - 1] = navRows[i]; navRows[i] = x; }
      if (a === 'down' && i < navRows.length - 1) { var y = navRows[i + 1]; navRows[i + 1] = navRows[i]; navRows[i] = y; }
      renderNav();
    });
    $('btnAddNav').addEventListener('click', function () {
      navRows = collectNav();
      navRows.push({ t: '新菜单', h: '/new-page/index.html', n: 0 });
      renderNav();
    });
    $('btnSaveNav').addEventListener('click', saveNav);
    $('btnReloadNav').addEventListener('click', loadNav);
  }
  function loadNav() {
    msg($('navMsg'), '读取菜单…');
    getFile('assets/nav.js').then(function (j) {
      navText = unb64(j.content); navSha = j.sha;
      var m = navText.match(/var NAV\s*=\s*\[[\s\S]*?\];/);
      if (!m) { msg($('navMsg'), 'nav.js 里没找到 NAV 数组，先别保存，去文件编辑器看一眼。', 'bad'); return; }
      var arr;
      try {
        arr = JSON.parse(m[0].replace(/^var NAV\s*=\s*/, '').replace(/;$/, ''));
      } catch (e) {
        msg($('navMsg'), 'NAV 数组格式不对，没法解析：' + e.message, 'bad'); return;
      }
      navRows = arr.map(function (it) { return { t: it.t || it.text || '', h: it.h || it.href || '', n: it.n ? 1 : 0 }; });
      renderNav();
      msg($('navMsg'), '读到 ' + navRows.length + ' 个菜单项，改完点保存。');
    }).catch(function (e) {
      msg($('navMsg'), '读取失败：' + e.message, 'bad');
    });
  }
  function saveNav() {
    if (!navText) { msg($('navMsg'), '还没读到 nav.js，先点重新读取。', 'bad'); return; }
    var list = collectNav();
    var lit = navLiteral(list);
    var next = navText.replace(/var NAV\s*=\s*\[[\s\S]*?\];/, lit);
    $('btnSaveNav').disabled = true;
    msg($('navMsg'), '保存中…');
    putFile('assets/nav.js', next, navSha, 'site: update the global nav menu').then(function (j) {
      navText = next;
      navSha = j.content && j.content.sha ? j.content.sha : navSha;
      navRows = list;
      $('btnSaveNav').disabled = false;
      msg($('navMsg'), '菜单保存好了，全站 40 个页面一两分钟内一起变。', 'ok');
      if (window.LYNAV) { window.LYNAV.data.length = 0; list.forEach(function (x) { window.LYNAV.data.push(x); }); window.LYNAV.render(); }
    }).catch(function (e) {
      $('btnSaveNav').disabled = false;
      msg($('navMsg'), '保存失败：' + e.message + ' ' + String(e.body || '').slice(0, 100), 'bad');
    });
  }

  /* ================= 新建页面 ================= */
  function pageTpl(title, desc, body) {
    var paras = String(body || '').split(/\n\s*\n/).map(function (p) { return p.trim(); })
      .filter(Boolean).map(function (p) { return '      <p>' + esc(p).replace(/\n/g, '<br>') + '</p>'; }).join('\n');
    return [
      '<!DOCTYPE html>',
      '<html lang="zh-CN">',
      '<head>',
      '<meta charset="UTF-8">',
      '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
      '<title>' + esc(title) + ' · 冷月技术网</title>',
      '<meta name="description" content="' + esc(desc || title) + '">',
      '<link rel="icon" href="/assets/avatar.png">',
      '<link rel="preconnect" href="https://miaoda.feishu.cn">',
      '<link rel="stylesheet" href="https://miaoda.feishu.cn/fonts/css2?family=Noto+Sans+SC:wght@300;400;500;700;900&family=JetBrains+Mono:wght@400;600&display=swap">',
      '<link rel="stylesheet" href="/assets/site.css">',
      '<script>',
      '(function(){var r=document.documentElement,s=null;try{s=localStorage.getItem("ly-theme");}catch(e){}',
      'function sys(){return window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";}',
      'r.setAttribute("data-theme",s||sys());',
      'document.addEventListener("DOMContentLoaded",function(){var b=document.getElementById("themeBtn");if(!b)return;',
      'b.addEventListener("click",function(){var n=r.getAttribute("data-theme")==="dark"?"light":"dark";r.setAttribute("data-theme",n);try{localStorage.setItem("ly-theme",n);}catch(e){}});});})();',
      '</script>',
      '</head>',
      '<body>',
      '',
      '<header class="nav">',
      '  <div class="nav-in">',
      '    <a class="brand" href="/index.html"><i class="dot"></i><span>冷月技术网</span></a>',
      '    <nav class="menu"></nav>',
      '    <button class="theme-btn" id="themeBtn" aria-label="切换明暗主题" title="切换明暗主题">',
      '      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.4v2.4M12 19.2v2.4M4.4 12H2M22 12h-2.4M5.2 5.2l1.7 1.7M17.1 17.1l1.7 1.7M18.8 5.2l-1.7 1.7M6.9 17.1l-1.7 1.7"/></svg>',
      '    </button>',
      '  </div>',
      '</header>',
      '',
      '<main class="page">',
      '  <div class="wrap" style="max-width:880px">',
      '    <div class="crumb"><a href="/index.html">主页</a><span>/</span><span>' + esc(title) + '</span></div>',
      '    <h1 style="font-size:34px">' + esc(title) + '</h1>',
      paras || '      <p>正文还没写，去后台改这个文件就能补上。</p>',
      '  </div>',
      '</main>',
      '',
      '<footer class="foot">',
      '  <div class="wrap">冷月技术网 · lyjsw.dpdns.org</div>',
      '</footer>',
      '',
      '<script src="/assets/nav.js"></script>',
      '</body>',
      '</html>',
      ''
    ].join('\n');
  }

  function normPagePath(v) {
    var p = String(v || '').trim().replace(/^\/+/, '').replace(/\/+$/, '');
    if (!p) return '';
    if (/\.html?$/i.test(p)) return p;
    return p + '/index.html';
  }

  function createPage() {
    var title = $('nTitle').value.trim();
    var file = normPagePath($('nPath').value);
    var desc = $('nDesc').value.trim();
    var body = $('nBody').value;
    if (!title) return msg($('newMsg'), '先写页面标题。', 'bad');
    if (!file) return msg($('newMsg'), '路径不能空，比如 warranty/ 或 about.html。', 'bad');
    if (file.indexOf('..') >= 0) return msg($('newMsg'), '路径别带 ..', 'bad');

    $('btnCreate').disabled = true;
    msg($('newMsg'), '检查有没有同名文件…');

    getFile(file).then(function () {
      throw new Error('already');
    }).catch(function (e) {
      if (e.message === 'already' || (e.status === 200)) {
        $('btnCreate').disabled = false;
        msg($('newMsg'), '/' + file + ' 已经存在了，换个路径（要改它就去文件编辑器）。', 'bad');
        return;
      }
      var html = pageTpl(title, desc, body);
      msg($('newMsg'), '写文件…');
      putFile(file, html, null, 'new page: ' + file).then(function (j) {
        return addSitemap(file).then(function () {
          var addMenu = $('nMenu').checked;
          var done = function () {
            $('btnCreate').disabled = false;
            msg($('newMsg'), '建好了：' + SITE + '/' + file.replace(/index\.html$/, '') + ' （一两分钟后能打开）', 'ok');
            loadList();
          };
          if (addMenu) {
            navRows = navRows.length ? collectNav() : navRows;
            navRows.push({ t: title, h: '/' + file, n: 0 });
            renderNav();
            saveNav();
          }
          done();
        });
      }).catch(function (err) {
        $('btnCreate').disabled = false;
        msg($('newMsg'), '失败：' + err.message + ' ' + String(err.body || '').slice(0, 100), 'bad');
      });
    });
  }

  function addSitemap(file) {
    return getFile('sitemap.xml').then(function (j) {
      var text = unb64(j.content);
      var loc = SITE + '/' + file.replace(/index\.html$/, '');
      if (text.indexOf(loc) >= 0) return Promise.resolve();
      var d = new Date().toISOString().slice(0, 10);
      var entry = '  <url><loc>' + loc + '</loc><lastmod>' + d + '</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>\n';
      var next = text.replace('</urlset>', entry + '</urlset>');
      return putFile('sitemap.xml', next, j.sha, 'sitemap: add ' + loc);
    });
  }
  function removeSitemap(file) {
    return getFile('sitemap.xml').then(function (j) {
      var text = unb64(j.content);
      var loc = SITE + '/' + file.replace(/index\.html$/, '');
      var next = text.split('\n').filter(function (line) {
        return !(line.indexOf('<loc>' + loc + '</loc>') >= 0);
      }).join('\n');
      if (next === text) return Promise.resolve();
      return putFile('sitemap.xml', next, j.sha, 'sitemap: drop ' + loc);
    }).catch(function () { return Promise.resolve(); });
  }

  /* ================= 页面列表 ================= */
  function loadList() {
    msg($('listMsg'), '读目录…');
    api('/contents/?ref=' + BRANCH).then(function (root) {
      var dirs = root.filter(function (i) { return i.type === 'dir' && i.name !== 'assets' && i.name !== 'bfykk'; })
        .map(function (i) { return i.name; });
      return Promise.all(dirs.map(function (d) {
        return api('/contents/' + encPath(d) + '?ref=' + BRANCH).then(function (items) {
          return items.filter(function (i) { return i.type === 'file' && /\.html?$/i.test(i.name); })
            .map(function (i) { return { path: i.path, name: i.name, size: i.size, sha: i.sha }; });
        }).catch(function () { return []; });
      })).then(function (arrs) {
        var files = [];
        root.filter(function (i) { return i.type === 'file' && /\.html?$/i.test(i.name); })
          .forEach(function (i) { files.push({ path: i.path, name: i.name, size: i.size, sha: i.sha }); });
        arrs.forEach(function (a) { a.forEach(function (f) { files.push(f); }); });
        files.sort(function (a, b) { return a.path.localeCompare(b.path); });
        renderList(files);
        msg($('listMsg'), '共 ' + files.length + ' 个页面（后台目录没列进来）。');
      });
    }).catch(function (e) {
      msg($('listMsg'), '读取失败：' + e.message, 'bad');
    });
  }

  function renderList(files) {
    var el = $('plist'), html = '';
    files.forEach(function (f) {
      html += '<div class="prow" data-path="' + esc(f.path) + '" data-sha="' + f.sha + '">' +
        '<span class="pp">/' + esc(f.path) + '</span>' +
        '<span class="pk">' + Math.round((f.size || 0) / 1024) + ' KB</span>' +
        '<button class="iconbtn" data-look="1" title="打开线上页面">看</button>' +
        '<button class="iconbtn xbtn" data-del="1" title="删除这个页面">删</button>' +
        '</div>';
    });
    el.innerHTML = html || '<div class="msg">没有可列的页面。</div>';
  }

  function bindList() {
    $('plist').addEventListener('click', function (e) {
      var row = e.target.closest('.prow');
      if (!row) return;
      var p = row.dataset.path, sha = row.dataset.sha;
      if (e.target.dataset.look) {
        window.open(SITE + '/' + p.replace(/index\.html$/, ''), '_blank');
        return;
      }
      if (e.target.dataset.del) {
        if (!confirm('真的删掉 /' + p + '？\n线上会立刻消失，GitHub 里有历史能找回。')) return;
        e.target.disabled = true;
        msg($('listMsg'), '删除中…');
        delFile(p, sha).then(function () {
          return removeSitemap(p).then(function () {
            msg($('listMsg'), '删掉了 /' + p, 'ok');
            loadList();
          });
        }).catch(function (err) {
          e.target.disabled = false;
          msg($('listMsg'), '删除失败：' + err.message + ' ' + String(err.body || '').slice(0, 100), 'bad');
        });
      }
    });
  }

  /* ================= 登录 ================= */
  function gate() {
    var p = $('gPass').value.trim();
    if (!p) return msg($('gMsg'), '先输密码。', 'bad');
    pass = p;
    msg($('gMsg'), '验证中…');
    api('/user').then(function () {
      try { sessionStorage.setItem('ly-pass', p); } catch (e) {}
      $('gate').hidden = true;
      $('pNav').hidden = false; $('pNew').hidden = false; $('pList').hidden = false;
      msg($('gMsg'), '');
      loadNav(); loadList();
    }).catch(function (e) {
      pass = '';
      if (e.status === 401) msg($('gMsg'), '密码不对。', 'bad');
      else if (!e.status) msg($('gMsg'), '连不上网关，检查网络。', 'bad');
      else msg($('gMsg'), '网关返回 HTTP ' + e.status, 'bad');
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    bindNavEvents(); bindList();
    $('btnGate').addEventListener('click', gate);
    $('gPass').addEventListener('keydown', function (e) { if (e.key === 'Enter') gate(); });
    $('btnCreate').addEventListener('click', createPage);
    $('btnReloadList').addEventListener('click', loadList);
    var saved = null;
    try { saved = sessionStorage.getItem('ly-pass'); } catch (e) {}
    if (saved) { $('gPass').value = saved; gate(); }
  });
})();
