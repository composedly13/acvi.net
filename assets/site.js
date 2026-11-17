/* acvi — 움직임만 담당. 이 파일이 없어도 내용은 전부 보인다.
   1) 첫 화면 파형: 계속 흐르고, 두드린 자리에서 진동이 퍼졌다가 잦아든다
   2) 화면에 들어올 때 나타나기
   3) 수치 올라가기 */
(function () {
  var root = document.documentElement;
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (still) return;
  root.classList.add('js');

  document.addEventListener('DOMContentLoaded', function () {
    wave();
    reveal();
  });

  /* ---------- 1) 파형 ---------- */
  function wave() {
    var hero = document.querySelector('.hero');
    var path = hero && hero.querySelector('.wave path');
    if (!path) return;
    var W = 1200, MID = 80, AMP = 59, F = 20, TAU = Math.PI * 2;
    var hits = [];          // 두드린 자리들 {s: 가로 위치(0–1), t0: 시각}
    var on = true, last = 0, phase = 0, raf = 0;

    function draw(now) {
      raf = 0;
      if (!on || document.hidden) return;
      var t = now / 1000, dt = last ? Math.min(t - last, .05) : 0;
      last = t;
      phase += dt * 2.4;
      hits = hits.filter(function (h) { return t - h.t0 < 6; });
      var breath = .46 + .06 * Math.sin(t * .7);
      var d = '';
      for (var x = 0; x <= W; x += 4) {
        var s = x / W;
        var v = breath * Math.exp(-4.2 * s) * Math.sin(TAU * F * s - phase);
        for (var i = 0; i < hits.length; i++) {
          var h = hits[i], age = t - h.t0, r = Math.sqrt((s - h.s) * (s - h.s) + .00003);   // 두드린 자리에서 꺾이지 않게
          var front = Math.min(1, Math.max(0, (age * .9 - r) * 12));   // 퍼져 나가는 앞머리
          v += 1.15 * Math.exp(-age / 1.3) * Math.exp(-6 * r) * front * Math.sin(TAU * F * r - age * 11);
        }
        var y = Math.max(5, Math.min(155, MID - AMP * v));
        d += (x ? ' L' : 'M') + x + ' ' + y.toFixed(1);
      }
      path.setAttribute('d', d);
      raf = requestAnimationFrame(draw);
    }
    function start() { if (!raf) { last = 0; raf = requestAnimationFrame(draw); } }

    hero.addEventListener('pointerdown', function (e) {
      var box = hero.getBoundingClientRect();
      hits.push({ s: (e.clientX - box.left) / box.width, t0: performance.now() / 1000 });
      if (hits.length > 5) hits.shift();
      hero.classList.add('tapped');
      start();
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { on = es[0].isIntersecting; if (on) start(); }).observe(hero);
    }
    document.addEventListener('visibilitychange', start);
    setTimeout(start, 2900);   // 처음 그려지는 연출이 끝난 뒤부터 흐름
  }

  /* ---------- 2) 나타나기 · 3) 수치 올라가기 ---------- */
  function reveal() {
    var sel = '.tile, .highlights > div, .spec, .phero > *, .contact > *';
    var els = [].slice.call(document.querySelectorAll(sel));
    if (!('IntersectionObserver' in window)) return;
    els.forEach(function (el) { el.classList.add('rv'); });
    var io = new IntersectionObserver(function (entries) {
      var shown = 0;
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        el.style.transitionDelay = (shown++ * 70) + 'ms';
        el.classList.add('in');
        io.unobserve(el);
        var b = el.parentElement.classList.contains('highlights') && el.querySelector('b');
        if (b) count(b, shown * 70);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    els.forEach(function (el) { io.observe(el); });
  }

  function count(b, delay) {
    var m = /^(\d+(?:\.\d+)?)(.*)$/.exec(b.textContent.trim());
    if (!m) return;
    var end = parseFloat(m[1]), dec = (m[1].split('.')[1] || '').length, tail = m[2], t0 = 0, DUR = 900;
    b.style.fontVariantNumeric = 'tabular-nums';
    function step(now) {
      if (!t0) t0 = now + delay;
      var p = Math.min(1, Math.max(0, (now - t0) / DUR)), e = 1 - Math.pow(1 - p, 3);
      b.textContent = (end * e).toFixed(dec) + tail;
      if (p < 1) requestAnimationFrame(step);
    }
    b.textContent = (0).toFixed(dec) + tail;
    requestAnimationFrame(step);
  }
})();
