/* 时节 · 节气配乐引擎 v1.1
 * 25 条完整编曲（主界面 + 24 节气），长度完全一致（32 小节 @ 92 BPM ≈ 83.5 s），共用一条时间轴。
 * 切换 = 两条音轨交叉淡化，播放位置不变 → 主旋律一拍不断、不重来，只是“换了一身衣服”。
 * 交互音效（进入、返回、切换、悬停、换候、进游戏）用 Web Audio 实时合成，音高取自 D 大调五声，
 * 并对齐到下一个八分音符，听起来像乐曲本身对操作的回应。不额外下载文件。
 *
 * window.ShijieMusic
 *   init(base?)                载入 manifest（默认 'music/'），预取主界面
 *   unlock()                   用户第一次点击时调用（浏览器自动播放限制）
 *   home()                     回到主界面          （带“回落”音效）
 *   term(i, {cue})             进入第 i 个节气 0..23（cue: 'enter' | 'switch' | false）
 *   hou(k)                     切换候（0..2）       （风铃一串，k 越大越高）
 *   hover(i)                   悬停某节气：预取 + 一声轻铃（音高随节气位置）
 *   gameEnter() / gameExit()   小游戏：音乐静音（时间轴照走）/ 淡回
 *   v0.9.1：音乐开时不播按键音效；音乐关时才播按键音效
 *   setEnabled(bool) / toggle() / isEnabled() / setVolume(0..1) / setCues(bool)
 */
(() => {
  'use strict';
  const XF = 0.9;            // 场景交叉淡化时长（秒）
  // 游戏中音乐静音但继续走时间轴；退出时 1.2 秒淡回，接着原来的位置，不从头
  const DUCK_IN = 0.7, DUCK_OUT = 1.2, DUCK_LEVEL = 0;
  const KEEP = 3;            // 最多同时保留几条已解码音轨（含当前）
  const PENT = [62, 64, 66, 69, 71];                   // D E F# A B
  const note = (k, base = 74) => base + 12 * Math.floor(k / 5) + (PENT[((k % 5) + 5) % 5] - 62);
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);

  let base = 'music/', M = null, ctx = null, out, duck, master, sfx, verb;
  let t0 = 0, loop = 0, started = false, enabled = true, cues = true, volume = 0.8, inGame = false;
  let want = 'home', active = null;
  const raw = new Map(), tracks = new Map();
  const now = () => ctx.currentTime;
  const fileOf = k => k === 'home' ? M.home.file : M.terms[k].file;

  const fetchRaw = f => { if (!raw.has(f)) raw.set(f, fetch(base + f).then(r => { if (!r.ok) throw new Error(f + ' ' + r.status); return r.arrayBuffer(); })); return raw.get(f); };
  function trim(b) {                       // 去掉 mp3 两端为抵消编码延迟而多补的 0.5 s
    const n = Math.round(M.loop * b.sampleRate), off = Math.round(M.pre * b.sampleRate);
    const o = ctx.createBuffer(b.numberOfChannels, n, b.sampleRate);
    for (let c = 0; c < b.numberOfChannels; c++) o.copyToChannel(b.getChannelData(c).subarray(off, off + n), c);
    return o;
  }
  function ramp(p, v, dur) {
    const t = now();
    if (p.cancelAndHoldAtTime) p.cancelAndHoldAtTime(t); else { p.cancelScheduledValues(t); p.setValueAtTime(p.value, t); }
    p.setTargetAtTime(v, t, Math.max(0.01, dur / 3));
  }
  function load(key) {
    const f = fileOf(key);
    let t = tracks.get(f);
    if (t) { t.used = performance.now(); return t; }
    const g = ctx.createGain(); g.gain.value = 0; g.connect(master);
    t = { key, gain: g, src: null, used: performance.now() };
    t.ready = fetchRaw(f).then(ab => ctx.decodeAudioData(ab.slice(0))).then(b => {
      const s = ctx.createBufferSource(); s.buffer = trim(b); s.loop = true; s.connect(g);
      const when = now() + 0.04; s.start(when, ((when - t0) % loop + loop) % loop);   // 对齐公共时间轴
      t.src = s; return t;
    });
    tracks.set(f, t); return t;
  }
  function gc() {
    const list = [...tracks.values()].filter(t => t !== active && t.key !== want).sort((a, b) => a.used - b.used);
    while (list.length > KEEP - 1) {
      const t = list.shift(); if (t.gain.gain.value > 0.002) continue;
      try { t.src && t.src.stop(); } catch (e) {} t.gain.disconnect(); tracks.delete(fileOf(t.key));
    }
  }
  // 切换：新轨准备好之后才交叉淡化；没准备好时旧轨继续放，音乐绝不出现空白
  function go(key) {
    want = key; if (!started) return;
    const t = load(key);
    t.ready.then(() => {
      if (want !== key) return;
      for (const o of tracks.values()) ramp(o.gain.gain, o === t ? 1 : 0, XF);
      active = t; setTimeout(gc, XF * 3000);
    });
  }
  function setOut() {
    if (!started) return;
    ramp(master.gain, enabled && !document.hidden ? 1 : 0, enabled ? 0.5 : 0.3);
    ramp(duck.gain, inGame ? DUCK_LEVEL : 1, inGame ? DUCK_IN : DUCK_OUT);
    ramp(out.gain, volume, 0.15);
  }

  // ———— 交互音效（实时合成，对齐八分音符网格） ————
  function grid(sub = 0.5, max = 0.14) {   // 若下一个八分音符很近就对齐，否则立即发声，避免延迟感
    const b = 60 / M.bpm * sub, p = (now() + 0.02 - t0) % b, wait = b - p;
    return now() + 0.02 + (wait < max ? wait : 0);
  }
  function tone(m, at, { dur = 1.4, gain = 0.12, type = 'sine', pan = 0, partials = [[1, 1], [2, 0.2], [3, 0.06]], attack = 0.004, wet = 0.5 } = {}) {
    const g = ctx.createGain(), p = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(gain, at + attack); g.gain.setTargetAtTime(0, at + attack, dur / 4);
    if (p) { p.pan.value = pan; g.connect(p); p.connect(sfx); } else g.connect(sfx);
    const w = ctx.createGain(); w.gain.value = wet; g.connect(w); w.connect(verb);
    for (const [k, a] of partials) {
      const o = ctx.createOscillator(), og = ctx.createGain(); o.type = type; o.frequency.value = hz(m) * k; og.gain.value = a;
      o.connect(og); og.connect(g); o.start(at); o.stop(at + dur + 0.2);
    }
  }
  function air(at, { dur = 0.6, from = 400, to = 2400, gain = 0.05 } = {}) {
    at = Math.max(at, now());   // 刚解锁时 at - 0.05 可能为负
    const n = ctx.createBufferSource(), len = Math.ceil(ctx.sampleRate * dur), b = ctx.createBuffer(1, len, ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    n.buffer = b; const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.2;
    f.frequency.setValueAtTime(from, at); f.frequency.exponentialRampToValueAtTime(to, at + dur);
    const g = ctx.createGain(); g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(gain, at + dur * 0.4); g.gain.linearRampToValueAtTime(0, at + dur);
    n.connect(f); f.connect(g); g.connect(sfx); const w = ctx.createGain(); w.gain.value = 0.6; g.connect(w); w.connect(verb); n.start(at);
  }
  const BELL = [[1, 1], [2, 0.22], [3, 0.08], [4.2, 0.05]], PLUCK = [[1, 1], [2, 0.4], [3, 0.15], [4, 0.06]];
  const CUE = {
    enter(i) {        // 进入：一阵风推开 + 主题钩子“6 1' 5”在高音区轻轻奏出
      const at = grid(); air(at - 0.05, { dur: 0.55, from: 500, to: 3000, gain: 0.035 });
      [[71, 0], [74, 0.16], [69, 0.32]].forEach(([m, d], k) => tone(m + 12, at + d, { partials: BELL, gain: 0.07 - k * 0.012, dur: 1.6, pan: -0.3 + k * 0.3 }));
    },
    home() {          // 返回：同一个钩子反向下落，像一片叶子落回转盘
      const at = grid(); air(at, { dur: 0.6, from: 2600, to: 500, gain: 0.03 });
      [[81, 0], [76, 0.14], [74, 0.28], [69, 0.42]].forEach(([m, d], k) => tone(m, at + d, { partials: PLUCK, gain: 0.06 - k * 0.008, dur: 1.4, pan: 0.4 - k * 0.25 }));
    },
    switch(i, dir) {  // 左右切换：一声拨弦，向后走音高上行、向前走下行
      const at = grid(0.5, 0.1); tone(note(10 + (i % 5)) + (dir < 0 ? -12 : 0), at, { partials: PLUCK, gain: 0.07, dur: 1.2, pan: dir < 0 ? -0.5 : 0.5 });
      air(at, { dur: 0.35, from: dir < 0 ? 2000 : 600, to: dir < 0 ? 600 : 2000, gain: 0.02 });
    },
    hover(i) {        // 悬停：一声极轻的铃，音高沿一年循环上行（24 节气 = 五声音阶上的 24 级）
      if (performance.now() - (CUE._h || 0) < 90) return; CUE._h = performance.now();
      tone(note(i % 12, 81), now() + 0.01, { partials: BELL, gain: 0.025, dur: 0.9, pan: Math.sin(i / 24 * 2 * Math.PI) * 0.6, wet: 0.7 });
    },
    hou(k) {          // 换候：一串风铃，第几候就高几级
      const at = grid(0.25, 0.08);
      for (let j = 0; j < 3; j++) tone(note(8 + k * 2 + j, 74), at + j * 0.07, { partials: BELL, gain: 0.04, dur: 1.1, pan: -0.4 + j * 0.4, wet: 0.7 });
    },
    game() { const at = now() + 0.01; air(at, { dur: 0.7, from: 3000, to: 300, gain: 0.04 }); tone(62, at, { partials: BELL, gain: 0.06, dur: 2.2 }); },
    back() { const at = now() + 0.01; air(at, { dur: 0.6, from: 300, to: 2500, gain: 0.03 }); tone(74, at + 0.1, { partials: BELL, gain: 0.05, dur: 1.8 }); }
  };
  // 音效出错（例如刚解锁时 currentTime≈0 算出负时间）绝不能打断换轨
  // 两种模式二选一：音乐开 → 只有音乐，没有按键音效；音乐关 → 没有音乐，按键音效照常
  // （小游戏自己的音效在 games.js 里，不受这里影响）
  const cue = (name, ...a) => { if (started && cues && !enabled && !document.hidden) try { CUE[name](...a); } catch (e) { console.warn('cue', name, e); } };

  let cur = -1;
  const api = {
    async init(b) {
      if (b) base = b.endsWith('/') ? b : b + '/';
      M = await (await fetch(base + 'manifest.json')).json();
      fetchRaw(M.home.file); return M;
    },
    async unlock() {
      if (!M) await api.init();
      if (!ctx) {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        out = ctx.createGain(); out.gain.value = volume; out.connect(ctx.destination);
        duck = ctx.createGain(); duck.connect(out);
        master = ctx.createGain(); master.gain.value = 0; master.connect(duck);
        sfx = ctx.createGain(); sfx.gain.value = 1; sfx.connect(out);           // 音效不被游戏压低，但跟随总音量
        verb = ctx.createConvolver(); const n = ctx.sampleRate * 2.4, ir = ctx.createBuffer(2, n, ctx.sampleRate);
        for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3.2); }
        verb.buffer = ir; const vg = ctx.createGain(); vg.gain.value = 0.35; verb.connect(vg); vg.connect(sfx);
        loop = M.loop; t0 = ctx.currentTime;
        started = true; setOut(); go(want);
      }
      if (ctx.state === 'suspended') await ctx.resume();
    },
    home() { if (want !== 'home') cue('home'); cur = -1; go('home'); },
    term(i, o = {}) {
      i = ((+i % 24) + 24) % 24; const c = o.cue === undefined ? (cur < 0 ? 'enter' : 'switch') : o.cue;
      if (c === 'enter') cue('enter', i); else if (c === 'switch') cue('switch', i, o.dir || (i > cur ? 1 : -1));
      cur = i; go(i);
    },
    hou(k) { cue('hou', +k || 0); },
    hover(i) { if (!M) return; i = ((+i % 24) + 24) % 24; fetchRaw(M.terms[i].file); cue('hover', i); },
    prefetch(i) { if (M) fetchRaw(M.terms[((+i % 24) + 24) % 24].file); },
    gameEnter() { cue('game'); inGame = true; setOut(); },
    gameExit() { inGame = false; setOut(); cue('back'); },
    setEnabled(v) { enabled = !!v; setOut(); },
    toggle() { api.setEnabled(!enabled); return enabled; },
    isEnabled: () => enabled,
    setVolume(v) { volume = Math.max(0, Math.min(1, v)); setOut(); },
    setCues(v) { cues = !!v; },
    get manifest() { return M; },
    get state() { return { want, inGame, enabled, started, position: started ? (now() - t0) % loop : 0 }; }
  };
  window.ShijieMusic = api;
  document.addEventListener('visibilitychange', setOut);   // 切到后台淡出、回来淡入；时间轴不停，不会跳拍
})();
