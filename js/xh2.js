var stop, staticx; var img = new Image(); img.src = "data:image/png;base64,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"; function Sakura(x, y, s, r, fn) { this.x = x; this.y = y; this.s = s; this.r = r; this.fn = fn; }
Sakura.prototype.draw = function (cxt) {
    cxt.save(); var xc = 40 * this.s / 4; cxt.translate(this.x, this.y); cxt.rotate(this.r); cxt.drawImage(img, 0, 0, 40 * this.s, 40 * this.s)
    cxt.restore();
}
Sakura.prototype.update = function () { this.x = this.fn.x(this.x, this.y); this.y = this.fn.y(this.y, this.y); this.r = this.fn.r(this.r); if (this.x > window.innerWidth || this.x < 0 || this.y > window.innerHeight || this.y < 0) { this.r = getRandom('fnr'); if (Math.random() > 0.4) { this.x = getRandom('x'); this.y = 0; this.s = getRandom('s'); this.r = getRandom('r'); } else { this.x = window.innerWidth; this.y = getRandom('y'); this.s = getRandom('s'); this.r = getRandom('r'); } } }
SakuraList = function () { this.list = []; }
SakuraList.prototype.push = function (sakura) { this.list.push(sakura); }
SakuraList.prototype.update = function () { for (var i = 0, len = this.list.length; i < len; i++) { this.list[i].update(); } }
SakuraList.prototype.draw = function (cxt) { for (var i = 0, len = this.list.length; i < len; i++) { this.list[i].draw(cxt); } }
SakuraList.prototype.get = function (i) { return this.list[i]; }
SakuraList.prototype.size = function () { return this.list.length; }
function getRandom(option) {
    var ret, random; switch (option) {
        case 'x': ret = Math.random() * window.innerWidth; break; case 'y': ret = Math.random() * window.innerHeight; break; case 's': ret = Math.random(); break; case 'r': ret = Math.random() * 6; break; case 'fnx': random = -0.5 + Math.random() * 1; ret = function (x, y) { return x + 0.5 * random - 1.7; }; break; case 'fny': random = 1.5 + Math.random() * 0.7
            ret = function (x, y) { return y + random; }; break; case 'fnr': random = Math.random() * 0.03; ret = function (r) { return r + random; }; break;
    }
    return ret;
}
function startSakura() {
    requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame || window.oRequestAnimationFrame; var canvas = document.createElement('canvas'), cxt; staticx = true; canvas.height = window.innerHeight; canvas.width = window.innerWidth; canvas.setAttribute('style', 'position: fixed;left: 0;top: 0;pointer-events: none;'); canvas.setAttribute('id', 'canvas_sakura'); document.getElementsByTagName('body')[0].appendChild(canvas); cxt = canvas.getContext('2d'); var sakuraList = new SakuraList(); for (var i = 0; i < 50; i++) { var sakura, randomX, randomY, randomS, randomR, randomFnx, randomFny; randomX = getRandom('x'); randomY = getRandom('y'); randomR = getRandom('r'); randomS = getRandom('s'); randomFnx = getRandom('fnx'); randomFny = getRandom('fny'); randomFnR = getRandom('fnr'); sakura = new Sakura(randomX, randomY, randomS, randomR, { x: randomFnx, y: randomFny, r: randomFnR }); sakura.draw(cxt); sakuraList.push(sakura); }
    stop = requestAnimationFrame(function () { cxt.clearRect(0, 0, canvas.width, canvas.height); sakuraList.update(); sakuraList.draw(cxt); stop = requestAnimationFrame(arguments.callee); })
}
window.onresize = function () { var canvasSnow = document.getElementById('canvas_snow'); }
img.onload = function () { startSakura(); }
function stopp() { if (staticx) { var child = document.getElementById("canvas_sakura"); child.parentNode.removeChild(child); window.cancelAnimationFrame(stop); staticx = false; } else { startSakura(); } }