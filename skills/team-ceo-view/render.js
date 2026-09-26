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

// Shared by every kind of item: figures (with the legacy "images" alias), arguments, and the visual-mention check.
function finish(item, where) {
  item.figures = (item.figures || []).concat(item.images || []);
  delete item.images;
  item.figures.forEach((f, j) => embed(f, `${where}.figures[${j}]`));
  checkArguments(item, where);
  checkOptions(item.options, where);
  const text = [item.title, item.detail, item.why].join(' ');
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

if (errors.length) { console.error('invalid gate JSON:\n- ' + errors.join('\n- ')); process.exit(1); }

const page = { kind: data.kind, title: data.title, date: data.date, source: data.source, summary: data.summary, figures: data.figures || [], items };
// Content hash: saved browser state is keyed by it, so an edited gate starts with fresh decisions.
page._rev = require('crypto').createHash('sha1').update(JSON.stringify(page)).digest('hex').slice(0, 12);

const template = fs.readFileSync(path.join(__dirname, 'template.html'), 'utf8');
// Escape "<" so "</script>" or "<!--" inside the data cannot break out of the script element.
const json = JSON.stringify(page).replace(/</g, '\\u003c');
const html = template.replace('<!--CEO_DATA-->', `<script type="application/json" id="ceo-data">${json}</script>`);

const out = outArg || src.replace(/(\.ceo)?\.json$/, '') + '.html';
fs.writeFileSync(out, html);
console.log(out);
