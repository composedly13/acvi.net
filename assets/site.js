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

  /* ---------- 1) 첫 화면 파형 — 캔버스. 가만히 두면 흐르고, 건드리면 퍼지고, 마이크를 켜면 실제 소리를 그린다 ---------- */
  function wave() {
    var hero = document.querySelector('.hero');
    var box = hero && hero.querySelector('.wave');
    if (!box) return;
    var cv = document.createElement('canvas'), g = cv.getContext('2d');
    cv.setAttribute('aria-hidden', 'true');
    box.appendChild(cv);
    var F = 20, TAU = Math.PI * 2, ACC = '#FF5B2E';
    var hits = [], on = true, last = 0, phase = 0, raf = 0, w = 0, h = 0;
    var mic = null;   // {an, time, freq, rate}

    function size() {
      var r = box.getBoundingClientRect(), k = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width; h = r.height; cv.width = Math.round(w * k); cv.height = Math.round(h * k);
      g.setTransform(k, 0, 0, k, 0, 0);
    }
    size(); window.addEventListener('resize', size);

    function synth(s, t, breath) {
      var v = breath * Math.exp(-3.4 * s) * Math.sin(TAU * F * s - phase);
      for (var i = 0; i < hits.length; i++) {
        var q = hits[i], age = t - q.t0, r = Math.sqrt((s - q.s) * (s - q.s) + .00003);
        var front = Math.min(1, Math.max(0, (age * .9 - r) * 12));
        v += q.w * Math.exp(-age / 1.3) * Math.exp(-6 * r) * front * Math.sin(TAU * F * r - age * 11);
      }
      return v;
    }
    function line(fn, width, color, alpha) {
      g.beginPath();
      for (var x = 0; x <= w; x += 3) {
        var y = Math.max(3, Math.min(h - 3, h / 2 - fn(x / w) * h * .4));
        x ? g.lineTo(x, y) : g.moveTo(x, y);
      }
      g.globalAlpha = alpha; g.lineWidth = width; g.strokeStyle = color; g.lineJoin = g.lineCap = 'round'; g.stroke();
      g.globalAlpha = 1;
    }
    function draw(now) {
      raf = 0;
      if (!on || document.hidden) return;
      var t = now / 1000, dt = last ? Math.min(t - last, .05) : 0;
      last = t; phase += dt * 2.4;
      hits = hits.filter(function (q) { return t - q.t0 < 6; });
      g.clearRect(0, 0, w, h);
      if (mic) listen(); else {
        var breath = .5 + .07 * Math.sin(t * .7);
        line(function (s) { return .55 * synth(s, t - .18, breath); }, 1, ACC, .28);   // 뒤따르는 잔상
        line(function (s) { return synth(s, t, breath); }, 2.5, ACC, 1);
      }
      raf = requestAnimationFrame(draw);
    }
    function start() { if (!raf) { last = 0; raf = requestAnimationFrame(draw); } }

    /* 마이크: 주파수 막대(옅게) + 실제 파형 + 가장 센 주파수와 크기 */
    var hzEl = document.getElementById('m-hz'), dbEl = document.getElementById('m-db'), shown = 0;
    function listen() {
      var an = mic.an, td = mic.time, fd = mic.freq, n = td.length, i;
      an.getFloatTimeDomainData(td); an.getFloatFrequencyData(fd);
      var bars = Math.max(24, Math.floor(w / 14)), top = Math.log(8000 / 60);
      g.fillStyle = ACC; g.globalAlpha = .2;
      for (i = 0; i < bars; i++) {
        var f = 60 * Math.exp(top * i / bars), bin = Math.min(fd.length - 1, Math.round(f / mic.rate * an.fftSize));
        var lv = Math.max(0, Math.min(1, (fd[bin] + 95) / 70));
        g.fillRect(i * w / bars + 2, h - lv * h * .9, w / bars - 4, lv * h * .9);
      }
      g.globalAlpha = 1;
      var sum = 0, peak = 0;
      for (i = 0; i < n; i++) { sum += td[i] * td[i]; if (Math.abs(td[i]) > peak) peak = Math.abs(td[i]); }
      var gain = Math.min(14, .8 / Math.max(peak, .02));
      line(function (s) { return td[Math.min(n - 1, Math.floor(s * (n - 1)))] * gain; }, 2.5, ACC, 1);
      var now = performance.now();
      if (now - shown > 140) {
        shown = now;
        var db = 10 * Math.log10(sum / n + 1e-12), lo = Math.ceil(60 / mic.rate * an.fftSize), best = lo;
        for (i = lo; i < fd.length; i++) if (fd[i] > fd[best]) best = i;
        dbEl.textContent = db > -90 ? Math.round(db) + 'dB' : '—';
        var a = fd[best - 1], c = fd[best + 1], den = a - 2 * fd[best] + c;   // 이웃 칸으로 봉우리 위치 보정
        var pos = best + (isFinite(den) && den ? .5 * (a - c) / den : 0);
        hzEl.textContent = db > -58 ? Math.round(pos * mic.rate / an.fftSize) + 'Hz' : '—';
      }
    }
    var btn = hero.querySelector('.mic'), meter = hero.querySelector('.meter'), note = hero.querySelector('.mic-note');
    if (btn && navigator.mediaDevices && navigator.mediaDevices.getUserMedia && (window.AudioContext || window.webkitAudioContext)) {
      btn.hidden = false;
      btn.addEventListener('click', function () {
        if (mic) { mic.stop(); return; }
        navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } }).then(function (stream) {
          var AC = window.AudioContext || window.webkitAudioContext, ac = new AC(), an = ac.createAnalyser();
          an.fftSize = 2048; an.smoothingTimeConstant = .72;
          ac.createMediaStreamSource(stream).connect(an);   // 스피커로 내보내지 않음. 재기만 한다
          mic = { an: an, time: new Float32Array(an.fftSize), freq: new Float32Array(an.frequencyBinCount), rate: ac.sampleRate,
            stop: function () {
              stream.getTracks().forEach(function (tr) { tr.stop(); }); ac.close(); mic = null;
              hero.classList.remove('listening'); btn.textContent = '마이크로 직접 재기'; meter.hidden = true; note.hidden = true;
            } };
          hero.classList.add('listening'); btn.textContent = '그만 재기'; meter.hidden = false; note.hidden = false;
          start();
        }).catch(function () { btn.textContent = '마이크 사용 불가'; btn.disabled = true; });
      });
    }

    function hit(e, weight) {
      var r = box.getBoundingClientRect();
      hits.push({ s: (e.clientX - r.left) / r.width, t0: performance.now() / 1000, w: weight });
      if (hits.length > 7) hits.shift();
      start();
    }
    hero.addEventListener('pointerdown', function (e) {
      if (e.target.closest('.probe')) return;
      hit(e, 1.15); hero.classList.add('tapped');
    });
    var moved = 0;
    hero.addEventListener('pointermove', function (e) {   // 지나가기만 해도 잔물결
      var now = performance.now();
      if (e.pointerType === 'mouse' && now - moved > 220) { moved = now; hit(e, .3); }
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { on = es[0].isIntersecting; if (on) start(); }).observe(hero);
    }
    document.addEventListener('visibilitychange', start);
    start();
    signals();
  }

  /* ---------- 타일마다 다른 신호 무늬 (꾸밈이며 실제 측정값이 아님) ---------- */
  function signals() {
    var TAU = Math.PI * 2, items = [];
    var shape = {
      pulses: function (u, t) {            // 바퀴가 지나가는 충격의 줄
        var f = ((u * 5 - t * .35) % 1 + 1) % 1 - .5;
        return .9 * Math.exp(-f * f / .006) * Math.sin(70 * f);
      },
      multi: function (u, t, k) {          // 여러 갈래 무선 신호
        return .34 * (1 + .5 * Math.sin(t * .6 + k * 2)) * Math.sin(TAU * (2.4 + k * .9) * u - t * (1.1 + k * .35)) + (k - 1) * .42;
      },
      steps: function (u, t) {             // 세 갈래 판정
        var i = Math.floor(u * 9 + t * .45), z = Math.sin(i * 12.9898) * 43758.5453;
        return (Math.floor((z - Math.floor(z)) * 3) - 1) * .62;
      },
      rise: function (u, t) {              // 점수가 올라가는 곡선
        return -.72 + 1.44 * (1 - Math.exp(-4.2 * u)) + .035 * Math.sin(46 * u - t * 3);
      },
      art: function (u, t) {
        return .8 * Math.sin(TAU * 2 * u + t * .8) * Math.sin(TAU * 5 * u - t * .55);
      }
    };
    [].forEach.call(document.querySelectorAll('.tile[data-sig]'), function (tile) {
      var cv = document.createElement('canvas');
      cv.className = 'sig'; cv.setAttribute('aria-hidden', 'true'); tile.appendChild(cv);
      items.push({ tile: tile, cv: cv, g: cv.getContext('2d'), fn: shape[tile.getAttribute('data-sig')], n: tile.getAttribute('data-sig') === 'multi' ? 3 : 1, seen: false, hot: 0, ph: 0 });
    });
    if (!items.length) return;
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (en) { items.forEach(function (it) { if (it.tile === en.target) it.seen = en.isIntersecting; }); });
      });
      items.forEach(function (it) { io.observe(it.tile); });
    } else items.forEach(function (it) { it.seen = true; });
    items.forEach(function (it) {
      it.tile.addEventListener('pointerenter', function () { it.over = true; });
      it.tile.addEventListener('pointerleave', function () { it.over = false; });
    });
    var prev = 0;
    function frame(now) {
      var dt = prev ? Math.min((now - prev) / 1000, .05) : 0, k = Math.min(window.devicePixelRatio || 1, 2);
      prev = now;
      items.forEach(function (it) {
        if (!it.seen || document.hidden) return;
        var w = it.cv.clientWidth, h = it.cv.clientHeight, g = it.g;
        if (it.cv.width !== Math.round(w * k)) { it.cv.width = Math.round(w * k); it.cv.height = Math.round(h * k); }
        g.setTransform(k, 0, 0, k, 0, 0); g.clearRect(0, 0, w, h);
        it.hot += ((it.over ? 1 : 0) - it.hot) * .12;
        it.ph += dt * (1 + it.hot * 1.6);   // 올려 두면 빨라진다
        var speed = it.ph;
        for (var j = 0; j < it.n; j++) {
          g.beginPath();
          for (var x = 0; x <= w; x += 3) {
            var y = h / 2 - it.fn(x / w, speed, j) * h * .4;
            x ? g.lineTo(x, y) : g.moveTo(x, y);
          }
          g.lineWidth = 1.5 + it.hot; g.lineJoin = g.lineCap = 'round';
          g.strokeStyle = 'rgb(' + Math.round(199 + 56 * it.hot) + ',' + Math.round(199 - 108 * it.hot) + ',' + Math.round(204 - 158 * it.hot) + ')';
          g.stroke();
        }
      });
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
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
