#!/usr/bin/env node
// Usage: node render.js <gate.json> [out.html]
// Validates a CEO-gate JSON, normalizes decisions, tensions and rejected items into one list of
// decidable items, embeds images, and injects the result into template.html.
// Output defaults to <gate>.html next to the JSON.
const fs = require('fs');
const path = require('path');

const [src, outArg] = process.argv.slice(2);
if (!src) { console.error('usage: node render.js <gate.json> [out.html]'); process.exit(2); }

const data = JSON.parse(fs.readFileSync(src, 'utf8'));
const baseDir = path.dirname(path.resolve(src));
const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml' };
// Text that points at visual evidence the human would expect to see next to it.
const MENTIONS_VISUAL = /\b(screenshots?|screen ?captures?|captures? d'écran|fig(ure)?\.? ?\d+)\b/i;
// Kinds whose gate approves something to build: the page must show where it lands.
const NEEDS_OUTCOME = ['plan', 'kickoff'];
const VIEWS = ['ui', 'system'];
// Card text is read at a glance: past these lengths it is a report, not a card.
const MAX = { detail: 240, why: 160, bullet: 120, bullets: 4 };

const errors = [];
if (!data.title) errors.push('missing "title"');
if (!Array.isArray(data.decisions) || !data.decisions.length) errors.push('"decisions" must be a non-empty array');
if (data.summary != null) {
  if (!Array.isArray(data.summary)) errors.push('"summary" must be an array of bullets — strings or { "label", "text" | "points" } — not a paragraph');
  else data.summary.forEach((b, i) => {
    if (typeof b === 'string') return;
    if (!b || typeof b !== 'object' || (!b.text && !(Array.isArray(b.points) && b.points.length))) errors.push(`summary[${i}] needs "text" or "points"`);
  });
}
if (data.metrics) errors.push('top-level "metrics" is not supported — put each metric in the "metrics" of the item it measures');

// Images are embedded as data URIs so the page is one self-contained file.
// src must be relative to the JSON, so the gate folder holds its own evidence and re-renders later.
function embed(fig, where) {
  if (!fig.svg && !fig.src) { errors.push(`${where} needs "svg" or "src"`); return; }
  if (!fig.src || /^data:/.test(fig.src)) return;
  if (path.isAbsolute(fig.src) || /^[a-z]+:\/\//i.test(fig.src)) {
    errors.push(`${where}.src "${fig.src}" must be relative to the JSON — copy the file into the gate folder`);
    return;
  }
  const file = path.resolve(baseDir, fig.src);
  if (path.extname(file).toLowerCase() === '.svg' && fs.existsSync(file)) {
    // Inlined rather than embedded as <img>, so currentColor follows the page's text color.
    fig.svg = fs.readFileSync(file, 'utf8').replace(/<\?xml[^>]*>\s*/, '');
    delete fig.src;
    return;
  }
  const mime = MIME[path.extname(file).toLowerCase()];
  if (!mime) { errors.push(`${where}.src "${fig.src}" is not a supported image type`); return; }
  if (!fs.existsSync(file)) { errors.push(`${where}.src "${fig.src}" not found (resolved to ${file})`); return; }
  fig.src = `data:${mime};base64,${fs.readFileSync(file).toString('base64')}`;
}

function checkOptions(opts, where) {
  (opts || []).forEach((o, j) => { if (!o.value || !o.label) errors.push(`${where}.options[${j}] needs "value" and "label"`); });
}

function checkArguments(item, where) {
  ['for', 'against'].forEach(k => {
    if (item[k] == null) return;
    if (!Array.isArray(item[k])) { errors.push(`${where}.${k} must be an array`); return; }
    item[k] = item[k].map(a => (typeof a === 'string' ? { point: a } : a));
    item[k].forEach((a, j) => { if (!a.point) errors.push(`${where}.${k}[${j}] needs "point"`); });
  });
}

// "Gold uses Math.floor…" → "gold uses math floor"
const norm = t => String(t || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const words = t => norm(t).split(' ').filter(w => w.length > 2);
const textOf = v => (Array.isArray(v) ? v.join('\n') : String(v || ''));

// detail and why are a string ("- " lines become bullets) or an array of bullets.
function checkText(item, key, where) {
  const v = item[key];
  if (v == null) return;
  if (!Array.isArray(v) && typeof v !== 'string') { errors.push(`${where}.${key} must be a string or an array of bullets`); return; }
  const text = textOf(v);
  if (text.length > MAX[key]) errors.push(`${where}.${key} is ${text.length} characters (max ${MAX[key]}) — keep the facts the title lacks, as bullets`);
  const bullets = Array.isArray(v) ? v : v.split('\n').filter(l => /^\s*[-•]\s/.test(l));
  if (bullets.length > MAX.bullets) errors.push(`${where}.${key} has ${bullets.length} bullets (max ${MAX.bullets})`);
  bullets.forEach((b, j) => { if (String(b).length > MAX.bullet) errors.push(`${where}.${key} bullet ${j + 1} is ${String(b).length} characters (max ${MAX.bullet})`); });
}

// Each field has one job: the title names the question, detail gives the facts, options are the answers.
// Text that restates another field makes the human read the same thing twice.
function checkEcho(item, where) {
  const title = norm(item.title), detail = norm(textOf(item.detail));
  if (detail && title && detail.startsWith(title)) errors.push(`${where} ("${item.id}") detail starts by repeating the title — give only what the title doesn't say`);
  const dw = new Set(words(item.detail));
  (item.options || []).forEach(o => {
    const label = norm(o.label), lw = words(o.label);
    if (label && label === title) errors.push(`${where} ("${item.id}") option "${o.label}" is the title — title the question, not an answer`);
    if (lw.length >= 2 && lw.every(w => dw.has(w))) errors.push(`${where} ("${item.id}") detail describes option "${o.label}" — state the situation in detail, keep the answers in options`);
  });
}

// Shared by every kind of item: figures (with the legacy "images" alias), arguments, and the visual-mention check.
function finish(item, where) {
  item.figures = (item.figures || []).concat(item.images || []);
  delete item.images;
  item.figures.forEach((f, j) => embed(f, `${where}.figures[${j}]`));
  checkArguments(item, where);
  checkOptions(item.options, where);
  checkText(item, 'detail', where);
  checkText(item, 'why', where);
  checkEcho(item, where);
  const text = [item.title, textOf(item.detail), textOf(item.why)].join(' ');
  if (MENTIONS_VISUAL.test(text) && !item.figures.length) {
    errors.push(`${where} ("${item.id}") mentions "${text.match(MENTIONS_VISUAL)[0]}" but has no "figures" — attach it or drop the reference`);
  }
  return item;
}

const items = [];

(data.decisions || []).forEach((d, i) => {
  const where = `decisions[${i}]`;
  if (!d.id || !d.title) errors.push(`${where} needs "id" and "title"`);
  const item = Object.assign({ kind: 'decision' }, d);
  if (!item.options || !item.options.length) {
    item.options = [
      { value: 'approve', label: 'Approve', recommended: d.recommended !== 'decline' },
      { value: 'decline', label: 'Decline', negative: true, recommended: d.recommended === 'decline' }
    ];
  }
  items.push(finish(item, where));
});

(data.tensions || []).forEach((t, i) => {
  const where = `tensions[${i}]`;
  const id = t.id || `T${i + 1}`;
  if (!t.topic && !t.title) errors.push(`${where} needs "topic"`);
  if (!Array.isArray(t.sides) || t.sides.length < 2) errors.push(`${where} needs at least two "sides"`);
  if (t.recommended != null) errors.push(`${where}.recommended is not supported — set "recommended": true on the recommended side`);
  // Drop a leading "T1 — " from the topic: the id is shown separately.
  const title = String(t.topic || t.title || '').replace(new RegExp('^' + id + '\\s*[—:-]\\s*'), '');
  const item = Object.assign({}, t, { kind: 'tension', id, title, group: 'Tensions' });
  delete item.topic;
  if (!item.options || !item.options.length) {
    item.options = (t.sides || []).map((s, j) => ({
      value: String(s.who || `side ${j + 1}`).replace(/\|/g, '/'),
      label: 'Side with ' + (s.who || `side ${j + 1}`),
      recommended: !!s.recommended
    })).concat([{ value: 'defer', label: 'Defer', negative: true }]);
  }
  items.push(finish(item, where));
});

(data.rejected || []).forEach((r, i) => {
  const where = `rejected[${i}]`;
  if (!r.id || !r.title) errors.push(`${where} needs "id" and "title"`);
  const item = Object.assign({}, r, { kind: 'rejected', group: 'Considered and rejected' });
  if (r.reason && !r.why) item.why = 'Rejected because: ' + r.reason;
  delete item.reason;
  if (!item.options || !item.options.length) {
    item.options = [
      { value: 'keep-rejected', label: 'Keep rejected', recommended: true },
      { value: 'revive', label: 'Revive' }
    ];
  }
  if (item.default == null) item.default = 'keep-rejected';
  items.push(finish(item, where));
});

const ids = new Set();
items.forEach(it => {
  if (ids.has(it.id)) errors.push(`duplicate id "${it.id}" (ids must be unique across decisions, tensions and rejected)`);
  ids.add(it.id);
});
(data.figures || []).forEach((f, i) => embed(f, `figures[${i}]`));

// outcome: where the work lands, one entry per view it changes (ui mockup, system diagram).
if (data.outcome != null && !Array.isArray(data.outcome)) errors.push('"outcome" must be an array of { "view", "after", "before"?, "caption" }');
const outcome = Array.isArray(data.outcome) ? data.outcome : [];
if (NEEDS_OUTCOME.includes(data.kind) && !outcome.length) {
  errors.push(`kind "${data.kind}" needs "outcome": a mockup ("view": "ui") and/or a diagram ("view": "system") of the result`);
}
outcome.forEach((o, i) => {
  const where = `outcome[${i}]`;
  if (!VIEWS.includes(o.view)) errors.push(`${where}.view must be one of ${VIEWS.join(', ')}`);
  if (!o.caption) errors.push(`${where} needs "caption": one line saying what to look at`);
  if (!o.after) errors.push(`${where} needs "after": the target state`);
  ['before', 'after'].forEach(k => { if (o[k]) embed(o[k], `${where}.${k}`); });
});

if (errors.length) { console.error('invalid gate JSON:\n- ' + errors.join('\n- ')); process.exit(1); }

const page = { kind: data.kind, title: data.title, date: data.date, source: data.source, summary: data.summary, outcome, figures: data.figures || [], items };
// Content hash: saved browser state is keyed by it, so an edited gate starts with fresh decisions.
page._rev = require('crypto').createHash('sha1').update(JSON.stringify(page)).digest('hex').slice(0, 12);

const template = fs.readFileSync(path.join(__dirname, 'template.html'), 'utf8');
// Escape "<" so "</script>" or "<!--" inside the data cannot break out of the script element.
const json = JSON.stringify(page).replace(/</g, '\\u003c');
const html = template.replace('<!--CEO_DATA-->', `<script type="application/json" id="ceo-data">${json}</script>`);

const out = outArg || src.replace(/(\.ceo)?\.json$/, '') + '.html';
fs.writeFileSync(out, html);
console.log(out);
