/* 冷月技术网 · 整站文件编辑器：浏览仓库文件，改源码，保存即提交 */
(function () {
  var WORKER = 'https://ps.lyjsw.dpdns.org';
  var REPO = 'bfykk/bfykk.github.io', BRANCH = 'main';
  var MAX = 190000;
  var pass = '', curPath = '', curSha = '', dirty = false;
  var TEXT = /\.(html|htm|css|js|json|xml|md|txt|yml|yaml|toml|svg|webmanifest)$/i;
  var NAMED = /^(CNAME|\.nojekyll|_config\.yml)$/i;

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function note(el, text, kind) {
    if (!el) return;
    el.textContent = text || '';
    el.className = 'fl-msg' + (kind ? ' ' + kind : '');
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
  function contentsPath(p) {
    var seg = String(p || '').split('/').filter(Boolean).map(encodeURIComponent).join('/');
    return '/contents/' + seg + (seg ? '' : '') + '?ref=' + BRANCH;
  }
  function listDir(p) { return api(contentsPath(p)); }

  function isEditable(name) {
    return TEXT.test(name) || NAMED.test(name);
  }

  /* ---------- 侧栏 ---------- */
  function renderSide(rootItems, dirMap) {
    var side = $('side');
    function row(it) {
      var ok = isEditable(it.name) && (!it.size || it.size <= MAX);
      if (ok) return '<div class="fitem" data-file="' + esc(it.path) + '">' + esc(it.name) + '</div>';
      var kb = it.size ? Math.round(it.size / 1024) + ' KB' : '非文本';
      return '<div class="fitem dim" data-big="' + esc(it.path) + '" data-note="' + esc(kb) + '">' + esc(it.name) + '</div>';
    }
    var html = '<h4>根目录</h4>';
    rootItems.forEach(function (it) {
      if (it.type === 'file') html += row(it);
    });
    html += '<h4>文件夹</h4>';
    Object.keys(dirMap).forEach(function (d) {
      var kids = dirMap[d].filter(function (it) { return it.type === 'file'; });
      html += '<div class="fitem dir" data-toggle="' + esc(d) + '">' + esc(d) + ' ▸</div>';
      html += '<div class="kids" data-kids="' + esc(d) + '" hidden>';
      kids.forEach(function (it) { html += row(it); });
      html += '</div>';
    });
    side.innerHTML = html;
  }

  /* ---------- 打开 / 保存 ---------- */
  function openFile(path) {
    if (dirty && !confirm('当前改动还没保存，确定换一个文件？')) return;
    note($('fMsg'), '读取中…');
    api(contentsPath(path)).then(function (j) {
      if (!isEditable(path)) {
        curPath = path; curSha = '';
        $('curPath').textContent = path + '（二进制，只能看不能改）';
        $('code').value = '这个文件不是文本，后台不改它。要换图请用 GitHub 网页或在别处上传。';
        $('code').disabled = true; $('btnSave').disabled = true; $('btnReload').disabled = true;
        markOn(path);
        note($('fMsg'), '');
        return;
      }
      if (j.size && j.size > MAX) {
        curPath = path; curSha = j.sha;
        $('curPath').textContent = path + '（' + Math.round(j.size / 1024) + ' KB，太大，只读）';
        $('code').value = '文件太大（' + Math.round(j.size / 1024) + ' KB），编辑器打开会卡。这类文件建议直接在 GitHub 网页上改。';
        $('code').disabled = true; $('btnSave').disabled = true; $('btnReload').disabled = true;
        markOn(path);
        note($('fMsg'), '');
        return;
      }
      curPath = path; curSha = j.sha; dirty = false;
      $('curPath').textContent = path;
      $('code').value = unb64(j.content);
      $('code').disabled = false;
      $('btnSave').disabled = false; $('btnReload').disabled = false;
      markOn(path);
      note($('fMsg'), '已载入，改完点右边保存。');
    }).catch(function (e) {
      note($('fMsg'), '读取失败：' + (e.status === 401 ? '密码失效，刷新页面重进' : e.message), 'bad');
    });
  }

  function markOn(path) {
    $('side').querySelectorAll('.fitem').forEach(function (el) {
      el.classList.toggle('on', el.dataset.file === path);
    });
  }

  function save() {
    if (!curPath || !$('code').value) return;
    var text = $('code').value;
    $('btnSave').disabled = true;
    note($('fMsg'), '提交中…');
    api(contentsPath(curPath).replace('?ref=' + BRANCH, ''), {
      method: 'PUT',
      body: JSON.stringify({
        message: 'edit: ' + curPath,
        content: b64(text),
        branch: BRANCH,
        sha: curSha
      })
    }).then(function (j) {
      curSha = j.content && j.content.sha ? j.content.sha : curSha;
      dirty = false;
      $('btnSave').disabled = false;
      note($('fMsg'), '提交好了，GitHub Pages 一两分钟后生效。看效果记得 Ctrl+F5。', 'ok');
    }).catch(function (e) {
      $('btnSave').disabled = false;
      note($('fMsg'), '提交失败：' + e.message + ' ' + String(e.body || '').slice(0, 120), 'bad');
    });
  }

  /* ---------- 登录 ---------- */
  function gate() {
    var p = $('gPass').value.trim();
    if (!p) return note($('gMsg'), '先输密码。', 'bad');
    pass = p;
    note($('gMsg'), '验证中…');
    api('/user').then(function (u) {
      try { sessionStorage.setItem('ly-pass', p); } catch (e) {}
      $('gate').hidden = true;
      $('browser').hidden = false;
      note($('gMsg'), '');
      loadTree(u.login);
    }).catch(function (e) {
      pass = '';
      if (e.status === 401) note($('gMsg'), '密码不对。', 'bad');
      else if (!e.status) note($('gMsg'), '连不上网关，检查网络。', 'bad');
      else note($('gMsg'), '网关返回 HTTP ' + e.status, 'bad');
    });
  }

  function loadTree(login) {
    note($('fMsg'), '正在读文件列表…');
    listDir('').then(function (root) {
      var dirs = root.filter(function (it) { return it.type === 'dir'; }).map(function (it) { return it.name; });
      return Promise.all(dirs.map(function (d) {
        return listDir(d).then(function (items) { return { d: d, items: items }; })
          .catch(function () { return { d: d, items: [] }; });
      })).then(function (arr) {
        var map = {};
        arr.forEach(function (x) { map[x.d] = x.items; });
        renderSide(root, map);
        note($('fMsg'), '已登录 ' + (login || '') + '，左边选文件开始改。');
        bindSide();
      });
    }).catch(function (e) {
      note($('fMsg'), '读目录失败：' + e.message, 'bad');
    });
  }

  function bindSide() {
    var side = $('side');
    side.addEventListener('click', function (e) {
      var t = e.target;
      if (t.dataset.file) return openFile(t.dataset.file);
      if (t.dataset.big) {
        note($('fMsg'), t.dataset.big + ' 是二进制或超大文件（' + (t.dataset.note || '') + '），后台不改它。要换就直接在 GitHub 网页上替换。', 'bad');
        return;
      }
      if (t.dataset.toggle) {
        var kids = side.querySelector('.kids[data-kids="' + t.dataset.toggle.replace(/"/g, '') + '"]');
        if (kids) {
          kids.hidden = !kids.hidden;
          t.textContent = t.dataset.toggle + (kids.hidden ? ' ▸' : ' ▾');
        }
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var saved = null;
    try { saved = sessionStorage.getItem('ly-pass'); } catch (e) {}
    if (saved) { $('gPass').value = saved; gate(); }

    $('btnGate').addEventListener('click', gate);
    $('gPass').addEventListener('keydown', function (e) { if (e.key === 'Enter') gate(); });
    $('btnSave').addEventListener('click', save);
    $('btnReload').addEventListener('click', function () {
      if (curPath) openFile(curPath);
    });
    $('code').addEventListener('input', function () {
      dirty = true;
      note($('fMsg'), '有未保存的改动。', 'bad');
    });
    window.addEventListener('beforeunload', function (e) {
      if (dirty) { e.preventDefault(); e.returnValue = ''; }
    });
  });
})();
