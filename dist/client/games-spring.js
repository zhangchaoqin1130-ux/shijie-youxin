/* 时节 · 春季六个小游戏（草稿 v0.1）
 * 0 立春 鞭春牛（节奏）  1 雨水 春雨润麦（物理+轻策略）  2 惊蛰 春雷醒虫（反应+辨认）
 * 3 春分 春分放鸢（躲避）  4 清明 清明祭扫（制作流程）  5 谷雨 谷雨插秧（时机）
 */
(function () {
  'use strict';
  const SG = window.SeasonGames; if (!SG) return;
  const TAU = Math.PI * 2;
  const HIT = ['Enter', ' ', 'j', 'J', 'f', 'F'];

  /* ———————————————————— 0 立春 · 鞭春牛 ———————————————————— */
  SG.register(0, {
    id: 'lichun-ox', term: '立春', title: '鞭春牛', type: '反应操作',
    howto: ['金色鼓点从上方落下，落到牛背的圆圈时出鞭', '按空格键，或点击画面', '跟着节拍打，泥牛会一块块裂开'],
    goal: '打中七成以上的鼓点，泥牛开裂，五谷撒出。',
    knowledge: { head: '立春 · 鞭春牛', text: '立春是二十四节气之首。旧时官府和乡民在这天用彩鞭抽打泥塑的春牛，催促农事开始，叫“打春”。泥牛打碎后，人们抢拾碎块和里面的五谷，图个丰年的好兆头。' },
    create(c) {
      const BEAT = 60 / 80, LEAD = 4 * BEAT, FALL = 1.6;
      const bars = [[0, 1, 2, 3], [0, 2, 3], [0, 1, 2, 3], [0, 1, 1.5, 2, 3], [0, 2, 2.5, 3], [0, 1, 2, 3], [0, .5, 1, 2, 3], [0, 1, 2, 3]];
      const notes = []; bars.forEach((b, i) => b.forEach(x => notes.push({ t: LEAD + (i * 4 + x) * BEAT, j: 0 })));
      const MOTIF = [2, 3, 4, 3, 2, 1, 0, 1];
      const TX = 600, TY = 300, END = notes[notes.length - 1].t + 1.2;
      let T = -0.3, lastBeat = -1, hits = 0, perfect = 0, combo = 0, maxCombo = 0, swing = 9, done = false, cracks = [], shards = [];
      const greet = ['好', '妙'];
      function judge(n, k) { n.j = k; }
      function press() {
        swing = 0;
        let best = null, bd = 1;
        for (const n of notes) if (!n.j) { const d = Math.abs(T - n.t); if (d < bd) { bd = d; best = n; } }
        if (best && bd < .16) {
          const pf = bd < .07; judge(best, pf ? 2 : 1); hits++; if (pf) perfect++; combo++; maxCombo = Math.max(maxCombo, combo);
          c.sfx.whip(); c.sfx.drum(.45); c.sfx.note(MOTIF[(hits - 1) % 8] + (pf ? 2 : 0), .35, .16);
          c.fx.burst(TX, TY, ['#e2c37a', '#c9a06a', '#d97c6a', '#7fae68'], pf ? 16 : 9, 240, 4);
          c.fx.ring(TX, TY, pf ? c.C.sun : c.C.ink, 34); c.fx.text(TX, TY - 60, greet[pf ? 1 : 0], c.C.sunInk, pf ? 26 : 20);
          c.shake(pf ? 5 : 3);
          if (hits % 3 === 0) cracks.push({ a: c.rnd(0, TAU), x: c.rnd(-70, 70), y: c.rnd(-30, 25), l: c.rnd(14, 30) });
          if (combo > 0 && combo % 8 === 0) c.toast(`${combo} 连击`);
        } else { combo = 0; c.sfx.whip(); }
      }
      function end() {
        done = true; const ok = hits >= notes.length * .7;
        if (ok) { for (let i = 0; i < 14; i++) shards.push({ x: TX + c.rnd(-80, 80), y: TY + c.rnd(-30, 30), vx: c.rnd(-260, 260), vy: c.rnd(-420, -120), r: c.rnd(0, TAU), w: c.rnd(-6, 6) }); c.fx.burst(TX, TY, ['#e2c37a', '#c9b06a', '#a9cc93', '#e8d8a8'], 60, 380, 4); c.sfx.win(); }
        else c.sfx.calm();
        c.finish({ success: ok, score: perfect * 2 + (hits - perfect) + maxCombo, stats: { hits, perfect, maxCombo, total: notes.length }, line: ok ? '春牛开裂，五谷撒地' : `打中 ${hits} / ${notes.length}，再跟紧一点节拍`, delay: ok ? 1500 : 700 });
      }
      return {
        start() { c.tip('空格 / 点击出鞭 · 跟着“嗒、嗒”的节拍'); },
        update(dt) {
          T += dt; swing += dt;
          const b = Math.floor(T / BEAT); if (b !== lastBeat && b >= 0 && T < END - 1) { lastBeat = b; c.sfx.tick(); if (T < LEAD) c.fx.text(TX, 120, String(4 - b), c.C.mute, 30); }
          for (const n of notes) if (!n.j && T > n.t + .18) { n.j = -1; combo = 0; }
          c.progress(Math.min(1, T / END));
          if (!done && T > END) end();
        },
        after(dt) { for (const s of shards) { s.vy += 900 * dt; s.x += s.vx * dt; s.y += s.vy * dt; s.r += s.w * dt; } },
        down() { press(); },
        key(k, d) { if (d && HIT.includes(k)) press(); },
        draw(g, t) {
          const p = Math.min(1, hits / (notes.length * .7));
          // 远山与大地：随打中次数由冬转春
          c.draw.wash(g, 260, 200, 260, 90, c.mix('#d9d5e6', '#cfe2b6', p), .5, 2);
          c.draw.wash(g, 760, 180, 220, 70, c.mix('#e3e0ea', '#dbe9c6', p), .45, 5);
          c.draw.ground(g, 430, c.mix('#cfcbd8', '#bcd9a2', p));
          // 柳枝发芽
          c.draw.ink(g, 1.6); g.beginPath(); g.moveTo(80, 0); g.bezierCurveTo(90, 60, 70, 120, 96, 190); g.moveTo(130, 0); g.bezierCurveTo(140, 70, 126, 140, 146, 220); g.stroke();
          for (let i = 0; i < 9; i++) { const q = i / 9, on = p > q; g.fillStyle = on ? '#9cc77f' : '#cfd3c4'; g.beginPath(); g.ellipse(88 + Math.sin(i) * 6 + (i % 2) * 48, 30 + i * 20, on ? 6 : 3, on ? 3 : 2, .6, 0, TAU); g.fill(); }
          // 春牛
          g.save(); g.translate(TX, TY + 40);
          const ox = done && hits >= notes.length * .7;
          c.draw.ink(g, 2.4);
          g.fillStyle = ox ? '#e9dcc0' : '#d9b77a';
          g.beginPath(); g.ellipse(0, 0, 120, 62, 0, 0, TAU); g.fill(); g.stroke();
          if (!ox) { // 彩绘纹
            g.fillStyle = 'rgba(217,124,106,.55)'; g.beginPath(); g.ellipse(-20, -6, 44, 30, 0, 0, TAU); g.fill();
            g.fillStyle = 'rgba(127,174,104,.55)'; g.beginPath(); g.ellipse(52, 4, 26, 22, 0, 0, TAU); g.fill();
            c.draw.ink(g, 1.4); for (const k of cracks) { g.beginPath(); g.moveTo(k.x, k.y); g.lineTo(k.x + Math.cos(k.a) * k.l, k.y + Math.sin(k.a) * k.l); g.lineTo(k.x + Math.cos(k.a + .7) * k.l * 1.5, k.y + Math.sin(k.a + .7) * k.l * 1.5); g.stroke(); }
          } else { for (let i = 0; i < 40; i++) { g.fillStyle = ['#c9a06a', '#e2c37a', '#a9cc93'][i % 3]; g.beginPath(); g.arc(Math.sin(i * 7.3) * 90, 30 + Math.cos(i * 3.1) * 14, 3, 0, TAU); g.fill(); } }
          c.draw.ink(g, 2.4);
          g.fillStyle = '#d9b77a'; for (const lx of [-80, -40, 50, 88]) { g.beginPath(); g.rect(lx - 9, 40, 18, 60); g.fill(); g.stroke(); }
          g.beginPath(); g.ellipse(140, -30, 42, 34, -.2, 0, TAU); g.fill(); g.stroke();
          g.beginPath(); g.moveTo(120, -58); g.quadraticCurveTo(110, -96, 136, -100); g.moveTo(160, -58); g.quadraticCurveTo(176, -96, 198, -90); g.stroke();
          g.fillStyle = c.C.ink; g.beginPath(); g.arc(152, -36, 3, 0, TAU); g.fill();
          g.beginPath(); g.moveTo(-118, -10); g.quadraticCurveTo(-150, 10, -142, 50); g.stroke();
          g.restore();
          for (const s of shards) { g.save(); g.translate(s.x, s.y); g.rotate(s.r); g.fillStyle = '#d9b77a'; c.draw.ink(g, 1.4); g.beginPath(); g.moveTo(-14, -8); g.lineTo(16, -4); g.lineTo(6, 12); g.closePath(); g.fill(); g.stroke(); g.restore(); }
          // 判定圈与落下的鼓点
          const pulse = 1 + .08 * Math.max(0, 1 - ((T % BEAT) / BEAT) * 4);
          c.draw.ink(g, 2, c.C.sun); g.setLineDash([5, 7]); g.beginPath(); g.moveTo(TX, 0); g.lineTo(TX, TY - 30); g.stroke(); g.setLineDash([]);
          c.draw.ink(g, 3, c.C.sun); g.beginPath(); g.arc(TX, TY, 28 * pulse, 0, TAU); g.stroke();
          for (const n of notes) {
            if (n.j) continue; const k = (T - (n.t - FALL)) / FALL; if (k < 0 || k > 1.15) continue;
            const y = c.lerp(-20, TY, k);
            g.fillStyle = '#e2c37a'; c.draw.ink(g, 2, c.C.sunInk); g.beginPath(); g.arc(TX, y, 20, 0, TAU); g.fill(); g.stroke();
            c.draw.text(g, '春', TX, y + 1, 18, c.C.sunInk);
          }
          // 小童与鞭
          const sw = Math.min(1, swing / .18), arm = swing < .18 ? c.lerp(-1.6, .3, sw) : c.lerp(.3, -1.1, Math.min(1, (swing - .18) / .5));
          const { hx, hy } = c.draw.gong(g, 380, 440, 1.25, { arm, robe: '#a9cc93', seed: 11 });
          c.draw.ink(g, 2, '#9a6f3c'); g.beginPath(); g.moveTo(hx, hy);
          if (swing < .2) g.quadraticCurveTo(TX - 80, TY - 120, TX - 6, TY + 6); else g.quadraticCurveTo(hx + 40, hy - 90, hx + 70, hy - 20);
          g.stroke(); g.fillStyle = '#d97c6a'; g.beginPath(); g.arc(hx, hy, 4, 0, TAU); g.fill();
        }
      };
    }
  });

  /* ———————————————————— 1 雨水 · 春雨润麦 ———————————————————— */
  SG.register(1, {
    id: 'yushui-rain', term: '雨水', title: '春雨润麦', type: '物理互动',
    howto: ['左右移动雨云（鼠标、手指或方向键）', '按住画面或空格下雨，松开停雨', '云里的雨有限，别浇在已经返青的麦田上'],
    goal: '让八块麦田全部返青，雨水用完前完成。',
    knowledge: { head: '雨水 · 春雨贵如油', text: '雨水时节，气温回升，降水由雪转雨、逐渐增多。北方的冬小麦这时开始返青，正需要水，所以说“春雨贵如油”。三候：獭祭鱼，鸿雁来，草木萌动。' },
    create(c) {
      const N = 8, PW = 100, X0 = 80, GY = 470;
      const plots = Array.from({ length: N }, (_, i) => ({ x: X0 + i * PW + PW / 2, w: c.rnd(0, .12), done: false }));
      let cx = 480, tx = 480, raining = false, keyL = false, keyR = false, keyRain = false, water = 1, drops = [], spawn = 0, wasted = 0, done = false;
      const need = plots.reduce((s, p) => s + (1 - p.w), 0), CAP = need * 1.45, PER = .014;
      function plotAt(x) { const i = Math.floor((x - X0) / PW); return plots[i]; }
      function check() {
        const n = plots.filter(p => p.w >= 1).length; c.progress(n / N);
        if (!done && n === N) { done = true; c.sfx.win(); c.fx.burst(480, 380, ['#a9cc93', '#7fae68', '#cfe2b6'], 50, 300, 4); c.finish({ success: true, score: Math.round(water * 100), stats: { wasted: +wasted.toFixed(2) }, line: '八块麦田全部返青', delay: 1400 }); }
      }
      return {
        start() { c.tip('按住下雨 · 一块田变绿后就移走'); },
        update(dt, t) {
          if (keyL) tx -= 420 * dt; if (keyR) tx += 420 * dt; tx = c.clamp(tx, 90, 870);
          cx += (tx - cx) * Math.min(1, dt * 8);
          raining = (keyRain || this._hold) && water > 0 && !done;
          if (raining) {
            spawn += dt; while (spawn > .028) { spawn -= .028; drops.push({ x: cx + c.rnd(-58, 58), y: 150, v: c.rnd(480, 560) }); water = Math.max(0, water - PER / CAP); }
            if (Math.random() < dt * 6) c.sfx.drip();
          }
          for (let i = drops.length - 1; i >= 0; i--) {
            const d = drops[i]; d.y += d.v * dt;
            if (d.y >= GY - 6) {
              drops.splice(i, 1); const p = plotAt(d.x); if (!p) { wasted += PER; continue; }
              if (p.w >= 1) wasted += PER; const was = p.w; p.w = Math.min(1.5, p.w + PER);
              if (was < 1 && p.w >= 1) { c.sfx.good(2 + plots.filter(q => q.w >= 1).length % 5); c.fx.burst(p.x, GY - 30, ['#a9cc93', '#7fae68'], 12, 160, 3); c.fx.text(p.x, GY - 70, '返青', c.C.sunInk, 20); check(); }
              if (was < 1.3 && p.w >= 1.3) c.toast('水够了，移到别处吧');
              if (Math.random() < .08) c.fx.list.push({ k: 'ring', x: d.x, y: GY - 2, life: 0, max: .35, c: '#9fbcc8', r: 8 });
            }
          }
          if (!done && water <= 0 && drops.length === 0) { done = true; c.sfx.calm(); c.finish({ success: false, score: 0, line: '云里的雨用完了', delay: 500 }); }
          c.tip(`云中雨量 ${Math.round(water * 100)}%`);
        },
        down(p) { this._hold = true; tx = p.x; },
        move(p) { tx = p.x; },
        up() { this._hold = false; },
        key(k, d) { if (k === 'ArrowLeft' || k === 'a') keyL = d; else if (k === 'ArrowRight' || k === 'd') keyR = d; else if (k === ' ' || k === 'Enter') keyRain = d; },
        draw(g, t) {
          c.draw.wash(g, 480, 260, 520, 120, '#dfe6dc', .5, 4);
          c.draw.ground(g, GY, '#d8ccb0', 1);
          plots.forEach((p, i) => {
            const k = Math.min(1, p.w), col = c.mix('#bfa877', '#7fae68', k);
            if (p.w > 1.3) c.draw.wash(g, p.x, GY + 18, 44, 9, '#a9c6d1', .6, i);
            if (k < .35) { c.draw.ink(g, 1, 'rgba(48,73,61,.35)'); g.beginPath(); g.moveTo(p.x - 30, GY + 20); g.lineTo(p.x - 10, GY + 28); g.lineTo(p.x + 5, GY + 22); g.moveTo(p.x + 12, GY + 34); g.lineTo(p.x + 28, GY + 26); g.stroke(); }
            for (let s = 0; s < 6; s++) {
              const bx = p.x - 38 + s * 15, h = 18 + k * 42 + (s % 2) * 6, sway = Math.sin(t * 2 + s + i) * 3 * k;
              c.draw.ink(g, 2.2, col); g.beginPath(); g.moveTo(bx, GY + 4); g.quadraticCurveTo(bx + sway, GY - h * .6, bx + sway * 2 - 4, GY - h); g.moveTo(bx, GY + 4); g.quadraticCurveTo(bx + 6 + sway, GY - h * .5, bx + 10 + sway, GY - h * .8); g.stroke();
            }
            // 每块田的小水位
            g.fillStyle = 'rgba(48,73,61,.12)'; g.fillRect(p.x - 30, GY + 46, 60, 4);
            g.fillStyle = p.w >= 1 ? '#7fae68' : '#9fbcc8'; g.fillRect(p.x - 30, GY + 46, 60 * Math.min(1, p.w), 4);
          });
          c.draw.ink(g, 1.4, '#7fa3b3'); for (const d of drops) { g.beginPath(); g.moveTo(d.x, d.y); g.lineTo(d.x - 2, d.y + 12); g.stroke(); }
          // 雨云
          const dark = .35 + water * .5;
          g.save(); g.translate(cx, 112);
          g.fillStyle = c.mix('#eef0ef', '#b9c6cc', dark); c.draw.ink(g, 2);
          g.beginPath(); g.arc(-44, 10, 30, Math.PI * .5, Math.PI * 1.5); g.arc(-12, -14, 36, Math.PI, TAU); g.arc(34, -2, 30, Math.PI * 1.3, Math.PI * .5); g.closePath(); g.fill(); g.stroke();
          if (raining) { g.globalAlpha = .4; c.draw.ink(g, 1.2, '#7fa3b3'); for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(i * 22, 46); g.lineTo(i * 22 - 4, 60); g.stroke(); } }
          g.restore();
          // 远飞的大雁（鸿雁来）
          c.draw.ink(g, 1.6); for (let i = 0; i < 5; i++) { const bx = ((t * 30 + i * 26) % 1200) - 120, by = 60 + Math.abs(i - 2) * 12; g.beginPath(); g.moveTo(bx - 8, by - 4); g.quadraticCurveTo(bx, by, bx + 8, by - 4); g.stroke(); }
        }
      };
    }
  });

  /* ———————————————————— 2 惊蛰 · 春雷醒虫 ———————————————————— */
  SG.register(2, {
    id: 'jingzhe-bugs', term: '惊蛰', title: '春雷醒虫', type: '反应操作',
    howto: ['春雷一响，虫子从土里钻出来', '点击啃麦苗的害虫，把它们赶走', '粉色的蚯蚓会松土，不要赶它'],
    goal: '赶走 15 只害虫；麦苗被啃光就要重来。',
    knowledge: { head: '惊蛰 · 蛰虫始振', text: '“蛰”是藏在土里过冬。古人以为是春雷惊醒了虫子，其实是气温和地温回升，让它们结束冬眠。惊蛰前后也是防治病虫害、春耕开始的时候。三候：桃始华，仓庚鸣，鹰化为鸠。' },
    create(c) {
      const holes = []; [[250, 330], [480, 320], [710, 330], [190, 430], [400, 420], [600, 420], [790, 430], [300, 520], [660, 520]].forEach(([x, y]) => holes.push({ x, y, b: null }));
      let next = 1, flash = 0, driven = 0, sprouts = 6, T = 0, done = false, wave = 0;
      const WAVES = [1, 1, 2, 1, 2, 2, 2, 3, 3, 4];   // 每声春雷钻出几只：前几下简单，最后两三下集中冒出来
      function thunder() {
        flash = 1; c.sfx.thunder(); c.shake(7);
        const free = holes.filter(h => !h.b), want = WAVES[Math.min(wave, WAVES.length - 1)] + (wave >= WAVES.length && Math.random() < .5 ? -1 : 0);
        const n = Math.min(free.length, want); wave++;
        for (let i = 0; i < n; i++) {
          const h = free.splice(Math.floor(Math.random() * free.length), 1)[0];
          h.b = { worm: i > 0 && Math.random() < .25, age: -c.rnd(0, .3), up: 2.0 + n * .3, hit: 0 };   // 一次冒得多，停留也长一点
        }
        next = c.rnd(2.2, 2.6);
      }
      function end(ok) { done = true; ok ? c.sfx.win() : c.sfx.calm(); c.finish({ success: ok, score: driven * 5 + sprouts * 10, stats: { driven, sprouts }, line: ok ? '麦苗保住了' : '麦苗被啃光了', delay: ok ? 1200 : 600 }); }
      function tap(p) {
        let best = null, bd = 74;
        for (const h of holes) if (h.b && !h.b.hit && h.b.age > 0) { const d = Math.hypot(p.x - h.x, p.y - (h.y - 30)); if (d < bd) { bd = d; best = h; } }
        if (!best) { c.sfx.soft(); return; }
        const b = best.b;
        if (b.worm) { b.hit = 1; c.sfx.miss(); c.toast('蚯蚓会松土，别赶它'); c.fx.text(best.x, best.y - 70, '是益虫', c.C.mute, 18); return; }
        b.hit = 1; driven++; c.sfx.pop(); c.sfx.note(2 + driven % 5, .2, .12, .04); c.fx.burst(best.x, best.y - 30, ['#c9a06a', '#e2c37a', '#a9cc93'], 10, 200, 3); c.fx.ring(best.x, best.y - 30, c.C.sun, 26);
        c.progress(driven / 15); if (driven % 5 === 0) c.toast(`已赶走 ${driven} 只`);
        if (driven >= 15 && !done) end(true);
      }
      return {
        start() { c.tip('点击害虫 · 别碰蚯蚓'); },
        update(dt) {
          T += dt; flash = Math.max(0, flash - dt * 2.2);
          next -= dt; if (next <= 0 && !done) thunder();
          for (const h of holes) {
            const b = h.b; if (!b) continue; b.age += dt;
            if (b.hit) { b.hit += dt; if (b.hit > .5) h.b = null; continue; }
            if (b.age > b.up) {
              if (!b.worm) { sprouts--; c.sfx.miss(); c.fx.text(h.x, h.y - 60, '啃了麦苗', c.C.mute, 16); if (sprouts <= 0 && !done) end(false); }
              h.b = null;
            }
          }
        },
        down(p) { tap(p); },
        draw(g, t) {
          const p = driven / 15;
          // 桃花随进度开（桃始华）
          c.draw.wash(g, 840, 150, 150, 100, '#f1cfcf', .35 + p * .3, 3);
          c.draw.ink(g, 2.4); g.beginPath(); g.moveTo(900, 260); g.quadraticCurveTo(880, 180, 820, 120); g.moveTo(870, 190); g.quadraticCurveTo(920, 140, 940, 100); g.moveTo(840, 140); g.lineTo(780, 110); g.stroke();
          for (let i = 0; i < 14; i++) { if (i / 14 > p + .1) break; const bx = 790 + (i * 37) % 150, by = 95 + (i * 23) % 90; g.fillStyle = '#efb7bb'; g.beginPath(); g.arc(bx, by, 6, 0, TAU); g.fill(); }
          // 云与雷
          c.draw.wash(g, 360, 110, 260, 60, '#d6d9dd', .6, 8);
          if (flash > .4) { c.draw.ink(g, 3, c.C.sun); g.beginPath(); g.moveTo(400, 120); g.lineTo(370, 170); g.lineTo(392, 172); g.lineTo(360, 230); g.stroke(); }
          c.draw.ground(g, 270, '#cdbb98', 2);
          // 麦苗（生命）
          for (let i = 0; i < 6; i++) {
            const x = 90 + i * 150, alive = i < sprouts; c.draw.ink(g, 2.2, alive ? '#7fae68' : '#c3b597');
            g.beginPath(); g.moveTo(x, 590); g.quadraticCurveTo(x - 6, 566, x - 12, alive ? 548 : 580); g.moveTo(x, 590); g.quadraticCurveTo(x + 6, 562, x + 14, alive ? 552 : 584); g.stroke();
          }
          for (const h of holes) {
            g.fillStyle = 'rgba(48,73,61,.75)'; g.beginPath(); g.ellipse(h.x, h.y, 42, 13, 0, 0, TAU); g.fill();
            const b = h.b;
            if (b && b.age > 0) {
              const rise = b.hit ? Math.max(0, 1 - b.hit * 2.5) : Math.min(1, b.age / .18, (b.up - b.age) / .18);
              g.save(); g.beginPath(); g.rect(h.x - 60, h.y - 120, 120, 120); g.clip();
              g.translate(h.x, h.y + 40 - rise * 70);
              if (b.hit && !b.worm) g.rotate(b.hit * 6);
              if (b.worm) { c.draw.ink(g, 10, '#e9a3a3'); g.beginPath(); g.moveTo(0, 30); g.bezierCurveTo(-14, 10, 14, -6, 0, -26); g.stroke(); c.draw.ink(g, 1.4); for (let s = 0; s < 4; s++) { g.beginPath(); g.moveTo(-5, 20 - s * 12); g.lineTo(5, 18 - s * 12); g.stroke(); } g.fillStyle = c.C.ink; g.beginPath(); g.arc(2, -24, 1.6, 0, TAU); g.fill(); }
              else { g.fillStyle = '#7e9a5a'; c.draw.ink(g, 2.2); g.beginPath(); g.ellipse(0, 0, 20, 26, 0, 0, TAU); g.fill(); g.stroke(); g.beginPath(); g.moveTo(0, -24); g.lineTo(0, 24); g.stroke(); g.fillStyle = c.C.ink; g.beginPath(); g.arc(-8, 4, 3, 0, TAU); g.arc(8, -6, 3, 0, TAU); g.fill(); g.beginPath(); g.arc(0, -30, 10, 0, TAU); g.fill(); c.draw.ink(g, 1.6); g.beginPath(); g.moveTo(-4, -38); g.quadraticCurveTo(-10, -52, -16, -50); g.moveTo(4, -38); g.quadraticCurveTo(10, -52, 16, -50); g.stroke(); g.fillStyle = '#fff'; g.beginPath(); g.arc(-4, -32, 2.4, 0, TAU); g.arc(4, -32, 2.4, 0, TAU); g.fill(); }
              g.restore();
            }
            c.draw.ink(g, 2); g.fillStyle = '#cdbb98'; g.beginPath(); g.ellipse(h.x, h.y + 4, 46, 10, 0, 0, Math.PI); g.fill(); g.stroke();
          }
          if (flash > 0) { g.fillStyle = `rgba(255,252,240,${flash * .55})`; g.fillRect(0, 0, c.W, c.H); }
          if (!done && T > 0) c.tip(`赶走 ${driven} / 15 · 麦苗还剩 ${sprouts} 株`);
        }
      };
    }
  });

  /* ———————————————————— 3 春分 · 春分放鸢 ———————————————————— */
  SG.register(3, {
    id: 'chunfen-kite', term: '春分', title: '春分放鸢', type: '反应操作',
    howto: ['风筝会自己往上爬', '鼠标或手指移到哪里，风筝就飘向哪里；也可以用方向键上下左右', '避开别人的风筝，留意侧风'],
    goal: '把风筝放到最高处；缠线四次就要重来。',
    knowledge: { head: '春分 · 昼夜平分', text: '春分这天太阳直射赤道，全球昼夜几乎等长；此后北半球白天一天比一天长。春分正好在春季九十天的中间，风和日暖，正是放风筝的时节。三候：玄鸟至，雷乃发声，始电。' },
    create(c) {
      let kx = 480, tx = 480, vx = 0, ky = 250, ty = 250, vy = 0, keyU = false, keyD = false, h = 0, keyL = false, keyR = false, inv = 0, tangles = 0, gust = 0, gustDir = 0, gustT = 2.5, others = [], spawnT = 1.5, done = false, spin = 0, swallows = [];
      const GOAL = 1000, LIVES = 4, YMIN = 100, YMAX = 400;
      function end(ok) { done = true; ok ? c.sfx.win() : c.sfx.calm(); c.finish({ success: ok, score: Math.round(h / 10) + (LIVES - tangles) * 15, stats: { tangles }, line: ok ? '风筝飞上了高空' : '线缠住了，风筝掉下来', delay: ok ? 1200 : 600 }); }
      return {
        start() { c.tip('上下左右躲开别人的风筝'); },
        update(dt, t) {
          if (keyL) tx -= 460 * dt; if (keyR) tx += 460 * dt; tx = c.clamp(tx, 60, 900);
          if (keyU) ty -= 360 * dt; if (keyD) ty += 360 * dt; ty = c.clamp(ty, YMIN, YMAX);
          gustT -= dt; if (gustT <= 0) { gustDir = Math.random() < .5 ? -1 : 1; gust = 1.4; gustT = c.rnd(3, 5); c.sfx.noise(.9, .12, 500, .5, 0, 'lowpass'); }
          gust = Math.max(0, gust - dt);
          const push = gust > 0 ? gustDir * 190 * Math.min(1, gust) : 0;
          vx += ((tx - kx) * 6 - vx) * Math.min(1, dt * 5); kx += (vx + push) * dt; kx = c.clamp(kx, 40, 920);
          vy += ((ty - ky) * 6 - vy) * Math.min(1, dt * 5); ky = c.clamp(ky + vy * dt, YMIN - 10, YMAX + 10);
          if (!done) h = Math.min(GOAL, h + (inv > 0 ? 10 : 34) * dt);
          inv = Math.max(0, inv - dt); spin = Math.max(0, spin - dt * 2);
          c.progress(h / GOAL);
          spawnT -= dt; if (spawnT <= 0 && !done) { const dir = Math.random() < .5 ? 1 : -1; others.push({ x: dir > 0 ? -60 : 1020, y: c.rnd(40, 380), v: dir * c.rnd(80, 130), hue: ['#d97c6a', '#7fa3b3', '#e2c37a', '#9aa6c7'][Math.floor(Math.random() * 4)], ph: c.rnd(0, TAU) }); spawnT = c.rnd(2.0, 2.8) - h / GOAL * .5; }
          for (let i = others.length - 1; i >= 0; i--) {
            const o = others[i]; o.x += o.v * dt; o.y += 16 * dt + Math.sin(t * 2 + o.ph) * 10 * dt;
            if (o.x < -100 || o.x > 1060 || o.y > 700) { others.splice(i, 1); continue; }
            if (inv <= 0 && !done && Math.hypot(o.x - kx, o.y - ky) < 42) {
              tangles++; inv = 1.8; spin = 1; h = Math.max(0, h - 50); c.sfx.miss(); c.sfx.noise(.25, .2, 1500, 2); c.shake(6);
              c.toast(tangles < LIVES ? `缠线了 · 还能缠 ${LIVES - tangles} 次` : '线断了'); o.v *= -1;
              if (tangles >= LIVES) end(false);
            }
          }
          if (Math.random() < dt * .4) swallows.push({ x: -30, y: c.rnd(60, 300), v: c.rnd(160, 220) });
          for (let i = swallows.length - 1; i >= 0; i--) { const s = swallows[i]; s.x += s.v * dt; s.y += Math.sin(s.x / 40) * .6; if (s.x > 1000) swallows.splice(i, 1); }
          if (!done && h >= GOAL) { c.fx.burst(kx, ky, ['#e2c37a', '#d97c6a', '#a9cc93'], 40, 300, 4); end(true); }
          c.tip(gust > .3 ? (gustDir > 0 ? '侧风 → 往左稳住' : '← 侧风 往右稳住') : `高度 ${Math.round(h / 10)} 丈`);
        },
        down(p) { tx = p.x; ty = c.clamp(p.y, YMIN, YMAX); }, move(p) { tx = p.x; ty = c.clamp(p.y, YMIN, YMAX); },
        key(k, d) { if (k === 'ArrowLeft' || k === 'a') keyL = d; if (k === 'ArrowRight' || k === 'd') keyR = d; if (k === 'ArrowUp' || k === 'w') keyU = d; if (k === 'ArrowDown' || k === 's') keyD = d; },
        draw(g, t) {
          const q = h / GOAL;
          // 昼夜平分：左半天暖，右半天微凉，太阳与淡月各在一边
          c.draw.wash(g, 240, 200, 300, 220, c.mix('#f3e4c4', '#e8eef0', q), .55, 1);
          c.draw.wash(g, 720, 200, 300, 220, c.mix('#dfe3ee', '#e8eef0', q), .55, 6);
          g.fillStyle = '#e8c47f'; g.beginPath(); g.arc(120, 90, 26, 0, TAU); g.fill();
          c.draw.ink(g, 1.6, '#9aa6c7'); g.beginPath(); g.arc(840, 90, 20, -1.2, 1.9); g.arc(850, 86, 17, 1.7, -1, true); g.stroke();
          // 云随高度下移
          for (let i = 0; i < 6; i++) { const y = ((i * 140 + h * .9) % 840) - 120; c.draw.wash(g, (i * 263) % 900 + 40, y, 70, 18, '#ffffff', .8, i); }
          // 地面随高度沉下去
          const gy = 520 + h * 1.4;
          if (gy < 700) { c.draw.ground(g, gy, '#cfe2b6', 2); c.draw.gong(g, 480, gy + 30, 1, { arm: -1.2, robe: '#a9cc93', seed: 13 }); }
          // 风线
          if (gust > 0) { g.globalAlpha = Math.min(1, gust); c.draw.ink(g, 1.6, '#9fb3bc'); for (let i = 0; i < 6; i++) { const y = 80 + i * 70, x0 = ((t * 600 * gustDir + i * 170) % 1100 + 1100) % 1100 - 70; g.beginPath(); g.moveTo(x0, y); g.quadraticCurveTo(x0 + 40 * gustDir, y - 8, x0 + 90 * gustDir, y); g.stroke(); } g.globalAlpha = 1; }
          c.draw.ink(g, 1.6); for (const s of swallows) { g.beginPath(); g.moveTo(s.x - 12, s.y - 5); g.lineTo(s.x, s.y); g.lineTo(s.x - 12, s.y + 5); g.moveTo(s.x, s.y); g.lineTo(s.x + 8, s.y - 1); g.stroke(); }
          // 别人的风筝
          for (const o of others) { c.draw.ink(g, 1, 'rgba(48,73,61,.35)'); g.beginPath(); g.moveTo(o.x, o.y + 20); g.quadraticCurveTo(o.x + (o.v > 0 ? -80 : 80), o.y + 200, o.x + (o.v > 0 ? -140 : 140), 700); g.stroke(); kite(g, o.x, o.y, o.hue, .8, Math.sin(t * 3 + o.ph) * .15); }
          // 自己的风筝与线
          c.draw.ink(g, 1.3, c.C.ink); g.beginPath(); g.moveTo(kx, ky + 26); g.quadraticCurveTo(kx * .6 + 190, 460, 480, Math.min(gy - 30, 640)); g.stroke();
          if (!(inv > 0 && Math.floor(t * 10) % 2)) kite(g, kx, ky, '#a9cc93', 1.1, (vx / 600) + spin * 6, true);
        }
      };
      function kite(g, x, y, col, s, rot, mine) {
        g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s); c.draw.ink(g, 2);
        g.fillStyle = col; g.beginPath(); g.moveTo(0, -36); g.lineTo(28, 0); g.lineTo(0, 30); g.lineTo(-28, 0); g.closePath(); g.fill(); g.stroke();
        g.beginPath(); g.moveTo(0, -36); g.lineTo(0, 30); g.moveTo(-28, 0); g.lineTo(28, 0); g.stroke();
        if (mine) { g.fillStyle = c.C.paper; g.beginPath(); g.arc(0, -8, 7, 0, TAU); g.fill(); g.fillStyle = c.C.sun; g.beginPath(); g.arc(0, -8, 4, 0, TAU); g.fill(); }
        g.beginPath(); g.moveTo(0, 30); for (let i = 1; i <= 4; i++) g.quadraticCurveTo((i % 2 ? 10 : -10), 30 + i * 12 - 6, 0, 30 + i * 12); g.stroke();
        g.fillStyle = '#d97c6a'; for (let i = 1; i <= 3; i++) { g.beginPath(); g.ellipse(0, 30 + i * 14, 5, 3, 0, 0, TAU); g.fill(); }
        g.restore();
      }
    }
  });

  /* ———————————————————— 4 清明 · 清明祭扫 ———————————————————— */
  SG.register(4, {
    id: 'qingming-tomb', term: '清明', title: '清明祭扫', type: '制作体验',
    howto: ['按顺序完成祭扫：拔草、扫叶、擦碑、献花、鞠躬', '拔草：按住杂草向上拖', '扫叶、擦碑：按住来回拖动；献花：把菊花拖到碑前'],
    goal: '把烈士墓清理干净，献上花，行三鞠躬。',
    knowledge: { head: '清明 · 慎终追远', text: '清明既是节气也是节日。“万物生长此时，皆清洁而明净”，故名清明。人们在这天扫墓祭祖、缅怀先烈，也踏青、插柳、植树。三候：桐始华，田鼠化为鴽，虹始见。' },
    create(c) {
      const S = { x: 400, y: 150, w: 160, h: 260 }, BASEY = 430;
      const STEPS = ['拔去碑前的杂草', '扫开台阶上的落叶', '擦净碑面的尘土', '把菊花放到碑前', '行三鞠躬'];
      let step = 0, done = false, ptr = { x: 0, y: 0, on: false }, last = null, bows = 0, bowT = 9, flower = { x: 120, y: 520, drag: false, placed: false }, rain = [];
      const weeds = [[330, 445], [370, 452], [600, 448], [640, 455], [300, 470], [690, 472]].map(([x, y]) => ({ x, y, pull: 0, gone: 0, held: false, sx: x, sy: y }));
      const leaves = Array.from({ length: 12 }, (_, i) => ({ x: 330 + (i * 47) % 300, y: 470 + (i * 13) % 40, vx: 0, vy: 0, r: i, ox: 0, oy: 0, away: 0 }));
      leaves.forEach(l => { l.ox = l.x; l.oy = l.y; });
      const GX = 16, GY = 24, dirt = Array.from({ length: GX * GY }, () => c.rnd(.7, 1));
      for (let i = 0; i < 60; i++) rain.push({ x: c.rnd(0, 960), y: c.rnd(0, 600), v: c.rnd(200, 260) });
      function advance() {
        c.sfx.good(step + 1); c.fx.ring(480, 300, c.C.sun, 60);
        step++; c.progress(step / STEPS.length);
        if (step < STEPS.length) { c.tip(`第 ${step + 1} 步 · ${STEPS[step]}`); c.toast(STEPS[step]); }
      }
      return {
        start() { c.tip(`第 1 步 · ${STEPS[0]}`); c.sfx.calm(); },
        update(dt, t) {
          for (const r of rain) { r.y += r.v * dt; r.x -= 20 * dt; if (r.y > 600) { r.y = -10; r.x = c.rnd(0, 980); } }
          for (const w of weeds) if (w.gone) w.gone += dt;
          for (const l of leaves) { l.x += l.vx * dt; l.y += l.vy * dt; l.vx *= .9; l.vy *= .9; if (l.away) l.away += dt; }
          if (step === 4 && bowT < 9) bowT += dt;
        },
        down(p) {
          ptr = { ...p, on: true }; last = p;
          if (step === 0) { for (const w of weeds) if (!w.gone && Math.hypot(p.x - w.x, p.y - w.y + 18) < 34) { w.held = true; w.sy0 = p.y; c.sfx.tick(); break; } }
          if (step === 3 && !flower.placed && Math.hypot(p.x - flower.x, p.y - flower.y) < 60) flower.drag = true;
          if (step === 4 && bowT > 1.1 && !done) { bowT = 0; bows++; c.sfx.note(4 - bows, 1.4, .12); if (bows >= 3) { done = true; c.progress(1); setTimeout(() => { c.sfx.win(); c.finish({ success: true, score: 100, line: '墓碑洁净，花已献上', delay: 400 }); }, 1300); } else c.tip(`行三鞠躬 · ${bows} / 3`); }
        },
        move(p, pressed) {
          const dx = last ? p.x - last.x : 0, dy = last ? p.y - last.y : 0; ptr = { ...p, on: pressed }; last = p;
          if (!pressed) return;
          if (step === 0) for (const w of weeds) if (w.held) {
            w.pull = Math.max(0, (w.sy0 - p.y) / 70);
            if (w.pull >= 1) { w.held = false; w.gone = .001; c.sfx.noise(.12, .25, 700, 1); c.fx.burst(w.x, w.y, ['#a68b62', '#7fae68'], 8, 150, 3); if (weeds.every(x => x.gone)) advance(); }
          }
          if (step === 1) for (const l of leaves) if (!l.away && Math.hypot(p.x - l.x, p.y - l.y) < 52) {
            l.vx += dx * 9 + (l.x - p.x) * 2; l.vy += dy * 5 - 30;
            if (Math.hypot(l.x - l.ox, l.y - l.oy) > 110) { l.away = .001; c.sfx.noise(.08, .1, 2500, 1); if (leaves.every(x => x.away)) advance(); }
          }
          if (step === 2 && p.x > S.x && p.x < S.x + S.w && p.y > S.y && p.y < S.y + S.h) {
            const amt = Math.min(.4, Math.hypot(dx, dy) / 60);
            for (let i = 0; i < GX; i++) for (let j = 0; j < GY; j++) { const cx = S.x + (i + .5) * S.w / GX, cy = S.y + (j + .5) * S.h / GY, d = Math.hypot(p.x - cx, p.y - cy); if (d < 34) dirt[j * GX + i] = Math.max(0, dirt[j * GX + i] - amt * (1 - d / 34)); }
            if (Math.random() < .2) c.sfx.noise(.05, .05, 3000, 1);
            const avg = dirt.reduce((a, b) => a + b, 0) / dirt.length;
            c.tip(`第 3 步 · 擦净碑面的尘土 ${Math.round((1 - avg) * 100)}%`);
            if (avg < .1) { dirt.fill(0); c.fx.burst(480, 280, ['#ffffff', c.C.sun], 18, 200, 3); advance(); }
          }
          if (step === 3 && flower.drag) { flower.x = p.x; flower.y = p.y; }
        },
        up() {
          ptr.on = false; for (const w of weeds) { if (w.held) { w.held = false; w.pull = 0; } }
          if (step === 3 && flower.drag) { flower.drag = false; if (Math.abs(flower.x - 480) < 90 && Math.abs(flower.y - BASEY) < 70) { flower.placed = true; flower.x = 480; flower.y = BASEY + 6; advance(); } else { flower.x = 120; flower.y = 520; c.toast('放到碑前的台上'); } }
        },
        key(k, d) { if (d && step === 4 && HIT.includes(k)) this.down({ x: 0, y: 0 }); },
        draw(g, t) {
          c.draw.wash(g, 480, 210, 460, 160, '#dfe6dc', .55, 9);
          // 松柏
          for (const [x, s] of [[190, 1], [770, 1.1]]) { c.draw.ink(g, 2.4); g.beginPath(); g.moveTo(x, 470); g.lineTo(x, 250); g.stroke(); for (let k = 0; k < 4; k++) { g.fillStyle = '#7f9e86'; g.beginPath(); g.moveTo(x, 190 + k * 50); g.lineTo(x - 60 * s + k * 6, 260 + k * 50); g.lineTo(x + 60 * s - k * 6, 260 + k * 50); g.closePath(); g.fill(); g.stroke(); } }
          c.draw.ground(g, 470, '#c9dcb6', 4);
          // 台基与碑
          c.draw.ink(g, 2.4); g.fillStyle = '#e9e6dc'; g.fillRect(320, BASEY - 20, 320, 40); g.strokeRect(320, BASEY - 20, 320, 40);
          g.fillStyle = '#efede6'; g.beginPath(); g.moveTo(S.x, S.y + S.h); g.lineTo(S.x, S.y + 20); g.quadraticCurveTo(S.x + S.w / 2, S.y - 26, S.x + S.w, S.y + 20); g.lineTo(S.x + S.w, S.y + S.h); g.closePath(); g.fill(); g.stroke();
          g.fillStyle = '#b9824f'; g.beginPath(); g.arc(480, S.y + 22, 9, 0, TAU); g.fill();
          ['烈', '士', '之', '墓'].forEach((ch, i) => c.draw.text(g, ch, 480, S.y + 70 + i * 46, 32, '#30493d'));
          // 尘土层
          for (let i = 0; i < GX; i++) for (let j = 0; j < GY; j++) { const v = dirt[j * GX + i]; if (v < .03) continue; const cx = S.x + (i + .5) * S.w / GX, cy = S.y + (j + .5) * S.h / GY; if (cy < S.y + 20 - Math.sin((cx - S.x) / S.w * Math.PI) * 40) continue; g.fillStyle = `rgba(150,128,96,${v * .55})`; g.beginPath(); g.arc(cx, cy, 8 + (i * j) % 4, 0, TAU); g.fill(); }
          // 杂草
          for (const w of weeds) {
            if (w.gone > .8) continue; const lift = w.gone ? 60 + w.gone * 300 : w.pull * 26, a = w.gone ? 1 - w.gone / .8 : 1;
            g.save(); g.globalAlpha = a; g.translate(w.x + (w.gone ? w.gone * 80 : 0), w.y - lift); c.draw.ink(g, 2, '#6f9a58');
            for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(k * 8, -18, k * 12 + Math.sin(t * 2 + k) * 2, -34 - (2 - Math.abs(k)) * 6); g.stroke(); }
            if (w.pull > 0 || w.gone) { c.draw.ink(g, 1.2, '#a68b62'); g.beginPath(); g.moveTo(0, 0); g.lineTo(-4, 10 + w.pull * 8); g.moveTo(0, 0); g.lineTo(5, 12 + w.pull * 6); g.stroke(); }
            g.restore();
          }
          // 落叶
          for (const l of leaves) { if (l.away > .6) continue; g.save(); g.globalAlpha = l.away ? 1 - l.away / .6 : 1; g.translate(l.x, l.y); g.rotate(l.r + l.x / 30); g.fillStyle = l.r % 2 ? '#c9a06a' : '#b6a27a'; c.draw.ink(g, 1.2); g.beginPath(); g.ellipse(0, 0, 11, 5, 0, 0, TAU); g.fill(); g.stroke(); g.restore(); }
          // 菊花
          if (step >= 3 || flower.placed) { g.save(); g.translate(flower.x, flower.y); c.draw.ink(g, 2, '#6f9a58'); for (const k of [-10, 0, 10]) { g.beginPath(); g.moveTo(0, 30); g.lineTo(k, -6); g.stroke(); } for (const [k, yy] of [[-10, -10], [0, -16], [10, -10]]) { g.fillStyle = '#f2ecd8'; for (let a = 0; a < 10; a++) { g.beginPath(); g.ellipse(k + Math.cos(a / 10 * TAU) * 6, yy + Math.sin(a / 10 * TAU) * 6, 5, 2.2, a / 10 * TAU, 0, TAU); g.fill(); } g.fillStyle = '#e2c37a'; g.beginPath(); g.arc(k, yy, 3, 0, TAU); g.fill(); } g.restore(); }
          // 鞠躬的人
          const bowK = bowT < 1.1 ? Math.sin(Math.min(1, bowT / 1.1) * Math.PI) : 0;
          c.draw.gong(g, 250, 560, 1.1, { robe: '#b8c7bd', bow: bowK, mood: bowK > .4 ? 'bow' : 'calm', seed: 17 });
          // 细雨
          c.draw.ink(g, 1, 'rgba(127,163,179,.45)'); for (const r of rain) { g.beginPath(); g.moveTo(r.x, r.y); g.lineTo(r.x - 3, r.y + 10); g.stroke(); }
          // 当前工具跟随指针
          if (ptr.x && step < 4) {
            g.save(); g.translate(ptr.x, ptr.y); c.draw.ink(g, 2);
            if (step === 1) { g.rotate(-.5); g.beginPath(); g.moveTo(0, -60); g.lineTo(0, 0); g.stroke(); g.fillStyle = '#d8c18a'; g.beginPath(); g.moveTo(-14, 0); g.lineTo(14, 0); g.lineTo(20, 26); g.lineTo(-20, 26); g.closePath(); g.fill(); g.stroke(); }
            if (step === 2) { g.fillStyle = '#ffffff'; g.beginPath(); g.rect(-18, -12, 36, 24); g.fill(); g.stroke(); g.beginPath(); g.moveTo(-12, -4); g.lineTo(12, -4); g.moveTo(-12, 4); g.lineTo(12, 4); g.stroke(); }
            g.restore();
          }
          if (step === 3 && !flower.placed) { g.setLineDash([6, 6]); c.draw.ink(g, 1.6, c.C.sun); g.strokeRect(400, BASEY - 50, 160, 70); g.setLineDash([]); }
        }
      };
    }
  });

  /* ———————————————————— 5 谷雨 · 谷雨插秧 ———————————————————— */
  SG.register(5, {
    id: 'guyu-rice', term: '谷雨', title: '谷雨插秧', type: '制作体验',
    howto: ['秧绳上有六个绳结，手会沿着秧绳来回移动', '手停在绳结上时按空格或点击，插下一株秧', '一行插满就往后退一步，插下一行'],
    goal: '60 秒内插满四行，共 24 株。',
    knowledge: { head: '谷雨 · 雨生百谷', text: '谷雨是春季最后一个节气，取“雨生百谷”之意：降雨明显增多，正适合谷物生长。南方这时忙着插秧。“手把青秧插满田，低头便见水中天”，插秧要一边插一边往后退，所以又说“退步原来是向前”。' },
    create(c) {
      const COLS = 6, ROWS = 4, RX0 = 230, RDX = 100, ROWY = 420, GAP = 70, LIMIT = 60;
      let row = 0, planted = [], hand = 0, dir = 1, speed = 1.0, T = 0, done = false, scroll = 0, scrollTo = 0, splash = [], rowSet = new Set(), total = 0, straight = 0, rainT = 0;
      const xs = Array.from({ length: COLS }, (_, i) => RX0 + i * RDX);
      function end(ok) { done = true; ok ? c.sfx.win() : c.sfx.calm(); c.finish({ success: ok, score: straight * 3 + Math.max(0, Math.round(LIMIT - T)), stats: { total, time: Math.round(T) }, line: ok ? '一田青秧插满了' : `时间到，插了 ${total} 株`, delay: ok ? 1200 : 600 }); }
      function plant() {
        if (done) return;
        const hx = c.lerp(xs[0] - 40, xs[COLS - 1] + 40, hand);
        let bi = -1, bd = 1e9; xs.forEach((x, i) => { if (!rowSet.has(i)) { const d = Math.abs(x - hx); if (d < bd) { bd = d; bi = i; } } });
        if (bi < 0) return;
        if (bd < 34) {
          rowSet.add(bi); total++; const perfect = bd < 12; if (perfect) straight++;
          planted.push({ x: xs[bi], r: row, tilt: perfect ? 0 : (hx - xs[bi]) / 80, born: T });
          c.sfx.splash(); c.sfx.note(rowSet.size + 1, .25, .14, .03); c.fx.ring(xs[bi], ROWY, '#9fbcc8', 22);
          if (perfect) c.fx.text(xs[bi], ROWY - 50, '正', c.C.sunInk, 20);
          c.progress(total / (COLS * ROWS));
          if (rowSet.size === COLS) {
            rowSet = new Set(); row++; speed += .12; scrollTo = row * GAP; c.sfx.good(4);
            if (row >= ROWS) end(true); else c.toast(`退一步 · 第 ${row + 1} 行`);
          }
        } else { c.sfx.splash(); c.sfx.miss(); splash.push({ x: hx, t: 0 }); c.fx.text(hx, ROWY - 40, '没对准', c.C.mute, 16); }
      }
      return {
        start() { c.tip('手到绳结上时插秧'); },
        update(dt) {
          T += dt; hand += dir * dt * speed * .55; if (hand > 1) { hand = 1; dir = -1; } if (hand < 0) { hand = 0; dir = 1; }
          scroll += (scrollTo - scroll) * Math.min(1, dt * 4);
          for (const s of splash) s.t += dt; splash = splash.filter(s => s.t < .6);
          rainT += dt;
          if (!done && T > LIMIT) end(false);
          c.tip(`还剩 ${Math.max(0, Math.ceil(LIMIT - T))} 秒 · 第 ${Math.min(ROWS, row + 1)} / ${ROWS} 行`);
        },
        down() { plant(); },
        key(k, d) { if (d && HIT.includes(k)) plant(); },
        draw(g, t) {
          // 水田倒映天空
          g.fillStyle = '#e4eef0'; g.fillRect(0, 0, c.W, c.H);
          c.draw.wash(g, 300, 160, 160, 40, '#ffffff', .9, 2); c.draw.wash(g, 700, 260, 200, 46, '#ffffff', .8, 5);
          c.draw.wash(g, 160, 120, 90, 50, '#f4e7c6', .7, 1);
          c.draw.ink(g, 1, 'rgba(127,163,179,.4)'); for (let i = 0; i < 12; i++) { const y = (i * 53 + t * 8) % 600; g.beginPath(); g.moveTo(40 + (i * 97) % 600, y); g.lineTo(140 + (i * 97) % 600, y); g.stroke(); }
          // 田埂
          c.draw.ink(g, 2.4); g.fillStyle = '#cdbb98'; g.fillRect(0, 0, 120, c.H); g.fillRect(840, 0, 120, c.H); g.beginPath(); g.moveTo(120, 0); g.lineTo(120, c.H); g.moveTo(840, 0); g.lineTo(840, c.H); g.stroke();
          // 已插秧苗：越早的行越往上
          for (const p of planted) {
            const y = ROWY - (row - p.r) * GAP + (scrollTo - scroll), grow = Math.min(1, (T - p.born) * 3);
            if (y < -40) continue;
            g.save(); g.translate(p.x, y); g.rotate(p.tilt); c.draw.ink(g, 2.2, '#6f9a58');
            for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(k * 4, -14 * grow, k * 7 + Math.sin(t * 1.6 + p.x) * 1.5, -28 * grow); g.stroke(); }
            c.draw.ink(g, 1, 'rgba(111,154,88,.35)'); g.beginPath(); g.moveTo(0, 2); g.lineTo(0, 16 * grow); g.stroke();
            g.restore();
          }
          // 秧绳与绳结
          if (row < ROWS) {
            c.draw.ink(g, 1.4, '#9a6f3c'); g.beginPath(); g.moveTo(120, ROWY + 4); g.lineTo(840, ROWY + 4); g.stroke();
            xs.forEach((x, i) => { if (rowSet.has(i)) return; g.fillStyle = '#c9a06a'; g.beginPath(); g.arc(x, ROWY + 4, 6, 0, TAU); g.fill(); c.draw.ink(g, 1.4, c.C.sun); g.beginPath(); g.arc(x, ROWY + 4, 26, 0, TAU); g.globalAlpha = .35; g.stroke(); g.globalAlpha = 1; });
            // 手与秧把
            const hx = c.lerp(xs[0] - 40, xs[COLS - 1] + 40, hand);
            g.save(); g.translate(hx, ROWY - 20); c.draw.ink(g, 2.2); g.fillStyle = '#fbf3e6'; g.beginPath(); g.ellipse(0, 0, 13, 10, 0, 0, TAU); g.fill(); g.stroke();
            c.draw.ink(g, 2, '#6f9a58'); for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(k * 2, -6); g.lineTo(k * 5, -34); g.stroke(); }
            g.restore();
            // 插秧人（退着走）
            c.draw.gong(g, 480, 560, 1.05, { arm: -.9, robe: '#a9cc93', bob: Math.sin(t * 3) * 2, seed: 19 });
            c.draw.ink(g, 2, '#9a6f3c'); g.beginPath(); g.ellipse(480, 470, 40, 9, 0, 0, TAU); g.stroke();
          }
          for (const s of splash) { c.draw.ink(g, 2 * (1 - s.t / .6), '#7fa3b3'); g.beginPath(); g.arc(s.x, ROWY, 10 + s.t * 50, 0, TAU); g.stroke(); }
          // 谷雨细雨
          c.draw.ink(g, 1, 'rgba(127,163,179,.5)'); for (let i = 0; i < 40; i++) { const x = (i * 131) % 960, y = (i * 71 + rainT * 220) % 620 - 10; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 2, y + 9); g.stroke(); }
        }
      };
    }
  });
})();
