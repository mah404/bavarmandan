// @ts-nocheck
/* Admin announcements dashboard logic (ported from the approved design file). */
export function initAnnouncementsAdmin(root, opts = {}) {
let disposed = false;
const cleanups = [];
const listen = (target, type, fn, options) => { target.addEventListener(type, fn, options); cleanups.push(() => target.removeEventListener(type, fn, options)); };

/* =========================================================
   تنظیمات اتصال به API
   آدرس و شکل داده را با بک‌اند خودتان هماهنگ کنید.
   انتظار: GET /api/announcements → [{id,title,body,pinned,status,cover,created_at}]
           POST /api/announcements   PUT /api/announcements/:id   DELETE /api/announcements/:id
   status: "published" | "draft"   body: HTML تمیزشده
   ========================================================= */
const CONFIG = {
  apiBase: '/api/admin/announcements',
  loginUrl: '/admin/login',
  // Demo mode is only for local development when the API does not exist yet.
  demoAllowed: opts.demoAllowed !== false,
};

/* Map backend field names here if they differ (e.g. content -> body, is_pinned -> pinned). */
const BLOCK_TAGS = /^(P|DIV|H2|H3|LI|BLOCKQUOTE|UL|OL|HR)$/;
const esc = v => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
/* Formatting is stored as sanitized HTML; plain text (older items) is converted for the editor. */
function htmlToText(html){
  const root = document.createElement('div'); root.innerHTML = html; let out = '';
  (function walk(n){
    n.childNodes.forEach(c => {
      if (c.nodeType === 3) { out += c.nodeValue; return; }
      if (c.nodeType !== 1) return;
      if (c.tagName === 'BR') { out += '\n'; return; }
      const block = BLOCK_TAGS.test(c.tagName);
      if (block && out && !out.endsWith('\n')) out += '\n';
      walk(c);
      if (block && !out.endsWith('\n')) out += '\n';
    });
  })(root);
  return out.replace(/\u00a0/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}
function textToHtml(text){
  return String(text || '').split('\n').map(line => line.trim() ? '<p>' + esc(line) + '</p>' : '<p><br></p>').join('');
}
/* Backend shape {id,title,content,published,createdAt,updatedAt} <-> dashboard shape */
const HTML_HINT = /<\/?(p|b|strong|i|em|u|s|strike|div|br|h2|h3|ul|ol|li|blockquote|a|span|font|hr)\b/i;
const fromApi = x => ({
  id: x.id,
  title: x.title || '',
  body: HTML_HINT.test(x.content || '') ? clean(x.content) : textToHtml(x.content),
  pinned: false,
  status: x.published ? 'published' : 'draft',
  cover: null,
  created_at: x.createdAt,
  updated_at: x.updatedAt,
});
const toApi = p => ({ title: p.title, content: clean(p.body), published: p.status === 'published' });
const unwrap = r => (r && (r.announcement || r.data)) || r;

const $ = (s, r = root) => r.querySelector(s);
const $$ = (s, r = root) => [...r.querySelectorAll(s)];
const FA = '۰۱۲۳۴۵۶۷۸۹';
const fa = n => String(n).replace(/\d/g, d => FA[d]);
const store = {
  get(k){ try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set(k,v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del(k){ try { localStorage.removeItem(k); } catch {} },
};

/* ---------- API layer (falls back to an in-page demo when the API is unreachable) ---------- */
let DEMO = false;
const SAMPLE = [
  { id:'s1', title:'زمان جلسات ماه آبان', body:'<p>جلسات دورهٔ <b>خلاقیت الله تعالی</b> در ماه آبان پنج‌شنبه‌ها ساعت ۲۰ برگزار می‌شود. 🕌</p><p>صوت و مکتوب هر جلسه حداکثر تا دو روز بعد در سایت قرار می‌گیرد.</p>', pinned:true, status:'published', cover:null, created_at:Date.now()-2*864e5 },
  { id:'s2', title:'شروع دورهٔ احسن الحدیث', body:'<p>دورهٔ تفسیر سوره واقعه با محوریت مباحث معاد آغاز شد. ✨</p>', pinned:false, status:'published', cover:null, created_at:Date.now()-9*864e5 },
  { id:'s3', title:'[نمونه] اطلاعیهٔ تعطیلی جلسه', body:'<p>[متن نمونه]</p>', pinned:false, status:'draft', cover:null, created_at:Date.now()-864e5 },
];
async function http(method, path = '', body){
  const res = await fetch(CONFIG.apiBase + path, {
    method, credentials:'include',
    headers: body ? { 'Content-Type':'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) { Promise.resolve(opts.onLogout && opts.onLogout()).catch(() => {}).then(() => { location.href = CONFIG.loginUrl; }); throw new Error('auth'); }
  if (!res.ok) { let m = ''; try { m = (await res.json()).message || ''; } catch {} throw new Error(m || ('خطای سرور (' + res.status + ')')); }
  return res.status === 204 ? null : res.json();
}
const api = {
  async list(){
    try { const r = await http('GET'); return (Array.isArray(r) ? r : (r.announcements || r.items || r.data || [])).map(fromApi); }
    catch(e){ if (e.message === 'auth' || !CONFIG.demoAllowed) throw e; DEMO = true; $('#demoBadge').hidden = false; return SAMPLE.map(x => ({...x})); }
  },
  async create(p){ if (DEMO) return { ...p, id:'l' + Date.now(), created_at:Date.now() }; const r = unwrap(await http('POST', '', toApi(p))); return r && r.id ? fromApi(r) : null; },
  async update(id, p){ if (DEMO) return { ...p, id }; const r = unwrap(await http('PUT', '/' + encodeURIComponent(id), toApi(p))); return r && r.id ? fromApi(r) : null; },
  async remove(id){ if (DEMO) return null; return http('DELETE', '/' + encodeURIComponent(id)); },
};

/* ---------- state ---------- */
let items = [], filter = 'all', query = '', editingId = null, confirmId = null, cover = null, pinned = false, freshId = null;
const DRAFT_KEY = 'bv-ann-draft';

/* ---------- sanitizer (the server must sanitize again) ---------- */
const ALLOWED = { B:1,STRONG:1,I:1,EM:1,U:1,S:1,STRIKE:1,P:1,DIV:1,BR:1,H2:1,H3:1,UL:1,OL:1,LI:1,BLOCKQUOTE:1,A:1,SPAN:1,FONT:1,HR:1 };
function clean(html){
  const t = document.createElement('template'); t.innerHTML = html;
  (function walk(n){
    [...n.childNodes].forEach(c => {
      if (c.nodeType === 3) return;
      if (c.nodeType !== 1 || !ALLOWED[c.tagName]) {
        if (c.nodeType === 1 && !/^(SCRIPT|STYLE|IFRAME|OBJECT|EMBED)$/.test(c.tagName)) { walk(c); c.replaceWith(...c.childNodes); }
        else c.remove();
        return;
      }
      const keep = {};
      if (c.tagName === 'A') { const h = c.getAttribute('href') || ''; if (/^(https?:|mailto:|\/|#)/i.test(h)) keep.href = h; keep.target = '_blank'; keep.rel = 'noopener'; }
      if (c.getAttribute('dir')) keep.dir = c.getAttribute('dir') === 'ltr' ? 'ltr' : 'rtl';
      const st = c.style, ok = [];
      if (st.color) ok.push('color:' + st.color);
      if (st.backgroundColor) ok.push('background-color:' + st.backgroundColor);
      if (st.textAlign) ok.push('text-align:' + st.textAlign);
      if (c.tagName === 'FONT' && c.getAttribute('color')) ok.push('color:' + c.getAttribute('color'));
      [...c.attributes].forEach(a => c.removeAttribute(a.name));
      Object.entries(keep).forEach(([k,v]) => c.setAttribute(k, v));
      if (ok.length) c.setAttribute('style', ok.join(';'));
      walk(c);
    });
  })(t.content);
  return t.innerHTML.replace(/\u200B/g, '');
}
const textOf = html => { const d = document.createElement('div'); d.innerHTML = html; return (d.textContent || '').trim(); };

/* ---------- toasts & sparkle ---------- */
function toast(msg, icon = '✓'){
  const el = document.createElement('div'); el.className = 'toast';
  el.innerHTML = '<span style="color:var(--gold)">' + icon + '</span><span></span>'; el.lastChild.textContent = msg;
  $('#toasts').appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 320); }, 2600);
}
function burst(from){
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const r = from.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  for (let i = 0; i < 14; i++) {
    const s = document.createElement('i'); s.className = 'burst';
    const a = (i / 14) * Math.PI * 2, d = 50 + Math.random() * 50;
    s.style.left = cx + 'px'; s.style.top = cy + 'px';
    s.style.setProperty('--dx', Math.cos(a) * d + 'px'); s.style.setProperty('--dy', Math.sin(a) * d + 'px');
    if (i % 3 === 0) s.style.background = 'var(--gold)';
    root.appendChild(s); setTimeout(() => s.remove(), 950);
  }
}

/* ---------- list ---------- */
function fmtDate(t){
  const d = Math.round((Date.now() - new Date(t).getTime()) / 864e5);
  if (d <= 0) return 'امروز'; if (d === 1) return 'دیروز'; if (d < 30) return fa(d) + ' روز پیش';
  try { return new Date(t).toLocaleDateString('fa-IR', { day:'numeric', month:'long' }); } catch { return ''; }
}
function faDate(t){
  try { return new Date(t).toLocaleDateString('fa-IR', { year:'numeric', month:'long', day:'numeric' }); } catch { return ''; }
}
function renderList(){
  const box = $('#items'); box.innerHTML = '';
  const q = query.trim();
  const rows = items
    .filter(x => filter === 'all' || x.status === filter)
    .filter(x => !q || (x.title + ' ' + textOf(x.body)).includes(q))
    .sort((a,b) => (b.pinned - a.pinned) || (new Date(b.created_at) - new Date(a.created_at)));
  $('#count').textContent = '(' + fa(items.length) + ')';
  if (!rows.length) {
    box.innerHTML = '<div class="empty">' + (items.length ? (q ? 'اعلانی با این جستجو پیدا نشد.' : 'در این دسته اعلانی نیست. برای دیدن همه، روی «همه» بزنید.') : 'هنوز اعلانی نیست. اولین اعلان را در ویرایشگر بنویسید.') + '</div>';
    return;
  }
  rows.forEach(x => {
    const el = document.createElement('div');
    el.className = 'item' + (x.id === editingId ? ' active' : '') + (x.id === freshId ? ' fresh' : '');
    const meta = document.createElement('div'); meta.className = 'meta';
    meta.innerHTML = (x.status === 'published' ? '<span class="chip pub">منتشرشده</span>' : '<span class="chip draft">پیش‌نویس</span>') +
      (x.pinned ? '<span class="chip pin">سنجاق</span>' : '') + '<span style="margin-inline-start:auto"></span>';
    meta.lastChild.textContent = fmtDate(x.created_at);
    const t = document.createElement('div'); t.className = 't'; t.textContent = x.title || 'بدون عنوان';
    const ex = document.createElement('div'); ex.className = 'ex'; ex.textContent = textOf(x.body);
    const dates = document.createElement('div'); dates.className = 'dates';
    dates.textContent = 'ایجاد: ' + faDate(x.created_at) + (x.updated_at && x.updated_at !== x.created_at ? ' · آخرین ویرایش: ' + faDate(x.updated_at) : '');
    el.append(meta, t, ex, dates);
    if (confirmId === x.id) {
      const c = document.createElement('div'); c.className = 'confirm';
      c.innerHTML = '<span style="flex:1">این اعلان حذف شود؟</span>';
      const yes = document.createElement('button'); yes.className = 'mini danger'; yes.type = 'button'; yes.textContent = 'حذف';
      const no = document.createElement('button'); no.className = 'mini'; no.type = 'button'; no.textContent = 'نه';
      yes.onclick = () => doDelete(x.id); no.onclick = () => { confirmId = null; renderList(); };
      c.append(yes, no); el.append(c);
    } else {
      const row = document.createElement('div'); row.className = 'row';
      const ed = document.createElement('button'); ed.className = 'mini'; ed.type = 'button'; ed.textContent = 'ویرایش';
      const del = document.createElement('button'); del.className = 'mini danger'; del.type = 'button'; del.textContent = 'حذف';
      ed.onclick = () => loadForEdit(x.id); del.onclick = () => { confirmId = x.id; renderList(); };
      row.append(ed, del); el.append(row);
    }
    box.append(el);
  });
  freshId = null;
}
async function doDelete(id){
  /* Optimistic: the card disappears right away; it comes back if the server refuses. */
  const snapshot = items, wasEditing = editingId === id;
  items = items.filter(x => x.id !== id); confirmId = null;
  if (wasEditing) resetEditor();
  renderList();
  try { await api.remove(id); toast('اعلان حذف شد', '🗑'); }
  catch(e){
    if (e.message === 'auth') return;
    items = snapshot; renderList();
    toast((e.message || 'حذف انجام نشد') + ' · اعلان برگردانده شد', '!');
  }
}

/* ---------- editor ---------- */
const body = $('#body'), title = $('#title');
let savedRange = null;
function saveRange(){ const s = getSelection(); if (s.rangeCount && body.contains(s.anchorNode)) savedRange = s.getRangeAt(0).cloneRange(); }
function restoreRange(){ body.focus(); if (savedRange) { const s = getSelection(); s.removeAllRanges(); s.addRange(savedRange); } }
/* With no text selected, colors/highlights would be forgotten before the next keystroke: put the caret inside a styled span instead. */
function typingStyle(cmd, val){
  const sel = getSelection();
  if (!sel.rangeCount || !sel.isCollapsed || !body.contains(sel.anchorNode)) return false;
  const span = document.createElement('span');
  span.style[cmd === 'foreColor' ? 'color' : 'backgroundColor'] = val;
  span.textContent = '\u200B';
  const range = sel.getRangeAt(0);
  range.insertNode(span);
  const caret = document.createRange();
  caret.setStart(span.firstChild, 1); caret.collapse(true);
  sel.removeAllRanges(); sel.addRange(caret);
  return true;
}
function exec(cmd, val = null){
  restoreRange();
  if (!((cmd === 'foreColor' || cmd === 'hiliteColor') && typingStyle(cmd, val))) document.execCommand(cmd, false, val);
  saveRange(); onChange(); updateState();
}
try { document.execCommand('styleWithCSS', false, true); } catch {}
try { document.execCommand('defaultParagraphSeparator', false, 'p'); } catch {}

$$('[data-cmd]').forEach(b => b.addEventListener('mousedown', e => e.preventDefault()));
$$('[data-cmd]').forEach(b => b.addEventListener('click', () => exec(b.dataset.cmd)));
$$('[data-block]').forEach(b => {
  b.addEventListener('mousedown', e => e.preventDefault());
  b.addEventListener('click', () => {
    const cur = currentBlock();
    exec('formatBlock', cur === b.dataset.block && b.dataset.block !== 'p' ? '<p>' : '<' + b.dataset.block + '>');
  });
});
$('#hrBtn').addEventListener('mousedown', e => e.preventDefault());
$('#hrBtn').addEventListener('click', () => exec('insertHTML', '<hr><p><br></p>'));

function currentBlock(){
  const s = getSelection(); if (!s.rangeCount) return '';
  let n = s.anchorNode; while (n && n !== body) { if (n.nodeType === 1 && /^(P|H2|H3|BLOCKQUOTE|DIV|LI)$/.test(n.tagName)) return n.tagName.toLowerCase(); n = n.parentNode; }
  return 'p';
}
function blockEl(){
  const s = getSelection(); if (!s.rangeCount) return null;
  let n = s.anchorNode; while (n && n !== body) { if (n.nodeType === 1 && /^(P|H2|H3|BLOCKQUOTE|DIV|LI)$/.test(n.tagName)) return n; n = n.parentNode; }
  return null;
}
$('#dirBtn').addEventListener('mousedown', e => e.preventDefault());
$('#dirBtn').addEventListener('click', () => {
  restoreRange(); let b = blockEl();
  if (!b) { document.execCommand('formatBlock', false, '<p>'); b = blockEl(); }
  if (!b) return;
  const ltr = b.getAttribute('dir') !== 'ltr';
  b.setAttribute('dir', ltr ? 'ltr' : 'rtl'); b.style.textAlign = ltr ? 'left' : '';
  onChange(); updateState();
});
function updateState(){
  if (!body.contains(getSelection().anchorNode)) return;
  ['bold','italic','underline','strikeThrough','insertUnorderedList','insertOrderedList','justifyRight','justifyCenter','justifyLeft','justifyFull'].forEach(c => {
    const b = $('[data-cmd="' + c + '"]'); let on = false; try { on = document.queryCommandState(c); } catch {}
    if (b) b.setAttribute('aria-pressed', String(on));
  });
  const blk = currentBlock();
  $$('[data-block]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.block === blk || (b.dataset.block === 'p' && (blk === 'div' || blk === 'li')))));
  const be = blockEl(); $('#dirBtn').textContent = be && be.getAttribute('dir') === 'ltr' ? 'LTR' : 'RTL';
}
listen(document, 'selectionchange', () => { saveRange(); updateState(); });

/* paste as clean text/HTML */
body.addEventListener('paste', e => {
  e.preventDefault();
  const html = e.clipboardData.getData('text/html'), text = e.clipboardData.getData('text/plain');
  if (html) document.execCommand('insertHTML', false, clean(html));
  else document.execCommand('insertText', false, text);
});
body.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); saveRange(); openPop('link'); }
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); save('published'); }
});

/* ---------- popovers: color, highlight, link, emoji ---------- */
const GRAYS = ['#FFFFFF','#E5E7EB','#C0C6CF','#9CA3AF','#6B7280','#374151','#111827','#000000'];
const HUES = [0, 24, 42, 55, 85, 140, 168, 190, 212, 245, 280, 325];
const tones = (lightnesses, sat) => lightnesses.flatMap(l => HUES.map(h => 'hsl(' + h + ',' + sat + '%,' + l + '%)'));
const COLORS = GRAYS.concat(tones([84, 70, 56, 42, 30], 72));
const HIS = GRAYS.concat(tones([88, 74, 58, 38, 24], 60));
let openName = null;
function closePop(){ if (opts.closeEmojiPicker) opts.closeEmojiPicker(); $$('.pop').forEach(p => p.remove()); $$('[aria-expanded="true"]').forEach(b => b.setAttribute('aria-expanded','false')); openName = null; }
function openPop(name){
  if (openName === name) { closePop(); return; }
  closePop(); openName = name;
  const anchor = { color:'#colorBtn', hi:'#hiBtn', link:'#linkBtn', emoji:'#emojiBtn' }[name];
  const btn = $(anchor); btn.setAttribute('aria-expanded','true');
  const p = document.createElement('div'); p.className = 'pop' + (name === 'emoji' ? ' emoji-pop' : ''); p.setAttribute('role','dialog');
  if (name === 'color' || name === 'hi') {
    const list = name === 'color' ? COLORS : HIS;
    p.innerHTML = '<div class="lbl">' + (name === 'color' ? 'رنگ متن' : 'رنگ پس‌زمینهٔ متن') + '</div><div class="swatches"></div>';
    const g = $('.swatches', p);
    list.forEach(c => { const b = document.createElement('button'); b.type = 'button'; b.className = 'sw'; b.style.background = c; b.setAttribute('aria-label', c);
      b.onmousedown = e => e.preventDefault();
      b.onclick = () => { exec(name === 'color' ? 'foreColor' : 'hiliteColor', c); $(name === 'color' ? '#colorSwatch' : '#hiSwatch').style.background = c; closePop(); };
      g.append(b); });
    const none = document.createElement('button'); none.type = 'button'; none.className = 'sw none'; none.setAttribute('aria-label','بدون رنگ'); none.textContent = '⌀';
    none.onmousedown = e => e.preventDefault();
    none.onclick = () => { exec(name === 'color' ? 'foreColor' : 'hiliteColor', name === 'color' ? 'inherit' : 'transparent'); closePop(); };
    g.append(none);
    const custom = document.createElement('label'); custom.className = 'custom-color';
    custom.innerHTML = '<span>رنگ دلخواه</span><input type="color" aria-label="رنگ دلخواه" value="#e6c55a">';
    const ci = $('input', custom);
    ci.onmousedown = () => saveRange();
    ci.onchange = () => { exec(name === 'color' ? 'foreColor' : 'hiliteColor', ci.value); $(name === 'color' ? '#colorSwatch' : '#hiSwatch').style.background = ci.value; closePop(); };
    p.append(custom);
  } else if (name === 'link') {
    const sel = savedRange ? savedRange.toString() : '';
    p.innerHTML = '<div class="lbl">افزودن لینک</div><input class="field" id="lkUrl" dir="ltr" placeholder="https://…" aria-label="آدرس لینک"><input class="field" id="lkTxt" placeholder="متن لینک" aria-label="متن لینک" style="margin-top:8px"><div class="acts"><button class="btn primary" type="button" id="lkOk">افزودن</button><button class="btn ghost" type="button" id="lkNo">انصراف</button></div>';
    setTimeout(() => { $('#lkTxt', p).value = sel; $('#lkUrl', p).focus(); });
    const apply = () => {
      let u = $('#lkUrl', p).value.trim(); const t = $('#lkTxt', p).value.trim() || u;
      if (!u) { $('#lkUrl', p).focus(); return; }
      if (!/^(https?:|mailto:|\/|#)/i.test(u)) u = 'https://' + u;
      const a = document.createElement('a'); a.href = u; a.textContent = t; a.target = '_blank'; a.rel = 'noopener';
      closePop(); exec('insertHTML', a.outerHTML + '&nbsp;');
    };
    p.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); apply(); } });
    setTimeout(() => { $('#lkOk', p).onclick = apply; $('#lkNo', p).onclick = () => { closePop(); restoreRange(); }; });
  }
  root.append(p);
  const br = btn.getBoundingClientRect(), pw = p.offsetWidth, ph = p.offsetHeight;
  let left = Math.max(12, Math.min(br.right - pw, innerWidth - pw - 12));
  let top = br.bottom + 8; if (top + ph > innerHeight - 12) top = Math.max(12, br.top - ph - 8);
  p.style.left = left + 'px'; p.style.top = top + 'px';
}
listen(window, 'resize', () => closePop());
listen(root, 'scroll', () => { if (openName) closePop(); }, { passive:true });
listen(window, 'scroll', () => { if (openName) closePop(); }, { passive:true });
['color','hi','link','emoji'].forEach(n => {
  const b = $({ color:'#colorBtn', hi:'#hiBtn', link:'#linkBtn', emoji:'#emojiBtn' }[n]);
  b.addEventListener('mousedown', e => { e.preventDefault(); saveRange(); });
  b.addEventListener('click', e => {
    e.stopPropagation();
    if (n === 'emoji' && opts.openEmojiPicker) {
      closePop();
      opts.openEmojiPicker(b.getBoundingClientRect(), em => { exec('insertText', em); });
      return;
    }
    openPop(n);
  });
});
listen(document, 'click', e => { if (!e.target.closest('.pop, .bv-emoji-pop')) closePop(); });
listen(document, 'keydown', e => { if (e.key === 'Escape') { closePop(); closeModal(); } });

/* ---------- counters, preview, autosave ---------- */
let saveT;
function onChange(){
  const txt = (body.textContent || '').trim();
  const words = txt ? txt.split(/\s+/).length : 0;
  $('#wc').textContent = fa(words) + ' کلمه · ' + fa(txt.length) + ' نویسه';
  const mins = Math.max(1, Math.round(words / 200));
  $('#rt').textContent = 'زمان خواندن: ' + (words < 100 ? 'کمتر از ۱ دقیقه' : fa(mins) + ' دقیقه');
  $('#titleLine').classList.toggle('filled', !!title.value.trim());
  $('#pvTitle2').textContent = title.value.trim() || '[عنوان اعلان]';
  $('#pvBody').innerHTML = clean(body.innerHTML) || 'متن اعلان اینجا دیده می‌شود.';
  $('#pvPin').hidden = !pinned;
  $('#pvCover').hidden = !cover; if (cover) $('#pvCover').style.backgroundImage = 'url(' + cover + ')';
  $('#formErr').hidden = true;
  if (!editingId) {
    const ss = $('#saveState'); ss.className = 'save-state saving'; ss.lastChild.textContent = 'در حال ذخیره…';
    clearTimeout(saveT);
    saveT = setTimeout(() => {
      store.set(DRAFT_KEY, { title:title.value, body:body.innerHTML, pinned, cover });
      ss.className = 'save-state saved'; ss.lastChild.textContent = 'پیش‌نویس روی این دستگاه ذخیره شد';
    }, 700);
  }
}
body.addEventListener('input', onChange);
title.addEventListener('input', onChange);
title.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); body.focus(); } });

/* ---------- pin & cover ---------- */
$('#pin').addEventListener('click', () => { pinned = !pinned; $('#pin').setAttribute('aria-checked', String(pinned)); onChange(); });
function setCover(src){
  cover = src; const c = $('#cover');
  $$('img,.rm', c).forEach(n => n.remove());
  if (src) {
    const img = document.createElement('img'); img.src = src; img.alt = 'تصویر اعلان';
    const rm = document.createElement('button'); rm.type = 'button'; rm.className = 'rm'; rm.setAttribute('aria-label','حذف تصویر'); rm.textContent = '✕';
    rm.onclick = e => { e.preventDefault(); e.stopPropagation(); setCover(null); };
    c.append(img, rm);
  }
  onChange();
}
function readFile(f){
  if (!f) return;
  if (!/^image\//.test(f.type)) { toast('فقط تصویر JPG، PNG یا WebP', '!'); return; }
  if (f.size > 2 * 1024 * 1024) { toast('حجم تصویر بیشتر از ۲ مگابایت است', '!'); return; }
  const r = new FileReader(); r.onload = () => setCover(r.result); r.readAsDataURL(f);
}
$('#coverIn').addEventListener('change', e => readFile(e.target.files[0]));
['dragover','dragenter'].forEach(t => $('#cover').addEventListener(t, e => { e.preventDefault(); $('#cover').classList.add('drag'); }));
['dragleave','drop'].forEach(t => $('#cover').addEventListener(t, () => $('#cover').classList.remove('drag')));
$('#cover').addEventListener('drop', e => { e.preventDefault(); readFile(e.dataTransfer.files[0]); });

/* ---------- save / publish ---------- */
function showErr(m){ const e = $('#formErr'); e.textContent = m; e.hidden = false; }
async function save(status){
  const t = title.value.trim(), html = clean(body.innerHTML), txt = textOf(html);
  const plain = htmlToText(html);
  if (!t) { showErr('اعلان باید عنوان داشته باشد.'); title.focus(); return; }
  if (t.length > 200) { showErr('عنوان نباید بیشتر از ۲۰۰ نویسه باشد.'); title.focus(); return; }
  if (!txt || !plain) { showErr('متن اعلان خالی است.'); body.focus(); return; }
  if (html.length > 10000) { showErr('متن (همراه با قالب‌بندی) بیش از حد طولانی است. کمی کوتاهش کنید.'); body.focus(); return; }
  const btn = status === 'published' ? $('#publishBtn') : $('#draftBtn');
  const label = btn === $('#publishBtn') ? $('#publishLabel') : btn;
  const old = label.textContent; btn.disabled = true;
  label.innerHTML = '<svg class="spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" style="vertical-align:-3px;margin-inline-end:8px"><path d="M12 3a9 9 0 019 9"/></svg>در حال ذخیره…';
  const payload = { title:t, body:html, pinned, cover, status };
  try {
    let saved;
    const wasEditing = editingId;
    if (editingId) { saved = await api.update(editingId, payload); freshId = editingId; }
    else { saved = await api.create(payload); store.del(DRAFT_KEY); }
    if (saved && saved.id) {
      /* The server answered with the saved item: show it now and re-sync the list in the background. */
      const i = items.findIndex(x => x.id === saved.id);
      if (i >= 0) items[i] = saved; else items.unshift(saved);
      if (!wasEditing) freshId = saved.id;
      api.list().then(list => { items = list; renderList(); }).catch(() => {});
    } else {
      try {
        items = await api.list();
        if (!wasEditing) freshId = items.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]?.id;
      } catch (e) { if (e.message === 'auth') throw e; }
    }
    if (status === 'published') burst($('#publishBtn'));
    toast(editingId ? 'تغییرات ذخیره شد' : (status === 'published' ? 'اعلان منتشر شد' : 'پیش‌نویس ذخیره شد'));
    resetEditor(); renderList();
  } catch(e){ if (e.message !== 'auth') showErr(e.message || 'ذخیره انجام نشد. دوباره امتحان کنید.'); }
  finally { btn.disabled = false; label.textContent = editingId ? old : (btn === $('#publishBtn') ? 'انتشار اعلان' : 'ذخیرهٔ پیش‌نویس'); }
}
$('#publishBtn').addEventListener('click', () => save('published'));
$('#draftBtn').addEventListener('click', () => save('draft'));

function resetEditor(){
  editingId = null; title.value = ''; body.innerHTML = ''; pinned = false; $('#pin').setAttribute('aria-checked','false'); setCover(null);
  $('#editingBar').hidden = true; $('#publishLabel').textContent = 'انتشار اعلان';
  const ss = $('#saveState'); ss.className = 'save-state'; ss.lastChild.textContent = 'آماده';
  onChange(); $('#saveState').className = 'save-state'; $('#saveState').lastChild.textContent = 'آماده'; clearTimeout(saveT);
}
function loadForEdit(id){
  const x = items.find(i => i.id === id); if (!x) return;
  editingId = id; title.value = x.title || ''; body.innerHTML = clean(x.body || '');
  pinned = !!x.pinned; $('#pin').setAttribute('aria-checked', String(pinned)); setCover(x.cover || null);
  $('#editingBar').hidden = false; $('#editingText').textContent = 'در حال ویرایش: ' + (x.title || 'بدون عنوان');
  $('#publishLabel').textContent = x.status === 'published' ? 'ذخیرهٔ تغییرات' : 'انتشار اعلان';
  clearTimeout(saveT); $('#saveState').className = 'save-state'; $('#saveState').lastChild.textContent = 'در حال ویرایش';
  renderList(); onChange(); clearTimeout(saveT);
  $('#saveState').className = 'save-state'; $('#saveState').lastChild.textContent = 'در حال ویرایش';
  title.scrollIntoView({ behavior:'smooth', block:'center' }); title.focus();
}
$('#cancelEdit').addEventListener('click', () => { resetEditor(); renderList(); });
$('#newBtn').addEventListener('click', () => { resetEditor(); renderList(); title.focus(); });

/* ---------- full preview ---------- */
function closeModal(){ const m = $('.modal'); if (m) m.remove(); }
$('#previewBtn').addEventListener('click', () => {
  const m = document.createElement('div'); m.className = 'modal'; m.setAttribute('role','dialog'); m.setAttribute('aria-modal','true'); m.setAttribute('aria-label','پیش‌نمایش اعلان');
  m.innerHTML = '<div class="sheet"><div class="sheet-head"><span>پیش‌نمایش ـ همان‌طور که بازدیدکننده می‌بیند</span><button class="btn" type="button" id="mClose">بستن</button></div><article class="art"></article></div>';
  const art = $('.art', m);
  if (cover) { const i = document.createElement('img'); i.className = 'cover-big'; i.src = cover; i.alt = ''; art.append(i); }
  const meta = document.createElement('div'); meta.style.cssText = 'display:flex;gap:8px;align-items:center;font-size:12.5px;color:var(--faint)';
  meta.innerHTML = (pinned ? '<span class="chip pin">سنجاق‌شده</span>' : '') + '<span>امروز</span>';
  const h = document.createElement('h1'); h.textContent = title.value.trim() || '[عنوان اعلان]';
  const b = document.createElement('div'); b.className = 'body'; b.style.padding = '0'; b.style.minHeight = '0'; b.innerHTML = clean(body.innerHTML) || '<p style="color:var(--faint)">متن اعلان هنوز نوشته نشده.</p>';
  art.append(meta, h, b);
  m.addEventListener('click', e => { if (e.target === m) closeModal(); });
  root.append(m); $('#mClose').onclick = closeModal; $('#mClose').focus();
});

/* ---------- list controls & theme ---------- */
$('#q').addEventListener('input', e => { query = e.target.value; renderList(); });
$$('.tabs button').forEach(b => b.addEventListener('click', () => { filter = b.dataset.f; $$('.tabs button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); renderList(); }));
$('#themeBtn').addEventListener('click', () => { opts.toggleTheme && opts.toggleTheme(); });

/* ---------- boot ---------- */
(async function(){
  const d = store.get(DRAFT_KEY);
  if (d && (d.title || textOf(d.body || ''))) {
    title.value = d.title || ''; body.innerHTML = clean(d.body || ''); pinned = !!d.pinned; $('#pin').setAttribute('aria-checked', String(pinned)); setCover(d.cover || null);
    setTimeout(() => toast('پیش‌نویس قبلی بازیابی شد', '↺'), 600);
  }
  onChange(); clearTimeout(saveT); $('#saveState').className = 'save-state'; $('#saveState').lastChild.textContent = 'آماده';
  $('#items').innerHTML = '<div class="empty">در حال بارگذاری اعلان‌ها…</div>';
  try { items = await api.list(); if (disposed) return; } catch (e) { if (disposed) return; items = []; if (e.message !== 'auth') toast('دریافت فهرست اعلان‌ها انجام نشد', '!'); }
  renderList();
})();

/* ---------- logout ---------- */
$('#logoutBtn').addEventListener('click', async () => {
  try { if (opts.onLogout) await opts.onLogout(); } catch {}
  location.href = CONFIG.loginUrl;
});

return () => { disposed = true; cleanups.forEach(fn => fn()); };
}
