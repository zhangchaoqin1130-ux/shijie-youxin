/* 时节 · 冬季六个小游戏（草稿 v0.1）
 * 18 立冬 包饺子（制作）  19 小雪 滚雪人（物理）  20 大雪 冰场竞速（竞速）
 * 21 冬至 九九消寒图（艺术）  22 小寒 熬腊八粥（制作+策略）  23 大寒 写福字（艺术）
 * 角色统一用 IP 拱拱（c.draw.gong），冬季淡彩为淡紫灰。
 */
(function () {
  'use strict';
  const SG = window.SeasonGames; if (!SG) return;
  const TAU = Math.PI * 2;
  const ROBE = '#cfc8dc';
  const HOLD = ['Shift', ' ', 'Enter', 'j', 'J', 'f', 'F'];
  function dirs(st, k, d) {
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') st.L = d; if (k === 'ArrowRight' || k === 'd' || k === 'D') st.R = d;
    if (k === 'ArrowUp' || k === 'w' || k === 'W') st.U = d; if (k === 'ArrowDown' || k === 's' || k === 'S') st.D = d;
  }

  /* ———————————————————— 18 立冬 · 包饺子 ———————————————————— */
  SG.register(18, {
    id: 'lidong-dumpling', term: '立冬', title: '包饺子', type: '制作体验',
    howto: ['先选：包，还是不包？', '和面：按住在盆里画圈；擀皮：按住左右来回擀；放馅、捏边：点一点', '饺子拖进锅，水开了就“点”一次凉水，点三次就熟了'],
    goal: '包好、煮熟四个饺子。',
    knowledge: { head: '立冬 · 冬始藏', text: '立冬是冬季的开始，万物收藏，北方有“立冬不端饺子碗，冻掉耳朵没人管”的俗语。这是民间的玩笑话，不是真会冻掉耳朵；饺子形似耳朵，冬天吃饺子图个暖和吉利。煮饺子“点三次凉水”，是为了让皮不破、馅煮透。三候：水始冰，地始冻，雉入大水为蜃（古人的想象）。' },
    create(c) {
      // 布局：一张大案板（后沿 TOP、前沿 FRONT），盆和锅都坐在后沿上，饺子摆在台面中间；拱拱站在左边小凳上
      const TOP = 430, FRONT = 530, BOWL = { x: 330, y: 345 }, POT = { x: 715, y: 350 }, WATER = { x: 895, y: 400 }, CH = [{ x: 360, y: 250, s: '包饺子' }, { x: 600, y: 250, s: '不包' }];
      const DX = i => 225 + i * 90, DY = 482;
      let step = 'choose', ang = 0, lastA = null, roll = 0, lastX = null, dir = 0, passes = 0, ears = 0, earT = 0, done = false, boil = 0, waters = 0, ptr = { x: 0, y: 0 }, drag = null;
      const dums = [0, 1, 2, 3].map(i => ({ x: DX(i), y: DY, fill: false, pinch: 0, inPot: false, px: 0, py: 0 }));
      const STEPS = { mix: '和面', roll: '擀皮', fill: '放馅', pinch: '捏边', cook: '下锅' };
      const order = ['mix', 'roll', 'fill', 'pinch', 'cook'];
      const go = s => { step = s; c.progress(order.indexOf(s) / 5); c.toast(STEPS[s]); c.sfx.good(order.indexOf(s) + 1); };
      function end() { done = true; c.progress(1); c.sfx.win(); c.finish({ success: true, score: 100 - ears * 10, stats: { ears }, line: '热腾腾的饺子出锅了', delay: 1300 }); }
      return {
        start() { c.tip('选一个吧'); },
        update(dt) {
          if (step === 'ear') { earT += dt; if (earT > 4.6) { step = 'choose'; c.tip('还是包饺子吧'); } return; }
          if (step === 'boil') {
            boil = Math.min(1, boil + dt / 2.2);
            if (boil >= 1 && Math.random() < dt * 3) c.sfx.noise(.1, .06, 500, .7);
            c.tip(boil >= 1 ? '水开了，点凉水！' : `煮着……已点 ${waters} / 3 次凉水`);
          }
          if (step === 'mix') c.tip(`在盆里画圈和面 · ${Math.min(100, Math.round(ang / (TAU * 3) * 100))}%`);
          if (step === 'roll') c.tip(`左右来回擀 · ${passes} / 6`);
          if (step === 'fill') c.tip('点每张皮，放上馅');
          if (step === 'pinch') c.tip('点饺子的边，捏紧（每个三下）');
          if (step === 'cook') c.tip('把饺子拖进锅里');
        },
        down(p) {
          ptr = p;
          if (step === 'choose') {
            const k = CH.findIndex(b => Math.abs(p.x - b.x) < 100 && Math.abs(p.y - b.y) < 40);
            if (k === 0) go('mix'); else if (k === 1) { step = 'ear'; earT = 0; ears++; c.sfx.noise(.6, .12, 700, .5, 0, 'lowpass'); c.tip(''); }
            return;
          }
          if (step === 'fill') { const d = dums.find(d => !d.fill && Math.hypot(p.x - d.x, p.y - d.y) < 40); if (d) { d.fill = true; c.sfx.pop(); c.fx.burst(d.x, d.y, ['#9cbf78', '#d9a07a'], 6, 100, 2); if (dums.every(d => d.fill)) go('pinch'); } else c.sfx.soft(); }
          else if (step === 'pinch') { const d = dums.find(d => d.pinch < 3 && Math.hypot(p.x - d.x, p.y - (d.y - 8)) < 44); if (d) { d.pinch++; c.sfx.note(2 + d.pinch, .15, .12); c.fx.ring(p.x, p.y, c.C.sun, 14); if (dums.every(d => d.pinch >= 3)) go('cook'); } else c.sfx.soft(); }
          else if (step === 'cook') { drag = dums.find(d => !d.inPot && Math.hypot(p.x - d.x, p.y - d.y) < 44) || null; }
          else if (step === 'boil') {
            if (Math.hypot(p.x - WATER.x, p.y - WATER.y) < 60 || Math.hypot(p.x - POT.x, p.y - POT.y) < 140) {
              if (boil >= 1) { waters++; boil = 0; c.sfx.splash(); c.fx.text(POT.x, POT.y - 120, ['一', '二', '三'][waters - 1] + '次凉水', c.C.sunInk, 20); c.progress(.8 + waters * .066); if (waters >= 3) end(); }
              else { c.sfx.soft(); c.toast('水还没开'); }
            }
          }
        },
        move(p, pr) {
          ptr = p; if (!pr || done) return;
          if (step === 'mix') {
            const a = Math.atan2(p.y - BOWL.y, p.x - BOWL.x), inBowl = Math.hypot(p.x - BOWL.x, p.y - BOWL.y) < 140;
            if (inBowl && lastA != null) { let d = a - lastA; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; ang += Math.abs(d); if (Math.random() < .15) c.sfx.noise(.05, .05, 600, .6); if (ang >= TAU * 3) go('roll'); }
            lastA = inBowl ? a : null;
          } else if (step === 'roll') {
            if (lastX != null) { const dx = p.x - lastX; if (Math.abs(dx) > 1) { const nd = Math.sign(dx); roll += Math.abs(dx); if (nd !== dir && roll > 120) { passes++; roll = 0; c.sfx.tick(); if (passes >= 6) go('fill'); } dir = nd; } }
            lastX = p.x;
          } else if (step === 'cook' && drag) { drag.x = p.x; drag.y = p.y; }
        },
        up(p) {
          lastA = null; lastX = null;
          if (step === 'cook' && drag) {
            if (Math.hypot(p.x - POT.x, p.y - POT.y) < 140) { drag.inPot = true; drag.px = c.rnd(-50, 50); drag.py = c.rnd(-10, 14); c.sfx.splash(); if (dums.every(d => d.inPot)) { step = 'boil'; c.progress(.8); c.toast('水开了就点凉水，点三次'); } }
            else { const i = dums.indexOf(drag); drag.x = DX(i); drag.y = DY; }
            drag = null;
          }
        },
        draw(g, t) {
          c.draw.wash(g, 480, 180, 440, 160, '#efe6dc', .6, 2); c.draw.wash(g, 160, 120, 90, 60, '#f3d9a8', .35, 4);
          // 窗外小雪
          g.fillStyle = '#e9e6ef'; c.draw.ink(g, 2); g.beginPath(); g.rect(70, 60, 160, 120); g.fill(); g.stroke(); g.beginPath(); g.moveTo(150, 60); g.lineTo(150, 180); g.moveTo(70, 120); g.lineTo(230, 120); g.stroke();
          g.fillStyle = '#fff'; for (let k = 0; k < 10; k++) { g.beginPath(); g.arc(80 + (k * 47) % 140, 70 + ((t * 20 + k * 31) % 100), 2, 0, TAU); g.fill(); }
          // 大案板：台面（梯形透视）+ 前沿 + 桌腿
          g.fillStyle = '#e8d3ac'; c.draw.ink(g, 2.2, c.C.sunInk); g.beginPath(); g.moveTo(190, TOP); g.lineTo(940, TOP); g.lineTo(950, FRONT); g.lineTo(170, FRONT); g.closePath(); g.fill(); g.stroke();
          g.fillStyle = '#c9a874'; g.beginPath(); g.rect(170, FRONT, 780, 26); g.fill(); g.stroke();
          g.fillStyle = '#b48e5c'; for (const x of [190, 910]) { g.beginPath(); g.rect(x, FRONT + 26, 22, 600 - FRONT - 26); g.fill(); g.stroke(); }
          c.draw.ink(g, 1, 'rgba(154,111,60,.25)'); for (let k = 1; k < 4; k++) { const y = TOP + k * 25; g.beginPath(); g.moveTo(190 - k * 5, y); g.lineTo(940 + k * 2.5, y); g.stroke(); }
          // 拱拱站在左边的小凳上，和台面一样高
          g.fillStyle = '#c9a874'; c.draw.ink(g, 2.2, c.C.sunInk); g.beginPath(); g.rect(52, TOP + 40, 100, 16); g.fill(); g.stroke(); g.beginPath(); g.moveTo(64, TOP + 56); g.lineTo(60, 600); g.moveTo(140, TOP + 56); g.lineTo(144, 600); g.stroke();
          if (step === 'choose' || step === 'ear') {
            for (const [k, b] of CH.entries()) { g.fillStyle = k ? '#f1efe9' : '#f6e4c8'; c.draw.ink(g, 2); g.beginPath(); g.roundRect(b.x - 95, b.y - 34, 190, 68, 14); g.fill(); g.stroke(); c.draw.text(g, b.s, b.x, b.y, 26); }
            const flying = step === 'ear', u = Math.min(1, earT / 1.2), back = Math.max(0, (earT - 3.2) / 1.2);
            // 耳朵飞走时，右肩轮廓断开一个缺口；耳朵飞回来后缺口合上
            const gone = flying && back < 1, GX0 = 102, GY0 = TOP + 40, GS = 1.1;
            c.draw.gong(g, GX0, GY0, GS, { robe: ROBE, seed: 83, ground: false, mood: flying ? (back > 0 ? 'happy' : 'bow') : 'calm', bob: flying ? Math.sin(t * 20) * (1 - back) * 2 : 0, cut: gone ? { side: 'right', kind: 'gap', at: -66, size: 6 } : undefined });
            if (gone) {   // 飞走的就是缺口那一小段轮廓：从肩上弹出、打着转飘远，再飘回来补上
              const k = u - back, ex = GX0 + 29 * GS + k * 170 + Math.sin(t * 4) * 10 * k, ey = GY0 - 66 * GS - k * 90 + Math.cos(t * 3) * 6 * k;
              g.save(); g.translate(ex, ey); g.rotate(t * 3 * k); g.scale(GS, GS); c.draw.ink(g, 4.4, '#2b2925');
              g.beginPath(); g.moveTo(-4, -11); g.quadraticCurveTo(4, -4, 3, 11); g.stroke(); g.restore();
            }
            if (flying) {   // 俗语大字：画面里此刻只有这一句要看
              const a = Math.min(1, earT / .4) * Math.min(1, (4.6 - earT) / .4);
              g.save(); g.globalAlpha = a; c.draw.wash(g, 560, 120, 330, 52, '#f6e7d2', .9, 7);
              c.draw.text(g, '立冬不端饺子碗，冻掉耳朵没人管', 560, 112, 34, '#a8382f');
              g.restore();
            }
            return;
          }
          // 盆
          g.fillStyle = '#d9c4a8'; c.draw.ink(g, 2.2); g.beginPath(); g.moveTo(BOWL.x - 130, BOWL.y - 30); g.lineTo(BOWL.x + 130, BOWL.y - 30); g.quadraticCurveTo(BOWL.x + 120, BOWL.y + 80, BOWL.x, BOWL.y + 86); g.quadraticCurveTo(BOWL.x - 120, BOWL.y + 80, BOWL.x - 130, BOWL.y - 30); g.fill(); g.stroke();
          if (step === 'mix' || step === 'roll') {
            const q = Math.min(1, ang / (TAU * 3));
            if (step === 'mix') { g.fillStyle = '#f6f1e6'; for (let k = 0; k < 14; k++) { const a = k * 2.4 + ang, r = (1 - q) * 70 * ((k % 4) / 4 + .2); g.beginPath(); g.arc(BOWL.x + Math.cos(a) * r, BOWL.y - 30 + Math.sin(a) * r * .3, 14 + q * 12, 0, TAU); g.fill(); } }
            if (step === 'roll') { const w = 90 + passes * 22, pinX = c.clamp(ptr.x || 380, 200, 560); g.fillStyle = '#f6f1e6'; c.draw.ink(g, 2); g.beginPath(); g.ellipse(380, DY, w, 22 - passes * 1.5, 0, 0, TAU); g.fill(); g.stroke(); c.draw.ink(g, 10, '#b48a5a'); g.beginPath(); g.moveTo(pinX - 90, DY - 20); g.lineTo(pinX + 90, DY - 20); g.stroke(); }
          }
          // 饺子
          for (const d of dums) {
            if (step === 'mix' || step === 'roll' || d.inPot) continue;
            g.save(); g.translate(d.x, d.y);
            g.fillStyle = '#f8f4ea'; c.draw.ink(g, 2);
            if (d.pinch < 1) { g.beginPath(); g.arc(0, 0, 32, 0, TAU); g.fill(); g.stroke(); if (d.fill) { g.fillStyle = '#9cbf78'; g.beginPath(); g.arc(0, 0, 12, 0, TAU); g.fill(); g.fillStyle = '#d9a07a'; g.beginPath(); g.arc(4, 3, 6, 0, TAU); g.fill(); } }
            else dumpling(g, d.pinch);
            g.restore();
          }
          // 锅
          g.fillStyle = '#4b4f4c'; c.draw.ink(g, 2.4); g.beginPath(); g.ellipse(POT.x, POT.y + 50, 150, 30, 0, 0, Math.PI); g.lineTo(POT.x - 150, POT.y - 20); g.ellipse(POT.x, POT.y - 20, 150, 30, 0, Math.PI, 0, true); g.closePath(); g.fill(); g.stroke();
          g.fillStyle = c.mix('#cfdde0', '#eef3f2', boil); g.beginPath(); g.ellipse(POT.x, POT.y - 20, 140, 26, 0, 0, TAU); g.fill();
          for (const d of dums) if (d.inPot) { g.save(); g.translate(POT.x + d.px, POT.y - 22 + d.py + (boil >= 1 ? Math.sin(t * 8 + d.px) * 3 : 0)); g.scale(.7, .7); dumpling(g, 3); g.restore(); }
          if (step === 'boil') {
            for (let k = 0; k < 10 * boil; k++) { g.fillStyle = 'rgba(255,255,255,.8)'; g.beginPath(); g.arc(POT.x - 110 + (k * 53) % 220, POT.y - 26 + Math.sin(t * 9 + k) * 6, 4 + boil * 3, 0, TAU); g.fill(); }
            for (let k = 0; k < 3; k++) c.draw.wash(g, POT.x - 60 + k * 60, POT.y - 90 - ((t * 30 + k * 20) % 60), 26, 18, '#ffffff', .5 * boil, k);
            g.fillStyle = '#dce9ec'; c.draw.ink(g, 2); g.beginPath(); g.arc(WATER.x, WATER.y, 34, 0, Math.PI); g.closePath(); g.fill(); g.stroke(); c.draw.ink(g, 4, '#9a6f3c'); g.beginPath(); g.moveTo(WATER.x + 26, WATER.y); g.lineTo(WATER.x + 46, WATER.y - 60); g.stroke();
            c.draw.text(g, '凉水', WATER.x, WATER.y + 52, 15, c.C.mute);
            for (let k = 0; k < 3; k++) { g.fillStyle = k < waters ? c.C.sun : 'rgba(48,73,61,.18)'; g.beginPath(); g.arc(WATER.x - 20 + k * 20, WATER.y + 74, 6, 0, TAU); g.fill(); }
          }
          c.draw.gong(g, 102, TOP + 40, .95, { robe: ROBE, seed: 83, mood: step === 'boil' ? 'happy' : 'calm', arm: -.4, ground: false });
        }
      };
      function dumpling(g, pin) {
        g.fillStyle = '#f8f4ea'; c.draw.ink(g, 2); g.beginPath(); g.moveTo(-34, 6); g.quadraticCurveTo(0, -38, 34, 6); g.quadraticCurveTo(0, 22, -34, 6); g.fill(); g.stroke();
        for (let k = 0; k < pin * 2; k++) { const x = -18 + k * 7; g.beginPath(); g.moveTo(x, -10 - Math.sin((x + 34) / 68 * Math.PI) * 10); g.lineTo(x + 4, -2 - Math.sin((x + 34) / 68 * Math.PI) * 10); g.stroke(); }
      }
    }
  });

  /* ———————————————————— 19 小雪 · 滚雪人 ———————————————————— */
  SG.register(19, {
    id: 'xiaoxue-snowman', term: '小雪', title: '滚雪人', type: '物理互动',
    howto: ['雪球跟着鼠标（或方向键）滚，在有雪的地方越滚越大', '滚过的地方雪就没了，要往雪厚的地方去', '先滚一个大的当身子，再滚一个小的当头，把头推到身子上'],
    goal: '60 秒内堆好雪人，时间到还没堆好，雪人会塌掉。',
    knowledge: { head: '小雪 · 气寒将雪', text: '小雪时北方开始降雪，但雪量还小、地面还常积不住，所以叫“小雪”；南方很多地方这时并不下雪。气象上的“小雪”是指 12 小时降雪量不到 1 毫米，和节气的“小雪”不是一回事。三候：虹藏不见，天气上升地气下降，闭塞而成冬。' },
    create(c) {
      const GX = 24, GY = 9, X0 = 40, Y0 = 250, CW = 36.6, CHh = 36, snow = new Float32Array(GX * GY).fill(1);
      let ball = { x: 300, y: 420, vx: 0, vy: 0, r: 16, rot: 0 }, body = null, head = null, T = 60, done = false, phase = 'body', keys = {}, tx = 300, ty = 420, fallen = 0, crunchT = 0, flakes = [];
      for (let k = 0; k < 50; k++) flakes.push({ x: c.rnd(0, 960), y: c.rnd(0, 600), v: c.rnd(20, 45), ph: c.rnd(0, TAU) });
      const BODY = 62, HEAD = 40;
      const cell = (x, y) => { const i = Math.floor((x - X0) / CW), j = Math.floor((y - Y0) / CHh); return i >= 0 && j >= 0 && i < GX && j < GY ? j * GX + i : -1; };
      function end(ok) { done = true; ok ? c.sfx.win() : c.sfx.calm(); c.finish({ success: ok, score: ok ? Math.round(T) + 40 : 0, stats: { t: 60 - T }, line: ok ? '雪人堆好了' : '时间到，雪人塌了', delay: ok ? 1400 : 1200 }); }
      return {
        start() { c.tip('先滚一个大雪球当身子'); },
        update(dt, t) {
          for (const f of flakes) { f.y += f.v * dt; f.x += Math.sin(t + f.ph) * 12 * dt; if (f.y > 600) { f.y = -5; f.x = c.rnd(0, 960); } }
          if (fallen) { fallen += dt; return; }
          if (done) return; T -= dt; crunchT -= dt;
          for (let i = 0; i < snow.length; i++) snow[i] = Math.min(1, snow[i] + dt * .02);   // 小雪慢慢补一点
          if (keys.L) tx -= 260 * dt; if (keys.R) tx += 260 * dt; if (keys.U) ty -= 260 * dt; if (keys.D) ty += 260 * dt;
          tx = c.clamp(tx, X0, X0 + GX * CW); ty = c.clamp(ty, Y0, Y0 + GY * CHh);
          const m = 1 + ball.r / 40;
          ball.vx += ((tx - ball.x) * 5 - ball.vx) * Math.min(1, dt * 3 / m); ball.vy += ((ty - ball.y) * 5 - ball.vy) * Math.min(1, dt * 3 / m);
          ball.x += ball.vx * dt; ball.y += ball.vy * dt;
          const lo = X0 + ball.r * .6, hi = X0 + GX * CW - ball.r * .6; if (ball.x < lo || ball.x > hi) { ball.vx *= -.3; ball.x = c.clamp(ball.x, lo, hi); }
          const ly = Y0 + ball.r * .3, hy = Y0 + GY * CHh; if (ball.y < ly || ball.y > hy) { ball.vy *= -.3; ball.y = c.clamp(ball.y, ly, hy); }
          // 碰撞：滚头时不能穿过已堆好的身子（见下）
          const sp = Math.hypot(ball.vx, ball.vy); ball.rot += ball.vx * dt / ball.r;
          const i = cell(ball.x, ball.y);
          if (i >= 0 && sp > 20) {
            const take = Math.min(snow[i], dt * Math.min(1, sp / 160));   // 增长按时间算，鼠标甩得再快也不会瞬间变大
            if (take > 0) { snow[i] -= take; const cap = phase === 'body' ? BODY + 6 : HEAD; ball.r = Math.min(cap, Math.sqrt(ball.r * ball.r + take * 200)); if (crunchT <= 0) { c.sfx.noise(.08, .08, 1800, 1); crunchT = .15; } }
          }
          if (phase === 'body' && ball.r >= BODY) { body = { x: ball.x, y: ball.y, r: ball.r }; phase = 'head'; c.sfx.good(3); c.toast('身子够大了，再滚个头'); c.fx.burst(body.x, body.y - body.r, ['#ffffff', '#dfe6ee'], 14, 200, 3); ball = { x: body.x < 480 ? body.x + 200 : body.x - 200, y: 420, vx: 0, vy: 0, r: 14, rot: 0 }; tx = ball.x; ty = ball.y; }
          if (body && phase !== 'body') {
            const d = Math.hypot(ball.x - body.x, (ball.y - ball.r) - (body.y - body.r)), minD = body.r + ball.r * .9;
            if (phase === 'head' && ball.r >= HEAD - 1 && Math.hypot(ball.x - body.x, ball.y - body.y) < body.r + ball.r + 10) { head = { r: ball.r }; phase = 'done'; c.sfx.win(); c.fx.burst(body.x, body.y - body.r * 2, ['#ffffff', '#d97c6a', '#e2c37a'], 24, 240, 3); end(true); return; }
            if (d < minD) { const a = Math.atan2((ball.y - ball.r) - (body.y - body.r), ball.x - body.x); ball.x = body.x + Math.cos(a) * minD; ball.y = body.y - body.r + Math.sin(a) * minD + ball.r; ball.vx *= -.2; ball.vy *= -.2; if (ball.r < HEAD - 1 && crunchT <= 0) { c.toast('头还太小，再滚大一点'); crunchT = 1.5; } }
          }
          c.progress(phase === 'body' ? ball.r / BODY * .6 : .6 + ball.r / HEAD * .4);
          if (T <= 0) { fallen = .001; c.shake(8); c.sfx.thunder(); end(false); }
          c.tip(`${Math.ceil(Math.max(0, T))} 秒 · ` + (phase === 'body' ? '滚身子：去雪厚的地方' : ball.r < HEAD - 1 ? '滚个头' : '头够大了，推到身子旁边'));
        },
        down(p) { tx = p.x; ty = p.y; }, move(p) { tx = p.x; ty = p.y; },
        key(k, dn) { dirs(keys, k, dn); },
        draw(g, t) {
          c.draw.wash(g, 480, 120, 460, 110, '#e7e6ef', .6, 2);
          c.draw.ink(g, 1.6, '#aab0bd'); g.beginPath(); g.moveTo(0, 240); g.quadraticCurveTo(300, 200, 520, 230); g.quadraticCurveTo(760, 250, 960, 220); g.stroke();
          // 雪地：整片白雪，滚过变薄的地方露出淡褐色的土，雪越薄颜色越深
          g.fillStyle = '#fdfdfe'; c.draw.ink(g, 1.6, '#c3c8d3'); g.beginPath(); g.roundRect(X0 - 16, Y0 - 8, GX * CW + 32, GY * CHh + 24, 22); g.fill(); g.stroke();
          g.save(); g.beginPath(); g.roundRect(X0 - 16, Y0 - 8, GX * CW + 32, GY * CHh + 24, 22); g.clip();
          for (let j = 0; j < GY; j++) for (let i = 0; i < GX; i++) { const v = snow[j * GX + i]; if (v > .97) continue; g.globalAlpha = (1 - v) * .8; g.fillStyle = '#b8a582'; g.beginPath(); g.ellipse(X0 + i * CW + CW / 2, Y0 + j * CHh + CHh / 2, CW * .62, CHh * .6, 0, 0, TAU); g.fill(); }
          g.restore(); g.globalAlpha = 1;
          const sn = (x, y, r) => { g.fillStyle = '#fbfbfd'; c.draw.ink(g, 2.2, '#8a93a6'); g.beginPath(); g.arc(x, y - r, r, 0, TAU); g.fill(); g.stroke(); };
          if (body) {
            const fy = fallen ? Math.min(1, fallen * 2) : 0;
            g.save(); if (fy) { g.translate(body.x, body.y); g.scale(1 + fy * .5, 1 - fy * .55); g.translate(-body.x, -body.y); }
            sn(body.x, body.y, body.r);
            if (head) { const hy = body.y - body.r * 2 + 6; sn(body.x, hy, head.r); g.fillStyle = c.C.ink; g.beginPath(); g.arc(body.x - 10, hy - head.r - 4, 3, 0, TAU); g.arc(body.x + 10, hy - head.r - 6, 2.6, 0, TAU); g.fill(); g.fillStyle = '#e8773a'; g.beginPath(); g.moveTo(body.x, hy - head.r + 2); g.lineTo(body.x + 22, hy - head.r + 6); g.lineTo(body.x, hy - head.r + 8); g.fill(); c.draw.ink(g, 7, '#d4543e'); g.beginPath(); g.moveTo(body.x - head.r * .8, hy - 4); g.quadraticCurveTo(body.x, hy + 6, body.x + head.r * .8, hy - 4); g.lineTo(body.x + head.r * .6, hy + 26); g.stroke(); }
            g.restore();
          }
          if (!head && !fallen) { sn(ball.x, ball.y, ball.r); c.draw.ink(g, 1.2, 'rgba(138,147,166,.6)'); g.beginPath(); g.arc(ball.x, ball.y - ball.r, ball.r * .6, ball.rot, ball.rot + 1.6); g.stroke(); }
          if (!done) { c.draw.text(g, String(Math.ceil(Math.max(0, T))), 900, 60, 34, T < 10 ? '#d4543e' : c.C.ink); }
          g.fillStyle = '#fff'; for (const f of flakes) { g.beginPath(); g.arc(f.x, f.y, 2.2, 0, TAU); g.fill(); }
        }
      };
    }
  });

  /* ———————————————————— 20 大雪 · 冰场竞速 ———————————————————— */
  SG.register(20, {
    id: 'daxue-skate', term: '大雪', title: '冰场竞速', type: '反应操作',
    howto: ['冰面很滑：鼠标左右移（或左右方向键）转向，停手后还会继续滑', '按住鼠标（或 Shift / 空格）蹬冰冲刺，冲刺时方向锁住', '绕开插着小旗的薄冰，压上去会减速'],
    goal: '和对手比赛，先滑到终点。',
    knowledge: { head: '大雪 · 至此而雪盛', text: '大雪是说降雪的可能比小雪更大、积雪增多，不是说这天一定下大雪。这时北方河湖渐渐封冻，滑冰、冰嬉是传统的冬日乐趣，清代宫中还有盛大的“冰嬉”。天然冰面厚薄不均，一定要去开放的正规冰场。三候：鹖鴠不鸣，虎始交，荔挺出。' },
    create(c) {
      const LEN = 4200, LX = 230, RX = 730, SY = 470, BASE = 140, DASH = 270;
      const me = { d: 0, x: 400, vx: 0, slow: 0, dash: false, lock: 0 }, ai = { d: 0, x: 560, vx: 0, slow: 0, dash: false, lock: 0, plan: 0 };
      // 每一排薄冰只留一个缺口（宽 170），相邻缺口横向最多差 240，保证一定躲得开
      const obs = []; let gap = 480; for (let d = 520; d < LEN - 250; d += c.rnd(300, 380)) { gap = c.clamp(gap + c.rnd(-240, 240), LX + 100, RX - 100); if (Math.abs(gap - 480) < 40 && Math.random() < .6) gap += gap < 480 ? -90 : 90; const gw = 170; for (const [a, b] of [[LX, gap - gw / 2], [gap + gw / 2, RX]]) for (let x = a; b - x > 30; x += 140) obs.push({ d, x, w: Math.min(140, b - x), hit: 0 }); }
      let tx = 400, keys = {}, hold = false, holdK = 0, done = false, T = 0, warnT = 0, useKeys = false;
      const hitObs = r => obs.find(o => r.d > o.d - 18 && r.d < o.d + 18 && r.x > o.x - 6 && r.x < o.x + o.w + 6);
      function step(r, dash, steer, dt) {
        if (dash && !r.dash) r.lock = r.vx; r.dash = dash;
        if (!dash) { r.vx += steer * 900 * dt; r.vx *= Math.pow(.55, dt); r.vx = c.clamp(r.vx, -320, 320); } else r.vx = r.lock;
        r.x += r.vx * dt; if (r.x < LX + 14 || r.x > RX - 14) { r.vx = -r.vx * .4; r.lock = r.vx; r.x = c.clamp(r.x, LX + 14, RX - 14); }
        r.slow = Math.max(0, r.slow - dt);
        const v = r.slow > 0 ? BASE * .3 : dash ? DASH : BASE; /* 踩上薄冰：冲刺也没用 */ r.d = Math.min(LEN, r.d + v * dt);
        const o = hitObs(r); if (o && r.slow <= 0) { r.slow = 1.5; return o; } return null;
      }
      function end(ok) { done = true; ok ? c.sfx.win() : c.sfx.calm(); c.finish({ success: ok, score: ok ? Math.max(10, 100 - Math.round(T * 2)) : 0, stats: { t: T }, line: ok ? '第一个滑到终点' : '对手先到了终点', delay: ok ? 1200 : 700 }); }
      return {
        start() { c.tip('左右转向，按住冲刺'); },
        update(dt) {
          if (done) return; T += dt; warnT -= dt;
          let steer = 0; if (keys.L) { steer = -1; useKeys = true; } else if (keys.R) { steer = 1; useKeys = true; } else if (!useKeys) steer = c.clamp((tx - me.x) / 120, -1, 1) - me.vx / 400;
          const o = step(me, hold || holdK > 0, steer, dt);
          if (o) { c.sfx.splash(); c.sfx.noise(.3, .2, 2400, 2); c.shake(5); c.fx.burst(me.x, SY, ['#bcd3e2', '#ffffff'], 14, 200, 3); if (warnT <= 0) { c.toast('薄冰！减速了'); warnT = 2; } }
          if (me.dash && Math.random() < dt * 10) c.sfx.noise(.05, .05, 3000, 1);
          // 对手：看前方的薄冰，找缺口；前方没障碍时才冲刺
          const ahead = obs.filter(q => q.d > ai.d && q.d < ai.d + 260);
          let goal = ai.x; if (ahead.length) { const row = ahead.filter(q => q.d === ahead[0].d); const blocked = x => row.some(q => x > q.x - 24 && x < q.x + q.w + 24); if (blocked(ai.x)) { let best = ai.x, bd = 1e9; for (let x = LX + 30; x < RX - 30; x += 20) if (!blocked(x) && Math.abs(x - ai.x) < bd) { bd = Math.abs(x - ai.x); best = x; } goal = best; } }
          ai.plan -= dt; if (ai.plan <= 0) { ai.want = Math.random() < .5; ai.plan = c.rnd(.5, 1.2); }
          const clear = !obs.some(q => q.d > ai.d && q.d < ai.d + 130);
          const ao = step(ai, ai.want && clear, c.clamp((goal - ai.x) / 90, -1, 1) - ai.vx / 400, dt);
          if (ao) c.sfx.splash();
          c.progress(me.d / LEN);
          if (me.d >= LEN) end(true); else if (ai.d >= LEN) end(false);
          c.tip(me.slow > 0 ? '踩到薄冰了' : me.dash ? '冲刺中 · 方向锁住' : me.d > ai.d ? '领先' : '追上去');
        },
        down(p) { hold = true; tx = p.x; useKeys = false; }, up() { hold = false; }, move(p) { tx = p.x; useKeys = false; },
        key(k, d) { dirs(keys, k, d); if (HOLD.includes(k)) holdK = Math.max(0, holdK + (d ? 1 : -1)); },
        draw(g, t) {
          const cam = me.d, sy = d => SY - (d - cam);
          c.draw.wash(g, 480, 60, 460, 60, '#e4e4ee', .6, 2);
          g.fillStyle = '#eef0f4'; g.fillRect(0, 0, LX, c.H); g.fillRect(RX, 0, c.W - RX, c.H);
          for (let k = 0; k < 14; k++) { const y = ((k * 120 + cam * 1) % 1680) - 100; for (const x of [80 + (k % 3) * 40, 820 + (k % 2) * 50]) { c.draw.ink(g, 2, '#8a93a6'); g.beginPath(); g.moveTo(x, 600 - y); g.lineTo(x, 600 - y - 40); g.stroke(); c.draw.wash(g, x, 600 - y - 46, 22, 18, '#ffffff', .95, k); } }
          // 冰道
          g.fillStyle = '#dfeaf1'; g.fillRect(LX, 0, RX - LX, c.H); c.draw.ink(g, 2.4, '#8a93a6'); g.beginPath(); g.moveTo(LX, 0); g.lineTo(LX, c.H); g.moveTo(RX, 0); g.lineTo(RX, c.H); g.stroke();
          c.draw.ink(g, 1, 'rgba(255,255,255,.9)'); for (let k = 0; k < 10; k++) { const y = ((k * 90 + cam) % 900) - 150; g.beginPath(); g.moveTo(LX + 40 + (k * 77) % 380, y); g.lineTo(LX + 90 + (k * 77) % 380, y + 20); g.stroke(); }
          // 终点
          const fy = sy(LEN); if (fy > -20) { for (let k = 0; k < 20; k++) { g.fillStyle = k % 2 ? '#30493d' : '#f8f7f2'; g.fillRect(LX + k * 25, fy - 8, 25, 16); } c.draw.text(g, '终点', 480, fy - 26, 18); }
          for (const o of obs) { const y = sy(o.d); if (y < -40 || y > 640) continue; g.fillStyle = 'rgba(110,150,180,.45)'; c.draw.ink(g, 1.4, '#6e96b4'); g.beginPath(); g.ellipse(o.x + o.w / 2, y, o.w / 2, 16, 0, 0, TAU); g.fill(); g.stroke(); c.draw.ink(g, 1, '#6e96b4'); g.beginPath(); g.moveTo(o.x + o.w * .3, y - 6); g.lineTo(o.x + o.w * .5, y + 2); g.lineTo(o.x + o.w * .7, y - 4); g.stroke(); c.draw.ink(g, 2, c.C.ink); g.beginPath(); g.moveTo(o.x + 8, y); g.lineTo(o.x + 8, y - 34); g.stroke(); g.fillStyle = '#d4543e'; g.beginPath(); g.moveTo(o.x + 8, y - 34); g.lineTo(o.x + 28, y - 28); g.lineTo(o.x + 8, y - 22); g.fill(); }
          for (const [r, o] of [[ai, { robe: '#c8d0dc', seed: 97, fill: '#f1efe9' }], [me, { robe: ROBE, seed: 89 }]]) {
            const y = sy(r.d); if (y < -100 || y > 700) continue;
            c.draw.ink(g, 1.2, 'rgba(110,150,180,.5)'); g.beginPath(); g.moveTo(r.x - 8, y + 2); g.lineTo(r.x - 8 - r.vx * .15, y + 60); g.moveTo(r.x + 8, y + 2); g.lineTo(r.x + 8 - r.vx * .15, y + 60); g.stroke();
            g.save(); g.translate(r.x, y); g.transform(1, 0, c.clamp(-r.vx / 900, -.35, .35), 1, 0, 0);
            c.draw.gong(g, 0, 0, .6, { ...o, mood: r.slow > 0 ? 'bow' : r.dash ? 'happy' : 'calm', ground: false, bob: r.dash ? Math.sin(t * 16) * 1.5 : 0 });
            g.restore();
            if (r === me) c.draw.text(g, '我', r.x, y - 70, 14, c.C.sunInk);
          }
          // 小地图：两人的进度
          c.draw.ink(g, 4, 'rgba(48,73,61,.15)'); g.beginPath(); g.moveTo(900, 520); g.lineTo(900, 120); g.stroke();
          g.fillStyle = '#9aa6c7'; g.beginPath(); g.arc(900, 520 - ai.d / LEN * 400, 6, 0, TAU); g.fill(); g.fillStyle = c.C.sun; g.beginPath(); g.arc(900, 520 - me.d / LEN * 400, 7, 0, TAU); g.fill();
        }
      };
    }
  });

  /* ———————————————————— 21 冬至 · 九九消寒图 ———————————————————— */
  SG.register(21, {
    id: 'dongzhi-plum', term: '冬至', title: '九九消寒图', type: '艺术体验',
    howto: ['书案上是一幅九九消寒图：九朵梅花，每朵九瓣', '点一片花瓣，或按住拖过去，就染上朱红', '古人每天染一瓣，八十一瓣染完，就出了九，春天到了'],
    goal: '把八十一瓣梅花都染红。',
    knowledge: { head: '冬至 · 数九', text: '冬至这天北半球白昼最短、黑夜最长，正午日影全年最长。从冬至起“数九”，每九天为一“九”，九个九共八十一天，数完天气就暖了。九九消寒图是明清以来的习俗：画素梅九朵、每朵九瓣，每天染一瓣。三候：蚯蚓结，麋角解，水泉动。' },
    create(c) {
      const SONG = ['一九 · 不出手', '二九 · 不出手', '三九 · 冰上走', '四九 · 冰上走', '五九 · 沿河看柳', '六九 · 沿河看柳', '七九 · 河开', '八九 · 雁来', '九九加一九 · 耕牛遍地走'];
      const flowers = [];
      for (let k = 0; k < 9; k++) {
        const x = 250 + (k % 3) * 150 + (Math.floor(k / 3) % 2) * 30, y = 150 + Math.floor(k / 3) * 140;
        const pet = []; for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + i / 9 * TAU; pet.push({ x: x + Math.cos(a) * 30, y: y + Math.sin(a) * 30, a, v: 0, on: false }); }
        flowers.push({ x, y, pet, done: false });
      }
      let n = 0, done = false, lines = 0;
      function paint(p) {
        if (done) return;
        for (const f of flowers) for (const q of f.pet) if (!q.on && Math.hypot(p.x - q.x, p.y - q.y) < 15) {
          q.on = true; n++; c.sfx.note(n % 7, .5, .08); c.sfx.noise(.08, .03, 1200, .6); c.progress(n / 81);
          if (!f.done && f.pet.every(q => q.on)) { f.done = true; lines++; c.sfx.calm(); c.fx.text(f.x, f.y - 56, SONG[flowers.indexOf(f)].split(' · ')[0], c.C.sunInk, 18); }
          if (n >= 81) { done = true; setTimeout(() => { c.sfx.calm(); c.finish({ success: true, score: 81, line: '九九尽，春已归', delay: 600 }); }, 1600); }
        }
      }
      return {
        start() { c.tip('点染梅瓣'); },
        update(dt) { for (const f of flowers) for (const q of f.pet) if (q.on) q.v = Math.min(1, q.v + dt * 2.4); c.tip(`已染 ${n} / 81 瓣`); },
        down: paint, move(p, pr) { if (pr) paint(p); },
        draw(g, t) {
          // 书案
          g.fillStyle = '#d9c4a0'; g.fillRect(0, 520, c.W, 80); c.draw.ink(g, 2, c.C.sunInk); g.beginPath(); g.moveTo(0, 520); g.lineTo(c.W, 520); g.stroke();
          // 宣纸
          g.fillStyle = '#fbf8ef'; c.draw.ink(g, 1.6); g.beginPath(); g.rect(170, 50, 520, 470); g.fill(); g.stroke();
          c.draw.wash(g, 430, 290, 240, 220, '#efe9db', .35, 3);
          // 梅枝
          c.draw.ink(g, 6, '#4a4038'); g.beginPath(); g.moveTo(200, 500); g.quadraticCurveTo(300, 420, 280, 290); g.quadraticCurveTo(270, 200, 250, 150); g.moveTo(280, 330); g.quadraticCurveTo(400, 300, 460, 260); g.quadraticCurveTo(540, 220, 610, 150); g.moveTo(300, 430); g.quadraticCurveTo(420, 430, 530, 410); g.quadraticCurveTo(600, 400, 640, 430); g.stroke();
          for (const f of flowers) {
            for (const q of f.pet) {
              g.save(); g.translate(q.x, q.y); g.rotate(q.a + Math.PI / 2);
              if (q.v > 0) { c.draw.wash(g, 0, 0, 13 * (.6 + q.v * .4), 15 * (.6 + q.v * .4), '#d0453a', .85 * q.v, q.x); }
              c.draw.ink(g, 1.4, '#4a4038'); g.beginPath(); g.ellipse(0, 0, 12, 15, 0, 0, TAU); g.stroke();
              g.restore();
            }
            g.fillStyle = f.done ? c.C.sun : '#d8cfb8'; g.beginPath(); g.arc(f.x, f.y, 7, 0, TAU); g.fill();
          }
          // 数九歌：每染完一朵出现一句
          c.draw.text(g, '数九歌', 820, 70, 20);
          for (let k = 0; k < 9; k++) { const s = SONG[k], on = flowers[k].done; g.globalAlpha = on ? 1 : .22; c.draw.text(g, on ? s : s.split(' · ')[0], 740, 110 + k * 40, 16, on ? c.C.ink : c.C.mute, 'left'); g.globalAlpha = 1; }
          c.draw.gong(g, 90, 520, .95, { robe: ROBE, seed: 101, ground: false, mood: n >= 81 ? 'happy' : 'calm' });
          // 窗外淡淡的冬日：日影长
          c.draw.ink(g, 1, 'rgba(48,73,61,.25)'); g.beginPath(); g.moveTo(60, 380); g.lineTo(60, 300); g.stroke(); g.fillStyle = 'rgba(48,73,61,.12)'; g.fillRect(60, 378, 100, 4);
        }
      };
    }
  });

  /* ———————————————————— 22 小寒 · 熬腊八粥 ———————————————————— */
  SG.register(22, {
    id: 'xiaohan-laba', term: '小寒', title: '熬腊八粥', type: '轻策略',
    howto: ['水开以后，点下面的罐子把食材放进锅：难熟的要先下', '从难熟到好熟：红豆（最难熟，最先下）→ 花生 → 大米 → 红枣（最好熟，最后下）', '锅里冒大泡、发出“咕嘟”声时，按住鼠标在锅里画圈搅一搅，不然会糊底', '所有食材都软了，点“出锅”'],
    goal: '每样食材都煮软，不糊底、不煮烂，熬出一锅腊八粥。',
    knowledge: { head: '小寒 · 腊八粥', text: '小寒时天气进入一年中最冷的阶段，民间有“小寒胜大寒”的说法。小寒前后常逢农历腊月初八，有吃腊八粥的习俗；但腊八是农历日子，不是每年都落在小寒里。熬粥要先下红豆这类难熟的，再下米和枣。三候：雁北乡，鹊始巢，雉始雊。' },
    create(c) {
      const POT = { x: 480, y: 300 }, MUSH = 2.4;
      const foods = [{ n: '红豆', c: '#9a3a34', need: 12 }, { n: '花生', c: '#d9a27a', need: 8 }, { n: '大米', c: '#f3efe2', need: 5 }, { n: '红枣', c: '#b8443a', need: 3 }];
      foods.forEach((f, i) => { f.x = 240 + i * 160; f.y = 520; f.in = false; f.t = 0; f.bits = []; });
      let heat = 0, boilT = 3, bub = 0, burnt = 0, done = false, stir = 0, lastA = null, T = 0, served = false;
      function end(ok, why) { done = true; ok ? c.sfx.win() : c.sfx.calm(); c.finish({ success: ok, score: ok ? Math.max(20, 100 - burnt * 20) : 0, stats: { burnt }, line: ok ? '一锅香甜的腊八粥' : why, delay: ok ? 1200 : 700 }); }
      return {
        start() { c.tip('等水开'); },
        update(dt, t) {
          if (done) return; T += dt; heat = Math.min(1, heat + dt / 3);
          if (heat < 1) { c.tip('烧水中……'); return; }
          for (const f of foods) if (f.in) { f.t += dt; if (f.t / f.need > MUSH) { end(false, `${f.n}煮烂成糊了：它熟得快，应该晚点下`); return; } }
          if (foods.some(f => f.in)) {
            if (bub > 0) { bub += dt; if (bub > 3.2) { burnt++; bub = 0; boilT = c.rnd(3.5, 5); c.sfx.miss(); c.shake(4); c.toast(burnt < 3 ? `糊底了 · 还能再糊 ${3 - burnt} 次` : '锅底糊了'); if (burnt >= 3) { end(false, '锅底糊了，要记得搅'); return; } } }
            else { boilT -= dt; if (boilT <= 0) { bub = .001; stir = 0; c.sfx.noise(.4, .2, 300, .6, 0, 'lowpass'); c.sfx.tone(160, .25, 'sine', .25, 0, .5); } }
          }
          const all = foods.every(f => f.in), ready = foods.filter(f => f.in && f.t >= f.need).length;
          c.progress(foods.reduce((s, f) => s + (f.in ? Math.min(1, f.t / f.need) : 0), 0) / 4);
          c.tip(bub > 0 ? '咕嘟！快在锅里画圈搅一搅' : !all ? '点罐子下料：难熟的先下' : ready < 4 ? '再等等，还有没软的' : '都软了，可以出锅');
        },
        down(p) {
          if (done) return;
          if (Math.hypot(p.x - 820, p.y - 380) < 60) { // 出锅
            if (!foods.every(f => f.in)) { c.sfx.soft(); c.toast('食材还没下齐'); return; }
            const hard = foods.find(f => f.t < f.need); if (hard) { c.sfx.soft(); c.toast(`${hard.n}还硬着`); return; }
            served = true; c.fx.burst(POT.x, POT.y - 40, ['#9a3a34', '#d9a27a', '#e2c37a'], 24, 240, 3); end(true); return;
          }
          const f = foods.find(f => !f.in && Math.hypot(p.x - f.x, p.y - f.y) < 55);
          if (f) { if (heat < 1) { c.sfx.soft(); c.toast('水还没开'); return; } f.in = true; c.sfx.splash(); c.sfx.good(foods.filter(q => q.in).length + 1); for (let k = 0; k < 14; k++) f.bits.push({ x: c.rnd(-100, 100), y: c.rnd(-16, 16), ph: c.rnd(0, TAU) }); c.fx.text(POT.x, POT.y - 80, `下${f.n}`, c.C.sunInk, 18); }
          lastA = null;
        },
        move(p, pr) {
          if (!pr || bub <= 0) { lastA = null; return; }
          if (Math.hypot(p.x - POT.x, (p.y - POT.y) * 2) > 190) { lastA = null; return; }
          const a = Math.atan2((p.y - POT.y) * 2, p.x - POT.x); if (lastA != null) { let d = a - lastA; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; stir += Math.abs(d); }
          lastA = a; if (stir > Math.PI * 1.6) { bub = 0; boilT = c.rnd(3.5, 5.5); c.sfx.good(4); c.fx.ring(POT.x, POT.y, c.C.sun, 60); }
        },
        draw(g, t) {
          c.draw.wash(g, 480, 160, 440, 140, '#efe4d8', .6, 2);
          g.fillStyle = '#c8a77a'; g.fillRect(0, 470, c.W, 130); c.draw.ink(g, 2, c.C.sunInk); g.beginPath(); g.moveTo(0, 470); g.lineTo(c.W, 470); g.stroke();
          // 灶与陶锅
          g.fillStyle = '#8a6a4a'; c.draw.ink(g, 2.2); g.beginPath(); g.rect(POT.x - 190, POT.y + 50, 380, 120); g.fill(); g.stroke();
          const fl = .6 + .4 * Math.sin(t * 9); g.fillStyle = `rgba(233,140,70,${.6 * fl})`; g.beginPath(); g.ellipse(POT.x, POT.y + 110, 70, 26, 0, 0, TAU); g.fill();
          g.fillStyle = '#7a5040'; c.draw.ink(g, 2.4); g.beginPath(); g.moveTo(POT.x - 170, POT.y - 20); g.quadraticCurveTo(POT.x - 180, POT.y + 70, POT.x, POT.y + 76); g.quadraticCurveTo(POT.x + 180, POT.y + 70, POT.x + 170, POT.y - 20); g.closePath(); g.fill(); g.stroke();
          const inCnt = foods.filter(f => f.in).length, broth = inCnt ? c.mix('#e9ddd0', '#c98a7a', Math.min(1, T / 30)) : c.mix('#d5e2e6', '#eef3f2', heat);
          g.fillStyle = bub > 0 ? c.mix(broth, '#8a5a40', Math.min(1, bub / 3.2)) : broth; g.beginPath(); g.ellipse(POT.x, POT.y - 20, 165, 34, 0, 0, TAU); g.fill(); c.draw.ink(g, 2.4); g.stroke();
          for (const f of foods) if (f.in) { const soft = Math.min(1, f.t / f.need), mush = f.t / f.need > 1.6; for (const b of f.bits) { g.fillStyle = mush ? c.mix(f.c, '#c98a7a', .5) : f.c; g.beginPath(); g.ellipse(POT.x + b.x + Math.sin(t + b.ph) * 4, POT.y - 20 + b.y, 5 + soft * 2, 3.5 + soft, b.ph, 0, TAU); g.fill(); } }
          if (heat >= 1) for (let k = 0; k < (bub > 0 ? 8 : 3); k++) { const s = bub > 0 ? 10 + Math.sin(t * 6 + k) * 4 : 4; g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.arc(POT.x - 120 + (k * 37) % 240, POT.y - 24 + Math.sin(t * 5 + k) * 8, s, 0, TAU); g.fill(); }
          for (let k = 0; k < 3; k++) c.draw.wash(g, POT.x - 70 + k * 70, POT.y - 90 - ((t * 25 + k * 25) % 70), 30, 20, '#ffffff', .4 * heat, k);
          if (bub > 0) { c.draw.ink(g, 3, '#d97c6a'); g.beginPath(); g.arc(POT.x, POT.y - 20, 190, -2.6, -.5); g.stroke(); c.draw.text(g, '咕嘟', POT.x + 210, POT.y - 70, 20, '#d97c6a'); }
          // 罐子与熟度
          for (const f of foods) {
            g.globalAlpha = f.in ? .4 : 1; g.fillStyle = '#e8dcc6'; c.draw.ink(g, 2); g.beginPath(); g.moveTo(f.x - 34, f.y - 30); g.lineTo(f.x + 34, f.y - 30); g.lineTo(f.x + 40, f.y + 34); g.lineTo(f.x - 40, f.y + 34); g.closePath(); g.fill(); g.stroke();
            for (let k = 0; k < 6; k++) { g.fillStyle = f.c; g.beginPath(); g.ellipse(f.x - 22 + k * 9, f.y - 32, 5, 4, k, 0, TAU); g.fill(); } g.globalAlpha = 1;
            c.draw.text(g, f.n, f.x, f.y + 2, 16); c.draw.text(g, ['最难熟', '较难熟', '一般', '最好熟'][foods.indexOf(f)], f.x, f.y + 22, 12, c.C.mute, 'center', false);
            if (f.in) { const q = f.t / f.need; c.draw.text(g, q >= 1.6 ? '快烂了' : q >= 1 ? '软了' : '还硬', f.x, f.y + 52, 13, q >= 1.6 ? '#d4543e' : q >= 1 ? c.C.deep || '#5f9e86' : c.C.mute, 'center', false); }
          }
          // 出锅
          g.fillStyle = '#f6e4c8'; c.draw.ink(g, 2); g.beginPath(); g.arc(820, 380, 50, 0, TAU); g.fill(); g.stroke(); c.draw.text(g, '出锅', 820, 380, 20);
          c.draw.gong(g, 110, 470, 1, { robe: ROBE, seed: 103, ground: false, mood: served ? 'happy' : 'calm', arm: -.3 });
        }
      };
    }
  });

  /* ———————————————————— 23 大寒 · 写福字 ———————————————————— */
  SG.register(23, {
    id: 'dahan-fu', term: '大寒', title: '写福字', type: '艺术体验',
    howto: ['红纸上有淡淡的笔画，发亮的那一笔就是该写的', '按住鼠标，从起笔的小圆点出发，顺着笔画写到尾', '写错只重写这一笔；写出红纸会留墨渍，三处墨渍要换张纸重写'],
    goal: '按笔顺写完“福”字的十三笔。',
    knowledge: { head: '大寒 · 岁末迎新', text: '大寒是二十四节气的最后一个，常在农历岁末，人们扫尘、置年货、写春联、贴福字，准备过年。气象数据里，很多地方最冷的时候其实在小寒前后，所以有“小寒胜大寒”的说法。过了大寒，又是立春，节气轮回一周。三候：鸡始乳，征鸟厉疾，水泽腹坚。' },
    create(c) {
      const OX = 320, OY = 140, S = 3.2, PAPER = { x: 285, y: 105, w: 390, h: 390 };
      const R = [[[16, 6], [24, 18]], [[4, 28], [30, 28], [8, 60]], [[20, 44], [20, 98]], [[23, 56], [34, 70]], [[46, 8], [96, 8]], [[52, 20], [52, 40]], [[52, 20], [90, 20], [90, 40]], [[52, 40], [90, 40]], [[48, 52], [48, 96]], [[48, 52], [96, 52], [96, 96]], [[48, 74], [96, 74]], [[72, 52], [72, 96]], [[48, 96], [96, 96]]];
      const NAMES = ['点', '横撇', '竖', '点', '横', '竖', '横折', '横', '竖', '横折', '横', '竖', '横'];
      const SK = R.map(s => s.map(([x, y]) => ({ x: OX + x * S, y: OY + y * S })));
      let k = 0, cur = null, inked = [], blots = [], done = false, glow = 0;
      const segD = (p, a, b) => { const dx = b.x - a.x, dy = b.y - a.y, l = dx * dx + dy * dy || 1, u = c.clamp(((p.x - a.x) * dx + (p.y - a.y) * dy) / l, 0, 1); return Math.hypot(p.x - a.x - dx * u, p.y - a.y - dy * u); };
      const polyD = (p, s) => { let m = 1e9; for (let i = 0; i < s.length - 1; i++) m = Math.min(m, segD(p, s[i], s[i + 1])); return m; };
      const plen = s => s.reduce((L, q, i) => i ? L + Math.hypot(q.x - s[i - 1].x, q.y - s[i - 1].y) : 0, 0);
      const inPaper = p => p.x > PAPER.x && p.x < PAPER.x + PAPER.w && p.y > PAPER.y && p.y < PAPER.y + PAPER.h;
      function judge(path, s) {
        if (path.length < 2) return 'short';
        const a = path[0], b = path[path.length - 1], st = s[0], en = s[s.length - 1];
        const short = plen(s) < 60, sTol = short ? 30 : 40, avg = path.reduce((m, p) => m + polyD(p, s), 0) / path.length;
        if (Math.hypot(a.x - en.x, a.y - en.y) < sTol && Math.hypot(b.x - st.x, b.y - st.y) < sTol + 8 && !short) return 'reverse';
        if (Math.hypot(a.x - st.x, a.y - st.y) > sTol) return 'start';
        if (Math.hypot(b.x - en.x, b.y - en.y) > sTol + 10) return 'end';
        if (avg > 26) return 'shape';
        if (s.length === 3 && polyD(s[1], [{ x: path[0].x, y: path[0].y }, ...path]) > 34) return 'corner';
        return 'ok';
      }
      return {
        start() { c.tip(`第 1 笔 · ${NAMES[0]}`); },
        update(dt) { glow += dt; },
        down(p) { if (done) return; cur = [p]; c.sfx.noise(.05, .04, 1500, .6); },
        move(p, pr) {
          if (!cur || !pr || done) return;
          const l = cur[cur.length - 1]; if (Math.hypot(p.x - l.x, p.y - l.y) < 3) return;
          p.w = c.clamp(16 - Math.hypot(p.x - l.x, p.y - l.y) * .35, 6, 16); cur.push(p);
          if (!inPaper(p)) {
            blots.push({ x: p.x, y: p.y, r: c.rnd(10, 16) }); cur = null; c.sfx.miss(); c.shake(3);
            if (blots.length >= 3) { c.toast('墨渍太多，换一张纸重写'); k = 0; inked = []; blots = []; c.progress(0); } else c.toast(`写出纸外了 · 墨渍 ${blots.length} / 3`);
          }
        },
        up() {
          if (!cur || done) { cur = null; return; }
          const path = cur; cur = null; const r = judge(path, SK[k]);
          if (r === 'short') return;
          if (r === 'ok') {
            inked.push(path); k++; c.sfx.note(k % 7 + 1, .35, .14); c.fx.ring(path[path.length - 1].x, path[path.length - 1].y, c.C.sun, 20); c.progress(k / 13);
            if (k >= 13) { done = true; c.sfx.win(); c.finish({ success: true, score: 100 - blots.length * 10, stats: { blots: blots.length }, line: '福到了 · 二十四节气，一年圆满', delay: 1800 }); }
            else c.tip(`第 ${k + 1} 笔 · ${NAMES[k]}`);
            return;
          }
          const later = SK.findIndex((s, i) => i > k && judge(path, s) === 'ok');
          c.sfx.soft(); c.toast(later > 0 ? `笔顺不对：这是第 ${later + 1} 笔，先写第 ${k + 1} 笔「${NAMES[k]}」` : r === 'reverse' ? '方向反了，从小圆点起笔' : r === 'start' ? '从发亮笔画的小圆点起笔' : r === 'corner' ? '这一笔要拐个弯' : '顺着淡淡的笔画写到尾', 2000);
        },
        draw(g, t) {
          const fin = done ? Math.min(1, glow) : 0;
          c.draw.wash(g, 480, 300, 440, 260, c.mix('#efe6dc', '#f6dcb0', fin), .55, 2);
          if (done) for (const x of [120, 840]) { c.draw.wash(g, x, 160, 60 * fin, 70 * fin, '#f3c070', .5, x); g.fillStyle = '#d0453a'; c.draw.ink(g, 2); g.beginPath(); g.ellipse(x, 160, 32, 38, 0, 0, TAU); g.fill(); g.stroke(); c.draw.ink(g, 2, c.C.sun); g.beginPath(); g.moveTo(x, 198); g.lineTo(x, 230); g.stroke(); }
          // 书案、砚、笔
          g.fillStyle = '#8a6a4a'; g.fillRect(0, 520, c.W, 80);
          g.fillStyle = '#3d3a36'; c.draw.ink(g, 2); g.beginPath(); g.ellipse(800, 470, 60, 30, 0, 0, TAU); g.fill(); g.stroke();
          // 红纸（比背景深，主体一眼可见）
          g.save(); g.fillStyle = '#c8392e'; g.fillRect(PAPER.x, PAPER.y, PAPER.w, PAPER.h); g.globalAlpha = .12; g.fillStyle = '#ffffff'; for (let i = 0; i < 40; i++) g.fillRect(PAPER.x + (i * 53) % PAPER.w, PAPER.y + (i * 97) % PAPER.h, 30, 2); g.restore();
          c.draw.ink(g, 2, '#8a2a22'); g.strokeRect(PAPER.x, PAPER.y, PAPER.w, PAPER.h);
          // 引导：所有笔画淡显，当前笔画发亮
          SK.forEach((s, i) => { if (i < k) return; c.draw.ink(g, 14, i === k ? `rgba(255,226,170,${.45 + .2 * Math.sin(t * 4)})` : 'rgba(255,220,200,.16)'); g.beginPath(); s.forEach((q, j) => j ? g.lineTo(q.x, q.y) : g.moveTo(q.x, q.y)); g.stroke(); });
          if (!done && SK[k]) { const st = SK[k][0], en = SK[k][SK[k].length - 1]; g.fillStyle = '#ffe2aa'; g.beginPath(); g.arc(st.x, st.y, 8, 0, TAU); g.fill(); c.draw.ink(g, 2, '#ffe2aa'); const a = Math.atan2(en.y - SK[k][SK[k].length - 2].y, en.x - SK[k][SK[k].length - 2].x); g.beginPath(); g.moveTo(en.x - Math.cos(a - .5) * 12, en.y - Math.sin(a - .5) * 12); g.lineTo(en.x, en.y); g.lineTo(en.x - Math.cos(a + .5) * 12, en.y - Math.sin(a + .5) * 12); g.stroke(); }
          // 墨迹：按速度变粗细
          const ink = path => { g.fillStyle = '#1f1d1b'; for (let i = 1; i < path.length; i++) { const a = path[i - 1], b = path[i], w = b.w || 12; const n = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 3); for (let j = 0; j <= n; j++) { g.beginPath(); g.arc(c.lerp(a.x, b.x, j / n), c.lerp(a.y, b.y, j / n), w / 2 * (i === path.length - 1 ? .8 : 1), 0, TAU); g.fill(); } } if (path[0]) { g.beginPath(); g.arc(path[0].x, path[0].y, 8, 0, TAU); g.fill(); } };
          inked.forEach(ink); if (cur) ink(cur);
          for (const b of blots) c.draw.wash(g, b.x, b.y, b.r, b.r * .8, '#1f1d1b', .85, b.x);
          c.draw.gong(g, 140, 520, 1, { robe: ROBE, seed: 107, ground: false, mood: done ? 'happy' : 'calm' });
          if (!done) c.draw.text(g, `${k} / 13`, 760, 140, 18, c.C.mute);
        }
      };
    }
  });
})();
