/* 极简 Markdown → HTML，只覆盖写博客常用的几种写法。挂到 window.LYMD */
(function (g) {
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function inline(s) {
    s = esc(s);
    s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
    s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img src="$2" alt="$1" loading="lazy">');
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    s = s.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
    s = s.replace(/(^|[\s(（])\*([^*\n]+)\*/g, '$1<i>$2</i>');
    return s;
  }
  function render(src) {
    var lines = String(src || '').replace(/\r\n/g, '\n').split('\n');
    var out = [], i = 0, buf = [];
    function flush() {
      if (buf.length) { out.push('<p>' + inline(buf.join(' ')) + '</p>'); buf = []; }
    }
    while (i < lines.length) {
      var l = lines[i];
      if (/^\s*$/.test(l)) { flush(); i++; continue; }

      var fence = l.match(/^\s*```\s*([\w+-]*)\s*$/);
      if (fence) {
        flush(); i++;
        var code = [];
        while (i < lines.length && !/^\s*```\s*$/.test(lines[i])) { code.push(lines[i]); i++; }
        i++;
        out.push('<pre><code>' + esc(code.join('\n')) + '</code></pre>');
        continue;
      }

      var h = l.match(/^(#{1,4})\s+(.*)$/);
      if (h) {
        flush();
        var n = h[1].length;
        out.push('<h' + n + '>' + inline(h[2].trim()) + '</h' + n + '>');
        i++; continue;
      }

      if (/^\s*>\s?/.test(l)) {
        flush();
        var q = [];
        while (i < lines.length && /^\s*>\s?/.test(lines[i])) { q.push(lines[i].replace(/^\s*>\s?/, '')); i++; }
        out.push('<blockquote>' + inline(q.join(' ')) + '</blockquote>');
        continue;
      }

      if (/^\s*[-*+]\s+/.test(l)) {
        flush();
        var ul = [];
        while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) { ul.push(lines[i].replace(/^\s*[-*+]\s+/, '')); i++; }
        out.push('<ul>' + ul.map(function (x) { return '<li>' + inline(x) + '</li>'; }).join('') + '</ul>');
        continue;
      }

      if (/^\s*\d+[.)]\s+/.test(l)) {
        flush();
        var ol = [];
        while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) { ol.push(lines[i].replace(/^\s*\d+[.)]\s+/, '')); i++; }
        out.push('<ol>' + ol.map(function (x) { return '<li>' + inline(x) + '</li>'; }).join('') + '</ol>');
        continue;
      }

      if (/^\s*(-{3,}|\*{3,})\s*$/.test(l)) { flush(); out.push('<hr>'); i++; continue; }

      buf.push(l.trim()); i++;
    }
    flush();
    return out.join('\n');
  }
  g.LYMD = render;
})(window);
