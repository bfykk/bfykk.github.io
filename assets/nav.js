/* 冷月技术网 · 全站导航（一处配置，所有页面统一生效）
   后台改这个文件的 NAV 数组，就能全站增删菜单项。 */
(function () {
  var NAV = [
    { "t": "主页", "h": "/index.html", "n": 0 },
    { "t": "案例", "h": "/works/index.html", "n": 0 },
    { "t": "系统下载", "h": "/downloads/index.html", "n": 0 },
    { "t": "工具下载", "h": "/tools/index.html", "n": 0 },
    { "t": "博客", "h": "/blog/index.html", "n": 0 },
    { "t": "联系", "h": "/contact/index.html", "n": 0 }
  ];

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function norm(p) {
    p = String(p || '/').toLowerCase();
    p = p.replace(/\/index\.html$/, '/');
    return p || '/';
  }
  function build() {
    var el = document.querySelector('.menu');
    if (!el) return;
    var cur = norm(location.pathname), html = '';
    for (var i = 0; i < NAV.length; i++) {
      var it = NAV[i];
      if (!it || !it.t) continue;
      var tgt = norm(it.h);
      var on = cur === tgt || (tgt !== '/' && tgt.length > 1 && cur.indexOf(tgt) === 0);
      html += '<a href="' + esc(it.h) + '"' +
        (on ? ' class="on"' : '') +
        (it.n ? ' target="_blank" rel="noopener"' : '') + '>' + esc(it.t) + '</a>';
    }
    el.innerHTML = html;
    el.hidden = false;
  }
  window.LYNAV = { data: NAV, render: build };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
