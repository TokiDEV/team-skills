// Gate validation and normalization: decisions, tensions and rejected items become one list of decidable items.
const fs = require('fs');
const path = require('path');
const { readPreset } = require('./share');

const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml' };
// Text that points at visual evidence the human would expect to see next to it.
const MENTIONS_VISUAL = /\b(screenshots?|screen ?captures?|captures? d'écran|fig(ure)?\.? ?\d+)\b/i;
// Kinds whose gate approves something to build: the page must show where it lands.
const NEEDS_OUTCOME = ['plan', 'kickoff'];
const VIEWS = ['ui', 'system'];
// Card text is read at a glance: past these lengths it is a report, not a card.
const MAX = { detail: 240, why: 160, bullet: 120, bullets: 4 };
// --share: the reader has neither this machine nor the .council/ folder.
const LANGS = ['en', 'fr'];
const LOCAL_PATH = /(?:^|[\s`'"(])(\/home\/|\/Users\/|\/tmp\/|[A-Za-z]:\\)|\.council\//;
// A commit id: 7-40 hex characters with at least one letter and one digit (not a date).
const SHA = /\b(?=[0-9a-f]*[a-f])(?=[0-9a-f]*\d)[0-9a-f]{7,40}\b/;

// Reads and validates the gate JSON. Every problem accumulates into `errors` (the caller prints them).
function loadGate(src, { share: SHARE, preset: PRESET }) {
  const data = JSON.parse(fs.readFileSync(src, 'utf8'));
  const baseDir = path.dirname(path.resolve(src));
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
      item.options = (t.sides || []).map((s, j) => Object.assign({
        value: String(s.who || `side ${j + 1}`).replace(/\|/g, '/'),
        label: 'Side with ' + (s.who || `side ${j + 1}`),
        recommended: !!s.recommended
      }, s.negative ? { negative: true } : {}, s.brief != null ? { brief: s.brief } : {}, s.suggestion != null ? { suggestion: s.suggestion } : {}))
        .concat([{ value: 'defer', label: 'Defer', negative: true }]);
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
  items.forEach(it => {
    if (it.needs == null) return;
    if (!Array.isArray(it.needs) || it.needs.some(n => typeof n !== 'string')) { errors.push(`"${it.id}".needs must be an array of ids`); return; }
    it.needs.forEach(n => {
      if (n === it.id) errors.push(`"${it.id}".needs names itself`);
      else if (!ids.has(n)) errors.push(`"${it.id}".needs names unknown id "${n}"`);
    });
  });
  // at: where a decision's or tension's code is, for the review's anchored comments.
  items.forEach(it => {
    if (it.at == null) return;
    const a = it.at;
    if (!a || typeof a !== 'object' || Array.isArray(a) || typeof a.path !== 'string' || !a.path || !Number.isInteger(a.line) || a.line < 1) {
      errors.push(`"${it.id}".at must be { "path", "line" } with a repo-relative path and a line ≥ 1`);
    } else if (LOCAL_PATH.test(a.path) || a.path.startsWith('/')) {
      errors.push(`"${it.id}".at.path "${a.path}" is not repo-relative`);
    }
  });
  // suggestion: { lines, text } on an item or on one option: replaces `lines` lines from at.line, for --review.
  items.forEach(it => {
    const holders = [it].concat(it.options || []).filter(h => h.suggestion != null);
    if (!holders.length) return;
    if (holders.length > 1) errors.push(`"${it.id}" has more than one suggestion`);
    holders.forEach(h => {
      const s = h.suggestion;
      if (!it.at) errors.push(`"${it.id}".suggestion needs "at"`);
      if (!s || typeof s !== 'object' || Array.isArray(s) || !Number.isInteger(s.lines) || s.lines < 1 || typeof s.text !== 'string') {
        errors.push(`"${it.id}".suggestion must be { "lines", "text" }`);
      } else if (s.text.split(/\r?\n/).some(l => /^\s*`{3,}\s*$/.test(l))) {
        errors.push(`"${it.id}".suggestion.text cannot contain a code fence`);
      }
    });
  });
  (data.figures || []).forEach((f, i) => embed(f, `figures[${i}]`));

  let preset = null;
  // --share: every outcome that leads to work carries a brief the reader's Claude can follow alone.
  if (SHARE) {
    if (data.kind !== 'review') errors.push('--share needs kind "review": only a team-review gate is shared with the branch owner');
    if (data.lang != null && !LANGS.includes(data.lang)) errors.push(`"lang" must be one of ${LANGS.join(', ')}`);
    if (!data.preamble) errors.push('--share needs "preamble": repo, branch, reviewed commit SHA, scope, baseline, rules (see contract.md, Share fields)');
    else if (!SHA.test(data.preamble)) errors.push('"preamble" names no commit SHA — give the reviewed commit, so the reader can tell when HEAD has moved');
    const texts = [['preamble', data.preamble]];
    items.forEach(it => {
      if (it.kind === 'rejected') return;
      if (it.brief != null) texts.push([`${it.id}.brief`, it.brief]);
      it.options.forEach(o => {
        if (o.brief != null) texts.push([`${it.id}.options[${o.value}].brief`, o.brief]);
        if (!o.negative && !o.brief && !it.brief) {
          errors.push(`"${it.id}" option "${o.value}" leads to work but has no brief — set "brief" on the item or the option, or mark the option "negative": true`);
        }
      });
    });
    texts.forEach(([where, t]) => {
      if (t == null) return;
      if (typeof t !== 'string') { errors.push(`${where} must be a Markdown string`); return; }
      const m = t.match(LOCAL_PATH);
      if (m) errors.push(`${where} holds "${(m[1] || m[0]).trim()}", a path the reader doesn't have — name files relative to the repo root`);
    });
    if (PRESET) preset = readPreset(PRESET, items, errors);
  }

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
  return { data, items, outcome, errors, preset };
}

module.exports = { loadGate };
