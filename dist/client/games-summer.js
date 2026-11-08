/* 时节 · 夏季六个小游戏（草稿 v0.1）
 * 6 立夏 立夏称人（物理）  7 小满 看麦梢黄（观察）  8 芒种 抢收抢种（轻策略）
 * 9 夏至 立竿见影（光影解谜）  10 小暑 庭院纳凉（轻策略）  11 大暑 夏夜流萤（技巧）
 * 角色统一用 IP 拱拱（c.draw.gong），夏季淡彩为浅青。
 */
(function () {
  'use strict';
  const SG = window.SeasonGames; if (!SG) return;
  const TAU = Math.PI * 2;
  const ROBE = '#a8d4c6';
  // 方向键 / WASD 统一处理
  function dirs(st, k, d) {
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') st.L = d; if (k === 'ArrowRight' || k === 'd' || k === 'D') st.R = d;
    if (k === 'ArrowUp' || k === 'w' || k === 'W') st.U = d; if (k === 'ArrowDown' || k === 's' || k === 'S') st.D = d;
  }

  /* ———————————————————— 6 立夏 · 立夏称人 ———————————————————— */
  SG.register(6, {
    id: 'lixia-weigh', term: '立夏', title: '立夏称人', type: '物理互动',
    howto: ['拱拱坐进秤篮，秤杆会往一边歪', '按住鼠标左右拖（或按左右方向键）移动秤砣', '秤杆放平、稳住一会儿，就称好了'],
    goal: '60 秒内给五位拱拱称好体重。',
    knowledge: { head: '立夏 · 称人', text: '立夏称人是江南等地的旧俗：挂起大杆秤称一称，盼着夏天不“疰夏”（天热吃不下、人变瘦）。杆秤靠杠杆平衡，秤砣离提纽越远，称得越重。立夏是夏季的开始，但各地真正入夏的时间并不一样。三候：蝼蝈鸣，蚯蚓出，王瓜生。' },
    create(c) {
      const PX = 400, PY = 150, L0 = 70, DMIN = 40, DMAX = 450, TOL = 16;
      const people = [{ s: .82, m: 2.6, seed: 31, robe: '#a8d4c6' }, { s: 1, m: 3.6, seed: 11, robe: '#cfe2b6' }, { s: .9, m: 3.0, seed: 43, robe: '#f1cfcf' }, { s: 1.12, m: 4.6, seed: 57, robe: '#efd4a4' }, { s: .95, m: 3.3, seed: 63, robe: '#d9d5e6' }];
      let i = 0, n = 0, d = 110, td = 110, th = 0, w = 0, hold = 0, tickT = 0, T = 60, done = false, swap = 0, sw = 0, swv = 0;
      const keys = {};
      function end(ok) { done = true; ok ? c.sfx.win() : c.sfx.calm(); c.finish({ success: ok, score: n * 15 + Math.round(T), stats: { weighed: n }, line: ok ? '五位拱拱都称好了，夏天不怕瘦' : '天色晚了，还没称完', delay: ok ? 1200 : 600 }); }
      return {
        start() { c.tip('拖动秤砣，让秤杆放平'); },
        update(dt) {
          if (done) return; T -= dt;
          if (keys.L) td -= 200 * dt; if (keys.R) td += 200 * dt; td = c.clamp(td, DMIN, DMAX);
          d += (td - d) * Math.min(1, dt * 10);
          const p = people[i], star = p.m * L0, tgt = c.clamp((d - star) / 260, -.32, .32);
          w += ((tgt - th) * 40 - w * 6) * dt; th += w * dt;
          swv += (-sw * 18 - swv * 1.6 - w * 5) * dt; sw += swv * dt;
          if (swap > 0) { const was = swap; swap = Math.max(0, swap - dt / 1.2); if (was > .5 && swap <= .5) { i++; sw = .25; } return; }
          const level = Math.abs(d - star) < TOL && Math.abs(th) < .06;
          if (level) { hold += dt; tickT -= dt; if (tickT <= 0) { c.sfx.tick(); tickT = .25; } } else hold = Math.max(0, hold - dt * 2);
          if (hold >= 1) {
            n++; hold = 0; c.progress(n / 5); c.sfx.good(2 + n);
            const lp = { x: PX - Math.cos(th) * L0, y: PY - Math.sin(th) * L0 };
            c.fx.text(lp.x, lp.y + 60, `${Math.round(p.m * 10)} 斤`, c.C.sunInk, 26); c.fx.burst(PX + d, PY + 40, ['#e2c37a', '#a8d4c6', '#d97c6a'], 16, 220, 3);
            if (n >= 5) end(true); else { swap = 1; c.toast(`称好了 · ${n} / 5`); }
          }
          if (T <= 0) end(false);
          c.tip(level ? '稳住……' : th > .05 ? '秤杆尾巴往下沉 → 秤砣往里收' : th < -.05 ? '秤杆尾巴翘起来 → 秤砣往外放' : '再挪一点点');
        },
        down(p) { td = c.clamp(p.x - PX, DMIN, DMAX); }, move(p, pr) { if (pr) td = c.clamp(p.x - PX, DMIN, DMAX); },
        key(k, dn) { dirs(keys, k, dn); },
        draw(g, t) {
          c.draw.wash(g, 200, 200, 260, 170, c.season.wash, .45, 2); c.draw.wash(g, 780, 420, 240, 140, '#e8efe0', .5, 5);
          c.draw.ground(g, 540, c.season.wash, 4);
          // 木架
          c.draw.ink(g, 5, '#9a6f3c'); g.beginPath(); g.moveTo(120, 545); g.lineTo(160, 60); g.lineTo(700, 60); g.lineTo(740, 545); g.stroke();
          c.draw.ink(g, 1.8); g.beginPath(); g.moveTo(PX, 60); g.lineTo(PX, PY - 8); g.stroke();
          // 秤杆
          const cos = Math.cos(th), sin = Math.sin(th), at = k => ({ x: PX + cos * k, y: PY + sin * k });
          g.save(); g.translate(PX, PY); g.rotate(th);
          c.draw.ink(g, 7, '#9a6f3c'); g.beginPath(); g.moveTo(-L0 - 24, 0); g.lineTo(DMAX + 24, 0); g.stroke();
          // 秤星：每 10 斤一颗，逢整数标字
          g.fillStyle = c.C.sun; for (let k = 140; k <= DMAX; k += 7) { const big = (k - 140) % 70 === 0; g.beginPath(); g.arc(k, 0, big ? 2.4 : 1.2, 0, TAU); g.fill(); }
          for (let k = 140; k <= DMAX; k += 70) c.draw.text(g, String(k / 7), k, -14, 12, c.C.mute, 'center', false);
          c.draw.ink(g, 2); g.beginPath(); g.arc(0, -6, 6, Math.PI, 0); g.stroke();
          g.restore();
          // 秤篮与拱拱
          const lp = at(-L0), len = 110, bx = lp.x + Math.sin(sw) * len, by = lp.y + Math.cos(sw) * len, p = people[i];
          const a = swap > 0 ? Math.abs(swap - .5) * 2 : 1;
          c.draw.ink(g, 1.4); g.beginPath(); g.moveTo(lp.x, lp.y); g.lineTo(bx - 52, by); g.moveTo(lp.x, lp.y); g.lineTo(bx + 52, by); g.stroke();
          g.save(); g.globalAlpha = a;
          c.draw.gong(g, bx, by + 30, p.s, { robe: p.robe, seed: p.seed, ground: false, mood: hold > .2 ? 'happy' : 'calm' });
          g.restore();
          g.fillStyle = '#e4cf9c'; c.draw.ink(g, 2.2, c.C.sunInk); g.beginPath(); g.moveTo(bx - 54, by); g.lineTo(bx + 54, by); g.quadraticCurveTo(bx + 50, by + 44, bx, by + 46); g.quadraticCurveTo(bx - 50, by + 44, bx - 54, by); g.fill(); g.stroke();
          c.draw.ink(g, 1, c.C.sunInk); for (let k = -3; k <= 3; k++) { g.beginPath(); g.moveTo(bx + k * 14, by + 2); g.lineTo(bx + k * 12, by + 42); g.stroke(); }
          // 秤砣
          const wp = at(d), wy = wp.y + 46;
          c.draw.ink(g, 1.4); g.beginPath(); g.moveTo(wp.x, wp.y); g.lineTo(wp.x, wy - 18); g.stroke();
          g.fillStyle = '#4a5a52'; c.draw.ink(g, 2); g.beginPath(); g.moveTo(wp.x - 10, wy - 18); g.lineTo(wp.x + 10, wy - 18); g.lineTo(wp.x + 18, wy + 12); g.lineTo(wp.x - 18, wy + 12); g.closePath(); g.fill(); g.stroke();
          g.fillStyle = c.C.sun; g.beginPath(); g.arc(wp.x, wy - 2, 4, 0, TAU); g.fill();
          if (hold > 0) { c.draw.ink(g, 3, c.C.sun); g.beginPath(); g.arc(PX, PY, 18, -Math.PI / 2, -Math.PI / 2 + TAU * hold); g.stroke(); }
          // 一旁记数的拱拱
          c.draw.gong(g, 850, 545, 1, { robe: ROBE, seed: 71, face: -1, mood: n ? 'happy' : 'calm' });
          for (let k = 0; k < 5; k++) { g.fillStyle = k < n ? c.C.sun : 'rgba(48,73,61,.15)'; g.beginPath(); g.arc(810 + k * 20, 410, 6, 0, TAU); g.fill(); }
        }
      };
    }
  });

  /* ———————————————————— 7 小满 · 看麦梢黄 ———————————————————— */
  SG.register(7, {
    id: 'xiaoman-wheat', term: '小满', title: '看麦梢黄', type: '观察发现',
    howto: ['田里有几株麦穗正在慢慢变黄，梢头先黄', '在它“青里泛黄”的时候点它', '太青还早，黄透了又过了头'],
    goal: '45 秒内找到 8 株正在灌浆的麦穗。',
    knowledge: { head: '小满 · 将满未满', text: '小满时，小麦等夏熟作物的籽粒开始灌浆饱满，但还没有成熟，所以叫“小满”。二十四节气里有小暑大暑、小雪大雪，却没有“大满”，常被解读为“满招损”的分寸。三候：苦菜秀，靡草死，麦秋至。' },
    create(c) {
      const ears = []; for (let r = 0; r < 2; r++) for (let k = 0; k < 5; k++) ears.push({ x: 150 + k * 150 + (r % 2) * 60, y: 280 + r * 130, r: 0, v: 0, st: 'idle', t: 0, ph: k * 1.3 + r });
      let found = 0, T = 45, done = false, spawnT = .4, mood = 0, moodT = 0, cool = 0;
      const LO = .3, HI = .85, GOAL = 8;
      function end(ok) { done = true; ok ? c.sfx.win() : c.sfx.calm(); c.finish({ success: ok, score: found * 10 + Math.round(T), stats: { found }, line: ok ? '麦粒正在灌浆，小满了' : '这片田还要再看看', delay: ok ? 1200 : 600 }); }
      return {
        start() { c.tip('盯住梢头开始泛黄的麦穗'); },
        update(dt) {
          if (done) return; T -= dt; cool -= dt; moodT -= dt; if (moodT <= 0) mood = 0;
          // 同一时间只有一株处在“青里泛黄”：上一株过了时机（或被点中）才开始下一株
          const busy = ears.some(e => e.st === 'ripen' && e.r < HI); spawnT -= dt;
          if (!busy && spawnT <= 0) { const idle = ears.filter(e => e.st === 'idle'); if (idle.length) { const e = idle[Math.floor(Math.random() * idle.length)]; e.st = 'ripen'; e.r = 0; e.t = 0; e.v = 1 / c.rnd(3, 3.6); } spawnT = c.rnd(.4, .8); }
          for (const e of ears) {
            if (e.st === 'ripen') { e.r = Math.min(1, e.r + e.v * dt); if (e.r >= 1) { e.st = 'over'; e.t = 0; } }
            else if (e.st === 'over') { e.t += dt; if (e.t > 2.5) { e.st = 'idle'; e.r = 0; } }   // 黄透的穗过一会儿换成新抽的青穗
          }
          if (T <= 0) end(false);
          c.tip(`找到 ${found} / ${GOAL}`);
        },
        down(p) {
          let best = null, bd = 56; for (const e of ears) { const dd = Math.hypot(p.x - e.x, p.y - e.y); if (dd < bd && e.st !== 'done') { bd = dd; best = e; } }
          if (!best || cool > 0) { c.sfx.soft(); return; }
          if (best.st === 'ripen' && best.r >= LO && best.r <= HI) {
            best.st = 'done'; found++; mood = 1; moodT = 1.2; c.sfx.good(2 + found % 4); c.fx.burst(best.x, best.y - 20, ['#e2c37a', '#a9cc93'], 12, 180, 3); c.fx.ring(best.x, best.y, c.C.sun, 30); c.fx.text(best.x, best.y - 50, '正在灌浆', c.C.sunInk, 18);
            c.progress(found / GOAL); if (found >= GOAL) end(true);
          } else if (best.r > HI || best.st === 'over') { mood = -1; moodT = 1.2; c.sfx.miss(); c.toast('黄透了，那是芒种的事'); cool = .7; }
          else { mood = -1; moodT = 1.2; c.sfx.soft(); c.toast('还青着呢，再等等'); cool = .7; }
        },
        draw(g, t) {
          c.draw.wash(g, 480, 120, 420, 90, '#eef0dc', .6, 2); c.draw.wash(g, 160, 90, 60, 40, c.C.sun, .35, 1);
          c.draw.ground(g, 560, '#cfe2b6', 3);
          for (const e of ears) ear(g, e, t);
          c.draw.gong(g, 880, 575, 1.15, { robe: ROBE, seed: 23, face: -1, mood: mood > 0 ? 'happy' : 'calm' });
          if (mood < 0) { c.draw.ink(g, 1.6, c.C.mute); g.beginPath(); g.moveTo(860, 450); g.quadraticCurveTo(856, 440, 864, 436); g.stroke(); }
        }
      };
      function ear(g, e, t) {
        const sway = Math.sin(t * 1.4 + e.ph) * 4, droop = e.r > .85 ? (e.r - .85) * 1.6 : 0;
        c.draw.ink(g, 2, c.mix('#7fae68', '#c9a06a', e.r * .8)); g.beginPath(); g.moveTo(e.x, 590); g.quadraticCurveTo(e.x + sway * .4, e.y + 120, e.x + sway, e.y + 30); g.stroke();
        g.save(); g.translate(e.x + sway, e.y + 30); g.rotate(droop + sway * .01); g.translate(0, -30);
        for (let k = 0; k < 6; k++) {
          const yy = 24 - k * 10, tipK = k / 5, rr = c.clamp(e.r * 1.15 + tipK * .25 * e.r, 0, 1), sz = 3.4 + e.r * 1.8;
          g.fillStyle = c.mix('#8fbf6a', '#e2b960', rr); c.draw.ink(g, 1, 'rgba(48,73,61,.55)');
          for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(sx * 4.5, yy, sz * .8, sz * 1.25, sx * .35, 0, TAU); g.fill(); g.stroke(); g.beginPath(); g.moveTo(sx * 5, yy - sz); g.lineTo(sx * 9, yy - sz - 14); g.stroke(); }
        }
        if (e.st === 'done') { c.draw.ink(g, 3, '#d97c6a'); g.beginPath(); g.moveTo(-7, 30); g.lineTo(7, 28); g.stroke(); }
        g.restore();
      }
    }
  });

  /* ———————————————————— 8 芒种 · 抢收抢种 ———————————————————— */
  SG.register(8, {
    id: 'mangzhong-rush', term: '芒种', title: '抢收抢种', type: '轻策略',
    howto: ['麦田一块块黄熟，按住鼠标在金黄的田里来回拖，割下麦子', '割完的田会自动放水插秧', '雨云从右边压过来，下雨前要把熟麦全收完'],
    goal: '雨来之前，收完六块麦田。',
    knowledge: { head: '芒种 · 有芒的收，有芒的种', text: '“芒”指麦、稻这类籽实带细芒的作物：有芒的麦子要抢收，有芒的稻子要抢种，所以芒种是一年里最忙的农时之一，民间说“芒种忙，忙着种”。麦子熟了要赶在雨前收，不然会倒伏、发芽。三候：螳螂生，鵙始鸣，反舌无声。' },
    create(c) {
      const fields = [], order = [0, 4, 2, 3, 1, 5], RIPE = [0, 2.5, 5.5, 8.5, 11.5, 14.5], RAIN = 50;
      for (let k = 0; k < 6; k++) {
        const col = k % 3, row = Math.floor(k / 3), x = 70 + col * 270, y = 200 + row * 175, st = [];
        for (let a = 0; a < 8; a++) for (let b = 0; b < 5; b++) st.push({ x: x + 18 + a * 29 + (b % 2) * 8, y: y + 26 + b * 24, cut: false });
        fields.push({ x, y, w: 245, h: 145, st, state: 'green', ripeAt: RIPE[order.indexOf(k)], f: 0, cut: 0 });
      }
      let T = 0, done = false, harvested = 0, ptr = { x: -99, y: -99 }, swishT = 0, warnT = 0;
      function end(ok) { done = true; ok ? c.sfx.win() : c.sfx.calm(); c.finish({ success: ok, score: harvested * 15 + Math.max(0, Math.round(RAIN - T)), stats: { harvested }, line: ok ? '麦收进仓，秧插下田' : '雨来了，麦子淋在地里', delay: ok ? 1600 : 600 }); }
      function inField(p) { return fields.find(f => p.x > f.x && p.x < f.x + f.w && p.y > f.y && p.y < f.y + f.h); }
      function cutAt(p) {
        const f = inField(p); if (!f) return;
        if (f.state === 'green') { if (warnT <= 0) { c.toast('这块还青着，先割黄的'); c.sfx.soft(); warnT = 1.5; } return; }
        if (f.state !== 'ripe') return;
        let got = 0; for (const s of f.st) if (!s.cut && Math.hypot(s.x - p.x, s.y - p.y) < 44) { s.cut = true; got++; f.cut++; }
        if (got) { if (swishT <= 0) { c.sfx.noise(.12, .28, 2600, 1.5); swishT = .09; } if (Math.random() < .5) c.fx.burst(p.x, p.y, ['#e2c37a', '#c9a06a'], 4, 120, 2.5); }
        if (f.cut >= f.st.length * .9) { f.st.forEach(s => s.cut = true); f.state = 'water'; f.f = 0; harvested++; c.sfx.good(harvested + 1); c.sfx.splash(); c.fx.text(f.x + f.w / 2, f.y + 20, '收好了 · 放水插秧', c.C.sunInk, 18); c.progress(harvested / 6); if (harvested >= 6) setTimeout(() => !done && end(true), 1300); }
      }
      return {
        start() { c.tip('按住鼠标，在金黄的田里来回拖'); },
        update(dt) {
          if (done) return; T += dt; swishT -= dt; warnT -= dt;
          for (const f of fields) { if (f.state === 'green' && T >= f.ripeAt) { f.state = 'ripe'; c.sfx.note(4, .3, .1); } if (f.state === 'water') { f.f = Math.min(1, f.f + dt / 1.6); if (f.f >= 1) f.state = 'planted'; } }
          if (T >= RAIN && harvested < 6) end(false);
          const left = RAIN - T; c.tip(left < 12 ? `雨快到了！还剩 ${6 - harvested} 块` : `已收 ${harvested} / 6`);
        },
        down(p) { ptr = p; cutAt(p); }, move(p, pr) { ptr = p; if (pr) cutAt(p); },
        draw(g, t) {
          const q = Math.min(1, T / RAIN), cx = 1060 - q * 1000;
          c.draw.wash(g, 480, 90, 460, 80, c.mix('#eef0dc', '#d6dadf', q), .6, 2);
          // 雨云
          c.draw.wash(g, cx + 140, 80, 220, 60, '#aeb8c0', .75, 3); c.draw.wash(g, cx + 60, 110, 150, 40, '#c2cad0', .7, 7);
          c.draw.ink(g, 1, 'rgba(110,140,160,.5)'); for (let k = 0; k < 18; k++) { const rx = cx + 10 + k * 18, ry = 140 + ((t * 400 + k * 37) % 60); g.beginPath(); g.moveTo(rx, ry); g.lineTo(rx - 4, ry + 12); g.stroke(); }
          c.draw.ground(g, 180, '#d9cfa8', 2);
          for (const f of fields) {
            const col = f.state === 'green' ? '#bcd59a' : f.state === 'ripe' ? '#efd393' : c.mix('#d9cfa8', '#c4dde0', f.f);
            g.fillStyle = col; c.draw.ink(g, 2); g.beginPath(); g.rect(f.x, f.y, f.w, f.h); g.fill(); g.stroke();
            if (f.state === 'green' || f.state === 'ripe') {
              const stalk = f.state === 'ripe' ? '#b48a3e' : '#6f9a58';
              for (const s of f.st) {
                if (s.cut) { c.draw.ink(g, 1.4, '#b49a62'); g.beginPath(); g.moveTo(s.x - 3, s.y + 8); g.lineTo(s.x + 3, s.y + 8); g.stroke(); continue; }
                const sw = Math.sin(t * 2 + s.x * .05) * 2; c.draw.ink(g, 1.6, stalk); g.beginPath(); g.moveTo(s.x, s.y + 10); g.lineTo(s.x + sw, s.y - 8); g.stroke();
                if (f.state === 'ripe') { g.fillStyle = '#e2b960'; g.beginPath(); g.ellipse(s.x + sw, s.y - 12, 3, 6, 0, 0, TAU); g.fill(); }
              }
            } else {
              c.draw.ink(g, 1, 'rgba(255,255,255,.7)'); for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(f.x + 30 + k * 70, f.y + 30 + k * 35); g.lineTo(f.x + 80 + k * 70, f.y + 30 + k * 35); g.stroke(); }
              const rows = Math.floor(f.f * 5); c.draw.ink(g, 1.8, '#6f9a58');
              for (let b = 0; b < (f.state === 'planted' ? 5 : rows); b++) for (let a = 0; a < 8; a++) { const sx = f.x + 20 + a * 29, sy = f.y + 30 + b * 24; g.beginPath(); g.moveTo(sx, sy + 6); g.lineTo(sx - 4, sy - 6); g.moveTo(sx, sy + 6); g.lineTo(sx + 4, sy - 6); g.stroke(); }
            }
          }
          // 麦捆计数
          for (let k = 0; k < harvested; k++) { const x = 70 + k * 34, y = 560; g.fillStyle = '#e2c37a'; c.draw.ink(g, 1.6, c.C.sunInk); g.beginPath(); g.moveTo(x - 10, y + 20); g.lineTo(x - 4, y - 18); g.lineTo(x + 4, y - 18); g.lineTo(x + 10, y + 20); g.closePath(); g.fill(); g.stroke(); g.beginPath(); g.moveTo(x - 7, y); g.lineTo(x + 7, y); g.stroke(); }
          c.draw.gong(g, 900, 585, .95, { robe: ROBE, seed: 29, face: -1, arm: -.8 });
          // 镰刀光标
          if (ptr.x > 0) { g.save(); g.translate(ptr.x, ptr.y); c.draw.ink(g, 3, '#9a6f3c'); g.beginPath(); g.moveTo(6, 4); g.lineTo(22, 30); g.stroke(); c.draw.ink(g, 3, '#6b776d'); g.beginPath(); g.moveTo(6, 4); g.quadraticCurveTo(-8, -20, -26, -10); g.stroke(); g.restore(); }
        }
      };
    }
  });

  /* ———————————————————— 9 夏至 · 立竿见影 ———————————————————— */
  SG.register(9, {
    id: 'xiazhi-gnomon', term: '夏至', title: '立竿见影', type: '物理互动',
    howto: ['这是古人测日影的圭表：竖的是“表”，地上带刻度的是“圭”', '按住鼠标上下拖太阳（或按上下方向键），改变正午太阳的高度', '让表的影子正好落在发亮的刻线上'],
    goal: '依次对准冬至、春分、夏至三道日影刻线。',
    knowledge: { head: '夏至 · 日影最短', text: '夏至这天太阳直射北回归线，北半球正午太阳最高、日影最短，白昼最长。古人用圭表量正午日影来定节气：影子最长的一天是冬至，最短的一天是夏至。以北京为例，夏至白天约 15 小时，冬至只有约 9 个多小时。三候：鹿角解，蜩始鸣，半夏生。' },
    create(c) {
      const PX = 300, GY = 470, PH = 130, R = 300, deg = Math.PI / 180;
      const marks = [{ n: '冬至', a: 26.6, day: 9.3 }, { n: '春分', a: 50, day: 12 }, { n: '夏至', a: 73.4, day: 15 }];
      marks.forEach(m => m.x = PX + PH / Math.tan(m.a * deg));
      let alt = 40, ta = 40, i = 0, hold = 0, done = false, flash = 0, keys = {};
      const tipX = () => PX + PH / Math.tan(alt * deg), dayH = () => c.clamp(9.3 + (alt - 26.6) / (73.4 - 26.6) * 5.7, 8, 16);
      function setFrom(p) { ta = c.clamp(Math.atan2(GY - p.y, PX - p.x) / deg, 18, 80); }
      return {
        start() { c.tip(`先找冬至：太阳低，影子长`); },
        update(dt) {
          if (done) return; flash = Math.max(0, flash - dt);
          if (keys.U) ta += 24 * dt; if (keys.D) ta -= 24 * dt; ta = c.clamp(ta, 18, 80);
          alt += (ta - alt) * Math.min(1, dt * 6);
          const m = marks[i], on = Math.abs(tipX() - m.x) < 9;
          if (on) { hold += dt; if (Math.floor(hold * 6) !== Math.floor((hold - dt) * 6)) c.sfx.tick(); } else hold = Math.max(0, hold - dt * 2);
          if (hold > .8) {
            hold = 0; flash = 1; c.sfx.good(2 + i * 2); c.fx.ring(m.x, GY, c.C.sun, 30); c.fx.text(m.x, GY - 50, `${m.n} · 白昼约 ${m.day === 9.3 ? '9 时余' : m.day + ' 时'}`, c.C.sunInk, 18);
            i++; c.progress(i / 3);
            if (i >= 3) { done = true; setTimeout(() => { c.sfx.win(); c.finish({ success: true, score: 100, line: '日影最短，白昼最长：夏至到了', delay: 600 }); }, 900); }
            else c.toast(i === 1 ? '下一道：春分，昼夜平分' : '最后：夏至，影子最短');
          }
          c.tip(i < 3 ? (on ? '稳住……' : tipX() > m.x ? `影子太长 → 把太阳往上拖（找${m.n}）` : `影子太短 → 把太阳往下放（找${m.n}）`) : '');
        },
        down(p) { setFrom(p); }, move(p, pr) { if (pr) setFrom(p); },
        key(k, dn) { dirs(keys, k, dn); },
        draw(g, t) {
          const q = (alt - 18) / 62, sx = PX - Math.cos(alt * deg) * R, sy = GY - Math.sin(alt * deg) * R;
          c.draw.wash(g, 400, 220, 420, 220, c.mix('#e6e8ec', '#f6e9c8', q), .55, 2);
          // 太阳可走的弧
          g.setLineDash([4, 8]); c.draw.ink(g, 1.2, 'rgba(201,160,106,.6)'); g.beginPath(); g.arc(PX, GY, R, Math.PI + 18 * deg, Math.PI + 80 * deg); g.stroke(); g.setLineDash([]);
          g.save(); g.beginPath(); g.rect(0, 0, c.W, GY); g.clip(); c.draw.wash(g, sx, sy, 70, 70, '#f3d999', .5, 4); g.restore();
          g.fillStyle = '#e8c47f'; c.draw.ink(g, 2, c.C.sunInk); g.beginPath(); g.arc(sx, sy, 28, 0, TAU); g.fill(); g.stroke();
          c.draw.ink(g, 1, 'rgba(201,160,106,.45)'); g.beginPath(); g.moveTo(sx, sy); g.lineTo(tipX(), GY); g.stroke();
          c.draw.ground(g, GY + 6, '#d9e3c9', 2);
          // 圭（石板与刻度）
          g.fillStyle = '#e9e3d3'; c.draw.ink(g, 2); g.beginPath(); g.rect(PX - 10, GY - 2, 330, 18); g.fill(); g.stroke();
          for (let x = PX + 10; x < PX + 320; x += 10) { c.draw.ink(g, 1, 'rgba(48,73,61,.35)'); g.beginPath(); g.moveTo(x, GY); g.lineTo(x, GY + (x % 50 ? 5 : 9)); g.stroke(); }
          marks.forEach((m, k) => { const cur = k === i, past = k < i; c.draw.ink(g, cur ? 3 : 2, past ? c.C.ink : cur ? c.C.sun : 'rgba(48,73,61,.3)'); g.beginPath(); g.moveTo(m.x, GY - 6); g.lineTo(m.x, GY + 22); g.stroke(); c.draw.text(g, m.n, m.x, GY + 40, 15, past || cur ? c.C.ink : c.C.mute); });
          // 影子与表
          c.draw.ink(g, 7, 'rgba(48,73,61,.55)'); g.beginPath(); g.moveTo(PX, GY + 2); g.lineTo(tipX(), GY + 2); g.stroke();
          c.draw.ink(g, 8, '#9a6f3c'); g.beginPath(); g.moveTo(PX, GY); g.lineTo(PX, GY - PH); g.stroke();
          if (hold > 0) { c.draw.ink(g, 3, c.C.sun); g.beginPath(); g.arc(marks[Math.min(i, 2)].x, GY - 22, 12, -Math.PI / 2, -Math.PI / 2 + TAU * hold / .8); g.stroke(); }
          // 昼夜环
          const dh = dayH(), RX = 820, RY = 150; c.draw.ink(g, 10, '#ccd3db'); g.beginPath(); g.arc(RX, RY, 48, 0, TAU); g.stroke();
          c.draw.ink(g, 10, c.C.sun); g.beginPath(); g.arc(RX, RY, 48, -Math.PI / 2 - dh / 24 * Math.PI, -Math.PI / 2 + dh / 24 * Math.PI); g.stroke();
          c.draw.text(g, `昼 ${dh.toFixed(1)} 时`, RX, RY, 16); c.draw.text(g, '以北京为例', RX, RY + 74, 12, c.C.mute, 'center', false);
          c.draw.gong(g, 760, 520, 1, { robe: ROBE, seed: 37, face: -1, mood: flash > 0 ? 'happy' : 'calm' });
        }
      };
    }
  });

  /* ———————————————————— 10 小暑 · 庭院纳凉 ———————————————————— */
  SG.register(10, {
    id: 'xiaoshu-shade', term: '小暑', title: '庭院纳凉', type: '轻策略',
    howto: ['太阳从东走到西，树荫和屋檐的影子跟着挪动', '按住鼠标左右拖（或按左右方向键），把竹椅挪进阴凉', '晒得太久会中暑；凉风吹过能降温'],
    goal: '从早到晚（30 秒），一直别让拱拱热晕。',
    knowledge: { head: '小暑 · 温风至', text: '“暑”是炎热，小暑是热起来了、但还没到最热。民谚说“小暑大暑，上蒸下煮”。小暑一候“温风至”，连风都是热的。影子总在太阳的对面：早上树荫偏西，午后转到东边，正午最短。三候：温风至，蟋蟀居宇，鹰始挚。' },
    create(c) {
      const DUR = 30, TX = 400, GY = 470;
      let T = 0, x = 560, tx = 560, heat = .2, done = false, breezeX = -400, breezeT = 4, keys = {}, warn = 0;
      function shade() {
        const q = T / DUR, sunX = 80 + q * 800, cx = TX + (TX - sunX) * .45, hw = 60 + Math.abs(.5 - q) * 120;
        const eaves = q > .5 ? [800 - (q - .5) * 420, 960] : null;
        return { q, sunX, cx, hw, eaves };
      }
      function end(ok) { done = true; ok ? c.sfx.win() : c.sfx.calm(); c.finish({ success: ok, score: Math.round((1 - heat) * 100), stats: { heat }, line: ok ? '日落了，院子里凉快下来' : '太热了，拱拱晒晕了', delay: ok ? 1200 : 600 }); }
      return {
        start() { c.tip('把竹椅挪进树荫'); },
        update(dt) {
          if (done) return; T += dt; warn -= dt;
          if (keys.L) tx -= 260 * dt; if (keys.R) tx += 260 * dt; tx = c.clamp(tx, 60, 900);
          x += c.clamp(tx - x, -260 * dt, 260 * dt);
          const s = shade(), inTree = Math.abs(x - s.cx) < s.hw - 18, inEave = s.eaves && x > s.eaves[0] + 20, cool = inTree || inEave;
          heat += dt * (cool ? -.2 : .13 + .1 * Math.sin(s.q * Math.PI));
          breezeT -= dt; if (breezeT <= 0) { breezeX = -200; breezeT = c.rnd(4.5, 6); c.sfx.noise(1.6, .1, 700, .5, 0, 'lowpass'); }
          if (breezeX > -300) { const was = breezeX; breezeX += 520 * dt; if (was < x && breezeX >= x) { heat -= .18; c.fx.text(x, 300, '凉风', '#5f9e86', 20); c.sfx.good(5); } if (breezeX > 1200) breezeX = -400; }
          heat = c.clamp(heat, 0, 1);
          if (!cool && heat > .7 && warn <= 0) { c.toast('太晒了，快挪进阴凉'); c.sfx.miss(); warn = 3; }
          c.progress(T / DUR);
          if (heat >= 1) end(false); else if (T >= DUR) end(true);
          c.tip(cool ? '在阴凉里，舒服' : s.q > .55 ? '树荫在挪 · 午后屋檐下也有阴凉' : '树荫在挪，跟上');
        },
        down(p) { tx = c.clamp(p.x, 60, 900); }, move(p, pr) { if (pr) tx = c.clamp(p.x, 60, 900); },
        key(k, dn) { dirs(keys, k, dn); },
        draw(g, t) {
          const s = shade(), sy = 150 - Math.sin(s.q * Math.PI) * 90;
          c.draw.wash(g, 480, 180, 460, 160, c.mix('#f6efd8', '#f3dcc0', Math.sin(s.q * Math.PI)), .6, 2);
          g.fillStyle = '#e8c47f'; c.draw.ink(g, 2, c.C.sunInk); g.beginPath(); g.arc(s.sunX, sy, 26, 0, TAU); g.fill(); g.stroke();
          c.draw.text(g, '东', 40, 60, 16, c.C.mute); c.draw.text(g, '西', 920, 60, 16, c.C.mute);
          c.draw.ground(g, GY, '#e6dcc0', 2);
          // 屋与屋檐
          g.fillStyle = '#efe8d6'; c.draw.ink(g, 2.2); g.beginPath(); g.rect(810, 250, 160, GY - 250); g.fill(); g.stroke();
          g.fillStyle = '#9aa6a0'; g.beginPath(); g.moveTo(770, 260); g.lineTo(890, 200); g.lineTo(980, 230); g.lineTo(980, 260); g.closePath(); g.fill(); g.stroke();
          g.fillStyle = '#d8c7a0'; g.beginPath(); g.rect(840, 330, 50, GY - 330); g.fill(); g.stroke();
          // 影子
          g.fillStyle = 'rgba(48,73,61,.22)'; g.beginPath(); g.ellipse(s.cx, GY + 40, s.hw, 34, 0, 0, TAU); g.fill();
          if (s.eaves) { g.beginPath(); g.moveTo(s.eaves[0], GY + 70); g.lineTo(810, GY); g.lineTo(960, GY); g.lineTo(960, GY + 70); g.closePath(); g.fill(); }
          // 树
          c.draw.ink(g, 8, '#8a6a44'); g.beginPath(); g.moveTo(TX, GY + 20); g.quadraticCurveTo(TX - 10, 330, TX + 4, 250); g.stroke();
          c.draw.wash(g, TX, 220, 120, 80, '#9cc49a', .85, 4); c.draw.wash(g, TX - 50, 250, 70, 50, '#86b487', .8, 9); c.draw.wash(g, TX + 60, 250, 70, 50, '#a9cc93', .8, 6);
          // 凉风
          if (breezeX > -300) { c.draw.ink(g, 2, 'rgba(95,158,134,.6)'); for (let k = 0; k < 4; k++) { const y = 320 + k * 40, x0 = breezeX - k * 30; g.beginPath(); g.moveTo(x0, y); g.quadraticCurveTo(x0 + 50, y - 12, x0 + 100, y); g.stroke(); } }
          // 竹椅与拱拱
          c.draw.ink(g, 3, '#b49a62'); g.beginPath(); g.moveTo(x - 34, GY + 50); g.lineTo(x - 30, GY + 14); g.lineTo(x + 30, GY + 14); g.lineTo(x + 34, GY + 50); g.moveTo(x - 32, GY + 30); g.lineTo(x + 32, GY + 30); g.stroke();
          c.draw.gong(g, x, GY + 14, .95, { robe: ROBE, seed: 41, ground: false, mood: heat < .4 ? 'happy' : 'calm', bob: Math.sin(t * 2) });
          if (heat > .45) { c.draw.ink(g, 1.6, `rgba(217,124,106,${heat})`); for (let k = -1; k <= 1; k++) { g.beginPath(); g.moveTo(x + k * 18, GY - 80); g.quadraticCurveTo(x + k * 18 + 6, GY - 92, x + k * 18, GY - 104); g.quadraticCurveTo(x + k * 18 - 6, GY - 116, x + k * 18, GY - 126); g.stroke(); } }
          // 暑气计：画在画面里，不是积分
          c.draw.text(g, '暑气', 54, 560, 15, c.C.mute); c.draw.ink(g, 10, 'rgba(48,73,61,.12)'); g.beginPath(); g.moveTo(90, 560); g.lineTo(290, 560); g.stroke();
          c.draw.ink(g, 10, c.mix('#e2c37a', '#d97c6a', heat)); g.beginPath(); g.moveTo(90, 560); g.lineTo(90 + 200 * Math.max(.02, heat), 560); g.stroke();
        }
      };
    }
  });

  /* ———————————————————— 11 大暑 · 夏夜流萤 ———————————————————— */
  SG.register(11, {
    id: 'dashu-firefly', term: '大暑', title: '夏夜流萤', type: '反应操作',
    howto: ['移动鼠标（或方向键）带着纱囊，靠近萤火虫就能收进来', '要慢慢靠近，动作太快会把萤火虫惊飞', '收满一囊，给拱拱照亮书页'],
    goal: '60 秒内收集 15 只萤火虫。',
    knowledge: { head: '大暑 · 腐草为萤', text: '大暑是一年里最热、最潮湿的时候。一候“腐草为萤”是古人的想象：萤火虫把卵产在水边潮湿的草丛里，幼虫在草根下长大，夏夜飞出来发光，古人便以为是腐草变的。晋代车胤“囊萤夜读”的故事就发生在这样的夏夜。三候：腐草为萤，土润溽暑，大雨时行。' },
    create(c) {
      const GOAL = 15, FAST = 420, SLOW = 300;
      let bx = 480, by = 330, tx = 480, ty = 330, lx = 480, ly = 330, sp = 0, got = 0, T = 60, done = false, keys = {}, warn = 0, flies = [], caught = [];
      const add = () => flies.push({ x: c.rnd(120, 900), y: c.rnd(120, 440), vx: c.rnd(-40, 40), vy: c.rnd(-30, 30), ph: c.rnd(0, TAU), flee: 0 });
      for (let k = 0; k < 6; k++) add();
      function end(ok) {
        done = true; ok ? c.sfx.win() : c.sfx.calm();
        if (ok) for (let k = 0; k < 20; k++) caught.push({ x: bx, y: by, vx: c.rnd(-120, 120), vy: c.rnd(-160, -40), ph: c.rnd(0, TAU), free: true });
        c.finish({ success: ok, score: got * 6 + Math.round(T), stats: { got }, line: ok ? '一囊萤光，照亮了书页' : '夜深了，萤火虫飞远了', delay: ok ? 1800 : 600 });
      }
      return {
        start() { c.tip('慢慢靠近萤火虫'); },
        update(dt) {
          if (keys.L) tx -= 220 * dt; if (keys.R) tx += 220 * dt; if (keys.U) ty -= 220 * dt; if (keys.D) ty += 220 * dt;
          tx = c.clamp(tx, 30, 930); ty = c.clamp(ty, 60, 560);
          bx += (tx - bx) * Math.min(1, dt * 14); by += (ty - by) * Math.min(1, dt * 14);
          sp += (Math.hypot(bx - lx, by - ly) / Math.max(dt, .001) - sp) * Math.min(1, dt * 8); lx = bx; ly = by;
          for (const f of caught) if (f.free) { f.x += f.vx * dt; f.y += f.vy * dt; f.vx += c.rnd(-60, 60) * dt; }
          if (done) return; T -= dt; warn -= dt;
          for (let k = flies.length - 1; k >= 0; k--) {
            const f = flies[k], d = Math.hypot(f.x - bx, f.y - by);
            if (f.flee > 0) f.flee -= dt; else { f.vx += c.rnd(-60, 60) * dt; f.vy += c.rnd(-60, 60) * dt; const v = Math.hypot(f.vx, f.vy); if (v > 60) { f.vx *= 60 / v; f.vy *= 60 / v; } }
            if (sp > FAST && d < 120 && f.flee <= 0) { const a = Math.atan2(f.y - by, f.x - bx); f.vx = Math.cos(a) * 280; f.vy = Math.sin(a) * 280; f.flee = .8; if (warn <= 0) { c.toast('太快了，萤火虫被惊飞'); c.sfx.soft(); warn = 2.5; } }
            f.x += f.vx * dt; f.y += f.vy * dt;
            if (f.x < 80 || f.x > 900) f.vx = -f.vx * .8; if (f.y < 100 || f.y > 470) f.vy = -f.vy * .8; f.x = c.clamp(f.x, 79, 901); f.y = c.clamp(f.y, 99, 471);
            if (d < 48 && sp < SLOW) { flies.splice(k, 1); got++; caught.push({ ox: c.rnd(-12, 12), oy: c.rnd(-10, 14), ph: c.rnd(0, TAU) }); c.sfx.note(3 + got % 5, .4, .12); c.fx.ring(bx, by, '#e9d66b', 30); c.progress(got / GOAL); if (got >= GOAL) { end(true); return; } }
          }
          while (flies.length < 6) add();
          if (T <= 0) end(false);
          c.tip(`纱囊里 ${got} / ${GOAL} 只` + (sp > FAST ? ' · 慢一点' : ''));
        },
        move(p) { tx = p.x; ty = p.y; }, down(p) { tx = p.x; ty = p.y; },
        key(k, dn) { dirs(keys, k, dn); },
        draw(g, t) {
          g.fillStyle = 'rgba(40,58,66,.82)'; g.fillRect(0, 0, c.W, c.H);
          c.draw.wash(g, 820, 90, 54, 54, '#f3ecd0', .25, 2); g.fillStyle = 'rgba(243,236,208,.92)'; g.beginPath(); for (let k = 0; k <= 40; k++) { const a = k / 40 * TAU, r = 30 * (1 + .025 * Math.sin(a * 3 + 1)); k ? g.lineTo(820 + Math.cos(a) * r, 90 + Math.sin(a) * r) : g.moveTo(820 + r, 90); } g.fill();
          c.draw.ground(g, 520, '#3d5a4c', 2);
          c.draw.ink(g, 2, '#5f8a6e'); for (let k = 0; k < 40; k++) { const x = k * 25 + 6, h = 30 + (k * 37) % 40, s = Math.sin(t + k) * 4; g.beginPath(); g.moveTo(x, 600); g.quadraticCurveTo(x + s, 600 - h / 2, x + s * 2, 600 - h - 20); g.stroke(); }
          // 拱拱与书
          const lit = got / GOAL;
          c.draw.wash(g, 170, 520, 120, 70, '#f1e59a', .15 + lit * .45, 3);
          g.fillStyle = c.mix('#8e958c', '#fbf3d8', lit); c.draw.ink(g, 1.6, '#cfd6cc'); g.beginPath(); g.moveTo(190, 560); g.lineTo(230, 552); g.lineTo(270, 560); g.lineTo(270, 574); g.lineTo(230, 566); g.lineTo(190, 574); g.closePath(); g.fill(); g.stroke();
          c.draw.gong(g, 130, 575, 1, { robe: ROBE, seed: 47, mood: lit > .5 ? 'happy' : 'calm' });
          // 萤火虫
          for (const f of flies) { const a = .3 + .7 * Math.max(0, Math.sin(t * 2.4 + f.ph)); g.globalAlpha = a; c.draw.wash(g, f.x, f.y, 14, 14, '#f3e27a', .5, 1); g.fillStyle = '#fff6b0'; g.beginPath(); g.arc(f.x, f.y, 3.2, 0, TAU); g.fill(); g.globalAlpha = 1; }
          // 纱囊
          c.draw.wash(g, bx, by + 6, 26 + got * .6, 30 + got * .6, '#f3e27a', .12 + lit * .4, 5);
          g.fillStyle = 'rgba(248,247,242,.18)'; c.draw.ink(g, 1.8, sp > FAST ? '#e9a3a3' : '#e8e3cf'); g.beginPath(); g.ellipse(bx, by + 8, 24, 28, 0, 0, TAU); g.fill(); g.stroke();
          g.beginPath(); g.moveTo(bx - 14, by - 16); g.quadraticCurveTo(bx, by - 10, bx + 14, by - 16); g.stroke();
          for (const f of caught) { if (f.free) { g.fillStyle = '#fff6b0'; g.globalAlpha = .4 + .6 * Math.max(0, Math.sin(t * 3 + f.ph)); g.beginPath(); g.arc(f.x, f.y, 3, 0, TAU); g.fill(); g.globalAlpha = 1; continue; } g.fillStyle = '#fff6b0'; g.globalAlpha = .5 + .5 * Math.max(0, Math.sin(t * 3 + f.ph)); g.beginPath(); g.arc(bx + f.ox, by + 8 + f.oy, 2.4, 0, TAU); g.fill(); g.globalAlpha = 1; }
        }
      };
    }
  });
})();
