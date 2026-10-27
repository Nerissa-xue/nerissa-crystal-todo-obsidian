import { ItemView, Plugin, WorkspaceLeaf } from 'obsidian';

const VIEW_TYPE = 'crystal-todo-view';

export interface CrystalData {
  finished: number;
  nextId: number;
  zones: { name: string; icon: string; blockFace: string; blocks: { id: number; text: string; anger: number; face: string }[] }[];
  completed: { id: number; text: string; zoneUid: string; tint: string; day: string; doneAt: number }[];
  dayMax: { date: string; max: number };
}

export default class CrystalTodoPlugin extends Plugin {
  data: CrystalData | null = null;

  async onload() {
    this.data = (await this.loadData()) as CrystalData | null;
    this.addRibbonIcon('gem', '打开水晶待办', () => { this.activateView(); });
    this.addCommand({ id: 'open-crystal-todo', name: '打开水晶待办板', callback: () => { this.activateView(); } });
    this.registerView(VIEW_TYPE, (leaf) => new CrystalTodoView(leaf, this));
  }

  onunload() {}

  async activateView() {
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType(VIEW_TYPE)[0];
    if (!leaf) {
      const newLeaf = workspace.getRightLeaf(false);
      if (newLeaf) await newLeaf.setViewState({ type: VIEW_TYPE, active: true });
      leaf = workspace.getLeavesOfType(VIEW_TYPE)[0];
    }
    if (leaf) leaf.setActive();
  }

  async persist(data: CrystalData) {
    this.data = data;
    await this.saveData(data);
  }
}

const VIEW_HTML = `<div class="shell"><header class="mast"><div class="brand"><i class="gem"></i> crystal todo <span style="font-size:10px;font-weight:400;color:#9ba89d;margin-left:5px">水晶待办</span></div><div class="status" id="saveStatus">轻一点，做事情。</div></header><section class="intro"><div class="eyebrow">A LITTLE LESS ON YOUR MIND</div><h1>把待办待办，总有待办。</h1><p>不想干，就锤两下。做完了，让它漂亮地消失。</p><div class="summary"><div><strong id="remaining">0</strong><span>件待办</span></div><div><strong id="finished">0</strong><span>件已完成</span></div></div></section>
<div class="demo-wrap"><div class="top-row"><div class="toolbar"><button class="tool active" id="toolHammer">🔨 解解气 <span class="key">1</span></button><button class="tool" id="toolWand">🪄 做完啦 <span class="key">2</span></button></div><div><button class="add-zone-btn" id="addZoneBtn">＋ 加个模块</button><button class="sound" id="sound">声音 关</button></div></div><div class="add-row"><input class="add-input" id="addInput" maxlength="400" aria-label="新待办" placeholder="什么事占着你的脑袋？写下来…"><select id="target" class="target" aria-label="落入模块"></select><button class="add-btn" id="addBtn">↓ 落一个</button></div><div class="combo" id="combo" aria-live="polite"></div><div class="zones" id="zones"></div><div class="hint" id="toolHint">🔨 点水晶解气，不会删除待办 · 按住拖动可以换模块</div></div><section class="trophy" aria-label="今日战利品"><div class="trophy-head"><span class="trophy-title">◆ 今日战利品</span><span class="trophy-stats"><strong id="trophyCount">0</strong><span class="trophy-badge" id="trophyCombo" hidden>🔥 最高连击 x2</span></span></div><div class="trophy-shelf" id="trophyShelf"><div class="trophy-empty" id="trophyEmpty">还没有，去消一个吧！</div></div><div class="trophy-feed" id="trophyFeed"></div></section><footer class="footer"><span>MAKE ROOM FOR A LIGHTER DAY.</span><span>点模块名改名 · 自动保存在当前浏览器</span></footer></div><div class="toast" id="toast" role="status"><span id="toastText"></span><button id="undo" hidden>撤销</button></div>`;

// @ts-nocheck —— 从单文件网页版整体移植，保持原样
class CrystalTodoView extends ItemView {
  plugin: CrystalTodoPlugin;
  private cleanupFns: (() => void)[] = [];

  constructor(leaf: WorkspaceLeaf, plugin: CrystalTodoPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType() { return VIEW_TYPE; }
  getDisplayText() { return '水晶待办'; }
  getIcon() { return 'gem'; }

  async onOpen() {
    const root = this.contentEl;
    const pluginRef = this.plugin;
    const initialData = this.plugin.data;
    root.addClass('ct-root');
    root.setAttribute('tabindex', '0');
    root.innerHTML = VIEW_HTML;
    const $ = (id: string) => root.querySelector('#' + id) as any;


    var COLS = 3, COLW = 96, GAP = 10, MAX_ROWS = 5;
    var persistTimer: any = null;
    function snapshot() {
      return { finished: finished, nextId: nextId, completed: completed, dayMax: dayMax,
        zones: zones.map(z => ({ name: z.name, icon: z.icon, blockFace: z.blockFace,
          blocks: z.blocks.map(b => ({ id: b.id, text: b.text, anger: b.anger, face: b.face })) })) };
    }
    function persist() {
      clearTimeout(persistTimer);
      persistTimer = setTimeout(function () { pluginRef.persist(snapshot()).catch(function () { $('saveStatus').textContent = '保存失败'; }); }, 300);
    }
    var ZONE_STYLES = ['zone-mint', 'zone-pink', 'zone-blue', 'zone-amber'];
    var TINTS = ['tint-blue', 'tint-pink', 'tint-mint', 'tint-amber'];
    var zones = [];
    var blockEls = {};
    var nextId = 1;
    var comboEl = $('combo');
    var comboCount = 0, comboTimer = null;
    var dragging = null;
    var activeTool = 'hammer';
var finished=0,ready=false,lastDone=null,toastTimer,soundOn=false,audio;
var completed=[],dayMax={date:"",max:0},zoneUidSeq=0;
function toast(t,undo){$('toastText').textContent=t;$('undo').hidden=!undo;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),5000);}
function tone(f){if(!soundOn)return;try{audio=audio||new(window.AudioContext||(window as any).webkitAudioContext)();audio.resume();var o=audio.createOscillator(),g=audio.createGain();o.connect(g);g.connect(audio.destination);o.frequency.setValueAtTime(f,audio.currentTime);o.frequency.exponentialRampToValueAtTime(f/2,audio.currentTime+.12);g.gain.setValueAtTime(.06,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.18);o.start();o.stop(audio.currentTime+.2);}catch(e){}}
function sync(){$('remaining').textContent=zones.reduce((a,z)=>a+z.blocks.length,0);$('finished').textContent=finished;var select=$('target'),v=select.value;select.replaceChildren();zones.forEach((z,i)=>{var o=new Option(z.name,String(i));select.add(o);var f=z.rootEl.querySelector('.zone-foot');f.firstChild.textContent=z.blocks.length+' 件小事';});select.value=zones[Number(v)]?v:'0';if(ready)persist();}
    var zonesContainer = $('zones');

    function defaultFace(zone) { return zone.blockFace || ''; }
    function posX(col) { return col * (COLW + GAP); }
    function escapeHtml(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
    function spawnFx(parent, cls, text, x, y, tx, ty, rot) {
      var r=parent.getBoundingClientRect(); x+=r.left; y+=r.top;
      var el = document.createElement('div');
      el.className = 'fx ' + cls;
      el.textContent = text;
      el.style.left = x + 'px'; el.style.top = y + 'px';
      el.style.setProperty('--tx', (tx || 0) + 'px');
      el.style.setProperty('--ty', (ty || 0) + 'px');
      el.style.setProperty('--rot', rot + 'deg');
      root.appendChild(el);
      setTimeout(function () { el.remove(); }, 800);
    }
    function bumpCombo() {
      comboCount++;
      comboEl.textContent = comboCount >= 2 ? '🔥 COMBO x' + comboCount + '！' : '';
      clearTimeout(comboTimer);
      comboTimer = setTimeout(function () { comboCount = 0; comboEl.textContent = ''; }, 2500);
    }
    function todayKey() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
    function rollDay() { var k = todayKey(); if (dayMax.date !== k) dayMax = { date: k, max: 0 }; }
    function gemEl(c) {
      var g = document.createElement('div');
      g.className = 'tgem tg-' + c.tint;
      g.title = '点我恢复：' + c.text;
      g.tabIndex = 0; g.setAttribute('role', 'button'); g.setAttribute('aria-label', '恢复待办：' + c.text);
      g.innerHTML = '<div class="tgem-shape"></div><div class="tgem-label">' + escapeHtml(c.text) + '</div>';
      g.addEventListener('click', function () { restoreGem(c.id, g); });
      g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); restoreGem(c.id, g); } });
      return g;
    }
    function renderTrophy(animId) {
      rollDay();
      var shelf = $('trophyShelf');
      var oldGems = shelf.querySelectorAll('.tgem');
      for (var gi = 0; gi < oldGems.length; gi++) oldGems[gi].remove();
      var today = completed.filter(function (c) { return c.day === todayKey(); }).reverse();
      var empty = $('trophyEmpty');
      empty.style.display = today.length ? 'none' : 'block';
      shelf.appendChild(empty);
      today.forEach(function (c) {
        var g = gemEl(c);
        if (c.id === animId) g.classList.add('drop');
        shelf.appendChild(g);
      });
      $('trophyCount').textContent = today.length;
      var feed = $('trophyFeed');
      feed.replaceChildren();
      today.forEach(function (c) {
        var d = new Date(c.doneAt);
        var line = document.createElement('div');
        line.className = 'tfeed-line';
        line.innerHTML = '<span class="tfeed-dot tg-' + c.tint + '"></span><s>' + escapeHtml(c.text) + '</s><span class="tfeed-time">' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2) + '</span>';
        feed.appendChild(line);
      });
      var badge = $('trophyCombo');
      badge.hidden = dayMax.max < 2;
      badge.textContent = '🔥 最高连击 x' + dayMax.max;
    }
    function restoreGem(id, g) {
      var i = -1;
      for (var k = 0; k < completed.length; k++) if (completed[k].id === id) { i = k; break; }
      if (i === -1) return;
      var c = completed[i];
      var z = null;
      for (var j = 0; j < zones.length; j++) if (zones[j].uid === c.zoneUid) { z = zones[j]; break; }
      if (!z) z = zones[0];
      var b = { id: c.id, text: c.text, face: defaultFace(z), anger: 0, zone: z };
      z.blocks.push(b);
      createBlockEl(b, true);
      completed.splice(i, 1);
      lastDone = null;
      finished = Math.max(0, finished - 1);
      sync();
      g.classList.add('pop');
      setTimeout(function () { renderTrophy(); }, 280);
      toast('又捡回来了，慢慢来。');
    }
    function setTool(t) {
      activeTool = t;
      $('toolHammer').classList.toggle('active', t === 'hammer');
      $('toolWand').classList.toggle('active', t === 'wand');
      root.classList.toggle('tool-hammer', t === 'hammer');
      root.classList.toggle('tool-wand', t === 'wand');
 $('toolHint').textContent=t==='hammer'?'🔨 点水晶解气，不会删除待办 · 按住拖动可以换模块':'🪄 点水晶标记完成 · 误触可以撤销 · 按住拖动可以换模块';
    }

    function createZone(name, icon, blockFace) {
      var style = ZONE_STYLES[zones.length % ZONE_STYLES.length];
      var zone = { uid: 'z' + (zoneUidSeq++), name: name, icon: icon || '', blockFace: blockFace || '', style: style, blocks: [] };
      var root = document.createElement('div');
      root.className = 'zone ' + style;
      root.innerHTML =
        '<div class="zone-head">' +
          '<span class="zone-title"><span class="zemoji">' + (icon || '') + '</span><span class="zname">' + escapeHtml(name) + '</span></span>' +
          '<button class="zdel" title="删除模块">×</button>' +
        '</div>' +
        '<div class="zboard"></div><div class="zone-foot"><span></span><span>一点一点，腾出空间</span></div>';
      zone.rootEl = root;
      zone.boardEl = root.querySelector('.zboard');
      zone.nameEl = root.querySelector('.zname');
      zonesContainer.appendChild(root);
      root.querySelector('.zone-title').addEventListener('click', function () { startRename(zone); });
      root.querySelector('.zdel').addEventListener('click', function (e) { e.stopPropagation(); deleteZone(zone); });
      zones.push(zone); sync();
      return zone;
    }

    function startRename(zone) {
      if (zone._editing) return;
      zone._editing = true;
      var input = document.createElement('input');
      input.className = 'rename-input';
      input.value = zone.name;
      zone.nameEl.textContent = '';
      zone.nameEl.appendChild(input);
      input.focus();
      input.select();
      function commit() {
        var v = input.value.trim();
        if (v) zone.name = v;
        zone.nameEl.textContent = zone.name;
        zone._editing = false; sync();
      }
      input.addEventListener('blur', commit);
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') input.blur();
        if (e.key === 'Escape') { input.value = zone.name; input.blur(); }
        e.stopPropagation();
      });
    }

    function deleteZone(zone) {
      if (zones.length <= 1) return;
      var target = zones[0] === zone ? zones[1] : zones[0];
      zone.blocks.slice().forEach(function (b) {
        var idx = zone.blocks.indexOf(b);
        if (idx !== -1) zone.blocks.splice(idx, 1);
        b.zone = target;
        b.anger = 0;
        b.face = defaultFace(target);
        target.blocks.push(b);
        var el = blockEls[b.id];
        el.querySelector('.tface').textContent = b.face;
        target.boardEl.appendChild(el);
      });
      zone.rootEl.remove();
      zones.splice(zones.indexOf(zone), 1);
      layout();
    }

    function slotCol(index) { return index % COLS; }
    function zoneFull(z) { return z.blocks.length >= COLS * MAX_ROWS; }

    function addTodo(text) {
      var zone = zones[Number($("target").value)] || zones[0];
      var block = { id: nextId++, text: text, face: defaultFace(zone), anger: 0, zone: zone };
      zone.blocks.push(block);
      createBlockEl(block, true);
    }

    function createBlockEl(block, fallIn) {
      var el = document.createElement('div');
      el.className = 'tblock';
      el.dataset.id = block.id;el.tabIndex=0;el.setAttribute('role','button');el.setAttribute('aria-label',block.text);el.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();var r=el.getBoundingClientRect();var point={clientX:r.left+r.width/2,clientY:r.top+r.height/2};if(activeTool==='hammer')bonk(block,el,point);else complete(block,el,point);}});
      var tint = TINTS[block.id % TINTS.length];
      el.innerHTML = '<div class="tblock-inner ' + tint + '" title="' + escapeHtml(block.text) + '"><div class="tface">' + block.face + '</div><div class="ttext">' + escapeHtml(block.text) + '</div></div>';
      var inner = el.querySelector('.tblock-inner');
      var z = block.zone;
      var c = slotCol(z.blocks.indexOf(block));
      el.addEventListener('pointerdown', function (e) { onPointerDown(e, block, el, inner); });
      z.boardEl.appendChild(el);
      blockEls[block.id] = el;
      var h = el.offsetHeight;
      if (fallIn) {
        el.style.transform = 'translate(' + posX(c) + 'px, ' + (-(h + GAP)) + 'px)';
        requestAnimationFrame(function () { requestAnimationFrame(function () { layout(); }); });
      } else {
        layout();
      }
    }

    // 落块顺序：先铺满底排（左→右），再轮流往上叠（index i → col=i%COLS）
    // 竖向：每列自己从底往上紧贴堆叠，高低块之间不留空隙
    function layout() {
      zones.forEach(function (z) {
        var heights=[0,0,0];z.blocks.forEach((b,i)=>{if(blockEls[b.id])heights[i%3]+=blockEls[b.id].offsetHeight+GAP;});z.boardEl.style.height=Math.max(window.innerWidth<700?320:348,Math.max(...heights)+70)+'px';
        var boardH = z.boardEl.clientHeight;
        var cols = [[], [], []];
        z.blocks.forEach(function (b, i) { cols[i % COLS].push(b); });
        for (var c = 0; c < COLS; c++) {
          var y = boardH;
          cols[c].forEach(function (b) {
            var el = blockEls[b.id];
            if (!el) return;
            var h = el.offsetHeight;
            y -= h;
            el.style.transform = 'translate(' + posX(c) + 'px, ' + y + 'px)';
            y -= GAP;
          });
        }
      });
      sync();
    }

    function zoneAt(x, y) {
      for (var i = 0; i < zones.length; i++) {
        var r = zones[i].boardEl.getBoundingClientRect();
        if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return zones[i];
      }
      return null;
    }
    function setDropHint(z) {
      zones.forEach(function (zz) { zz.boardEl.classList.toggle('drop-hint', zz === z); });
    }

    function onPointerDown(e, block, el, inner) {
      if(block.busy || dragging || e.button>0)return;
      e.preventDefault();
      var rect = el.getBoundingClientRect();
      dragging = {
        block: block, el: el,
        startX: e.clientX, startY: e.clientY,
        moved: false,
        offsetX: e.clientX - rect.left,
        offsetY: e.clientY - rect.top,
        w: rect.width, h: rect.height
      };
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerUp);
    }
    function onPointerMove(e) {
      if (!dragging) return;
      var dx = e.clientX - dragging.startX, dy = e.clientY - dragging.startY;
      if (!dragging.moved && Math.sqrt(dx * dx + dy * dy) > 6) {
        dragging.moved = true;
        var el = dragging.el;
        el.classList.add('dragging');
        root.appendChild(el); el.style.transform='none';
        el.style.position = 'fixed';
        el.style.width = dragging.w + 'px';
        el.style.height = dragging.h + 'px';
      }
      if (dragging.moved) {
        var el = dragging.el;
        el.style.left = (e.clientX - dragging.offsetX) + 'px';
        el.style.top = (e.clientY - dragging.offsetY) + 'px';
        setDropHint(zoneAt(e.clientX, e.clientY));
      }
    }
    function onPointerUp(e) {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      if (!dragging) return;
      var d = dragging;
      dragging = null;
      setDropHint(null);
      if (d.moved) {
        var el = d.el;
        el.classList.remove('dragging');
        el.style.position = '';
        el.style.left = '';
        el.style.top = '';
        el.style.width = '';
        el.style.height = '';
        d.block.zone.boardEl.appendChild(el);
        var z = zoneAt(e.clientX, e.clientY);
        if (z !== null && z !== d.block.zone) moveBlock(d.block, z);
        else layout();
      } else {
        if(e.type==='pointercancel')return;
        if (activeTool === 'hammer') bonk(d.block, d.el, e);
        else complete(d.block, d.el, e);
      }
    }

    function moveBlock(block, targetZone) {
      var cur = block.zone;
      var i = cur.blocks.indexOf(block);
      if (i !== -1) cur.blocks.splice(i, 1);
      block.zone = targetZone;
      block.anger = 0;
      block.face = defaultFace(targetZone);
      targetZone.blocks.push(block);
      var col = slotCol(targetZone.blocks.indexOf(block));
      var el = blockEls[block.id];
      el.querySelector('.tface').textContent = block.face;el.querySelector('.tblock-inner').classList.remove('cracked');
      targetZone.boardEl.appendChild(el);
      var h = el.offsetHeight;
      el.style.transition = 'none';
      el.style.transform = 'translate(' + posX(col) + 'px, ' + (-(h + GAP)) + 'px)';
      requestAnimationFrame(function () { requestAnimationFrame(function () {
        el.style.transition = '';
        layout();
      }); });
    }

    function bonk(block, el, e) {
      if(block.busy)return;
      tone(170);block.anger++;
      var faces = ['😖', '😖', '😠', '😠', '🤬', '💢'];
      block.face = faces[Math.min(block.anger - 1, faces.length - 1)];
      var inner = el.querySelector('.tblock-inner');
      inner.querySelector('.tface').textContent = block.face;
      inner.classList.remove('wobble'); void inner.offsetWidth; inner.classList.add('wobble');
      if(block.anger>=10){block.anger=0;block.busy=true;inner.classList.remove('wobble');inner.classList.add('popback','cracked');root.querySelector('.shell').classList.add('shake');toast('该干还得干！干它！');tone(70);for(var k=0;k<18;k++)spawnFx(inner,'sparkle','✦',inner.offsetWidth/2,inner.offsetHeight/2,Math.cos(k)*100,Math.sin(k)*100,k*30);setTimeout(()=>{block.busy=false;inner.classList.remove('popback');root.querySelector('.shell').classList.remove('shake');inner.querySelector('.tface').textContent=defaultFace(block.zone);block.face=defaultFace(block.zone);layout();},650);}
      layout();
      var rect = el.getBoundingClientRect();
      var x = e.clientX - rect.left, y = e.clientY - rect.top;
      spawnFx(inner, 'bome', 'BOME!', x, y, 0, 0, Math.random() * 40 - 20);
      for (var i = 0; i < 4; i++) {
        var ang = Math.random() * Math.PI * 2, d = 28 + Math.random() * 45;
        spawnFx(inner, 'sparkle', ['⭐', '✨', '💫'][i % 3], x, y, Math.cos(ang) * d, Math.sin(ang) * d, Math.random() * 360 - 180);
      }
    }

    function complete(block, el, e) {
      if(block.busy)return;block.busy=true;tone(900);finished++;lastDone={text:block.text,zone:block.zone};toast("又放下了一件小事。",true);
      var z = block.zone;
      var idx = z.blocks.indexOf(block);
      if (idx !== -1) z.blocks.splice(idx, 1);
      var inner = el.querySelector('.tblock-inner');
      inner.classList.remove('wobble');
      inner.classList.add('wand-poof');
      var rect = el.getBoundingClientRect();
      var cx = rect.width / 2, cy = rect.height / 2;
      for (var i = 0; i < 14; i++) {
        var ang = (Math.PI * 2 / 14) * i, d = 45 + Math.random() * 45;
        spawnFx(inner, 'sparkle', ['✨', '🌟', '💖', '🎀'][i % 4], cx, cy, Math.cos(ang) * d, Math.sin(ang) * d, Math.random() * 360 - 180);
      }
      bumpCombo();
      completed.push({ id: block.id, text: block.text, zoneUid: z.uid, tint: TINTS[block.id % TINTS.length].slice(5), day: todayKey(), doneAt: Date.now() });
      if (comboCount > dayMax.max) dayMax.max = comboCount;
      sync(); renderTrophy(block.id);
      setTimeout(function () {
        el.remove();
        if (blockEls[block.id] === el) delete blockEls[block.id];
        layout();
      }, 480);
    }

    $('toolHammer').addEventListener('click', function () { setTool('hammer'); });
    $('toolWand').addEventListener('click', function () { setTool('wand'); });
    $('addZoneBtn').addEventListener('click', function () { createZone('新模块', '', ''); });
    root.addEventListener('keydown', function (e) {
      if (e.target.tagName === 'INPUT') return;
      if (e.key === '1') setTool('hammer');
      if (e.key === '2') setTool('wand');
    });

    var input = $('addInput');
    var btn = $('addBtn');
    function submit() {
      var v = input.value.trim();
      if (!v) return;
      addTodo(v);
      input.value = '';
      input.focus();
    }
    btn.addEventListener('click', submit);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.isComposing) submit(); });

    $('sound').onclick=function(){soundOn=!soundOn;this.textContent='声音 '+(soundOn?'开':'关');tone(500);};
    $('undo').onclick=function(){if(!lastDone)return;var z=zones.includes(lastDone.zone)?lastDone.zone:zones[0];var b={id:nextId++,text:lastDone.text,face:defaultFace(z),anger:0,zone:z};z.blocks.push(b);createBlockEl(b,true);finished=Math.max(0,finished-1);lastDone=null;sync();toast('已放回去，慢慢来。');};
    window.addEventListener('resize',layout);
    setTool('hammer');
    var saved = initialData;
    if(saved&&Array.isArray(saved.zones)&&saved.zones.length){finished=Number(saved.finished)||0;nextId=Number(saved.nextId)||1;completed=Array.isArray(saved.completed)?saved.completed:[];dayMax=saved.dayMax&&saved.dayMax.date?saved.dayMax:{date:"",max:0};saved.zones.forEach(data=>{var z=createZone(data.name,data.icon,data.blockFace);data.blocks.forEach(d=>{var b={...d,zone:z};z.blocks.push(b);createBlockEl(b,false);});});}
    else {var z1=createZone('今天必须干完','💪','💪'),z2=createZone('啊啊啊太不想干了','💢','');[['把这个方案最后一页写完',z1],['回复那封邮件',z1],['下楼走走',z1],['整理今天的会议记录',z1],['把想法做出一个小样',z1],['写周报',z2],['报销那一堆发票',z2],['开会，还要做汇报',z2],['这个需求又改了',z2]].forEach(([text,zone])=>{var b={id:nextId++,text,face:defaultFace(zone),anger:0,zone};zone.blocks.push(b);createBlockEl(b,true);});}
    ready=true;layout();renderTrophy();
    var roTimer: any = null;
    var ro = new ResizeObserver(function () { clearTimeout(roTimer); roTimer = setTimeout(layout, 120); });
    ro.observe(root);
    this.cleanupFns.push(function () {
      window.removeEventListener('resize', layout);
      ro.disconnect();
      clearTimeout(persistTimer);
      pluginRef.persist(snapshot());
    });
  
  }

  async onClose() {
    this.cleanupFns.forEach(f => f());
    this.cleanupFns = [];
  }
}
