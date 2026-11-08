/* 时节 · 拱拱的衣橱 v1.0
 * 数据：24 件节气物品；存储：localStorage 'shijie.wardrobe.v1' = {unlocked:number[], equipped:number|null, seen:number[]}
 * 素材：ip/gong.svg（本体）、ip/wear-NN.svg（穿戴图）、ip/item-NN.svg（物品单独图），NN = 节气序号 00–23。
 * 以后细化画法只需替换 ip/ 里的 SVG；物品图标的取景框 crop 若物品位置变化较大，再按需微调。
 *
 * 页面上任何 <img data-gong> 都会自动显示当前穿戴的拱拱（没穿戴时是本体），穿戴变化后立即刷新。
 */
(function () {
  'use strict';
  const KEY = 'shijie.wardrobe.v1';
  const SEASONS = ['春', '夏', '秋', '冬'];
  const WASH = ['#cfe2b6', '#c4e0d2', '#efd4a4', '#d9d5e6'];
  // crop = 物品在 200×200 画布上的方形取景框 [x, y, 边长]，只用于图标居中放大，不改素材
  const ITEMS = [
    ['立春', '春幡', '头顶', [108, 13, 57], '古人立春剪彩绸做成小幡，戴在头上迎春。', '古人在立春这天剪彩绸或彩纸做成小幡，戴在头上或系在花枝上，叫作“春幡”，用来迎接春天。辛弃疾词里写过“看美人头上，袅袅春幡”。'],
    ['雨水', '油纸伞', '手拿', [92, 11, 116], '雨水时节降水渐多，“春雨贵如油”。', '雨水时节，降水开始增多。民间说“春雨贵如油”，这时的雨对刚返青的庄稼格外要紧。拱拱撑起油纸伞，等这场好雨。'],
    ['惊蛰', '拨浪鼓', '手拿', [134, 47, 74], '春雷渐起，蛰伏的虫子醒了过来。', '惊蛰前后春雷渐起，古人认为是雷声惊醒了蛰伏在土里的虫子。现在知道，让虫子苏醒的主要是回暖的气温。拱拱摇一摇拨浪鼓，学一声小小的春雷。'],
    ['春分', '纸鸢', '手拿', [116, 6, 109], '春分前后风和日暖，正好放风筝。', '纸鸢就是风筝。春分前后风和日暖，民间有放风筝的习惯，有的地方还会在风筝上写下祝福，让它飞得高高的。'],
    ['清明', '柳环', '头戴', [50, 43, 113], '清明有折柳、插柳、戴柳的习俗。', '民间有清明折柳、插柳、戴柳的习俗，有的地方把柳枝编成环戴在头上。新柳青青，是这个时节最当令的颜色。'],
    ['谷雨', '谷雨茶', '手拿', [138, 70, 65], '谷雨前后采制的新茶，叫“谷雨茶”。', '谷雨是春季最后一个节气，取“雨生百谷”的意思。这时前后采制的新茶叫“谷雨茶”，有的地方有在谷雨喝一杯新茶的习惯。'],
    ['立夏', '蛋兜', '挂在胸前', [52, 88, 99], '立夏挂蛋，民间盼孩子平安度夏。', '民间有立夏挂蛋、斗蛋的习俗：用彩线编个小网兜装上煮熟的鸡蛋，挂在孩子胸前。俗话说“立夏胸挂蛋，孩子不疰夏”，寄托的是平安度夏的心愿。'],
    ['小满', '麦穗', '头顶', [73, -7, 72], '麦粒开始饱满，但还没全熟，所以叫“小满”。', '小满时，北方的麦粒开始饱满，但还没有完全成熟。小得盈满、还未全满，就是“小满”这个名字的意思。'],
    ['芒种', '斗笠', '头戴', [30, 5, 149], '有芒的作物要抓紧收种，“芒种忙种”。', '芒种的“芒”，指麦、稻这类带芒的作物。这时北方忙着收麦、南方忙着插秧，民间常说“芒种忙种”。戴上斗笠，下田去。'],
    ['夏至', '蒲扇', '手拿', [-7, 30, 87], '北半球一年中白天最长的一天。', '夏至这天，北半球白天最长、夜晚最短。此后天气越来越热，一把蒲扇是老辈人消暑的好帮手。'],
    ['小暑', '荷叶帽', '头戴', [32, -20, 143], '小暑前后荷花盛开，荷叶又大又圆。', '小暑前后荷花盛开，荷叶也长得又大又圆。拱拱摘一片荷叶顶在头上，当作遮阳的帽子。'],
    ['大暑', '萤囊', '手拿', [133, 103, 54], '大暑初候“腐草为萤”，这是古人的想象。', '大暑初候叫“腐草为萤”，古人以为萤火虫是腐草变的。这是古人的认识，萤火虫其实由卵和幼虫长成。民间还流传着车胤用纱囊装萤火虫照明读书的故事。'],
    ['立秋', '梧桐叶', '头顶', [81, 4, 61], '“梧桐一叶落，天下尽知秋。”', '古话说“梧桐一叶落，天下尽知秋”，一片落叶就能让人察觉季节的转换。立秋是秋天的开始，不过暑热往往还没有退。'],
    ['处暑', '河灯', '手拿', [142, 86, 61], '处暑前后是中元节，有的地方放河灯。', '处暑的“处”是止的意思，暑热到这里渐渐止住。处暑前后常逢农历七月十五中元节，有的地方有放河灯的习俗，寄托对先人的思念。'],
    ['白露', '雁羽', '漂浮', [32, 11, 63], '白露初候“鸿雁来”，大雁开始南飞。', '白露初候是“鸿雁来”，大雁开始成群南飞。一片雁羽飘过拱拱身边，是秋天经过的痕迹。'],
    ['秋分', '桂花枝', '手拿', [137, 45, 76], '秋分昼夜等长，前后正是桂花开。', '秋分这天昼夜等长，秋季过半。前后正是桂花开的时候，有的地方会赏桂、做桂花糕。'],
    ['寒露', '菊花', '簪在头侧', [106, 47, 56], '寒露三候“菊有黄华”，菊花开得正好。', '寒露三候是“菊有黄华”，菊花这时开得正好。寒露也常临近重阳，民间有赏菊、饮菊花酒的习俗。'],
    ['霜降', '柿子帽', '头顶', [78, 13, 55], '霜降吃柿子，取“事事如意”的好意头。', '霜降前后柿子正红，有的地方有霜降吃柿子的习俗，也借“柿”与“事”谐音，讨一个“事事如意”的好意头。'],
    ['立冬', '饺子', '手拿', [139, 68, 65], '立冬“补冬”，北方不少地方吃饺子。', '立冬有“补冬”的说法，北方不少地方这天吃饺子。民间解释说，饺子取“交子之时”的意思，正是秋冬之交。'],
    ['小雪', '围巾', '围在身上', [45, 100, 115], '气温下降，北方开始飘雪。', '小雪时气温下降，北方开始飘雪，不过雪量还不大。拱拱围上围巾，准备过冬。'],
    ['大雪', '雪帽', '头顶', [22, 14, 135], '降雪增多，“瑞雪兆丰年”。', '大雪时节降雪增多。民间说“瑞雪兆丰年”，厚厚的积雪像棉被一样，护住了越冬的麦苗。'],
    ['冬至', '消寒图', '手拿', [122, 55, 93], '从冬至开始数九，每天染一瓣梅花。', '从冬至开始“数九”，九九八十一天后寒冬过去。古人画九九消寒图：一枝梅花八十一瓣，每天染一瓣，染完了，春天也就到了。'],
    ['小寒', '手炉', '手拿', [126, 64, 88], '一年中最冷的时段之一。', '小寒是一年中最冷的时段之一，民间有“小寒胜大寒”的说法。旧时人们捧一只手炉取暖。'],
    ['大寒', '灯笼', '手拿', [132, 48, 89], '大寒临近春节，人们开始迎年。', '大寒是二十四节气的最后一个，往往临近春节。人们扫尘、备年货、挂灯笼，开始迎接新的一年。']
  ].map(([term, name, wear, crop, short, intro], index) => ({ index, term, name, wear, crop, short, intro }));

  const pad = i => String(i).padStart(2, '0');
  const valid = i => Number.isInteger(i) && i >= 0 && i < 24;
  const uniq = a => [...new Set(a.filter(valid))].sort((x, y) => x - y);

  // ——— 存储：读取失败或格式不对时回退成空状态 ———
  function load() {
    try {
      const v = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (!v || typeof v !== 'object' || !Array.isArray(v.unlocked)) throw 0;
      const unlocked = uniq(v.unlocked);
      const equipped = valid(v.equipped) && unlocked.includes(v.equipped) ? v.equipped : null;
      const seen = Array.isArray(v.seen) ? uniq(v.seen) : unlocked.slice();
      return { unlocked, equipped, seen };
    } catch { return { unlocked: [], equipped: null, seen: [] }; }
  }
  let st = load();
  const subs = [];
  function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch {} }
  function emit() { save(); paintGongs(); subs.forEach(fn => { try { fn(api.state()); } catch (e) { console.warn('wardrobe', e); } }); }

  const gongURL = () => st.equipped === null ? 'ip/gong.svg' : `ip/wear-${pad(st.equipped)}.svg`;
  function paintGongs() { document.querySelectorAll('img[data-gong]').forEach(img => { const u = gongURL(); if (img.getAttribute('src') !== u) img.src = u; }); }
  // 物品图标：用取景框把物品居中放大；素材本身不改
  function itemSVG(i, cls = '') {
    const it = ITEMS[i], [x, y, s] = it.crop;
    return `<svg class="${cls}" viewBox="${x} ${y} ${s} ${s}" aria-hidden="true" focusable="false"><image href="ip/item-${pad(i)}.svg" width="200" height="200"/></svg>`;
  }

  const api = {
    ITEMS, SEASONS, WASH,
    unlocked: () => st.unlocked.slice(),
    isUnlocked: i => st.unlocked.includes(i),
    unlock(i) { if (!valid(i) || st.unlocked.includes(i)) return false; st.unlocked = uniq([...st.unlocked, i]); emit(); return true; },
    equipped: () => st.equipped,
    equip(i) { if (!st.unlocked.includes(i)) return false; st.equipped = i; emit(); return true; },
    unequip() { if (st.equipped === null) return; st.equipped = null; emit(); },
    unread: () => st.unlocked.filter(i => !st.seen.includes(i)),
    markSeen(i) { if (!st.unlocked.includes(i) || st.seen.includes(i)) return; st.seen = uniq([...st.seen, i]); emit(); },
    onChange(fn) { subs.push(fn); return () => { const k = subs.indexOf(fn); if (k >= 0) subs.splice(k, 1); }; },
    state: () => ({ unlocked: st.unlocked.slice(), equipped: st.equipped, seen: st.seen.slice() }),
    gongURL, itemSVG, wearURL: i => `ip/wear-${pad(i)}.svg`,
    open: () => {}, isOpen: () => false     // 面板就绪后替换
  };
  window.Wardrobe = api;
  // 其他标签页改了存储，同步过来
  addEventListener('storage', e => { if (e.key === KEY) { st = load(); emit(); } });

  // ——— 衣橱面板 ———
  function ui() {
    paintGongs();
    const btn = document.getElementById('wardrobeBtn');
    const dlg = document.createElement('dialog');
    dlg.id = 'wardrobe'; dlg.className = 'wd'; dlg.setAttribute('aria-labelledby', 'wdTitle');
    dlg.innerHTML = `<div class="wd-head"><img data-gong class="wd-me" alt="" src="${gongURL()}"><div class="wd-tt"><h2 id="wdTitle">拱拱的衣橱</h2><p id="wdCount"></p></div><button class="m-close wd-x" type="button" aria-label="关闭衣橱">×</button></div>
      <div class="wd-body">${SEASONS.map((s, k) => `<section class="wd-sec" aria-label="${s}"><h3>${s}</h3><div class="wd-grid">${ITEMS.slice(k * 6, k * 6 + 6).map(it => `<button type="button" class="wd-cell" data-i="${it.index}">${itemSVG(it.index, 'wd-ic')}<span class="wd-term">${it.term}</span><span class="wd-name"></span><i class="wd-dot" aria-hidden="true"></i><svg class="wd-lock" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><rect x="3.5" y="7" width="9" height="6.5" rx="1.5"/><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2"/></svg></button>`).join('')}</div></section>`).join('')}</div>
      <p class="wd-hint" role="status" aria-live="polite"></p>
      <div class="wd-card" role="group" aria-labelledby="wdcName" hidden><div class="wd-card-in"><div class="wd-art"><i class="wd-wash"></i><img alt=""></div><p class="wd-kick"></p><h3 id="wdcName"></h3><p class="wd-wear"></p><p class="wd-intro"></p><div class="wd-btns"><button type="button" class="wd-main"></button><button type="button" class="wd-ghost">关闭</button></div></div></div>`;
    document.body.appendChild(dlg);
    const $ = s => dlg.querySelector(s), cells = [...dlg.querySelectorAll('.wd-cell')], card = $('.wd-card'), hint = $('.wd-hint');
    let cardFor = -1, hintT = 0;

    function paint() {
      const n = st.unlocked.length;
      $('#wdCount').textContent = `已收集 ${n} / 24`;
      cells.forEach(c => {
        const i = +c.dataset.i, it = ITEMS[i], on = st.unlocked.includes(i), eq = st.equipped === i, nw = on && !st.seen.includes(i);
        c.classList.toggle('locked', !on); c.classList.toggle('on', eq); c.classList.toggle('new', nw);
        c.querySelector('.wd-name').textContent = !on ? '？？' : eq ? '穿戴中' : it.name;
        c.setAttribute('aria-disabled', String(!on));
        c.setAttribute('aria-label', on ? `${it.term} · ${it.name}${eq ? '，穿戴中' : ''}${nw ? '，新获得' : ''}` : `${it.term}，未解锁。通关「${it.term}」小游戏后解锁`);
      });
      if (btn) { btn.classList.toggle('new', api.unread().length > 0); btn.setAttribute('aria-label', '拱拱的衣橱' + (api.unread().length ? '，有新物品' : '')); }
      if (cardFor >= 0) paintCard(cardFor);
    }
    function paintCard(i) {
      const it = ITEMS[i], eq = st.equipped === i;
      card.querySelector('img').src = api.wearURL(i);
      card.querySelector('.wd-wash').style.background = `radial-gradient(closest-side, ${WASH[Math.floor(i / 6)]}cc, ${WASH[Math.floor(i / 6)]}00)`;
      $('.wd-kick').textContent = `${it.term} · ${SEASONS[Math.floor(i / 6)]}`;
      $('#wdcName').textContent = `${it.term} · ${it.name}`;
      $('.wd-wear').textContent = '穿法：' + it.wear;
      $('.wd-intro').textContent = it.intro;
      $('.wd-main').textContent = eq ? '卸下' : '穿上';
    }
    function showCard(i) {
      if (!st.unlocked.includes(i)) return;
      cardFor = i; paintCard(i); card.hidden = false; dlg.classList.add('carded');
      cells.forEach(c => c.inert = true);
      requestAnimationFrame(() => card.classList.add('show'));
      api.markSeen(i);
      setTimeout(() => $('.wd-main').focus({ preventScroll: true }), 30);
    }
    function hideCard() {
      if (cardFor < 0) return;
      const i = cardFor; cardFor = -1; card.classList.remove('show'); card.hidden = true; dlg.classList.remove('carded');
      cells.forEach(c => c.inert = false); cells[i].focus({ preventScroll: true });
    }
    function say(s) { hint.textContent = s; hint.classList.add('show'); clearTimeout(hintT); hintT = setTimeout(() => hint.classList.remove('show'), 2400); }

    cells.forEach(c => c.onclick = () => {
      const i = +c.dataset.i;
      if (!st.unlocked.includes(i)) { say(`通关「${ITEMS[i].term}」小游戏后解锁`); return; }
      showCard(i);
    });
    $('.wd-main').onclick = () => { if (cardFor < 0) return; st.equipped === cardFor ? api.unequip() : api.equip(cardFor); };
    $('.wd-ghost').onclick = hideCard;
    card.addEventListener('click', e => { if (e.target === card) hideCard(); });
    $('.wd-x').onclick = () => close();
    dlg.addEventListener('cancel', e => { e.preventDefault(); if (cardFor >= 0) hideCard(); else close(); });
    dlg.addEventListener('click', e => { if (e.target === dlg) close(); });

    let opener = null;
    function open(i) {
      if (!dlg.open) { opener = btn || document.activeElement; paint(); dlg.showModal(); dlg.querySelector('.wd-body').scrollTop = 0; requestAnimationFrame(() => dlg.classList.add('show')); }
      if (valid(i) && st.unlocked.includes(i)) { cells[i].scrollIntoView({ block: 'nearest' }); showCard(i); }
      else setTimeout(() => (cells.find(c => !c.classList.contains('locked')) || $('.wd-x')).focus({ preventScroll: true }), 30);
    }
    function close() {
      if (!dlg.open) return;
      if (cardFor >= 0) { cardFor = -1; card.hidden = true; card.classList.remove('show'); dlg.classList.remove('carded'); cells.forEach(c => c.inert = false); }
      dlg.classList.remove('show'); dlg.close();
      (opener && document.contains(opener) ? opener : btn)?.focus({ preventScroll: true });
    }
    api.open = open; api.close = close; api.isOpen = () => dlg.open;
    if (btn) btn.onclick = () => open();
    api.onChange(paint); paint();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ui); else ui();
})();
