/* Ingrandimento immagini degli articoli: tocco per aprire, due dita o doppio tocco per zoomare */
(function () {
  var imgs = document.querySelectorAll('.article-body img');
  if (!imgs.length) return;

  var css = document.createElement('style');
  css.textContent =
    '.zoomable{cursor:zoom-in}' +
    '.lb{position:fixed;inset:0;z-index:9999;background:rgba(6,18,38,.94);display:none;align-items:center;justify-content:center;touch-action:none;overflow:hidden;opacity:0;transition:opacity .2s}' +
    '.lb.on{display:flex}.lb.vis{opacity:1}' +
    '.lb img{max-width:96vw;max-height:88vh;object-fit:contain;border-radius:8px;user-select:none;-webkit-user-drag:none;transform-origin:center center;will-change:transform;cursor:zoom-in}' +
    '.lb.zoomed img{cursor:grab}' +
    '.lb-x{position:absolute;top:14px;right:14px;width:44px;height:44px;border-radius:50%;border:0;background:rgba(255,255,255,.14);color:#fff;font-size:26px;line-height:44px;cursor:pointer}' +
    '.lb-hint{position:absolute;bottom:18px;left:0;right:0;text-align:center;color:rgba(255,255,255,.6);font:13px/1.4 "IBM Plex Mono",monospace;letter-spacing:.04em;pointer-events:none}';
  document.head.appendChild(css);

  var lb = document.createElement('div');
  lb.className = 'lb';
  lb.setAttribute('role', 'dialog');
  lb.setAttribute('aria-modal', 'true');
  lb.innerHTML = '<img alt=""><button class="lb-x" type="button" aria-label="Chiudi">&times;</button><div class="lb-hint"></div>';
  document.body.appendChild(lb);
  var big = lb.querySelector('img'), hint = lb.querySelector('.lb-hint');
  var touch = matchMedia('(pointer:coarse)').matches;
  hint.textContent = touch ? 'Due dita o doppio tocco per ingrandire' : 'Doppio clic o rotellina per ingrandire';

  var s = 1, x = 0, y = 0, pts = {}, start = null, lastTap = 0, moved = false, isOpen = false;
  function apply() {
    big.style.transform = 'translate(' + x + 'px,' + y + 'px) scale(' + s + ')';
    lb.classList.toggle('zoomed', s > 1.01);
  }
  function reset() { s = 1; x = 0; y = 0; apply(); }
  function clamp() {
    if (s <= 1) { reset(); return; }
    var mx = big.offsetWidth * (s - 1) / 2, my = big.offsetHeight * (s - 1) / 2;
    x = Math.max(-mx, Math.min(mx, x)); y = Math.max(-my, Math.min(my, y));
  }
  function zoomAt(ns, cx, cy) {
    ns = Math.max(1, Math.min(5, ns));
    var r = lb.getBoundingClientRect();
    var ox = cx - r.width / 2, oy = cy - r.height / 2;
    x = ox - (ox - x) * ns / s; y = oy - (oy - y) * ns / s; s = ns;
    clamp(); apply();
  }

  function open(src, alt) {
    big.src = src; big.alt = alt || '';
    reset(); lb.classList.add('on');
    requestAnimationFrame(function () { lb.classList.add('vis'); });
    document.documentElement.style.overflow = 'hidden';
    isOpen = true;
    try { history.pushState({ lb: 1 }, ''); } catch (e) {}
  }
  function close(fromPop) {
    if (!isOpen) return;
    isOpen = false;
    lb.classList.remove('vis');
    setTimeout(function () { lb.classList.remove('on'); big.src = ''; }, 200);
    document.documentElement.style.overflow = '';
    if (!fromPop) { try { history.back(); } catch (e) {} }
  }
  window.addEventListener('popstate', function () { close(true); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  lb.querySelector('.lb-x').addEventListener('click', function (e) { e.stopPropagation(); close(); });

  imgs.forEach(function (im) {
    if (im.closest('a')) return;
    im.classList.add('zoomable');
    im.setAttribute('tabindex', '0');
    im.addEventListener('click', function () { open(im.currentSrc || im.src, im.alt); });
    im.addEventListener('keydown', function (e) { if (e.key === 'Enter') open(im.currentSrc || im.src, im.alt); });
  });

  lb.addEventListener('pointerdown', function (e) {
    pts[e.pointerId] = { x: e.clientX, y: e.clientY };
    var ids = Object.keys(pts);
    moved = false;
    if (ids.length === 2) {
      var a = pts[ids[0]], b = pts[ids[1]];
      start = { d: Math.hypot(a.x - b.x, a.y - b.y), s: s };
    } else if (ids.length === 1) {
      start = { px: e.clientX, py: e.clientY, x: x, y: y };
    }
  });
  lb.addEventListener('pointermove', function (e) {
    if (!pts[e.pointerId]) return;
    pts[e.pointerId] = { x: e.clientX, y: e.clientY };
    var ids = Object.keys(pts);
    if (ids.length === 2 && start && start.d) {
      var a = pts[ids[0]], b = pts[ids[1]];
      zoomAt(start.s * Math.hypot(a.x - b.x, a.y - b.y) / start.d, (a.x + b.x) / 2, (a.y + b.y) / 2);
      moved = true;
    } else if (ids.length === 1 && start && start.px !== undefined) {
      var dx = e.clientX - start.px, dy = e.clientY - start.py;
      if (Math.abs(dx) + Math.abs(dy) > 6) moved = true;
      if (s > 1) { x = start.x + dx; y = start.y + dy; clamp(); apply(); }
    }
  });
  function up(e) {
    var wasMulti = Object.keys(pts).length > 1;
    delete pts[e.pointerId];
    if (Object.keys(pts).length === 1) {
      var k = Object.keys(pts)[0];
      start = { px: pts[k].x, py: pts[k].y, x: x, y: y };
      return;
    }
    start = null;
    if (wasMulti || moved || e.type === 'pointercancel') return;
    var now = Date.now();
    if (now - lastTap < 300) {
      lastTap = 0;
      if (s > 1) reset(); else zoomAt(2.5, e.clientX, e.clientY);
      return;
    }
    lastTap = now;
    var onImg = e.target === big;
    setTimeout(function () {
      if (lastTap === now && !onImg && s <= 1) close();
    }, 300);
  }
  lb.addEventListener('pointerup', up);
  lb.addEventListener('pointercancel', up);
  lb.addEventListener('wheel', function (e) {
    e.preventDefault();
    zoomAt(s * (e.deltaY < 0 ? 1.2 : 1 / 1.2), e.clientX, e.clientY);
  }, { passive: false });
})();
