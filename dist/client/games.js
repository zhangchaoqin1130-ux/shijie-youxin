/* 时节 · 节气小游戏框架 v0.1
 * 统一提供：全屏游戏层、画布与缩放、输入、音效、粒子反馈、开始/结束卡片、进度条、积分预留。
 * 每个节气游戏只需调用 SeasonGames.register(termIndex, def)。
 *
 * def = {
 *   id, title, type,          // 唯一 id、游戏名、玩法类型（见 TYPES）
 *   howto:[...], goal,        // 开始卡上的操作说明和通关条件
 *   knowledge:{head, text},   // 结束卡上的节气知识（玩完要记住的那一点）
 *   create(ctx) → {update(dt,t), draw(g,t), down(p), move(p), up(p), key(k,isDown)}
 * }
 * 游戏结束时调用 ctx.finish({success, score, stats, line})。
 * score 只进入 SeasonGames.Score（预留积分系统），当前不在界面显示。
 */
(function () {
  'use strict';
  const W = 960, H = 600;
  const C = {
    ink: '#30493d', paper: '#f8f7f2', mute: '#6b776d', sun: '#c9a06a', sunInk: '#9a6f3c',
    season: [
      { wash: '#cfe2b6', dab: '#f1cfcf', deep: '#7fae68' },
      { wash: '#c4e0d2', dab: '#efe1a8', deep: '#5f9e86' },
      { wash: '#efd4a4', dab: '#e7b48e', deep: '#c08a4e' },
      { wash: '#d9d5e6', dab: '#efe2d4', deep: '#8e8aa8' }
    ]
  };
  const TYPES = ['反应操作', '拖拽互动', '观察发现', '轻策略', '物理互动', '制作体验', '艺术体验'];
  const registry = new Map();
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ——— 积分预留：记录每局结果，带每日次数上限和"只计最佳"规则，界面暂不显示 ———
  const Score = {
    enabled: false,                 // 以后开放积分时改为 true，并在界面里读取 Score.summary()
    rules: { dailyCap: 3, bestOnly: true, minPlayMs: 8000 },
    log: [],
    record(r) {
      const day = new Date().toISOString().slice(0, 10);
      const sameDay = this.log.filter(x => x.id === r.id && x.day === day).length;
      const valid = r.success && r.playMs >= this.rules.minPlayMs && sameDay < this.rules.dailyCap;
      const entry = { ...r, day, counted: valid };
      this.log.push(entry);
      document.dispatchEvent(new CustomEvent('shijie:game-result', { detail: entry }));
      return entry;
    },
    best(id) { return Math.max(0, ...this.log.filter(x => x.id === id && x.counted).map(x => x.score || 0)); },
    summary() { const ids = [...new Set(this.log.map(x => x.id))]; return ids.map(id => ({ id, best: this.best(id) })); }
  };

  // ——— 音效：WebAudio 合成，D 大调五声音阶，与主题音乐同调 ———
  const PENTA = [293.66, 329.63, 369.99, 440, 493.88, 587.33, 659.25, 739.99, 880];
  const sfx = {
    ac: null, muted: false, master: null,
    init() {
      if (this.ac) { if (this.ac.state === 'suspended') this.ac.resume(); return; }
      const A = window.AudioContext || window.webkitAudioContext; if (!A) return;
      this.ac = new A(); this.master = this.ac.createGain(); this.master.gain.value = .55; this.master.connect(this.ac.destination);
    },
    now() { return this.ac ? this.ac.currentTime : performance.now() / 1000; },
    tone(f, d = .18, type = 'sine', v = .25, at = 0, slide = 0) {
      if (!this.ac || this.muted) return;
      const t = this.ac.currentTime + at, o = this.ac.createOscillator(), g = this.ac.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f * slide), t + d);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + d);
      o.connect(g); g.connect(this.master); o.start(t); o.stop(t + d + .05);
    },
    noise(d = .12, v = .3, freq = 2000, q = 1, at = 0, type = 'bandpass') {
      if (!this.ac || this.muted) return;
      const t = this.ac.currentTime + at, n = Math.floor(this.ac.sampleRate * d), b = this.ac.createBuffer(1, n, this.ac.sampleRate), ch = b.getChannelData(0);
      for (let i = 0; i < n; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const s = this.ac.createBufferSource(), f = this.ac.createBiquadFilter(), g = this.ac.createGain();
      s.buffer = b; f.type = type; f.frequency.value = freq; f.Q.value = q; g.gain.value = v;
      s.connect(f); f.connect(g); g.connect(this.master); s.start(t);
    },
    note(k, d = .3, v = .18, at = 0) { this.tone(PENTA[Math.max(0, Math.min(PENTA.length - 1, k))], d, 'triangle', v, at); },
    // 常用反馈
    good(k = 4) { this.note(k, .25, .2); this.note(k + 2, .3, .12, .06); },
    soft() { this.tone(220, .14, 'sine', .14, 0, .7); },
    miss() { this.tone(180, .2, 'sine', .12, 0, .6); },
    pop() { this.tone(520, .09, 'sine', .2, 0, 1.8); },
    drum(v = .5) { this.tone(110, .22, 'sine', v, 0, .45); this.noise(.04, v * .3, 900); },
    tick() { this.tone(1200, .03, 'square', .04); },
    whip() { this.noise(.07, .55, 3200, 2); this.tone(1400, .05, 'square', .05, 0, .5); },
    splash() { this.noise(.18, .2, 900, .8); },
    drip() { this.tone(900 + Math.random() * 400, .08, 'sine', .07, 0, .5); },
    thunder() { this.noise(1.1, .45, 140, .6, 0, 'lowpass'); this.noise(.5, .25, 300, .5, .15, 'lowpass'); },
    win() { [0, 2, 4, 5, 7].forEach((k, i) => this.note(k + 1, .5, .17, i * .11)); },
    calm() { [3, 1, 0].forEach((k, i) => this.note(k, 1.2, .1, i * .45)); }
  };

  // ——— 统一画风工具：纸面、墨线、水彩、人物 ———
  const rnd = (a, b) => a + Math.random() * (b - a);
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function mix(c1, c2, t) {
    const p = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
    const a = p(c1), b = p(c2); return '#' + a.map((v, i) => Math.round(lerp(v, b[i], clamp(t, 0, 1))).toString(16).padStart(2, '0')).join('');
  }
  // ——— 拱拱的手绘笔触（移植自 时节IP/IP草稿_v0.2_手绘.html 的 brush / blob），固定种子 + 缓存，不闪烁 ———
  const GONG_INK = '#2b2925';
  const GONG_BASE = [[-31, 0], [-32, -30], [-30, -61], [-15, -85], [6, -90], [25, -78], [32, -54], [31, -26], [32, 0]];
  function rng(seed) { let t = seed >>> 0; return () => { t += 0x6D2B79F5; let r = Math.imul(t ^ (t >>> 15), 1 | t); r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r; return ((r ^ (r >>> 14)) >>> 0) / 4294967296; }; }
  function sample(pts, per) {
    const out = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(i - 1, 0)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(i + 2, pts.length - 1)];
      for (let k = 0; k < per; k++) { const t = k / per, t2 = t * t, t3 = t2 * t; out.push([0, 1].map(j => .5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3))); }
    }
    out.push(pts[pts.length - 1].slice()); return out;
  }
  // 沿线抖动 + 起笔重收笔轻，输出填充多边形
  function brushPoly(P, o) {
    const r = rng(o.seed), w0 = o.width || 4.2, n = P.length, ph1 = r() * 6.28, ph2 = r() * 6.28, jit = o.jitter ?? 1.2, L = [], R = [];
    for (let i = 0; i < n; i++) {
      const a = P[Math.max(i - 1, 0)], b = P[Math.min(i + 1, n - 1)]; let dx = b[0] - a[0], dy = b[1] - a[1]; const len = Math.hypot(dx, dy) || 1; dx /= len; dy /= len;
      const nx = -dy, ny = dx, t = i / (n - 1 || 1), wob = jit * (Math.sin(t * 9 + ph1) * .6 + Math.sin(t * 23 + ph2) * .4);
      const press = .55 + .45 * Math.sin(Math.PI * Math.min(1, t * 1.15)) + .12 * Math.sin(t * 17 + ph2);
      const w = Math.max(.6, w0 * press * (o.taperEnd && t > .9 ? 1 - (t - .9) * 6 : 1)) / 2, cx = P[i][0] + nx * wob, cy = P[i][1] + ny * wob;
      L.push([cx + nx * w, cy + ny * w]); R.push([cx - nx * w, cy - ny * w]);
    }
    return L.concat(R.reverse());
  }
  const polyPath = (poly, p = new Path2D()) => { poly.forEach((q, i) => i ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1])); p.closePath(); return p; };
  const brushPath = (pts, o) => polyPath(brushPoly(sample(pts, 14), o));
  function blobPoly(cx, cy, rad, seed) {
    const r = rng(seed), pts = [];
    for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2, rr = rad * (.8 + r() * .35); pts.push([cx + Math.cos(a) * rr * 1.05, cy + Math.sin(a) * rr * .95]); }
    pts.push(pts[0], pts[1]); return sample(pts, 6);
  }
  // “切掉一边”：只改轮廓，不加零件。flat 切平、gap 断开、notch 折一个小缺口
  function cutLine(P, cut) {
    if (!cut) return [P];
    const side = cut.side || 'right', kind = cut.kind || 'flat', at = cut.at ?? -70;
    const top = P.reduce((m, p, i) => p[1] < P[m][1] ? i : m, 0);
    const idx = side === 'top' ? P.reduce((m, p, i) => Math.abs(p[0] - at) < Math.abs(P[m][0] - at) ? i : m, 0)
      : P.reduce((m, p, i) => ((side === 'right' ? i >= top : i <= top) && Math.abs(p[1] - at) < Math.abs(P[m][1] - at)) ? i : m, side === 'right' ? P.length - 1 : 0);
    if (kind === 'gap') { const k = cut.size || 5; return [P.slice(0, Math.max(1, idx - k)), P.slice(Math.min(P.length - 1, idx + k))].filter(s => s.length > 1); }
    if (kind === 'notch') { const k = cut.size || 4, Q = P.map(p => p.slice()); for (let i = idx - k; i <= idx + k; i++) { if (!Q[i]) continue; const d = 1 - Math.abs(i - idx) / (k + 1), dx = -Q[i][0], dy = -45 - Q[i][1], l = Math.hypot(dx, dy) || 1; Q[i][0] += dx / l * 7 * d; Q[i][1] += dy / l * 7 * d; } return [Q]; }
    // flat：从 idx 到头顶这一段拉成直线（top 则把头顶削平到 at 高度）
    const Q = P.map(p => p.slice());
    if (side === 'top') { const y0 = cut.y ?? -82; Q.forEach(p => { if (p[1] < y0) p[1] = y0; }); return [Q]; }
    const [a, b] = idx < top ? [idx, top] : [top, idx];
    for (let i = a; i <= b; i++) { const t = (i - a) / (b - a || 1); Q[i][0] = lerp(P[a][0], P[b][0], t); Q[i][1] = lerp(P[a][1], P[b][1], t); }
    return [Q];
  }
  const gongCache = new Map();
  function gongPaths(seed, cut, mood, bowing) {
    const key = seed + '|' + JSON.stringify(cut || 0) + '|' + mood + bowing;
    let v = gongCache.get(key); if (v) return v;
    const center = sample(GONG_BASE, 14), parts = cutLine(center, cut);
    const line = new Path2D(); parts.forEach((pp, i) => polyPath(brushPoly(pp, { seed: seed + i * 7, width: 4.6, taperEnd: true }), line));
    const inside = polyPath(parts.length > 1 ? cutLine(center, cut && { ...cut, kind: 'flat' })[0] : parts[0]);
    const face = new Path2D();
    if (mood === 'happy') {
      polyPath(brushPoly(sample([[-14, -47], [-10, -51], [-6, -47]], 10), { seed: 3, width: 2.6, jitter: .3, taperEnd: true }), face);
      polyPath(brushPoly(sample([[9, -45], [13, -49], [17, -45]], 10), { seed: 5, width: 2.3, jitter: .3, taperEnd: true }), face);
      polyPath(brushPoly(sample([[-6, -34], [1, -28], [8, -34]], 12), { seed: 7, width: 3, jitter: .4, taperEnd: true }), face);
    } else if (bowing) {
      polyPath(brushPoly(sample([[-13, -45], [-10, -43], [-7, -45]], 8), { seed: 3, width: 2.2, jitter: .2, taperEnd: true }), face);
      polyPath(brushPoly(sample([[10, -43], [13, -41], [16, -43]], 8), { seed: 5, width: 2, jitter: .2, taperEnd: true }), face);
      polyPath(brushPoly(sample([[-2, -31], [1, -30], [4, -31]], 8), { seed: 7, width: 2.4, jitter: .2, taperEnd: true }), face);
    } else {
      polyPath(blobPoly(-10, -48, 3.4, 3), face); polyPath(blobPoly(13, -46, 2.9, 5), face);
      polyPath(brushPoly(sample([[-4, -32], [1, -29], [6, -33]], 14), { seed: 7, width: 3, jitter: .4, taperEnd: true }), face);
    }
    const ground = polyPath(brushPoly(sample([[-46, 1], [0, 2], [46, .5]], 14), { seed: 9, width: 2.2, jitter: .6, taperEnd: true }));
    v = { line, inside, face, ground }; gongCache.set(key, v); return v;
  }

  const draw = {
    ink(g, w = 2.2, c = C.ink) { g.strokeStyle = c; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; },
    paper(g) { g.fillStyle = C.paper; g.fillRect(0, 0, W, H); },
    // 一笔水彩晕染（固定种子，避免闪烁）
    wash(g, x, y, rx, ry, color, a = .5, seed = 1) {
      g.save(); g.globalAlpha = a; g.fillStyle = color; g.beginPath();
      for (let i = 0; i <= 24; i++) {
        const t = i / 24 * Math.PI * 2, j = 1 + .09 * Math.sin(t * 3 + seed) + .06 * Math.sin(t * 7 + seed * 2);
        const px = x + Math.cos(t) * rx * j, py = y + Math.sin(t) * ry * j; i ? g.lineTo(px, py) : g.moveTo(px, py);
      }
      g.closePath(); g.fill(); g.restore();
    },
    ground(g, y, color, seed = 3) {
      g.save(); g.fillStyle = color; g.globalAlpha = .55; g.beginPath(); g.moveTo(0, H);
      for (let x = 0; x <= W; x += 40) g.lineTo(x, y + Math.sin(x / 90 + seed) * 6);
      g.lineTo(W, H); g.fill(); g.restore();
      draw.ink(g, 1.6); g.beginPath(); for (let x = 0; x <= W; x += 20) { const yy = y + Math.sin(x / 90 + seed) * 6; x ? g.lineTo(x, yy) : g.moveTo(x, yy); } g.stroke();
    },
    /* 统一角色：IP 拱拱。一笔拱形（头身一体、底部不闭合）+ 两个墨点眼 + 一道短嘴。
     * o.face 1 右 / -1 左；o.bob 上下起伏；o.robe 身体内淡彩；o.arm 有值时从右侧伸出一根短线当手；
     * o.mood 'calm' | 'happy' | 'bow'；o.bow 0–1 鞠躬程度；o.cut {side:'left'|'right'|'top', at, kind:'flat'|'gap'|'notch'}；
     * o.seed 固定笔触种子。返回手（或身体中心）在画布上的坐标 {hx, hy}。碰撞可用 GONG_BOX（宽 64、高 90，乘 s）。 */
    gong(g, x, y, s = 1, o = {}) {
      const f = o.face || 1, bob = o.bob || 0, mood = o.mood || 'calm', bow = clamp(o.bow ?? (mood === 'bow' ? 1 : 0), 0, 1);
      const shear = -bow * .3, sy = 1 - bow * .16;
      g.save(); g.translate(x, y + bob); g.scale(s * f, s); g.transform(1, 0, shear, sy, 0, 0);
      const P = gongPaths(o.seed ?? 11, o.cut, mood, bow > .5);
      // 身体内部：比背景略亮的纸色 + 一小块淡彩，让主体从画面里跳出来
      g.fillStyle = o.fill || '#fffdf8'; g.fill(P.inside);
      if (o.robe) { g.save(); g.clip(P.inside); draw.wash(g, 4, -14, 26, 18, o.robe, .45, 2); g.restore(); }
      g.fillStyle = GONG_INK; g.fill(P.line); g.fill(P.face);
      if (o.ground !== false) { g.globalAlpha = .35; g.fill(P.ground); g.globalAlpha = 1; }
      let hx = 0, hy = -45;
      if (o.arm != null) {
        const a = o.arm, ex = 31 + Math.cos(a) * 15, ey = -40 + Math.sin(a) * 15;
        g.fill(brushPath([[30, -40], [31 + Math.cos(a) * 8, -40 + Math.sin(a) * 8 + 1], [ex, ey]], { seed: 21, width: 3, jitter: .3, taperEnd: true }));
        hx = ex; hy = ey;
      }
      g.restore();
      return { hx: x + (hx + shear * hy) * s * f, hy: y + bob + hy * sy * s };
    },
    // 旧名保留为别名，旧代码不会坏
    child: (...a) => draw.gong(...a),
    // 拱拱的碰撞盒（脚底中点为 x,y）：宽 64、高 90，乘 s
    gongBox: (x, y, s = 1) => ({ x: x - 32 * s, y: y - 90 * s, w: 64 * s, h: 90 * s, cx: x, cy: y - 45 * s, r: 36 * s }),
    text(g, s, x, y, size = 20, color = C.ink, align = 'center', serif = true) {
      g.font = `${size}px ${serif ? '"Songti SC","STSong","Noto Serif CJK SC",serif' : '-apple-system,"PingFang SC",sans-serif'}`;
      g.fillStyle = color; g.textAlign = align; g.textBaseline = 'middle'; g.fillText(s, x, y);
    }
  };

  // ——— 粒子与浮字：所有游戏共用的正向反馈 ———
  function makeFx() {
    const list = [];
    return {
      list,
      burst(x, y, colors, n = 14, sp = 220, r = 4) {
        if (reduce) n = Math.ceil(n / 3);
        for (let i = 0; i < n; i++) { const a = rnd(0, Math.PI * 2), v = rnd(sp * .3, sp); list.push({ k: 'dot', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, g: 380, life: 0, max: rnd(.5, .9), c: colors[i % colors.length], r: rnd(r * .6, r * 1.3) }); }
      },
      ring(x, y, c = C.sun, r = 40) { list.push({ k: 'ring', x, y, life: 0, max: .5, c, r }); },
      text(x, y, s, c = C.sunInk, size = 22) { list.push({ k: 'text', x, y, s, c, size, life: 0, max: .9 }); },
      update(dt) {
        for (let i = list.length - 1; i >= 0; i--) { const p = list[i]; p.life += dt; if (p.life > p.max) { list.splice(i, 1); continue; } if (p.k === 'dot') { p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; } }
      },
      draw(g) {
        for (const p of list) {
          const t = p.life / p.max; g.save(); g.globalAlpha = 1 - t;
          if (p.k === 'dot') { g.fillStyle = p.c; g.beginPath(); g.arc(p.x, p.y, p.r, 0, Math.PI * 2); g.fill(); }
          if (p.k === 'ring') { draw.ink(g, 3 * (1 - t) + .5, p.c); g.beginPath(); g.arc(p.x, p.y, p.r * (.5 + t), 0, Math.PI * 2); g.stroke(); }
          if (p.k === 'text') draw.text(g, p.s, p.x, p.y - t * 36, p.size, p.c);
          g.restore();
        }
      }
    };
  }

  // ——— 游戏层 DOM ———
  let root, cv, g, card, toastEl, progEl, titleEl, tipEl, dpr = 1;
  let game = null, def = null, termIdx = -1, raf = 0, last = 0, startedAt = 0, state = 'idle', shakeT = 0, shakeA = 0, keyHandler, fx, onExit;
  function build() {
    root = document.createElement('div'); root.className = 'gm'; root.hidden = true;
    root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-labelledby', 'gmTitle');
    root.innerHTML = `<div class="gm-top"><button class="gm-back" type="button">‹ 回到节气</button><div class="gm-title" id="gmTitle"></div><button class="gm-mute" type="button" aria-pressed="false" aria-label="静音">声音 开</button></div>
      <div class="gm-prog" aria-hidden="true"><i></i></div>
      <div class="gm-stage"><canvas aria-label="游戏画面"></canvas><div class="gm-card"></div><div class="gm-toast" role="status" aria-live="polite"></div></div>
      <p class="gm-tip"></p>`;
    document.body.appendChild(root);
    cv = root.querySelector('canvas'); g = cv.getContext('2d'); card = root.querySelector('.gm-card'); toastEl = root.querySelector('.gm-toast');
    progEl = root.querySelector('.gm-prog i'); titleEl = root.querySelector('.gm-title'); tipEl = root.querySelector('.gm-tip');
    root.querySelector('.gm-back').onclick = close;
    const mute = root.querySelector('.gm-mute');
    mute.onclick = () => { sfx.muted = !sfx.muted; mute.textContent = sfx.muted ? '声音 关' : '声音 开'; mute.setAttribute('aria-pressed', sfx.muted); };
    const pos = e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H }; };
    cv.addEventListener('pointerdown', e => { if (state !== 'play') return; e.preventDefault(); cv.setPointerCapture(e.pointerId); sfx.init(); game.down && game.down(pos(e)); });
    cv.addEventListener('pointermove', e => { if (state === 'play' && game.move) game.move(pos(e), e.buttons > 0 || e.pointerType === 'touch'); });
    cv.addEventListener('pointerup', e => { if (state === 'play' && game.up) game.up(pos(e)); });
    addEventListener('resize', fit);
  }
  function fit() {
    if (!root || root.hidden) return;
    const st = root.querySelector('.gm-stage'), r = st.getBoundingClientRect();
    const s = Math.min(r.width / W, r.height / H); dpr = Math.min(2, devicePixelRatio || 1);
    cv.style.width = W * s + 'px'; cv.style.height = H * s + 'px';
    cv.width = Math.round(W * s * dpr); cv.height = Math.round(H * s * dpr); cv.dataset.s = s;
  }
  function showCard(html, btns) {
    card.innerHTML = html + `<div class="gm-btns">${btns.map((b, i) => `<button type="button" data-i="${i}" class="${i ? 'ghost' : ''}">${b[0]}</button>`).join('')}</div>`;
    card.querySelectorAll('button').forEach(b => b.onclick = () => btns[+b.dataset.i][1]());
    card.inert = false; card.classList.add('show'); setTimeout(() => card.querySelector('button')?.focus(), 50);
  }
  function hideCard() { card.classList.remove('show'); card.inert = true; }
  let toastTimer = 0;
  function toast(s, ms = 1600) { toastEl.textContent = s; toastEl.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove('show'), ms); }

  function intro() {
    state = 'intro'; progEl.style.width = '0';
    const j = def;
    showCard(`<p class="gm-kicker">${j.term} · ${j.type}</p><h3>${j.title}</h3><ul>${j.howto.map(h => `<li>${h}</li>`).join('')}</ul><p class="gm-goal">${j.goal}</p>`,
      [['开始', start], ['回到节气', close]]);
    tipEl.textContent = '';
    // 开始前也渲染一帧场景作为背景
    game = def.create(makeCtx()); frame(performance.now());
  }
  function makeCtx() {
    fx = makeFx();
    return {
      W, H, C, sfx, draw, fx, rnd, lerp, clamp, mix, reduce,
      season: C.season[Math.floor(termIdx / 6)],
      progress(v) { progEl.style.width = clamp(v, 0, 1) * 100 + '%'; },
      tip(s) { tipEl.textContent = s; },
      toast, shake(a = 6) { if (!reduce) { shakeA = a; shakeT = .25; } },
      finish
    };
  }
  function start() {
    sfx.init(); hideCard(); document.activeElement && document.activeElement.blur && document.activeElement.blur(); game = def.create(makeCtx()); state = 'play'; startedAt = performance.now();
    if (game.start) game.start();
  }
  function finish(r) {
    if (state !== 'play') return; state = 'end';
    const entry = Score.record({ id: def.id, term: def.term, success: !!r.success, score: r.score || 0, stats: r.stats || {}, playMs: performance.now() - startedAt });
    // 衣橱：通关立刻解锁并写入存储，之后不管怎么退出，物品都不会丢；衣橱模块缺失时不影响游戏
    let isNew = false;
    if (r.success) { try { isNew = !!window.Wardrobe?.unlock(termIdx); } catch (e) { console.warn('wardrobe', e); } }
    const ti = termIdx;
    setTimeout(() => {
      if (r.success) {
        const know = `<p class="gm-kicker">${def.term} · 完成</p><h3>${r.line || '做得好'}</h3><div class="gm-know"><b>${def.knowledge.head}</b><p>${def.knowledge.text}</p></div>`;
        // 第一次通关：成功卡只有「继续」，接着是“获得新物品”卡；重复通关维持原样
        if (isNew && window.Wardrobe) showCard(know, [['继续', () => newItem(ti)]]);
        else showCard(know, [['回到节气', close], ['再玩一次', start]]);
      } else {
        showCard(`<p class="gm-kicker">${def.term}</p><h3>${r.line || '差一点'}</h3><p class="gm-goal">${def.goal}</p>`, [['再试一次', start], ['回到节气', close]]);
      }
    }, r.delay ?? 900);
    return entry;
  }
  // ——— 获得新物品：复用同一张 .gm-card，只换内容 ———
  function newItem(i) {
    const WD = window.Wardrobe, it = WD.ITEMS[i], wash = WD.WASH[Math.floor(i / 6)];
    const quiet = i === 4 || i === 21;   // 清明、冬至：庄重，粒子和音效都减弱
    card.classList.remove('gm-new'); void card.offsetWidth;
    showCard(`<div class="gm-gain"><p class="gm-kicker">${it.term} · 新物品</p><div class="gm-item" style="--w:${wash}">${WD.itemSVG(i)}</div><h3>拱拱得到了「${it.name}」</h3><p class="gm-short">${it.short}</p><p class="gm-guide">快回到首页，打开「拱拱的衣橱」给它换上吧。</p></div>`,
      [['去衣橱看看', () => { close(); document.dispatchEvent(new CustomEvent('shijie:wardrobe-go', { detail: { index: i } })); }],
       ['好的', endButtons]]);
    if (!reduce) card.classList.add('gm-new');
    if (quiet) sfx.calm(); else sfx.win();
    if (fx && !reduce) fx.burst(W / 2, H / 2 - 40, ['#c9a06a', '#e2c37a', '#d4ae7c'], quiet ? 6 : 14, quiet ? 140 : 220, 3);
  }
  // 「好的」：留在这张卡上，只把按钮换回「回到节气」「再玩一次」
  function endButtons() {
    const box = card.querySelector('.gm-btns'), btns = [['回到节气', close], ['再玩一次', start]];
    box.innerHTML = btns.map((b, k) => `<button type="button" data-i="${k}" class="${k ? 'ghost' : ''}">${b[0]}</button>`).join('');
    box.querySelectorAll('button').forEach(b => b.onclick = () => btns[+b.dataset.i][1]());
    box.querySelector('button').focus();
  }
  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000 || 0); last = now;
    if (state === 'play' && game.update) game.update(dt, now / 1000);
    if (state !== 'intro' && game.after) game.after(dt);
    fx && fx.update(dt);
    const s = +cv.dataset.s || 1; g.setTransform(s * dpr, 0, 0, s * dpr, 0, 0);
    if (shakeT > 0) { shakeT -= dt; g.translate(rnd(-shakeA, shakeA), rnd(-shakeA, shakeA)); }
    draw.paper(g); game.draw(g, now / 1000, state); fx && fx.draw(g);
    raf = requestAnimationFrame(frame);
  }

  function open(i, opts = {}) {
    def = registry.get(i); if (!def) return false;
    if (!root) build();
    termIdx = i; onExit = opts.onExit;
    titleEl.textContent = `${def.term} · ${def.title}`;
    root.hidden = false; document.body.classList.add('in-game'); fit();
    requestAnimationFrame(() => root.classList.add('on'));
    keyHandler = e => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); return; }
      if (state === 'play' && game.key && !e.repeat) { if (game.key(e.key, true) !== false && [' ', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) e.preventDefault(); }
    };
    const keyUp = e => { if (state !== 'play') return; if ([' ', 'Enter'].includes(e.key)) e.preventDefault(); game.key && game.key(e.key, false); };
    keyHandler.up = keyUp;
    addEventListener('keydown', keyHandler, true); addEventListener('keyup', keyUp, true);
    last = performance.now(); cancelAnimationFrame(raf); intro();
    return true;
  }
  function close() {
    if (!root || root.hidden) return;
    state = 'idle'; cancelAnimationFrame(raf); game && game.destroy && game.destroy();
    removeEventListener('keydown', keyHandler, true); removeEventListener('keyup', keyHandler.up, true);
    root.classList.remove('on'); document.body.classList.remove('in-game');
    setTimeout(() => { root.hidden = true; hideCard(); }, reduce ? 0 : 420);
    onExit && onExit();
  }

  window.SeasonGames = {
    TYPES, Score, sfx, draw, C,
    register(i, d) { registry.set(i, { ...d, termIndex: i }); },
    has: i => registry.has(i),
    info: i => { const d = registry.get(i); return d ? { id: d.id, title: d.title, type: d.type } : null; },
    open, close,
    isOpen: () => !!root && !root.hidden
  };
})();
