/* 冷月技术网 · 写文章后台：浏览器直连 GitHub Contents API，提交即发布 */
(function () {
  var REPO = 'bfykk/bfykk.github.io', BRANCH = 'main', SITE = 'https://lyjsw.dpdns.org';
  var TK = 'ly-gh-token', DK = 'ly-draft';
  var token = '', postsSha = null, posts = [];

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function b64(s) {
    var bytes = new TextEncoder().encode(s), bin = '';
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }
  function unb64(s) {
    var bin = atob(String(s).replace(/\s/g, ''));
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }
  function msg(el, text, kind) {
    if (!el) return;
    el.textContent = text || '';
    el.className = 'amsg' + (kind ? ' ' + kind : '');
  }

  /* 云端网关地址：填了就走「只输密码」模式，token 存在 Cloudflare 上；
     留空则走本机模式（密码加密保存 token）。 */
  var WORKER = 'https://ps.lyjsw.dpdns.org';
  var cloudPass = '';

  function api(path, opt) {
    opt = opt || {};
    opt.headers = Object.assign({ 'Accept': 'application/vnd.github+json' }, opt.headers || {});
    var url;
    if (WORKER) {
      var p = path.replace(new RegExp('^/repos/' + REPO.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), '');
      url = WORKER + '/api' + p;
      opt.headers['x-pass'] = cloudPass;
    } else {
      url = 'https://api.github.com' + path;
      opt.headers['Authorization'] = 'Bearer ' + token;
    }
    return fetch(url, opt).then(function (r) {
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

  function getFile(path, quiet) {
    var url = '/repos/' + REPO + '/contents/' + path.split('/').map(encodeURIComponent).join('/') + '?ref=' + BRANCH;
    return api(url).then(function (j) {
      return { sha: j.sha, text: unb64(j.content) };
    }).catch(function (e) {
      if (e.status === 404 && quiet) return null;
      throw e;
    });
  }
  function putFile(path, text, sha, message) {
    var body = { message: message, content: b64(text), branch: BRANCH };
    if (sha) body.sha = sha;
    return api('/repos/' + REPO + '/contents/' + path.split('/').map(encodeURIComponent).join('/'),
      { method: 'PUT', body: JSON.stringify(body) });
  }
  function delFile(path, sha, message) {
    return api('/repos/' + REPO + '/contents/' + path.split('/').map(encodeURIComponent).join('/'),
      { method: 'DELETE', body: JSON.stringify({ message: message, sha: sha, branch: BRANCH }) });
  }

  /* ---------- 文章页模板 ---------- */
  function buildPost(p) {
    var tags = (p.tags || []).map(function (t) {
      return '<a class="chip" style="text-decoration:none" href="index.html?tag=' + encodeURIComponent(t) + '">' + esc(t) + '</a>';
    }).join('');
    var catChip = p.cat
      ? '<a class="chip" style="text-decoration:none" href="index.html?cat=' + encodeURIComponent(p.cat) + '">' + esc(p.cat) + '</a>'
      : '';
    var bodyHtml = window.LYMD ? window.LYMD(p.body || '') : '<pre>' + esc(p.body) + '</pre>';
    var ld = {
      '@context': 'https://schema.org', '@type': 'BlogPosting',
      headline: p.title, description: p.summary || '',
      url: SITE + '/blog/' + p.slug + '.html', datePublished: p.date,
      inLanguage: 'zh-CN',
      author: { '@type': 'Organization', name: '冷月技术网' },
      publisher: { '@type': 'Organization', name: '冷月技术网' },
      isPartOf: { '@type': 'WebSite', name: '冷月技术网', url: SITE + '/' }
    };
    var head = [
      '<!DOCTYPE html>',
      '<html lang="zh-CN" data-theme="dark">',
      '<head>',
      '<meta charset="UTF-8">',
      '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
      '<title>' + esc(p.title) + ' · 冷月技术网</title>',
      '<meta name="description" content="' + esc(p.summary || '') + '">',
      '<link rel="canonical" href="' + SITE + '/blog/' + p.slug + '.html">',
      '<meta property="og:title" content="' + esc(p.title) + '">',
      '<meta property="og:description" content="' + esc(p.summary || '') + '">',
      '<meta property="og:type" content="article">',
      '<meta property="og:url" content="' + SITE + '/blog/' + p.slug + '.html">',
      '<link rel="icon" href="../assets/avatar.png">',
      '<link rel="preconnect" href="https://miaoda.feishu.cn">',
      '<link rel="stylesheet" href="https://miaoda.feishu.cn/fonts/css2?family=Noto+Sans+SC:wght@300;400;500;700;900&family=JetBrains+Mono:wght@400;600&display=swap">',
      '<link rel="stylesheet" href="../assets/site.css">',
      '<script type="application/ld+json">' + JSON.stringify(ld) + '<\/script>',
      '</head>'
    ].join('\n');

    var nav = [
      '<body>',
      '<header class="nav">',
      '  <div class="nav-in">',
      '    <a class="brand" href="../index.html"><i class="dot"></i><span>冷月技术网</span></a>',
      '    <nav class="menu">',
      '      <a href="../index.html">主页</a>',
      '      <a href="../works/index.html">案例</a>',
      '      <a href="../downloads/index.html">系统下载</a>',
      '      <a href="../tools/index.html">工具下载</a>',
      '      <a href="index.html">博客</a>',
      '      <a href="../contact/index.html">联系</a>',
      '    </nav>',
      '    <button class="theme-btn" id="themeBtn" aria-label="切换明暗主题" title="切换明暗主题">',
      '      <svg id="iconSun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.4v2.4M12 19.2v2.4M4.4 12H2M22 12h-2.4M5.2 5.2l1.7 1.7M17.1 17.1l1.7 1.7M18.8 5.2l-1.7 1.7M6.9 17.1l-1.7 1.7"/></svg>',
      '      <svg id="iconMoon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" style="display:none"><path d="M20.6 14.2A8.6 8.6 0 0 1 9.8 3.4a8.9 8.9 0 1 0 10.8 10.8z"/></svg>',
      '    </button>',
      '  </div>',
      '</header>'
    ].join('\n');

    var mid = [
      '<main class="page">',
      '  <div class="wrap">',
      '    <div class="crumb"><a href="index.html">博客</a><span>/</span><span>' + esc(p.title) + '</span></div>',
      '    <h1>' + esc(p.title) + '</h1>',
      '    <div class="page-meta"><span class="chip">' + esc(p.date) + '</span>' + catChip + tags + '</div>',
      '    <div class="prose">',
      bodyHtml,
      '    </div>',
      '    <div class="pagenav"><a href="index.html">全部文章</a><a href="index.html">返回博客 →</a></div>',
      '    <div class="page-cta">',
      '      <p>卡在某一步过不去？把 <b>型号 / CPU / 无线网卡</b> 发过来，先判断可行性再谈方案。</p>',
      '      <div class="hero-actions" style="margin:0">',
      '        <a class="btn btn-primary" href="tencent://message/?uin=1102962755">QQ 1102962755</a>',
      '        <a class="btn btn-ghost" href="https://lyjsw.taobao.com" target="_blank" rel="noopener">淘宝店铺</a>',
      '      </div>',
      '    </div>',
      '  </div>',
      '</main>'
    ].join('\n');

    var foot = [
      '<footer>',
      '  <div class="wrap foot-in">',
      '    <div class="l"><i class="dot" style="width:8px;height:8px;border-radius:50%;background:var(--accent);display:inline-block"></i><b>冷月技术网</b><span>· 重庆</span></div>',
      '    <div>© 2026 冷月技术网 · Built for the machines that shouldn\'t work</div>',
      '  </div>',
      '</footer>',
      '<script>(function(){',
      "  var root = document.documentElement, btn = document.getElementById('themeBtn');",
      "  var sun = document.getElementById('iconSun'), moon = document.getElementById('iconMoon');",
      "  var stored = null; try { stored = localStorage.getItem('ly-theme'); } catch(e){}",
      '  function apply(t){ root.setAttribute("data-theme", t); var dark = t === "dark";',
      '    sun.style.display = dark ? "block" : "none"; moon.style.display = dark ? "none" : "block"; }',
      '  function sys(){ return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"; }',
      '  apply(stored || sys());',
      '  btn.addEventListener("click", function(){ var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";',
      '    apply(next); try { localStorage.setItem("ly-theme", next); } catch(e){} });',
      '  var mq = window.matchMedia("(prefers-color-scheme: light)");',
      '  if(mq.addEventListener) mq.addEventListener("change", function(){ if(!stored) apply(sys()); });',
      '})();<\/script>',
      '</body>',
      '</html>',
      ''
    ].join('\n');

    return head + '\n' + nav + '\n' + mid + '\n' + foot;
  }

  /* ---------- 列表 ---------- */
  function renderList() {
    var box = $('adminList');
    if (!posts.length) { box.innerHTML = '<div class="td" style="padding:12px">还没有文章。</div>'; return; }
    box.innerHTML = posts.slice().sort(function (a, b) { return (b.date || '').localeCompare(a.date || ''); })
      .map(function (p, i) {
        return '<div class="trow">'
          + '<span class="td">' + esc(p.date || '') + '</span>'
          + '<span class="tt">' + esc(p.title) + '</span>'
          + '<button class="mini" data-edit="' + esc(p.slug) + '">编辑</button>'
          + '<a class="mini" href="../blog/' + esc(p.slug) + '.html" target="_blank" rel="noopener" style="text-decoration:none">看</a>'
          + '<button class="mini dan" data-del="' + esc(p.slug) + '">删</button>'
          + '</div>';
      }).join('');
  }

  function loadPosts() {
    return getFile('blog/posts.json', true).then(function (f) {
      if (f) { postsSha = f.sha; try { posts = JSON.parse(f.text || '[]'); } catch (e) { posts = []; } }
      else { postsSha = null; posts = []; }
      if (!Array.isArray(posts)) posts = [];
      renderList();
      return posts;
    });
  }

  /* ---------- 表单 ---------- */
  function readForm() {
    return {
      title: $('fTitle').value.trim(),
      slug: $('fSlug').value.trim().toLowerCase(),
      date: $('fDate').value,
      cat: $('fCat') ? $('fCat').value : '',
      tags: $('fTags').value.split(/[,，]/).map(function (s) { return s.trim(); }).filter(Boolean),
      summary: $('fSummary').value.trim(),
      body: $('fBody').value
    };
  }
  function fillForm(p) {
    $('fTitle').value = p.title || '';
    $('fSlug').value = p.slug || '';
    $('fDate').value = p.date || today();
    $('fTags').value = (p.tags || []).join(', ');
    $('fSummary').value = p.summary || '';
    $('fBody').value = p.body || '';
    var sel = $('fCat'), c = p.cat || '装机记录';
    if (sel) {
      var known = false;
      for (var i = 0; i < sel.options.length; i++) {
        if (sel.options[i].value === c) known = true;
      }
      if (!known && c) sel.add(new Option(c, c));
      sel.value = c;
    }
    switchTab('write');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function today() {
    var d = new Date(), m = d.getMonth() + 1, dd = d.getDate();
    return d.getFullYear() + '-' + (m < 10 ? '0' + m : m) + '-' + (dd < 10 ? '0' + dd : dd);
  }
  function normSlug(s) {
    s = (s || '').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    if (!s) {
      var d = new Date();
      s = 'p-' + d.getFullYear() + ('0' + (d.getMonth() + 1)).slice(-2) + ('0' + d.getDate()).slice(-2)
        + '-' + ('0' + d.getHours()).slice(-2) + ('0' + d.getMinutes()).slice(-2);
    }
    return s;
  }
  function switchTab(which) {
    var write = which === 'write';
    document.querySelectorAll('.tab').forEach(function (b) { b.classList.toggle('on', b.dataset.tab === which); });
    $('fBody').hidden = !write;
    $('previewBox').hidden = write;
    if (!write) {
      $('previewHtml').innerHTML = window.LYMD ? window.LYMD($('fBody').value) : '';
    }
  }

  /* ---------- 发布 ---------- */
  function publish() {
    var p = readForm();
    var out = $('pubMsg');
    if (!p.title) return msg(out, '标题还没写。', 'bad');
    if (!p.body.trim()) return msg(out, '正文是空的。', 'bad');
    p.slug = normSlug(p.slug);
    if (!/^[a-z0-9][a-z0-9-]{1,60}$/.test(p.slug)) return msg(out, '链接名只能用英文小写、数字和短横线。', 'bad');
    if (!p.date) p.date = today();

    msg(out, '正在提交…');
    $('btnPublish').disabled = true;

    var stamp = p.date + ' ' + (p.title || '').slice(0, 30);
    getFile('blog/' + p.slug + '.html', true).then(function (old) {
      return putFile('blog/' + p.slug + '.html', buildPost(p), old ? old.sha : null, 'post: ' + stamp);
    }).then(function () {
      var idx = posts.findIndex(function (x) { return x.slug === p.slug; });
      var entry = { slug: p.slug, title: p.title, date: p.date, cat: p.cat, tags: p.tags, summary: p.summary, body: p.body };
      if (idx > -1) posts[idx] = entry; else posts.push(entry);
      posts.sort(function (a, b) { return (b.date || '').localeCompare(a.date || ''); });
      return putFile('blog/posts.json', JSON.stringify(posts, null, 1), postsSha, 'posts index: ' + p.slug);
    }).then(function () {
      return getFile('sitemap.xml', true).then(function (s) {
        if (!s) return null;
        var url = SITE + '/blog/' + p.slug + '.html';
        if (s.text.indexOf(url) > -1) return null;
        var entry = '<url><loc>' + url + '</loc><lastmod>' + p.date + '</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>';
        var at = s.text.lastIndexOf('</urlset>');
        var text = s.text.slice(0, at) + entry + '\n' + s.text.slice(at);
        return putFile('sitemap.xml', text, s.sha, 'sitemap: add ' + p.slug);
      });
    }).then(function () {
      msg(out, '发出去了。GitHub Pages 大概一分钟重建完，线上地址 ' + SITE + '/blog/' + p.slug + '.html', 'ok');
      $('btnPublish').disabled = false;
      $('fSlug').value = p.slug;
      return loadPosts();
    }).catch(function (e) {
      $('btnPublish').disabled = false;
      if (e.status === 401 || e.status === 403) {
        msg(out, 'token 没权限或已失效（HTTP ' + e.status + '）。检查 token 是否勾了 Contents: Read and write。', 'bad');
      } else if (!e.status) {
        msg(out, '连不上 api.github.com。这台机器上 GitHub 可能需要开代理，开了再点一次。', 'bad');
      } else {
        msg(out, '提交失败：' + e.message + ' ' + String(e.body || '').slice(0, 120), 'bad');
      }
    });
  }

  function removePost(slug) {
    if (!confirm('删掉《' + slug + '》？线上这篇文章会一起消失。')) return;
    var out = $('pubMsg');
    msg(out, '正在删除…');
    var item = posts.find(function (x) { return x.slug === slug; });
    var job = Promise.resolve();
    if (item) {
      job = getFile('blog/' + slug + '.html', true).then(function (f) {
        if (!f) return null;
        return delFile('blog/' + slug + '.html', f.sha, 'delete post: ' + slug);
      }).then(function () {
        posts = posts.filter(function (x) { return x.slug !== slug; });
        return putFile('blog/posts.json', JSON.stringify(posts, null, 1), postsSha, 'posts index: remove ' + slug);
      }).then(function () {
        return getFile('sitemap.xml', true).then(function (s) {
          if (!s) return null;
          var url = SITE + '/blog/' + slug + '.html';
          if (s.text.indexOf(url) === -1) return null;
          var re = new RegExp('<url>(?:(?!</url>)[\\s\\S])*' + url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?:(?!</url>)[\\s\\S])*</url>\\s*');
          var text = s.text.replace(re, '');
          return putFile('sitemap.xml', text, s.sha, 'sitemap: remove ' + slug);
        });
      });
    }
    job.then(function () {
      msg(out, '删掉了。', 'ok');
      return loadPosts();
    }).catch(function (e) {
      msg(out, '删除失败：' + e.message, 'bad');
    });
  }

  /* ---------- 密码锁（本机） ---------- */
  var VK = 'ly-vault';

  function b64arr(buf) {
    var a = new Uint8Array(buf), s = '';
    for (var i = 0; i < a.length; i++) s += String.fromCharCode(a[i]);
    return btoa(s);
  }
  function arrB64(s) {
    var bin = atob(s), a = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i);
    return a;
  }
  function getVault() {
    try { return JSON.parse(localStorage.getItem(VK) || 'null'); } catch (e) { return null; }
  }
  function deriveKey(pw, saltBuf) {
    return crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveKey'])
      .then(function (km) {
        return crypto.subtle.deriveKey(
          { name: 'PBKDF2', salt: saltBuf, iterations: 150000, hash: 'SHA-256' },
          km, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']
        );
      });
  }
  function saveVault(pw, tok) {
    var salt = crypto.getRandomValues(new Uint8Array(16));
    var iv = crypto.getRandomValues(new Uint8Array(12));
    return deriveKey(pw, salt).then(function (k) {
      return crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, k, new TextEncoder().encode(tok));
    }).then(function (ct) {
      try {
        localStorage.setItem(VK, JSON.stringify({ v: 1, salt: b64arr(salt), iv: b64arr(iv), ct: b64arr(ct) }));
        localStorage.removeItem(TK);
      } catch (e) {}
    });
  }
  function openVault(pw) {
    var v = getVault();
    if (!v) return Promise.reject(new Error('empty'));
    var salt = arrB64(v.salt), iv = arrB64(v.iv), ct = arrB64(v.ct);
    return deriveKey(pw, salt).then(function (k) {
      return crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv }, k, ct);
    }).then(function (buf) { return new TextDecoder().decode(buf); });
  }

  /* ---------- 连接 ---------- */
  function onAuthed(login) {
    $('loginBox').hidden = true;
    $('editBox').hidden = false;
    $('listBox').hidden = false;
    loadPosts();
    setTimeout(function () {
      if (!$('fDate').value) $('fDate').value = today();
    }, 60);
  }

  function connect(t, msgEl) {
    var tk = (t || '').trim();
    if (!tk) { msg(msgEl, '没有拿到 token，点「忘了密码 / 换电脑」重新配一次。', 'bad'); return Promise.resolve(false); }
    token = tk;
    msg(msgEl, '正在连 GitHub…');
    return api('/user').then(function (u) {
      msg(msgEl, '连上了，' + u.login, 'ok');
      onAuthed(u.login);
      return true;
    }).catch(function (e) {
      token = '';
      if (!e.status) msg(msgEl, '连不上 api.github.com —— 这台机器访问 GitHub 要开代理，开好再点一次。', 'bad');
      else if (e.status === 401 || e.status === 403) msg(msgEl, 'token 失效或没权限（HTTP ' + e.status + '），重新生成一个。', 'bad');
      else msg(msgEl, '连接失败：' + e.message, 'bad');
      return false;
    });
  }

  /* ---------- 云端模式：只输密码，token 在 Cloudflare ---------- */
  function cloudLogin() {
    var pw = $('cPass').value.trim();
    if (!pw) return msg($('cloudMsg'), '先输密码。', 'bad');
    cloudPass = pw;
    msg($('cloudMsg'), '正在连…');
    api('/user').then(function (u) {
      try { localStorage.setItem('ly-pass', pw); } catch (e) {}
      msg($('cloudMsg'), '进去了，' + u.login, 'ok');
      onAuthed(u.login);
    }).catch(function (e) {
      cloudPass = '';
      if (e.status === 401) msg($('cloudMsg'), '密码不对。', 'bad');
      else if (!e.status) msg($('cloudMsg'), '连不上网关，检查 Worker 地址和网络。', 'bad');
      else msg($('cloudMsg'), '网关返回 HTTP ' + e.status + '，看看 Worker 里的两个 Secret 配对没有。', 'bad');
    });
  }

  /* ---------- 绑定 ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    var vault = getVault(), legacy = null;
    try { legacy = localStorage.getItem(TK); } catch (e) {}

    function showLocal() {
      $('cloudForm').hidden = true;
      $('unlockForm').hidden = !vault;
      $('setupForm').hidden = !!vault;
      if (!vault && legacy) $('sToken').value = legacy;
      setTimeout(function () { (vault ? $('fPass') : $('sPass1')).focus(); }, 60);
    }

    if (WORKER) {
      $('cloudForm').hidden = false;
      $('unlockForm').hidden = true;
      $('setupForm').hidden = true;
      var sp = null;
      try { sp = localStorage.getItem('ly-pass'); } catch (e) {}
      if (sp) { $('cPass').value = sp; setTimeout(cloudLogin, 80); }
      else setTimeout(function () { $('cPass').focus(); }, 80);

      $('btnCloud').addEventListener('click', cloudLogin);
      $('cPass').addEventListener('keydown', function (e) { if (e.key === 'Enter') cloudLogin(); });
      $('btnCloudForget').addEventListener('click', function () {
        try { localStorage.removeItem('ly-pass'); } catch (e) {}
        cloudPass = '';
        $('cPass').value = '';
        $('cPass').focus();
        msg($('cloudMsg'), '本机记住的密码清掉了，重新输。', 'ok');
      });
      var lm = $('btnLocalMode');
      if (lm) lm.addEventListener('click', showLocal);
    } else {
      showLocal();
    }

    function unlock() {
      var pw = $('fPass').value;
      if (!pw) return msg($('lockMsg'), '先输密码。', 'bad');
      msg($('lockMsg'), '正在解锁…');
      openVault(pw).then(function (tok) {
        return connect(tok, $('lockMsg'));
      }).catch(function (e) {
        if (e && e.name === 'OperationError') msg($('lockMsg'), '密码不对。', 'bad');
        else msg($('lockMsg'), '解锁失败：' + (e && e.message ? e.message : '本机没有保存的凭据'), 'bad');
      });
    }

    function setup() {
      var p1 = $('sPass1').value, p2 = $('sPass2').value, tk = $('sToken').value.trim() || legacy || '';
      if (p1.length < 6) return msg($('setupMsg'), '密码至少 6 位。', 'bad');
      if (p1 !== p2) return msg($('setupMsg'), '两次输的密码不一样。', 'bad');
      if (!tk) return msg($('setupMsg'), '还得粘一次 token，只这一次。', 'bad');
      msg($('setupMsg'), '保存中…');
      saveVault(p1, tk).then(function () {
        return connect(tk, $('setupMsg'));
      }).catch(function (e) {
        msg($('setupMsg'), '保存失败：' + (e && e.message ? e.message : '浏览器不支持加密存储'), 'bad');
      });
    }

    $('btnUnlock').addEventListener('click', unlock);
    $('fPass').addEventListener('keydown', function (e) { if (e.key === 'Enter') unlock(); });
    $('btnSetup').addEventListener('click', setup);
    $('btnForget').addEventListener('click', function () {
      if (!confirm('清掉这台电脑上保存的密码和 token？之后要重新粘一次 token。')) return;
      try { localStorage.removeItem(VK); localStorage.removeItem(TK); } catch (e) {}
      location.reload();
    });

    bindEditor();
  });

  function bindEditor() {
    $('btnPublish').addEventListener('click', publish);
    $('btnClear').addEventListener('click', function () {
      fillForm({ title: '', slug: '', date: today(), tags: [], summary: '', body: '' });
      msg($('pubMsg'), '');
    });

    document.querySelectorAll('.tab').forEach(function (b) {
      b.addEventListener('click', function () { switchTab(this.dataset.tab); });
    });

    $('adminList').addEventListener('click', function (e) {
      var t = e.target;
      if (t.dataset.edit) {
        var p = posts.find(function (x) { return x.slug === t.dataset.edit; });
        if (p) fillForm(p);
      } else if (t.dataset.del) {
        removePost(t.dataset.del);
      }
    });

    // 草稿：标题/正文变动自动存本地，免得手滑关掉
    var saveDraft = function () {
      try { localStorage.setItem(DK, JSON.stringify(readForm())); } catch (e) {}
    };
    ['fTitle', 'fSlug', 'fSummary', 'fBody', 'fTags', 'fDate'].forEach(function (id) {
      $(id).addEventListener('input', saveDraft);
      $(id).addEventListener('change', saveDraft);
    });
    var d = null;
    try { d = JSON.parse(localStorage.getItem(DK) || 'null'); } catch (e) {}
    if (d && d.title) fillForm(d); else $('fDate').value = today();
  }
})();
