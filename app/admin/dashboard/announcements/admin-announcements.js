// @ts-nocheck
/* Admin announcements dashboard logic (ported from the approved design file). */
import { parseAnnouncementContent, buildAnnouncementContent, neutralColorKind } from '../../../../lib/announcement-meta';
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
const fromApi = x => {
  const { meta, body } = parseAnnouncementContent(x.content || '');
  return {
    id: x.id,
    title: x.title || '',
    body: HTML_HINT.test(body) ? clean(body) : textToHtml(body),
    pinned: false,
    status: x.published ? 'published' : 'draft',
    created_at: x.createdAt,
    updated_at: x.updatedAt,
    showDate: meta.showDate,
    publishAt: meta.publishAt,
    order: meta.order,
    cover: meta.cover,
  };
};
const toApi = p => ({
  title: p.title,
  content: buildAnnouncementContent(clean(p.body), { showDate: !!p.showDate, publishAt: p.publishAt || null, order: typeof p.order === 'number' ? p.order : null, cover: p.cover || null }),
  published: p.status === 'published',
});
const unwrap = r => (r && (r.announcement || r.data)) || r;

const $ = (s, r = root) => r.querySelector(s);
const $$ = (s, r = root) => [...r.querySelectorAll(s)];
const FA = '۰۱۲۳۴۵۶۷۸۹';
const fa = n => String(n).replace(/\d/g, d => FA[d]);
const ZONE_NAMES = {
  'Asia/Tehran': 'ایران', 'Europe/Berlin': 'آلمان', 'Europe/London': 'انگلستان', 'Europe/Paris': 'فرانسه', 'Europe/Istanbul': 'ترکیه',
  'Asia/Dubai': 'امارات', 'Asia/Riyadh': 'عربستان', 'Asia/Baghdad': 'عراق', 'Asia/Karachi': 'پاکستان', 'Asia/Kolkata': 'هند',
  'Asia/Shanghai': 'چین', 'Asia/Tokyo': 'ژاپن', 'America/New_York': 'آمریکا (شرق)', 'America/Chicago': 'آمریکا (مرکز)',
  'America/Los_Angeles': 'Pacific', 'America/Toronto': 'کانادا', 'Australia/Sydney': 'استرالیا',
};
/* The zone the admin types times in. The saved time is always an absolute UTC instant. */
let TZ = ZONE_NAMES[store_get('bv-sched-tz')] ? store_get('bv-sched-tz') : 'America/Los_Angeles';
function store_get(k){ try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } }
const pad = n => String(n).padStart(2, '0');
function tzParts(date){
  const f = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  return Object.fromEntries(f.formatToParts(date).map(p => [p.type, p.value]));
}
function tzOffsetMs(date){ const m = tzParts(date); return Date.UTC(+m.year, +m.month - 1, +m.day, +m.hour, +m.minute, +m.second) - Math.floor(date.getTime() / 1000) * 1000; }
/* "2026-10-21T14:30" typed as Pacific time -> UTC ISO string */
function pacificToIso(local){
  const [d, t] = local.split('T'); const [Y, M, D] = d.split('-').map(Number); const [h, mi] = t.split(':').map(Number);
  const guess = Date.UTC(Y, M - 1, D, h, mi); let utc = guess - tzOffsetMs(new Date(guess)); utc = guess - tzOffsetMs(new Date(utc));
  return new Date(utc).toISOString();
}
function isoToPacificLocal(iso){ const m = tzParts(new Date(iso)); return m.year + '-' + m.month + '-' + m.day + 'T' + m.hour + ':' + m.minute; }
const pacificNowLocal = () => isoToPacificLocal(new Date().toISOString());
const pacificLabel = iso => { try { return new Date(iso).toLocaleString('fa-IR', { timeZone: TZ, dateStyle: 'medium', timeStyle: 'short' }) + ' (' + (ZONE_NAMES[TZ] || TZ) + ')'; } catch { return iso; } };
const isScheduled = x => x.status === 'published' && x.publishAt && new Date(x.publishAt).getTime() > Date.now();
const orderKey = x => (typeof x.order === 'number' ? x.order : 1e15);
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
  async reorder(x){ if (DEMO) return null; return http('PUT', '/' + encodeURIComponent(x.id), { content: toApi(x).content }); },
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
      if (st.color) { const k = neutralColorKind(st.color); if (k === 'white') ok.push('color:#ffffff'); else if (!k) ok.push('color:' + st.color); }   /* plain black follows the theme */
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
function toast(msg, icon = '✓', ms = 2600){
  const el = document.createElement('div'); el.className = 'toast';
  el.innerHTML = '<span style="color:var(--gold)">' + icon + '</span><span></span>'; el.lastChild.textContent = msg;
  $('#toasts').appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 320); }, ms);
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
/* A soft bell under a short list; it disappears once the list is long enough to fill the column. */
function addDeco(box, count){
  if (count >= 4) return;
  const deco = document.createElement('div'); deco.className = 'list-deco'; deco.setAttribute('aria-hidden', 'true');
  deco.innerHTML = '<span>🔔</span><small>اعلان‌های شما اینجا فهرست می‌شوند</small>'; box.append(deco);
}
function renderList(){
  const box = $('#items'); box.innerHTML = '';
  const q = query.trim();
  const rows = items
    .filter(x => filter === 'all' || x.status === filter)
    .filter(x => !q || (x.title + ' ' + textOf(x.body)).includes(q))
    .sort((a,b) => (orderKey(a) - orderKey(b)) || (new Date(b.created_at) - new Date(a.created_at)));
  const canDrag = filter === 'all' && !q;
  $('#count').textContent = '(' + fa(items.length) + ')';
  if (!rows.length) {
    box.innerHTML = '<div class="empty">' + (items.length ? (q ? 'اعلانی با این جستجو پیدا نشد.' : 'در این دسته اعلانی نیست. برای دیدن همه، روی «همه» بزنید.') : 'هنوز اعلانی نیست. اولین اعلان را در ویرایشگر بنویسید.') + '</div>';
    addDeco(box, 0);
    return;
  }
  rows.forEach(x => {
    const el = document.createElement('div');
    el.className = 'item' + (x.id === editingId ? ' active' : '') + (x.id === freshId ? ' fresh' : '');
    const meta = document.createElement('div'); meta.className = 'meta';
    meta.innerHTML = (canDrag ? '<span class="grip" title="بکشید و رها کنید" aria-hidden="true">⠿</span>' : '') +
      (isScheduled(x) ? '<span class="chip sched">زمان‌بندی‌شده</span>' : (x.status === 'published' ? '<span class="chip pub">منتشرشده</span>' : '<span class="chip draft">پیش‌نویس</span>')) +
      (x.pinned ? '<span class="chip pin">سنجاق</span>' : '') + '<span style="margin-inline-start:auto"></span>';
    meta.lastChild.textContent = fmtDate(x.created_at);
    const t = document.createElement('div'); t.className = 't'; t.textContent = x.title || 'بدون عنوان';
    const ex = document.createElement('div'); ex.className = 'ex'; ex.textContent = textOf(x.body);
    const dates = document.createElement('div'); dates.className = 'dates';
    dates.textContent = 'ایجاد: ' + faDate(x.created_at) + (x.updated_at && x.updated_at !== x.created_at ? ' · آخرین ویرایش: ' + faDate(x.updated_at) : '') + (x.publishAt ? ' · انتشار: ' + pacificLabel(x.publishAt) : '');
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
      row.append(ed, del);
      if (canDrag) {
        const up = document.createElement('button'); up.className = 'mini'; up.type = 'button'; up.textContent = '↑'; up.setAttribute('aria-label', 'بردن بالاتر'); up.onclick = () => moveBy(x.id, -1);
        const dn = document.createElement('button'); dn.className = 'mini'; dn.type = 'button'; dn.textContent = '↓'; dn.setAttribute('aria-label', 'بردن پایین‌تر'); dn.onclick = () => moveBy(x.id, 1);
        row.append(up, dn);
      }
      el.append(row);
    }
    if (canDrag) {
      el.draggable = true; el.dataset.id = x.id;
      el.addEventListener('dragstart', e => { dragId = x.id; el.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', x.id); } catch {} });
      el.addEventListener('dragend', () => { dragId = null; $$('.item', box).forEach(n => n.classList.remove('dragging', 'drop-before', 'drop-after')); });
      el.addEventListener('dragover', e => {
        if (!dragId || dragId === x.id) return; e.preventDefault(); e.dataTransfer.dropEffect = 'move';
        const r = el.getBoundingClientRect(), after = e.clientY > r.top + r.height / 2;
        el.classList.toggle('drop-after', after); el.classList.toggle('drop-before', !after);
      });
      el.addEventListener('dragleave', () => el.classList.remove('drop-before', 'drop-after'));
      el.addEventListener('drop', e => {
        e.preventDefault(); if (!dragId || dragId === x.id) return;
        const r = el.getBoundingClientRect(); reorderTo(dragId, x.id, e.clientY > r.top + r.height / 2);
      });
    }
    box.append(el);
  });
  addDeco(box, rows.length);
  freshId = null;
}
let dragId = null, orderQueue = Promise.resolve();
const orderedItems = () => items.slice().sort((a, b) => (orderKey(a) - orderKey(b)) || (new Date(b.created_at) - new Date(a.created_at)));
function reorderTo(movedId, targetId, after){
  const list = orderedItems(), from = list.findIndex(x => x.id === movedId); if (from < 0) return;
  const [moved] = list.splice(from, 1); let to = list.findIndex(x => x.id === targetId); if (to < 0) return;
  list.splice(after ? to + 1 : to, 0, moved); persistOrder(list);
}
function moveBy(id, step){
  const list = orderedItems(), i = list.findIndex(x => x.id === id), j = i + step; if (i < 0 || j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]]; persistOrder(list);
}
/* The new order is shown immediately; only the items whose position changed are saved to the server. */
function persistOrder(list){
  const snapshot = items.map(x => ({ ...x })), changed = [];
  list.forEach((x, i) => { if (x.order !== i) { x.order = i; changed.push(x); } });
  items = list; renderList();
  if (!changed.length) return;
  orderQueue = orderQueue.then(async () => {
    try { await Promise.all(changed.map(x => api.reorder(x))); toast('ترتیب اعلان‌ها ذخیره شد', '↕'); }
    catch (e) { if (e.message === 'auth') return; items = snapshot; renderList(); toast((e.message || 'ذخیرهٔ ترتیب انجام نشد') + ' · ترتیب قبلی برگردانده شد', '!'); }
  });
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
function warnNeutral(c){
  const k = neutralColorKind(c);
  if (k === 'white') toast('رنگ سفید در تم روشن سایت «آبی تیره» نشان داده می‌شود (در تم تیره سفید می‌ماند). اگر می‌خواهید رنگ دیگری انتخاب کنید.', 'ℹ', 6000);
  else if (k === 'black') toast('رنگ سیاه در تم تیرهٔ سایت سفید نشان داده می‌شود. اگر می‌خواهید رنگ دیگری انتخاب کنید.', 'ℹ', 6000);
}
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
  const anchor = { color:'#colorBtn', hi:'#hiBtn', link:'#linkBtn', emoji:'#emojiBtn', tz:'#tzBtn', date:'#dateBtn' }[name];
  const btn = $(anchor); btn.setAttribute('aria-expanded','true');
  const p = document.createElement('div'); p.className = 'pop' + (name === 'emoji' ? ' emoji-pop' : '') + (name === 'tz' ? ' tz-pop' : '') + (name === 'date' ? ' cal-pop' : ''); p.setAttribute('role','dialog');
  if (name === 'color' || name === 'hi') {
    const list = name === 'color' ? COLORS : HIS;
    p.innerHTML = '<div class="lbl">' + (name === 'color' ? 'رنگ متن' : 'رنگ پس‌زمینهٔ متن') + '</div><div class="swatches"></div>';
    const g = $('.swatches', p);
    list.forEach(c => { const b = document.createElement('button'); b.type = 'button'; b.className = 'sw'; b.style.background = c; b.setAttribute('aria-label', c);
      b.onmousedown = e => e.preventDefault();
      b.onclick = () => { exec(name === 'color' ? 'foreColor' : 'hiliteColor', c); $(name === 'color' ? '#colorSwatch' : '#hiSwatch').style.background = c; closePop(); if (name === 'color') warnNeutral(c); };
      g.append(b); });
    const none = document.createElement('button'); none.type = 'button'; none.className = 'sw none'; none.setAttribute('aria-label','بدون رنگ'); none.textContent = '⌀';
    none.onmousedown = e => e.preventDefault();
    none.onclick = () => { exec(name === 'color' ? 'foreColor' : 'hiliteColor', name === 'color' ? 'inherit' : 'transparent'); closePop(); };
    g.append(none);
    const custom = document.createElement('label'); custom.className = 'custom-color';
    custom.innerHTML = '<span>رنگ دلخواه</span><input type="color" aria-label="رنگ دلخواه" value="#e6c55a">';
    const ci = $('input', custom);
    ci.onmousedown = () => saveRange();
    ci.onchange = () => { exec(name === 'color' ? 'foreColor' : 'hiliteColor', ci.value); $(name === 'color' ? '#colorSwatch' : '#hiSwatch').style.background = ci.value; closePop(); if (name === 'color') warnNeutral(ci.value); };
    p.append(custom);
  } else if (name === 'tz') {
    p.setAttribute('role', 'listbox'); p.innerHTML = '<div class="tz-list"></div>';
    ZONES.forEach(z => {
      const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'option'); b.className = 'tz-item' + (z === TZ ? ' on' : ''); b.setAttribute('aria-selected', String(z === TZ));
      b.innerHTML = '<span class="tz-n"></span><span class="tz-r"><bdi dir="ltr" class="tz-t"></bdi><em></em></span>';
      $('.tz-n', b).textContent = ZONE_FULL[z]; $('.tz-t', b).textContent = nowIn(z).split('T')[1]; $('em', b).textContent = offsetLabel(z);
      b.onclick = () => {
        const cur = $('#schedAt').value, keep = cur ? pacificToIso(cur) : null;   /* same instant, shown in the new zone */
        TZ = z; try { localStorage.setItem('bv-sched-tz', JSON.stringify(TZ)); } catch {}
        if (keep) { const l = isoToPacificLocal(keep); schedTime = l.split('T')[1]; $('#schedAt').value = l; }
        renderSchedUi(); closePop();
      };
      $('.tz-list', p).append(b);
    });
  } else if (name === 'date') {
    const today = pacificNowLocal().split('T')[0], sel = getDate();
    if (!calYM) { const [y, m] = (sel || today).split('-').map(Number); calYM = { y, m }; }
    const draw = () => {
      const { y, m } = calYM, first = new Date(Date.UTC(y, m - 1, 1)), startPad = (first.getUTCDay() + 1) % 7, days = new Date(Date.UTC(y, m, 0)).getUTCDate();
      p.innerHTML = '<div class="cal-head"><button type="button" class="cal-nav" data-n="1" aria-label="ماه بعد">‹</button><b></b><button type="button" class="cal-nav" data-n="-1" aria-label="ماه قبل">›</button></div><div class="cal-grid"></div>';
      $('b', p).textContent = first.toLocaleDateString('fa-IR-u-ca-gregory', { timeZone: 'UTC', month: 'long', year: 'numeric' });
      const g = $('.cal-grid', p);
      ['ش','ی','د','س','چ','پ','ج'].forEach(d => { const w = document.createElement('span'); w.className = 'cal-w'; w.textContent = d; g.append(w); });
      for (let i = 0; i < startPad; i++) g.append(document.createElement('span'));
      for (let d = 1; d <= days; d++) {
        const key = y + '-' + pad(m) + '-' + pad(d), b = document.createElement('button'); b.type = 'button'; b.className = 'cal-d' + (key === today ? ' today' : '') + (key === sel ? ' on' : '');
        b.textContent = fa(d); b.disabled = key < today;
        b.onclick = () => { setSched(key); closePop(); };
        g.append(b);
      }
      $$('.cal-nav', p).forEach(n => n.onclick = ev => { ev.stopPropagation(); const k = Number(n.dataset.n); calYM = { y: m + k > 12 ? y + 1 : m + k < 1 ? y - 1 : y, m: m + k > 12 ? 1 : m + k < 1 ? 12 : m + k }; draw(); });
    };
    draw();
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
  if (name === 'tz') p.style.minWidth = btn.getBoundingClientRect().width + 'px';
  const br = btn.getBoundingClientRect(), pw = p.offsetWidth, ph = p.offsetHeight;
  let left = Math.max(12, Math.min(br.right - pw, innerWidth - pw - 12));
  let top = br.bottom + 8; if (top + ph > innerHeight - 12) top = Math.max(12, br.top - ph - 8);
  p.style.left = left + 'px'; p.style.top = top + 'px';
}
listen(window, 'resize', () => closePop());
listen(root, 'scroll', () => { if (openName) closePop(); }, { passive:true });
listen(window, 'scroll', () => { if (openName) closePop(); }, { passive:true });
['color','hi','link','emoji','tz','date'].forEach(n => {
  const b = $({ color:'#colorBtn', hi:'#hiBtn', link:'#linkBtn', emoji:'#emojiBtn', tz:'#tzBtn', date:'#dateBtn' }[n]);
  b.addEventListener('mousedown', e => { e.preventDefault(); if (n !== 'tz' && n !== 'date') saveRange(); });
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
  if (typeof syncClear === 'function') queueMicrotask(syncClear);
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
  $('#coverRemove').hidden = !src; if (!src) $('#coverIn').value = '';   /* picking the same file again must work */
  $$('img,.rm', c).forEach(n => n.remove());
  if (src) {
    const img = document.createElement('img'); img.src = src; img.alt = 'تصویر اعلان';
    const rm = document.createElement('button'); rm.type = 'button'; rm.className = 'rm'; rm.setAttribute('aria-label','حذف تصویر'); rm.textContent = '✕';
    rm.onclick = e => { e.preventDefault(); e.stopPropagation(); setCover(null); };
    c.append(img, rm);
  }
  onChange();
}
/* The cover travels inside the announcement, so it is shrunk first (about 900px wide JPEG, small enough for the API). */
const COVER_MAX_CHARS = 150000;
function shrinkImage(src){
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      for (const [side, q] of [[900, .74], [800, .66], [700, .58], [600, .5], [500, .45]]) {
        const k = Math.min(1, side / Math.max(img.width, img.height)), c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(img.width * k)); c.height = Math.max(1, Math.round(img.height * k));
        const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
        const out = c.toDataURL('image/jpeg', q); if (out.length <= COVER_MAX_CHARS) return resolve(out);
      }
      reject(new Error('big'));
    };
    img.onerror = () => reject(new Error('bad')); img.src = src;
  });
}
function readFile(f){
  if (!f) return;
  if (!/^image\//.test(f.type)) { toast('فقط تصویر JPG، PNG یا WebP', '!'); return; }
  if (f.size > 8 * 1024 * 1024) { toast('حجم تصویر بیشتر از ۸ مگابایت است', '!'); return; }
  const r = new FileReader();
  r.onload = () => shrinkImage(r.result).then(setCover).catch(e => toast(e.message === 'big' ? 'این تصویر خیلی سنگین است؛ تصویر ساده‌تر یا کوچک‌تری انتخاب کنید' : 'تصویر خوانده نشد', '!'));
  r.readAsDataURL(f);
}
$('#coverRemove').addEventListener('click', () => setCover(null));
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
  if (!txt || !plain) { showErr('متن اعلان خالی است.'); body.focus(); return; }
  const cur = editingId && items.find(i => i.id === editingId);
  let publishAt = null;
  if ($('#schedOn').checked) {
    const v = $('#schedAt').value;
    if (!v) { if (status === 'published') { showErr('زمان انتشار را انتخاب کنید یا گزینهٔ زمان‌بندی را خاموش کنید.'); $('#schedAt').focus(); return; } }
    else {
      publishAt = pacificToIso(v);
      if (status === 'published' && publishAt !== (cur && cur.publishAt) && new Date(publishAt).getTime() <= Date.now()) { showErr('زمان انتخاب‌شده گذشته است؛ یک زمان آینده (در منطقهٔ زمانی انتخاب‌شده) بگذارید.'); $('#schedAt').focus(); return; }
    }
  }
  const topOrder = () => { const o = items.map(x => x.order).filter(n => typeof n === 'number'); return o.length ? Math.min(...o) - 1 : 0; };
  const btn = status === 'published' ? $('#publishBtn') : $('#draftBtn');
  const label = btn === $('#publishBtn') ? $('#publishLabel') : btn;
  const old = label.textContent; btn.disabled = true;
  label.innerHTML = '<svg class="spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" style="vertical-align:-3px;margin-inline-end:8px"><path d="M12 3a9 9 0 019 9"/></svg>در حال ذخیره…';
  const payload = { title:t, body:html, pinned, cover, status, showDate: $('#showDate').checked, publishAt, order: cur && typeof cur.order === 'number' ? cur.order : (cur ? null : topOrder()) };
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
    const scheduled = status === 'published' && publishAt && new Date(publishAt).getTime() > Date.now();
    if (status === 'published' && !scheduled) burst($('#publishBtn'));
    toast(editingId ? 'تغییرات ذخیره شد' : (scheduled ? 'اعلان برای زمان انتخاب‌شده زمان‌بندی شد' : (status === 'published' ? 'اعلان منتشر شد' : 'پیش‌نویس ذخیره شد')));
    resetEditor(); renderList();
  } catch(e){ if (e.message !== 'auth') showErr(e.message || 'ذخیره انجام نشد. دوباره امتحان کنید.'); }
  finally { btn.disabled = false; if (btn === $('#publishBtn')) syncPublishLabel(); else label.textContent = 'ذخیرهٔ پیش‌نویس'; }
}
$('#publishBtn').addEventListener('click', () => save('published'));
$('#draftBtn').addEventListener('click', () => save('draft'));

function syncPublishLabel(){
  const cur = editingId && items.find(i => i.id === editingId);
  $('#publishLabel').textContent = cur && cur.status === 'published' ? 'ذخیرهٔ تغییرات' : ($('#schedOn').checked ? 'زمان‌بندی انتشار' : 'انتشار اعلان');
}
const ZONES = ['Asia/Tehran','Europe/Berlin','Europe/London','Europe/Paris','Europe/Istanbul','Asia/Dubai','Asia/Riyadh','Asia/Baghdad','Asia/Karachi','Asia/Kolkata','Asia/Shanghai','Asia/Tokyo','America/New_York','America/Chicago','America/Los_Angeles','America/Toronto','Australia/Sydney'];
const ZONE_FULL = { 'Asia/Tehran':'ایران (تهران)', 'Europe/Berlin':'آلمان (برلین)', 'Europe/London':'انگلستان (لندن)', 'Europe/Paris':'فرانسه (پاریس)', 'Europe/Istanbul':'ترکیه (استانبول)', 'Asia/Dubai':'امارات (دبی)', 'Asia/Riyadh':'عربستان (ریاض)', 'Asia/Baghdad':'عراق (بغداد)', 'Asia/Karachi':'پاکستان (کراچی)', 'Asia/Kolkata':'هند (دهلی)', 'Asia/Shanghai':'چین (پکن)', 'Asia/Tokyo':'ژاپن (توکیو)', 'America/New_York':'آمریکا – ساحل شرقی (نیویورک)', 'America/Chicago':'آمریکا – مرکزی (شیکاگو)', 'America/Los_Angeles':'آمریکا – ساحل غربی (Pacific)', 'America/Toronto':'کانادا (تورنتو)', 'Australia/Sydney':'استرالیا (سیدنی)' };
function offsetLabel(tz){
  const keep = TZ; TZ = tz; const min = Math.round(tzOffsetMs(new Date()) / 60000); TZ = keep;
  const sign = min < 0 ? '−' : '+', a = Math.abs(min); return 'UTC' + sign + Math.floor(a / 60) + (a % 60 ? ':' + pad(a % 60) : '');
}
function nowIn(tz){ const keep = TZ; TZ = tz; const v = pacificNowLocal(); TZ = keep; return v; }
let schedTime = '12:00', calYM = null;
const getDate = () => ($('#schedAt').value || '').split('T')[0] || '';
function setSched(date, time){
  if (time) schedTime = time;
  $('#schedAt').value = date ? date + 'T' + schedTime : '';
  renderSchedUi();
}
function renderSchedUi(){
  const date = getDate(); if ($('#schedAt').value) schedTime = $('#schedAt').value.split('T')[1] || schedTime;
  $('#tzName').textContent = ZONE_FULL[TZ] || TZ; $('#tzOff').textContent = offsetLabel(TZ);
  $('#dateTxt').textContent = date ? new Date(date + 'T12:00:00Z').toLocaleDateString('fa-IR-u-ca-gregory', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'انتخاب تاریخ';
  $('#dateBtn').classList.toggle('empty', !date);
  const [h, m] = schedTime.split(':'); $('#hTxt').textContent = fa(h); $('#mTxt').textContent = fa(m);
  const hint = $('#schedHint'); hint.textContent = 'ساعت الان در ' + (ZONE_FULL[TZ] || TZ) + ': ';
  const clock = document.createElement('bdi'); clock.dir = 'ltr'; clock.textContent = pacificNowLocal().replace('T', ' '); hint.append(clock);
}
function syncSchedule(){
  const on = $('#schedOn').checked; $('#schedBox').hidden = !on;
  if (on) renderSchedUi();
  syncPublishLabel();
}
$$('[data-step]').forEach(b => b.addEventListener('click', () => {
  let [h, m] = schedTime.split(':').map(Number); const k = b.dataset.step;
  if (k === 'h+') h = (h + 1) % 24; if (k === 'h-') h = (h + 23) % 24;
  if (k === 'm+') { m = (Math.floor(m / 5) * 5 + 5) % 60; if (m === 0) h = (h + 1) % 24; }
  if (k === 'm-') { m = m % 5 ? Math.floor(m / 5) * 5 : (m + 55) % 60; if (m === 55) h = (h + 23) % 24; }
  setSched(getDate(), pad(h) + ':' + pad(m));
}));
$('#schedOn').addEventListener('change', syncSchedule);
function resetEditor(){
  $('#showDate').checked = false; $('#schedOn').checked = false; $('#schedAt').value = ''; schedTime = '12:00'; calYM = null; $('#schedBox').hidden = true;
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
  $('#showDate').checked = !!x.showDate; $('#schedOn').checked = !!x.publishAt; $('#schedAt').value = x.publishAt ? isoToPacificLocal(x.publishAt) : ''; calYM = null;
  syncSchedule();
  clearTimeout(saveT); $('#saveState').className = 'save-state'; $('#saveState').lastChild.textContent = 'در حال ویرایش';
  renderList(); onChange(); clearTimeout(saveT);
  $('#saveState').className = 'save-state'; $('#saveState').lastChild.textContent = 'در حال ویرایش';
  title.scrollIntoView({ behavior:'smooth', block:'center' }); title.focus();
}
/* The clear button only appears when there is something to clear. */
function syncClear(){
  const dirty = !!(title.value.trim() || textOf(body.innerHTML) || cover || $('#showDate').checked || $('#schedOn').checked || editingId);
  const btn = $('#clearAll'); if (!dirty) { btn.classList.remove('confirm'); $('#clearAllTxt').textContent = 'پاک کردن همه و شروع از اول'; }
  btn.hidden = !dirty;
}
$('#showDate').addEventListener('change', syncClear); $('#schedOn').addEventListener('change', syncClear);
body.addEventListener('input', syncClear); title.addEventListener('input', syncClear);
/* Clears everything typed so far (title, text, image, time options) and starts over; two taps to avoid accidents. */
let clearTimer = 0;
$('#clearAll').addEventListener('click', () => {
  const btn = $('#clearAll'), txt = $('#clearAllTxt');
  if (!btn.classList.contains('confirm')) {
    btn.classList.add('confirm'); txt.textContent = 'مطمئنید؟ دوباره بزنید تا همه‌چیز پاک شود';
    clearTimeout(clearTimer); clearTimer = setTimeout(() => { btn.classList.remove('confirm'); txt.textContent = 'پاک کردن همه و شروع از اول'; }, 3500);
    return;
  }
  clearTimeout(clearTimer); btn.classList.remove('confirm'); txt.textContent = 'پاک کردن همه و شروع از اول';
  store.del(DRAFT_KEY); closeModal(); resetEditor(); renderList(); title.focus(); toast('همه‌چیز پاک شد؛ از اول شروع کنید', '↺');
});
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
const themeBtn = $('#themeBtn'); if (themeBtn) themeBtn.addEventListener('click', () => { opts.toggleTheme && opts.toggleTheme(); });

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
