/* 时节 · 秋季六个小游戏（草稿 v0.1）
 * 12 立秋 一叶知秋（物理）  13 处暑 稻田守望（轻策略）  14 白露 收清露（物理解谜）
 * 15 秋分 晒秋（拖拽）  16 寒露 登高赛（竞速）  17 霜降 霜前抢收（连续操作）
 * 角色统一用 IP 拱拱（c.draw.gong），秋季淡彩为米黄。
 */
(function () {
  'use strict';
  const SG = window.SeasonGames; if (!SG) return;
  const TAU = Math.PI * 2;
  const ROBE = '#efd4a4';
  const HOLD = ['Shift', ' ', 'Enter', 'j', 'J', 'f', 'F', 'ArrowUp', 'w', 'W'];

  /* ———————————————————— 12 立秋 · 一叶知秋 ———————————————————— */
  SG.register(12, {
    id: 'liqiu-leaf', term: '立秋', title: '一叶知秋', type: '物理互动',
    howto: ['梧桐叶一片片飘下来', '按住鼠标划一下，就是一阵风：顺着你划的方向吹', '把叶子吹进拱拱脚边的竹篮'],
    goal: '60 秒内吹进 10 片梧桐叶。',
    knowledge: { head: '立秋 · 一叶知秋', text: '“梧桐一叶落，天下尽知秋”：古人看见梧桐落叶，就知道秋天要来了。立秋是秋季的开始，但不等于马上变凉，很多地方还有“秋老虎”，真正入秋要等日平均气温稳定降到 22℃ 以下。三候：凉风至，白露降，寒蝉鸣。' },
    create(c) {
      const BX = 760, BY = 520, GOAL = 10;
      let leaves = [], got = 0, T = 60, done = false, spawnT = 0, last = null, trail = [], swishT = 0;
      const add = () => leaves.push({ x: c.rnd(140, 460), y: 150, vx: c.rnd(-10, 20), vy: 20, r: c.rnd(0, TAU), vr: c.rnd(-2, 2), ph: c.rnd(0, TAU), rest: 0 });
      function end(ok) { done = true; ok ? c.sfx.win() : c.sfx.calm(); c.finish({ success: ok, score: got * 8 + Math.round(T), stats: { got }, line: ok ? '一篮梧桐叶：秋天来了' : '叶子都落在地上了', delay: ok ? 1200 : 600 }); }
      function blow(p) {
        if (!last) { last = p; return; }
        const dx = p.x - last.x, dy = p.y - last.y, len = Math.hypot(dx, dy); if (len < 2) return;
        trail.push({ x: p.x, y: p.y, a: 1 });
        for (const l of leaves) { const d = Math.hypot(l.x - p.x, l.y - p.y); if (d < 110) { const k = (1 - d / 110) * 7; l.vx += dx * k; l.vy += dy * k; l.rest = 0; l.vr += c.rnd(-3, 3); } }
        if (swishT <= 0 && len > 8) { c.sfx.noise(.25, .07, 900, .6, 0, 'lowpass'); swishT = .18; }
        last = p;
      }
      return {
        start() { c.tip('划一下鼠标，送一阵风'); },
        update(dt, t) {
          if (done) return; T -= dt; swishT -= dt; spawnT -= dt;
          if (spawnT <= 0 && leaves.length < 7) { add(); spawnT = c.rnd(.55, .95); }
          for (let k = leaves.length - 1; k >= 0; k--) {
            const l = leaves[k];
            if (l.y >= 556) { l.y = 556; l.vy = 0; l.vx *= .9; l.rest += dt; if (l.rest > 4) { leaves.splice(k, 1); continue; } }
            else { l.vy += 40 * dt; l.vx += Math.sin(t * 1.5 + l.ph) * 30 * dt; }
            l.vx *= Math.pow(.25, dt); l.vy = Math.min(l.vy * Math.pow(.4, dt), 260); l.vy = Math.max(l.vy, -380);
            l.x += l.vx * dt; l.y += l.vy * dt; l.r += l.vr * dt; if (l.x < 10 || l.x > 950) l.vx = -l.vx * .5; l.x = c.clamp(l.x, 10, 950); l.y = Math.max(l.y, 20);
            if (Math.abs(l.x - BX) < 66 && l.y > BY - 44 && (l.vy >= 0 || l.y >= 556)) {   // 落进篮口，或贴着地面被吹进篮里都算
              leaves.splice(k, 1); got++; c.sfx.good(2 + got % 4); c.fx.burst(BX, BY - 20, ['#d9b262', '#a9cc93'], 10, 160, 3); c.progress(got / GOAL);
              if (got >= GOAL) { end(true); return; }
            }
          }
          for (let k = trail.length - 1; k >= 0; k--) { trail[k].a -= dt * 2.5; if (trail[k].a <= 0) trail.splice(k, 1); }
          if (T <= 0) end(false);
          c.tip(`篮里 ${got} / ${GOAL} 片`);
        },
        down(p) { last = p; }, move(p, pr) { if (pr) blow(p); else last = null; }, up() { last = null; },
        draw(g, t) {
          const q = got / GOAL;
          c.draw.wash(g, 480, 200, 460, 200, c.mix('#f6e6c4', '#e9efe6', q), .55, 2);
          // 热浪随落叶消退
          if (q < 1) { c.draw.ink(g, 1.4, `rgba(217,124,106,${.35 * (1 - q)})`); for (let k = 0; k < 5; k++) { const x = 560 + k * 80; g.beginPath(); for (let y = 120; y < 420; y += 10) { const xx = x + Math.sin(y / 20 + t * 3 + k) * 5; y === 120 ? g.moveTo(xx, y) : g.lineTo(xx, y); } g.stroke(); } }
          c.draw.ground(g, 560, '#e6d6ad', 2);
          // 梧桐
          c.draw.ink(g, 10, '#8a6a44'); g.beginPath(); g.moveTo(260, 565); g.quadraticCurveTo(250, 380, 280, 200); g.moveTo(272, 300); g.quadraticCurveTo(340, 250, 400, 200); g.stroke();
          c.draw.wash(g, 300, 150, 190, 90, '#a9c98a', .8, 3); c.draw.wash(g, 230, 180, 110, 60, '#c8c46d', .7, 7); c.draw.wash(g, 400, 170, 100, 60, '#d9b262', .6, 5);
          for (const l of leaves) leaf(g, l.x, l.y, l.r);
          // 风痕
          for (const s of trail) { g.globalAlpha = s.a * .6; c.draw.wash(g, s.x, s.y, 14, 6, '#cfe0dc', 1, 1); } g.globalAlpha = 1;
          // 竹篮 + 拱拱
          c.draw.gong(g, 870, 562, 1, { robe: ROBE, seed: 53, face: -1, mood: got ? 'happy' : 'calm' });
          g.fillStyle = '#e4cf9c'; c.draw.ink(g, 2.2, c.C.sunInk); g.beginPath(); g.moveTo(BX - 62, BY - 30); g.lineTo(BX + 62, BY - 30); g.lineTo(BX + 48, BY + 36); g.lineTo(BX - 48, BY + 36); g.closePath(); g.fill(); g.stroke();
          for (let k = 0; k < Math.min(got, 10); k++) leaf(g, BX - 40 + (k % 5) * 20, BY - 34 - Math.floor(k / 5) * 8, k);
          c.draw.ink(g, 1, c.C.sunInk); for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(BX + k * 22, BY - 30); g.lineTo(BX + k * 17, BY + 36); g.stroke(); }
        }
      };
      function leaf(g, x, y, r) {
        g.save(); g.translate(x, y); g.rotate(r); g.fillStyle = '#d9b262'; c.draw.ink(g, 1.4, '#9a6f3c');
        g.beginPath(); g.moveTo(0, -13); for (let k = 1; k <= 5; k++) { const a = -Math.PI / 2 + k / 5 * Math.PI * 2; g.quadraticCurveTo(Math.cos(a - .6) * 7, Math.sin(a - .6) * 7, Math.cos(a) * 13, Math.sin(a) * 13); } g.closePath(); g.fill(); g.stroke();
        g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 16); g.stroke(); g.restore();
      }
    }
  });

  /* ———————————————————— 13 处暑 · 稻田守望 ———————————————————— */
  SG.register(13, {
    id: 'chushu-scarecrow', term: '处暑', title: '稻田守望', type: '轻策略',
    howto: ['稻子熟了，麻雀成群飞来啄谷', '拖动三个稻草人去守护稻田；放稳的稻草人才吓得走麻雀，拖在手上时不管用', '也可以直接点麻雀把它赶走'],
    goal: '守住稻田 35 秒，别让稻谷被啄光。',
    knowledge: { head: '处暑 · 暑气至此而止', text: '“处”是停止的意思，处暑就是炎热到这里告一段落，早晚开始转凉。这时许多地方的稻谷渐渐成熟，三候里的“禾乃登”说的就是谷物成熟、可以收获了。三候：鹰乃祭鸟，天地始肃，禾乃登。' },
    create(c) {
      const DUR = 35, patches = [];
      for (let r = 0; r < 2; r++) for (let k = 0; k < 4; k++) patches.push({ x: 150 + k * 220, y: 300 + r * 150, g: 1 });
      const crows = [{ x: 60, y: 590 }, { x: 120, y: 590 }, { x: 180, y: 590 }];   // 开局靠在田埂角落，要玩家自己摆
      let T = 0, done = false, birds = [], spawnT = 1.2, drag = null, chirpT = 0;
      const total = () => patches.reduce((s, p) => s + p.g, 0) / patches.length;
      function end(ok) { done = true; ok ? c.sfx.win() : c.sfx.calm(); c.finish({ success: ok, score: Math.round(total() * 100), stats: { left: total() }, line: ok ? '稻谷守住了，禾乃登' : '稻谷被麻雀啄光了', delay: ok ? 1200 : 600 }); }
      function scare(b) { if (b.st === 'flee') return; b.st = 'flee'; const a = Math.atan2(b.y - 300, b.x - 480); b.vx = Math.cos(a) * 320; b.vy = -220; c.sfx.tone(1500, .06, 'triangle', .08, 0, 1.4); c.fx.burst(b.x, b.y, ['#b49a62', '#8a6a44'], 5, 120, 2); }
      return {
        start() { c.tip('拖动稻草人，守住稻田'); },
        update(dt, t) {
          if (done) return; T += dt; chirpT -= dt; spawnT -= dt;
          const live = birds.filter(b => b.st !== 'flee').length;
          if (spawnT <= 0 && live < 3 + (T > 25 ? 1 : 0)) { const left = Math.random() < .5, tgt = patches.filter(p => p.g > 0)[Math.floor(Math.random() * 8) % Math.max(1, patches.filter(p => p.g > 0).length)]; if (tgt) birds.push({ x: left ? -30 : 990, y: c.rnd(80, 200), tgt, st: 'fly', vx: 0, vy: 0, eat: 0, ph: c.rnd(0, TAU) }); spawnT = c.rnd(1.3, 2.1) - T / DUR * .4; }
          for (let k = birds.length - 1; k >= 0; k--) {
            const b = birds[k];
            if (b.st === 'flee') { b.x += b.vx * dt; b.y += b.vy * dt; if (b.y < -40 || b.x < -60 || b.x > 1020) birds.splice(k, 1); continue; }
            for (const s of crows) if (s !== drag && Math.hypot(s.x - b.x, s.y - 50 - b.y) < 95) { scare(b); break; }
            if (b.st === 'flee') continue;
            if (b.st === 'fly') { const dx = b.tgt.x - b.x, dy = b.tgt.y - 20 - b.y, d = Math.hypot(dx, dy); if (d < 6) b.st = 'eat'; else { b.x += dx / d * 150 * dt; b.y += dy / d * 150 * dt; } }
            else { b.eat += dt; b.tgt.g = Math.max(0, b.tgt.g - dt * .065); if (chirpT <= 0) { c.sfx.tone(2200, .04, 'sine', .05, 0, 1.2); chirpT = .4; } if (b.tgt.g <= 0) { b.st = 'fly'; const alive = patches.filter(p => p.g > 0); if (alive.length) b.tgt = alive[Math.floor(Math.random() * alive.length)]; else scare(b); } }
          }
          c.progress(T / DUR);
          if (total() <= .2) end(false); else if (T >= DUR) end(true);
          c.tip(`稻谷还剩 ${Math.round(total() * 100)}%`);
        },
        down(p) {
          for (const b of birds) if (b.st !== 'flee' && Math.hypot(b.x - p.x, b.y - p.y) < 50) { scare(b); c.fx.ring(b.x, b.y, c.C.sun, 24); return; }
          let best = null, bd = 80; for (const s of crows) { const d = Math.hypot(s.x - p.x, s.y - 50 - p.y); if (d < bd) { bd = d; best = s; } }
          drag = best; if (drag) c.sfx.soft();
        },
        move(p, pr) { if (drag && pr) { drag.x = c.clamp(p.x, 40, 920); drag.y = c.clamp(p.y + 50, 250, 580); } },
        up() { drag = null; },
        draw(g, t) {
          c.draw.wash(g, 480, 110, 460, 90, '#eef0e4', .6, 2); c.draw.wash(g, 820, 80, 50, 40, c.C.sun, .3, 4);
          c.draw.ground(g, 230, '#e6d6ad', 2);
          for (const p of patches) {
            g.fillStyle = c.mix('#d8cfb2', '#efd393', p.g); c.draw.ink(g, 1.6); g.beginPath(); g.ellipse(p.x, p.y, 90, 46, 0, 0, TAU); g.fill(); g.stroke();
            for (let k = 0; k < 9; k++) { const sx = p.x - 64 + (k % 5) * 32 + (k > 4 ? 16 : 0), sy = p.y - 8 + (k > 4 ? 18 : 0), sw = Math.sin(t * 2 + k) * 2; c.draw.ink(g, 1.6, '#9a7a3c'); g.beginPath(); g.moveTo(sx, sy + 14); g.quadraticCurveTo(sx + 2, sy - 6, sx + 8 + sw, sy - 10); g.stroke(); if (p.g > k / 9) { g.fillStyle = '#e2b960'; g.beginPath(); g.ellipse(sx + 8 + sw, sy - 10, 4, 7, .6, 0, TAU); g.fill(); } }
          }
          for (const s of crows) {
            c.draw.ink(g, 3, '#8a6a44'); g.beginPath(); g.moveTo(s.x, s.y); g.lineTo(s.x, s.y - 90); g.moveTo(s.x - 34, s.y - 66); g.lineTo(s.x + 34, s.y - 66); g.stroke();
            g.fillStyle = '#e4cf9c'; c.draw.ink(g, 2); g.beginPath(); g.arc(s.x, s.y - 98, 14, 0, TAU); g.fill(); g.stroke();
            g.fillStyle = '#c9a06a'; g.beginPath(); g.moveTo(s.x - 22, s.y - 104); g.lineTo(s.x + 22, s.y - 104); g.lineTo(s.x, s.y - 128); g.closePath(); g.fill(); g.stroke();
            g.fillStyle = '#d97c6a'; g.beginPath(); g.rect(s.x - 16, s.y - 70, 32, 26); g.fill(); g.stroke();
            if (s === drag) { g.setLineDash([4, 6]); c.draw.ink(g, 1.4, 'rgba(201,160,106,.6)'); g.beginPath(); g.arc(s.x, s.y - 50, 95, 0, TAU); g.stroke(); g.setLineDash([]); } else { g.fillStyle = 'rgba(201,160,106,.08)'; g.beginPath(); g.arc(s.x, s.y - 50, 95, 0, TAU); g.fill(); }
          }
          for (const b of birds) { const fl = Math.sin(t * 22 + b.ph) * (b.st === 'eat' ? .2 : 1); g.save(); g.translate(b.x, b.y); g.fillStyle = '#8a6a44'; c.draw.ink(g, 1.4); g.beginPath(); g.ellipse(0, 0, 12, 8, 0, 0, TAU); g.fill(); g.stroke(); g.beginPath(); g.moveTo(-4, -2); g.lineTo(-14, -10 - fl * 8); g.lineTo(4, -4); g.stroke(); g.fillStyle = c.C.ink; g.beginPath(); g.arc(8, -3, 1.5, 0, TAU); g.fill(); g.restore(); }
          c.draw.gong(g, 880, 210, .8, { robe: ROBE, seed: 59, face: -1, mood: total() > .7 ? 'happy' : 'calm' });
        }
      };
    }
  });

  /* ———————————————————— 14 白露 · 收清露 ———————————————————— */
  SG.register(14, {
    id: 'bailu-dew', term: '白露', title: '收清露', type: '物理互动',
    howto: ['清晨，露珠在最上层的草叶上凝出来', '点一片叶子，它就换个方向倾斜，露珠会顺着往低处滚', '让露珠一层层滚下去，落进拱拱的碗里'],
    goal: '太阳升起之前（45 秒），收满 7 滴清露。',
    knowledge: { head: '白露 · 露凝而白', text: '白露时夜里降温明显、昼夜温差变大，空气里的水汽在草叶上凝结成露珠，古人说“阴气渐重，露凝而白”。露不是从天上降下来的，是近地面的水汽遇冷凝结出来的。太阳一晒就蒸发了，所以收露要趁早。三候：鸿雁来，玄鸟归，群鸟养羞。' },
    create(c) {
      const HL = 72, BOWL = { x: 565, y: 530, w: 54 }, GOAL = 7;
      const leaves = [[240, 170], [480, 170], [720, 170], [360, 290], [600, 290], [480, 410]].map(([x, y], k) => ({ x, y, tilt: k % 2 ? 1 : -1, a: 0, k }));
      [-1, 1, -1, 1, -1, -1].forEach((v, k) => { leaves[k].tilt = v; leaves[k].a = v * .28; });   // 默认走向不进碗，得自己改
      let drops = [], T = 45, got = 0, lost = 0, done = false, spawnT = .4, windT = 5;
      function end(ok) { done = true; ok ? c.sfx.win() : c.sfx.calm(); c.finish({ success: ok, score: got * 10 - lost, stats: { got, lost }, line: ok ? '一碗清露，凉凉的' : '太阳出来，露水蒸发了', delay: ok ? 1200 : 600 }); }
      const ends = l => ({ x: l.x + Math.cos(l.a) * HL * Math.sign(l.tilt), y: l.y + Math.sin(Math.abs(l.a)) * HL });
      return {
        start() { c.tip('点叶子，改变它倾斜的方向'); },
        update(dt) {
          if (done) return; T -= dt; spawnT -= dt;
          if (spawnT <= 0 && drops.length < 3) { const l = leaves[Math.floor(Math.random() * 3)]; drops.push({ l, u: 0, du: 0, x: l.x, y: l.y, vx: 0, vy: 0, grow: 0 }); spawnT = c.rnd(1.6, 2.2); c.sfx.drip(); }
          windT -= dt; if (windT <= 0) { const l = leaves[5].tilt > 0 && Math.random() < .5 ? leaves[5] : leaves[3 + Math.floor(Math.random() * 2)]; l.tilt *= -1; windT = c.rnd(5.5, 7); c.sfx.noise(.6, .08, 600, .5, 0, 'lowpass'); c.toast('晨风吹动了一片草叶'); c.fx.ring(l.x, l.y, '#9fc3d1', 26); }
          for (const l of leaves) l.a += (l.tilt * .28 - l.a) * Math.min(1, dt * 10);
          for (let k = drops.length - 1; k >= 0; k--) {
            const d = drops[k];
            if (d.l) {
              d.grow = Math.min(1, d.grow + dt * 2); if (d.grow < 1) { d.x = d.l.x; d.y = d.l.y - 6; continue; }
              d.du += Math.sin(d.l.a) * 2.6 * dt; d.du *= Math.pow(.6, dt); d.u += d.du * dt;
              d.x = d.l.x + Math.cos(d.l.a) * d.u * HL; d.y = d.l.y + Math.sin(d.l.a) * d.u * HL - 6;
              if (Math.abs(d.u) > 1) { d.vx = d.du * HL * .5; d.vy = 0; d.from = d.l; d.l = null; }
              continue;
            }
            const py = d.y; d.vy += 600 * dt; d.x += d.vx * dt; d.y += d.vy * dt;
            const land = leaves.find(l => { if (l === d.from || Math.abs(d.x - l.x) > Math.cos(l.a) * HL) return false; const sy = l.y + Math.tan(l.a) * (d.x - l.x) - 6; return py <= sy + 2 && d.y >= sy; });
            if (land) { d.l = land; d.u = (d.x - land.x) / (Math.cos(land.a) * HL); d.du = 0; d.grow = 1; c.sfx.tone(1400, .05, 'sine', .06); continue; }
            if (Math.abs(d.x - BOWL.x) < BOWL.w && d.y > BOWL.y - 20) { drops.splice(k, 1); got++; c.sfx.note(3 + got % 4, .4, .14); c.fx.ring(BOWL.x, BOWL.y - 10, '#9fc3d1', 28); c.progress(got / GOAL); if (got >= GOAL) { end(true); return; } continue; }
            if (d.y > 560) { drops.splice(k, 1); lost++; c.sfx.splash(); c.fx.burst(d.x, 560, ['#9fc3d1', '#cfe3ea'], 6, 120, 2); }
          }
          if (T <= 0) end(false);
          c.tip(`碗里 ${got} / ${GOAL} 滴`);
        },
        down(p) {
          let best = null, bd = 70; for (const l of leaves) { const d = Math.hypot(p.x - l.x, (p.y - l.y) * 1.6); if (d < bd) { bd = d; best = l; } }
          if (best) { best.tilt *= -1; c.sfx.tone(600, .06, 'triangle', .07); c.fx.ring(best.x, best.y, c.C.sun, 20); } else c.sfx.soft();
        },
        draw(g, t) {
          const q = 1 - T / 45, sunY = 560 - q * 360;
          c.draw.wash(g, 480, 200, 460, 200, c.mix('#e6ebee', '#f3e7cf', q), .6, 2);
          g.save(); g.beginPath(); g.rect(0, 0, c.W, 556); g.clip(); g.fillStyle = '#efc58a'; g.globalAlpha = .7; g.beginPath(); g.arc(860, sunY, 30, 0, TAU); g.fill(); g.restore();
          // 晨雾与芦苇
          c.draw.wash(g, 150, 500, 200, 40, '#ffffff', .5, 3); c.draw.wash(g, 820, 480, 220, 40, '#ffffff', .5, 6);
          c.draw.ink(g, 1.6, '#b49a62'); for (let k = 0; k < 7; k++) { const x = 40 + k * 22, s = Math.sin(t + k) * 4; g.beginPath(); g.moveTo(x, 600); g.quadraticCurveTo(x + s, 480, x + s * 2, 380 + k * 6); g.stroke(); c.draw.wash(g, x + s * 2, 372 + k * 6, 5, 14, '#d9cfb2', .9, k); }
          c.draw.ground(g, 556, '#cfe0c4', 2);
          // 草茎
          c.draw.ink(g, 2.4, '#6f9a58'); g.beginPath(); for (const l of leaves) { g.moveTo(l.x, l.y); g.lineTo(l.x + (l.k % 2 ? 10 : -10), 556); } g.stroke();
          for (const l of leaves) { g.save(); g.translate(l.x, l.y); g.rotate(l.a); g.fillStyle = '#9cc490'; c.draw.ink(g, 2, '#4f7a4a'); g.beginPath(); g.moveTo(-HL - 4, 0); g.quadraticCurveTo(0, -16, HL + 4, 0); g.quadraticCurveTo(0, 12, -HL - 4, 0); g.fill(); g.stroke(); g.beginPath(); g.moveTo(-HL, 0); g.lineTo(HL, 0); g.stroke(); g.restore(); const e = ends(l); c.draw.ink(g, 1.4, 'rgba(201,160,106,.55)'); g.beginPath(); g.moveTo(e.x, e.y + 6); g.lineTo(e.x, e.y + 16); g.stroke(); }
          for (const d of drops) { const r = 7 * (d.l ? d.grow : 1); g.fillStyle = 'rgba(190,220,232,.85)'; c.draw.ink(g, 1.4, '#7fa3b3'); g.beginPath(); g.arc(d.x, d.y, r, 0, TAU); g.fill(); g.stroke(); g.fillStyle = '#fff'; g.beginPath(); g.arc(d.x - r * .35, d.y - r * .35, r * .3, 0, TAU); g.fill(); }
          // 碗与拱拱
          g.fillStyle = '#f1ece0'; c.draw.ink(g, 2.2); g.beginPath(); g.moveTo(BOWL.x - BOWL.w, BOWL.y - 16); g.lineTo(BOWL.x + BOWL.w, BOWL.y - 16); g.quadraticCurveTo(BOWL.x + BOWL.w - 4, BOWL.y + 26, BOWL.x, BOWL.y + 26); g.quadraticCurveTo(BOWL.x - BOWL.w + 4, BOWL.y + 26, BOWL.x - BOWL.w, BOWL.y - 16); g.fill(); g.stroke();
          g.fillStyle = 'rgba(159,195,209,.7)'; g.beginPath(); g.ellipse(BOWL.x, BOWL.y - 14, (BOWL.w - 6) * Math.min(1, got / GOAL + .1), 5, 0, 0, TAU); g.fill();
          c.draw.gong(g, 690, 562, .95, { robe: ROBE, seed: 61, face: -1, arm: 2.6, mood: got > 4 ? 'happy' : 'calm' });
        }
      };
    }
  });

  /* ———————————————————— 15 秋分 · 晒秋 ———————————————————— */
  SG.register(15, {
    id: 'qiufen-shaiqiu', term: '秋分', title: '晒秋', type: '拖拽互动',
    howto: ['收回来的辣椒、玉米、黄豆、菊花一筐筐放在院子里', '把每一筐拖到屋顶上对应的晒匾', '每只晒匾晒两筐就满，四只都满，屋顶就是一幅晒秋图'],
    goal: '每种收成晒两筐，一共 8 筐。',
    knowledge: { head: '秋分 · 昼夜均而寒暑平', text: '秋分这天太阳又直射赤道，昼夜几乎等长，此后北半球夜比昼长。秋分前后正是收获的季节，自 2018 年起，每年秋分是“中国农民丰收节”。江西婺源等山区村落把收成晾在屋顶竹匾里，叫“晒秋”。三候：雷始收声，蛰虫坯户，水始涸。' },
    create(c) {
      const kinds = [{ n: '辣椒', c: '#d9574a' }, { n: '玉米', c: '#e8b33c' }, { n: '黄豆', c: '#d8c07a' }, { n: '菊花', c: '#f0d24a' }];
      const trays = kinds.map((k, i) => ({ ...k, i, x: 210 + i * 180, y: 205, cnt: 0 }));
      const order = []; for (let r = 0; r < 2; r++) for (let i = 0; i < 4; i++) order.push(i); order.sort(() => Math.random() - .5);
      const slots = [{ x: 180 }, { x: 330 }, { x: 480 }].map(s => ({ ...s, y: 520, b: null }));
      let drag = null, placed = 0, done = false, T = 0;
      const refill = () => { for (const s of slots) if (!s.b && order.length) s.b = { k: order.pop(), x: s.x, y: s.y, home: s }; };
      refill();
      function end() { done = true; c.sfx.win(); c.finish({ success: true, score: 100 - Math.min(40, Math.round(T)), stats: { t: T }, line: '屋顶晒满了秋色', delay: 1400 }); }
      return {
        start() { c.tip('把筐拖到同色的晒匾上'); },
        update(dt) { T += dt; c.tip(`已晒 ${placed} / 8 筐`); },
        down(p) { for (const s of slots) if (s.b && Math.hypot(p.x - s.b.x, p.y - s.b.y) < 60) { drag = s.b; c.sfx.soft(); return; } },
        move(p, pr) { if (drag && pr) { drag.x = p.x; drag.y = p.y; } },
        up(p) {
          if (!drag || done) return; const b = drag; drag = null;
          const t = trays.find(t => Math.hypot(p.x - t.x, p.y - t.y) < 85);
          if (t && t.i === b.k && t.cnt < 2) { t.cnt++; placed++; b.home.b = null; c.sfx.good(1 + t.i + t.cnt); c.fx.burst(t.x, t.y, [t.c, c.C.sun], 14, 200, 3); c.progress(placed / 8); refill(); if (placed >= 8) end(); }
          else { if (t) { c.sfx.miss(); c.toast(`这只匾晒的是${t.n}`); } b.x = b.home.x; b.y = b.home.y; }
        },
        draw(g, t) {
          // 一半昼一半夜，各占一边
          c.draw.wash(g, 240, 100, 280, 90, '#f6e6c4', .6, 2); c.draw.wash(g, 720, 100, 280, 90, '#dcdde8', .6, 5);
          g.fillStyle = '#e8c47f'; g.beginPath(); g.arc(90, 70, 22, 0, TAU); g.fill(); c.draw.ink(g, 1.6, '#9aa6c7'); g.beginPath(); g.arc(880, 70, 18, -1.2, 1.9); g.arc(888, 66, 15, 1.7, -1, true); g.stroke();
          // 徽派屋顶
          g.fillStyle = '#7b8784'; c.draw.ink(g, 2.4); g.beginPath(); g.moveTo(80, 300); g.lineTo(140, 170); g.lineTo(840, 170); g.lineTo(900, 300); g.closePath(); g.fill(); g.stroke();
          c.draw.ink(g, 1, 'rgba(255,255,255,.25)'); for (let x = 150; x < 840; x += 16) { g.beginPath(); g.moveTo(x, 172); g.lineTo(x - 20 + (x - 480) * .08, 298); g.stroke(); }
          g.fillStyle = '#f2efe6'; c.draw.ink(g, 2.4); g.beginPath(); g.rect(110, 300, 760, 120); g.fill(); g.stroke();
          g.fillStyle = '#4a4a46'; g.beginPath(); g.moveTo(90, 300); g.lineTo(130, 286); g.lineTo(850, 286); g.lineTo(890, 300); g.closePath(); g.fill();
          for (const tr of trays) {
            g.fillStyle = '#d8c18a'; c.draw.ink(g, 2, c.C.sunInk); g.beginPath(); g.ellipse(tr.x, tr.y, 74, 30, 0, 0, TAU); g.fill(); g.stroke(); if (tr.cnt < 2) { g.setLineDash([5, 6]); c.draw.ink(g, 2.4, tr.c); g.beginPath(); g.ellipse(tr.x, tr.y, 64, 24, 0, 0, TAU); g.stroke(); g.setLineDash([]); }
            g.save(); g.beginPath(); g.ellipse(tr.x, tr.y, 68, 26, 0, 0, TAU); g.clip();
            for (let k = 0; k < tr.cnt * 20; k++) { const a = k * 2.4, r = Math.sqrt(k / 40) * 64; g.fillStyle = tr.c; g.beginPath(); g.ellipse(tr.x + Math.cos(a) * r, tr.y + Math.sin(a) * r * .4, tr.i === 0 ? 8 : 5, tr.i === 0 ? 3 : 4, a, 0, TAU); g.fill(); }
            g.restore();
            c.draw.text(g, tr.cnt < 2 ? `${tr.n} ${tr.cnt}/2` : `${tr.n} 晒满`, tr.x, 340, 16, tr.cnt < 2 ? c.C.mute : c.C.sunInk);
          }
          c.draw.ground(g, 450, '#e6d6ad', 3);
          c.draw.gong(g, 760, 560, 1, { robe: ROBE, seed: 67, face: -1, mood: placed > 4 ? 'happy' : 'calm' });
          for (const s of slots) { g.fillStyle = 'rgba(48,73,61,.08)'; g.beginPath(); g.ellipse(s.x, s.y + 30, 50, 10, 0, 0, TAU); g.fill(); }
          for (const s of slots) if (s.b && s.b !== drag) basket(g, s.b);
          if (drag) basket(g, drag);
        }
      };
      function basket(g, b) {
        const k = kinds[b.k]; g.fillStyle = '#e4cf9c'; c.draw.ink(g, 2, c.C.sunInk);
        g.beginPath(); g.moveTo(b.x - 44, b.y - 10); g.lineTo(b.x + 44, b.y - 10); g.lineTo(b.x + 34, b.y + 28); g.lineTo(b.x - 34, b.y + 28); g.closePath(); g.fill(); g.stroke();
        for (let i = 0; i < 9; i++) { g.fillStyle = k.c; g.beginPath(); g.ellipse(b.x - 30 + i * 7.5, b.y - 14 - (i % 3) * 3, b.k === 0 ? 7 : 5, b.k === 0 ? 3 : 4, i, 0, TAU); g.fill(); }
        c.draw.text(g, k.n, b.x, b.y + 46, 14, c.C.mute, 'center', false);
      }
    }
  });

  /* ———————————————————— 16 寒露 · 登高赛 ———————————————————— */
  SG.register(16, {
    id: 'hanlu-climb', term: '寒露', title: '登高赛', type: '反应操作',
    howto: ['山道弯弯，拱拱自己会往上走', '按住鼠标（或 Shift / 空格）冲刺：快，但冲刺时转不了弯', '到拐角的树前要松手，冲过去会撞树；碎石路上冲刺会绊倒'],
    goal: '和对手比赛，先登上山顶。',
    knowledge: { head: '寒露 · 露气寒冷', text: '寒露比白露更冷，露水寒得快要凝成霜了，深秋景色渐浓。北京香山的红叶多在 10 月中下旬到 11 月上旬最好看，主要是黄栌，也有元宝枫、火炬树等。寒露前后常逢重阳节，登高、赏菊、插茱萸都是这个时节的风俗。三候：鸿雁来宾，雀入大水为蛤（古人的想象），菊有黄华。' },
    create(c) {
      const P = [[110, 560], [830, 520], [150, 430], [820, 345], [230, 262], [700, 182], [480, 96]];
      const seg = []; let L = 0; for (let k = 0; k < P.length - 1; k++) { const [a, b] = [P[k], P[k + 1]], l = Math.hypot(b[0] - a[0], b[1] - a[1]); seg.push({ a, b, s: L, l }); L += l; }
      const corners = seg.slice(1).map(s => s.s), rocks = [[seg[1].s + 260, 170], [seg[3].s + 300, 170], [seg[5].s + 120, 120]];
      const WALK = 72, DASH = 205, ZONE = 34;
      const me = { s: 0, stun: 0, dash: false, trip: 0 }, ai = { s: 0, stun: 0, dash: false, plan: 0 };
      let hold = false, keys = 0, done = false, T = 0, warnT = 0, fall = [];
      for (let k = 0; k < 18; k++) fall.push({ x: c.rnd(0, 960), y: c.rnd(-600, 0), v: c.rnd(30, 60), r: c.rnd(0, TAU), ph: c.rnd(0, TAU) });
      const at = s => { s = c.clamp(s, 0, L); const q = seg.find(q => s <= q.s + q.l) || seg[seg.length - 1], u = (s - q.s) / q.l; return { x: c.lerp(q.a[0], q.b[0], u), y: c.lerp(q.a[1], q.b[1], u), dir: Math.sign(q.b[0] - q.a[0]) || 1 }; };
      const nearCorner = s => corners.some(k => s > k - ZONE && s < k + 6), onRock = s => rocks.some(([a, l]) => s > a && s < a + l);
      function step(r, dash, dt) {
        if (r.stun > 0) { r.stun -= dt; r.dash = false; return null; }
        r.dash = dash; const v = dash ? DASH : WALK, ns = r.s + v * dt;
        if (dash && corners.some(k => r.s < k && ns >= k)) { r.s = corners.find(k => r.s < k && ns >= k) - 18; r.stun = 1.1; return 'tree'; }
        if (dash && onRock(ns)) { r.stun = .8; r.s = ns; return 'rock'; }
        r.s = Math.min(L, ns); return null;
      }
      function end(ok) { done = true; ok ? c.sfx.win() : c.sfx.calm(); c.finish({ success: ok, score: ok ? Math.max(10, 100 - Math.round(T)) : 0, stats: { t: T }, line: ok ? '先登顶！漫山红叶' : '对手先登顶了', delay: ok ? 1200 : 700 }); }
      return {
        start() { c.tip('按住冲刺，拐角前松手'); },
        update(dt, t) {
          for (const f of fall) { f.y += f.v * dt; f.x += Math.sin(t + f.ph) * 20 * dt; f.r += dt; if (f.y > 620) { f.y = -20; f.x = c.rnd(0, 960); } }
          if (done) return; T += dt; warnT -= dt;
          const r = step(me, hold || keys > 0, dt);
          if (r === 'tree') { c.sfx.drum(.5); c.shake(6); c.toast('冲刺转不了弯，撞树了'); c.fx.burst(at(me.s).x, at(me.s).y - 40, ['#d4543e', '#e2884a'], 12, 200, 3); }
          if (r === 'rock') { c.sfx.miss(); c.toast('碎石路，别冲刺'); }
          if (me.dash && Math.random() < dt * 12) { const p = at(me.s); c.fx.burst(p.x - p.dir * 20, p.y, ['#cdbb98'], 1, 60, 2); }
          // 对手：大多走、直道上偶尔冲，拐角前会收住；偶尔失误
          ai.plan -= dt; if (ai.plan <= 0) { ai.want = Math.random() < .5; ai.plan = c.rnd(.6, 1.4); }
          const lookAhead = corners.some(k => ai.s < k && ai.s > k - 70) || onRock(ai.s + 30);
          const ar = step(ai, ai.want && (!lookAhead || Math.random() < .004), dt);
          if (ar) c.fx.text(at(ai.s).x, at(ai.s).y - 90, ar === 'tree' ? '撞树了' : '绊了一下', c.C.mute, 15);
          c.progress(me.s / L);
          if (me.s >= L) end(true); else if (ai.s >= L) end(false);
          const near = corners.find(k => me.s < k && me.s > k - 90);
          c.tip(me.stun > 0 ? '晕了……' : near && me.dash ? '拐角到了，松手！' : onRock(me.s + 40) ? '前面是碎石路' : me.s > ai.s ? '领先' : '追上去');
        },
        down() { hold = true; }, up() { hold = false; },
        key(k, d) { if (HOLD.includes(k)) keys = Math.max(0, keys + (d ? 1 : -1)); },
        draw(g, t) {
          c.draw.wash(g, 480, 120, 460, 110, '#f3e1d2', .55, 2);
          c.draw.wash(g, 200, 140, 200, 60, '#d9c4c8', .5, 4); c.draw.wash(g, 780, 130, 220, 70, '#d9c4c8', .5, 6);
          // 山体
          g.fillStyle = '#ead9c2'; c.draw.ink(g, 2); g.beginPath(); g.moveTo(0, 600); g.lineTo(0, 420); g.quadraticCurveTo(150, 280, 300, 170); g.quadraticCurveTo(420, 70, 480, 62); g.quadraticCurveTo(560, 70, 660, 170); g.quadraticCurveTo(820, 280, 960, 420); g.lineTo(960, 600); g.closePath(); g.fill(); g.stroke();
          // 红叶团
          for (let k = 0; k < 36; k++) { const x = 80 + (k * 211) % 820, y = 140 + (k * 97) % 440; if (y < 90 + Math.abs(x - 480) * .75) continue; c.draw.wash(g, x, y, 34, 22, ['#d4543e', '#e2884a', '#c9473a', '#e8a14f'][k % 4], .55, k); }
          // 山道
          c.draw.ink(g, 18, '#f3ead6'); g.beginPath(); P.forEach(([x, y], k) => k ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke();
          c.draw.ink(g, 1.4, 'rgba(48,73,61,.35)'); g.setLineDash([6, 8]); g.beginPath(); P.forEach(([x, y], k) => k ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); g.setLineDash([]);
          for (const [a, l] of rocks) for (let s = a; s < a + l; s += 14) { const p = at(s); g.fillStyle = '#9aa09a'; g.beginPath(); g.ellipse(p.x + ((s * 7) % 9 - 4), p.y + ((s * 3) % 7 - 3), 3.5, 2.5, 0, 0, TAU); g.fill(); }
          // 拐角的树
          for (let k = 1; k < P.length - 1; k++) { const [x, y] = P[k], o = x > 480 ? 36 : -36; c.draw.ink(g, 4, '#8a6a44'); g.beginPath(); g.moveTo(x + o, y + 6); g.lineTo(x + o, y - 34); g.stroke(); c.draw.wash(g, x + o, y - 46, 26, 22, '#c9473a', .9, k); }
          // 山顶亭
          const [tx, ty] = P[P.length - 1]; g.fillStyle = '#c9473a'; c.draw.ink(g, 2); g.beginPath(); g.moveTo(tx - 34, ty - 30); g.lineTo(tx, ty - 52); g.lineTo(tx + 34, ty - 30); g.closePath(); g.fill(); g.stroke(); g.beginPath(); g.moveTo(tx - 24, ty - 30); g.lineTo(tx - 24, ty); g.moveTo(tx + 24, ty - 30); g.lineTo(tx + 24, ty); g.stroke();
          // 选手：对手在后，自己在前，颜色区分
          for (const [r, o] of [[ai, { robe: '#c8d0dc', seed: 73, fill: '#f1efe9' }], [me, { robe: ROBE, seed: 11 }]]) {
            const p = at(r.s), lean = r.dash ? .35 : 0;
            g.save(); g.translate(p.x, p.y + 4); g.transform(1, 0, -lean * p.dir, 1, 0, 0);
            c.draw.gong(g, 0, 0, .55, { ...o, face: p.dir, mood: r.stun > 0 ? 'bow' : r.dash ? 'happy' : 'calm', bob: r.stun > 0 ? 0 : Math.abs(Math.sin(t * (r.dash ? 18 : 9))) * -3 });
            g.restore();
            if (r.stun > 0) { c.draw.ink(g, 1.4, c.C.sunInk); g.beginPath(); g.arc(p.x, p.y - 60, 8, t * 6, t * 6 + 4.5); g.stroke(); }
            if (r.dash) { c.draw.ink(g, 1.6, 'rgba(48,73,61,.4)'); for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(p.x - p.dir * (28 + k * 6), p.y - 14 - k * 10); g.lineTo(p.x - p.dir * (48 + k * 6), p.y - 14 - k * 10); g.stroke(); } }
          }
          c.draw.text(g, '我', at(me.s).x, at(me.s).y - 70, 14, c.C.sunInk);
          for (const f of fall) { g.save(); g.translate(f.x, f.y); g.rotate(f.r); g.fillStyle = '#d4543e'; g.beginPath(); g.ellipse(0, 0, 7, 3.5, 0, 0, TAU); g.fill(); g.restore(); }
        }
      };
    }
  });

  /* ———————————————————— 17 霜降 · 霜前抢收 ———————————————————— */
  SG.register(17, {
    id: 'shuangjiang-harvest', term: '霜降', title: '霜前抢收', type: '反应操作',
    howto: ['白菜、萝卜：按住往上一拽就拔出来', '红薯：连点三下挖出来；花生、柿子：点一下就收', '收好的会自动装车运进地窖，赶在白霜铺满之前'],
    goal: '霜来之前（60 秒），把地里和树上的都收完。',
    knowledge: { head: '霜降 · 气肃而凝', text: '霜降是秋季最后一个节气，天气更冷，北方开始见到初霜。霜其实是近地面的水汽遇冷直接凝华成的冰晶，并不是从天上“降”下来的，“霜降”是古人的说法。打过霜的白菜、萝卜会更甜，所以有“霜降吃柿子”“霜打的菜更香”的说法。三候：豺乃祭兽，草木黄落，蛰虫咸俯。' },
    create(c) {
      const items = [], DUR = 60;
      const plots = [{ k: 'cabbage', x: 90, y: 330 }, { k: 'radish', x: 330, y: 330 }, { k: 'potato', x: 90, y: 470 }, { k: 'peanut', x: 330, y: 470 }];
      for (const p of plots) for (let i = 0; i < 4; i++) items.push({ k: p.k, x: p.x + 30 + i * 52, y: p.y + 40, hit: 0, done: false, out: 0 });
      [[690, 170], [760, 140], [830, 180], [720, 230], [800, 225], [870, 250]].forEach(([x, y]) => items.push({ k: 'persimmon', x, y, hit: 0, done: false, out: 0 }));
      const N = items.length; let got = 0, T = 0, done = false, grab = null, cart = [], carts = 0;
      function end(ok) { done = true; ok ? c.sfx.win() : c.sfx.calm(); c.finish({ success: ok, score: got * 4 + Math.max(0, Math.round(DUR - T)), stats: { got }, line: ok ? '都收进地窖了，不怕霜冻' : '白霜落满了田', delay: ok ? 1300 : 600 }); }
      function take(it) {
        it.done = true; got++; c.progress(got / N); c.sfx.good(1 + got % 5); c.fx.burst(it.x, it.y - 20, it.k === 'persimmon' ? ['#e8773a', '#f0a050'] : ['#a68b62', '#cdbb98'], 10, 180, 3);
        cart.push(it); if (cart.length >= 4 || got === N) { carts++; c.fx.text(560, 470, '装车 → 地窖', c.C.sunInk, 16); cart = []; }
        if (got >= N) end(true);
      }
      const pick = p => { let b = null, bd = 42; for (const it of items) if (!it.done) { const d = Math.hypot(p.x - it.x, p.y - (it.y - 14)); if (d < bd) { bd = d; b = it; } } return b; };
      return {
        start() { c.tip('拔、挖、摘，赶在霜前'); },
        update(dt) {
          if (done) return; T += dt; for (const it of items) if (it.done) it.out = Math.min(1, it.out + dt * 2);
          if (T >= DUR) end(false);
          c.tip(`已收 ${got} / ${N}` + (T > DUR - 12 ? ' · 霜快铺满了' : ''));
        },
        down(p) {
          const it = pick(p); if (!it) { c.sfx.soft(); return; }
          if (it.k === 'persimmon' || it.k === 'peanut') take(it);
          else if (it.k === 'potato') { it.hit++; c.sfx.drum(.3); c.fx.burst(it.x, it.y, ['#a68b62'], 5, 120, 2); if (it.hit >= 3) take(it); }
          else grab = { it, y: p.y };
        },
        move(p, pr) { if (grab && pr) { grab.it.hit = c.clamp((grab.y - p.y) / 40, 0, 1); if (grab.it.hit >= 1) { take(grab.it); grab = null; } } },
        up() { if (grab) { grab.it.hit = 0; c.toast('按住往上拽'); grab = null; } },
        draw(g, t) {
          const fq = T / DUR;
          c.draw.wash(g, 480, 120, 460, 100, '#efe6d6', .6, 2);
          c.draw.ground(g, 300, '#d8c7a0', 2);
          // 柿子树
          c.draw.ink(g, 8, '#7a5a3a'); g.beginPath(); g.moveTo(780, 420); g.quadraticCurveTo(770, 330, 780, 260); g.moveTo(778, 300); g.lineTo(700, 200); g.moveTo(780, 280); g.lineTo(860, 200); g.stroke();
          c.draw.wash(g, 780, 190, 140, 80, '#d9a65a', .5, 3);
          // 地窖
          g.fillStyle = '#c8b48c'; c.draw.ink(g, 2.2); g.beginPath(); g.moveTo(620, 560); g.quadraticCurveTo(700, 450, 780, 560); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#3d4a42'; g.beginPath(); g.moveTo(670, 560); g.quadraticCurveTo(700, 510, 730, 560); g.closePath(); g.fill();
          c.draw.text(g, '地窖', 700, 585, 14, c.C.mute);
          for (let k = 0; k < Math.min(carts, 6); k++) { g.fillStyle = ['#e9efd9', '#f3e0e0', '#c98a5a', '#e2c37a'][k % 4]; g.beginPath(); g.arc(680 + (k % 3) * 18, 548 - Math.floor(k / 3) * 10, 7, 0, TAU); g.fill(); }
          for (const p of plots) { g.fillStyle = '#b9966a'; c.draw.ink(g, 1.6); g.beginPath(); g.rect(p.x, p.y, 220, 80); g.fill(); g.stroke(); }
          for (const it of items) { if (it.out >= 1) continue; g.save(); g.globalAlpha = 1 - it.out; g.translate(it.x, it.y - it.out * 40 - (it.k === 'cabbage' || it.k === 'radish' ? it.hit * 22 : 0)); crop(g, it); g.restore(); }
          c.draw.gong(g, 600, 420, .95, { robe: ROBE, seed: 79, face: 1, arm: -.5, mood: got > N / 2 ? 'happy' : 'calm' });
          // 白霜从四周爬进来
          g.save(); g.globalAlpha = .75; const fw = 20 + fq * 200; const grd = g.createLinearGradient(0, 0, fw, 0); grd.addColorStop(0, '#f4f7fa'); grd.addColorStop(1, 'rgba(244,247,250,0)'); g.fillStyle = grd; g.fillRect(0, 0, fw, c.H);
          const grd2 = g.createLinearGradient(c.W, 0, c.W - fw, 0); grd2.addColorStop(0, '#f4f7fa'); grd2.addColorStop(1, 'rgba(244,247,250,0)'); g.fillStyle = grd2; g.fillRect(c.W - fw, 0, fw, c.H);
          c.draw.ink(g, 1.2, '#b7c6d3'); for (let k = 0; k < 10; k++) { const side = k % 2, x = side ? c.W - fw * .5 * ((k * 37) % 10) / 10 : fw * .5 * ((k * 37) % 10) / 10, y = 40 + k * 55; for (let a = 0; a < 3; a++) { g.beginPath(); g.moveTo(x - Math.cos(a) * 6, y - Math.sin(a) * 6); g.lineTo(x + Math.cos(a) * 6, y + Math.sin(a) * 6); g.stroke(); } }
          g.restore();
        }
      };
      function crop(g, it) {
        c.draw.ink(g, 1.8);
        if (it.k === 'cabbage') { g.fillStyle = '#c9dfae'; g.beginPath(); g.ellipse(0, -16, 20, 22, 0, 0, TAU); g.fill(); g.stroke(); g.fillStyle = '#e9efd9'; g.beginPath(); g.ellipse(0, -10, 11, 16, 0, 0, TAU); g.fill(); g.stroke(); }
        if (it.k === 'radish') { g.fillStyle = '#f3f0ea'; g.beginPath(); g.moveTo(-9, -6); g.quadraticCurveTo(0, 28, 9, -6); g.closePath(); g.fill(); g.stroke(); c.draw.ink(g, 2.2, '#6f9a58'); for (const a of [-1, 0, 1]) { g.beginPath(); g.moveTo(0, -6); g.quadraticCurveTo(a * 10, -22, a * 14, -34); g.stroke(); } }
        if (it.k === 'potato') { g.fillStyle = '#9a7a52'; g.beginPath(); g.ellipse(0, -4, 22, 12 - it.hit * 2, 0, Math.PI, 0); g.fill(); g.stroke(); c.draw.ink(g, 2, '#6f9a58'); g.beginPath(); g.moveTo(0, -14); g.quadraticCurveTo(-6, -28, -14, -30); g.moveTo(0, -14); g.quadraticCurveTo(8, -26, 14, -30); g.stroke(); if (it.hit) { g.fillStyle = '#c96a5a'; g.beginPath(); g.ellipse(0, -2, 12, 7, .2, 0, TAU); g.fill(); } }
        if (it.k === 'peanut') { c.draw.ink(g, 2, '#6f9a58'); for (const a of [-1, 0, 1]) { g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(a * 8, -16, a * 14, -24); g.stroke(); g.fillStyle = '#8fb46e'; g.beginPath(); g.ellipse(a * 14, -26, 5, 3, a, 0, TAU); g.fill(); } }
        if (it.k === 'persimmon') { g.fillStyle = '#e8773a'; c.draw.ink(g, 1.6, '#9a4a2a'); g.beginPath(); g.ellipse(0, 0, 13, 11, 0, 0, TAU); g.fill(); g.stroke(); g.fillStyle = '#6f7a48'; g.beginPath(); g.ellipse(0, -10, 7, 3, 0, 0, TAU); g.fill(); }
      }
    }
  });
})();
