const test = require('node:test');
const assert = require('node:assert');
const vm = require('node:vm');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { RENDER, shareGate, writeGate, render, pageData } = require('./helpers');

// A council gate in the spec's shape: a page constraint, an item constraint, both lenses, a violating option.
function bridgeGate(overrides) {
  const gate = {
    kind: 'council',
    title: 'Export',
    source: '.council/decisions/2026-10-14-export.md',
    constraints: [{ id: 'K1', lens: 'business', text: 'Live before the 1 Dec closing', source: 'CEO, framing', status: 'confirmed' }],
    decisions: [{
      id: 'D1', title: 'Accounting export: build or buy?', lens: 'business',
      constraints: [{ id: 'K2', lens: 'tech', text: 'No new database in production', source: 'CLAUDE.md:12', status: 'confirmed' }],
      options: [
        { value: 'build', label: 'Build in-house', recommended: true, tradeoff: { business: 'Live mid-November', tech: 'Duplicates the PDF pipeline (debt)' } },
        { value: 'buy', label: 'Third-party service', tradeoff: { business: '200 €/month', tech: 'No debt; one new dependency' }, violates: ['K2'] }
      ],
      accepts: 'PDF pipeline debt, to make the 1 Dec closing',
      for: [{ who: 'PO', point: 'Unblocks the three customers waiting on the export' }],
      against: [{ who: 'CTO', point: 'Two PDF code paths to keep in sync', lens: 'tech' }],
      metrics: [{ label: 'Weeks to ship', before: 0, after: 3, better: 'lower', lens: 'tech' }]
    }]
  };
  return Object.assign(gate, overrides || {});
}

function page(gate) {
  const file = writeGate(gate);
  const r = render(file);
  assert.strictEqual(r.code, 0, r.stderr);
  return pageData(fs.readFileSync(file.replace(/\.ceo\.json$/, '.html'), 'utf8'));
}

function rejects(gate, pattern) {
  const r = render(writeGate(gate));
  assert.strictEqual(r.code, 1, 'expected a rejection');
  assert.match(r.stderr, pattern);
}

const item = (data, id) => data.items.find(it => it.id === id);
const ids = list => list.map(k => k.id);
// One decision on a page of the given kind.
const plain = (kind, d) => ({ kind, title: 'G', decisions: [Object.assign({ id: 'S1', title: 'Extract Function: total' }, d)] });

test('a council gate with both lenses: entries take the item lens, the bridge holds the item constraint', () => {
  const data = page(bridgeGate());
  const d1 = item(data, 'D1');
  assert.deepStrictEqual(ids(data.constraints), ['K1']);
  assert.strictEqual(d1.for[0].lens, 'business');
  assert.strictEqual(d1.against[0].lens, 'tech');
  assert.strictEqual(d1.metrics[0].lens, 'tech');
  assert.strictEqual(d1.lensTabs, true);
  assert.deepStrictEqual(d1.lenses, ['business', 'tech']);
  assert.deepStrictEqual(ids(d1.bridge), ['K2']);
  assert.strictEqual(d1.accepts, 'PDF pipeline debt, to make the 1 Dec closing');
  assert.deepStrictEqual(d1.options[1].violates, ['K2']);
});

test('a page constraint shows on the bridge of a card whose option violates it', () => {
  const g = bridgeGate(); g.decisions[0].options[1].violates = ['K2', 'K1'];
  assert.deepStrictEqual(ids(item(page(g), 'D1').bridge), ['K2', 'K1']);
});

test('a lens-free gate gets no bridge fields', () => {
  const file = writeGate(shareGate());
  assert.strictEqual(render(file).code, 0);
  const json = JSON.stringify(pageData(fs.readFileSync(file.replace(/\.ceo\.json$/, '.html'), 'utf8')));
  assert.doesNotMatch(json, /"lens"|"lenses"|"lensTabs"|"bridge"|"constraints"/);
});

test('tabs: entries of both lenses show them on any page', () => {
  const both = { for: [{ who: 'PO', point: 'Ships sooner.', lens: 'business' }], against: [{ who: 'CTO', point: 'More code.', lens: 'tech' }] };
  assert.strictEqual(page(plain('refactor', both)).items[0].lensTabs, true);
  const withCode = { for: [{ who: 'PO', point: 'Ships sooner.', lens: 'business' }], code: { before: 'a', after: 'b' } };
  assert.strictEqual(page(plain('refactor', withCode)).items[0].lensTabs, true); // code is tech
});

test('a one-lens card gets no tabs, on any page: its header names the lens', () => {
  const tech = { lens: 'tech', for: [{ who: 'CTO', point: 'Cheaper to run.' }] };
  const council = page(plain('council', tech)).items[0];
  assert.strictEqual(council.lensTabs, undefined);
  assert.deepStrictEqual(council.lenses, ['tech']);
  assert.strictEqual(council.for[0].lens, 'tech');
  assert.deepStrictEqual(page(plain('council', { lens: 'business', minor: true, default: 'approve' })).items[0].lenses, ['business']);
});

test('lenses: what a card concerns counts its trade-offs and the constraints it can break, not only its arguments', () => {
  const g = bridgeGate();
  g.decisions.push({ id: 'D2', title: 'Charge for it?', lens: 'business', for: [{ who: 'PO', point: 'Customers asked.' }],
    options: [{ value: 'free', label: 'Free', recommended: true }, { value: 'paid', label: 'Paid', violates: ['K3'] }],
    constraints: [{ id: 'K3', lens: 'tech', text: 'No new payment provider', source: 'CTO', status: 'confirmed' }] });
  const d2 = item(page(g), 'D2');
  assert.deepStrictEqual(d2.lenses, ['business', 'tech']); // breaking a tech rule concerns tech
  assert.strictEqual(d2.lensTabs, undefined); // but every argument is business: nothing to switch
});

test('lenses: code counts as tech once a trade-off lenses the card', () => {
  const it = page(plain('council', { for: [{ who: 'PO', point: 'Faster.' }], code: { before: 'a', after: 'b' },
    options: [{ value: 'a', label: 'A', recommended: true, tradeoff: { business: 'Live sooner' } }, { value: 'b', label: 'B' }],
    accepts: 'Some debt' })).items[0];
  assert.deepStrictEqual(it.lenses, ['business', 'tech']);
});

test('tabs: a lens-free item keeps no lens, even with code', () => {
  const it = page(plain('council', { for: [{ who: 'Mechanics', point: 'Testable alone.' }], code: { before: 'a', after: 'b' } })).items[0];
  assert.doesNotMatch(JSON.stringify(it), /"lens"|"lenses"|"lensTabs"|"bridge"/);
});

test('a tension side carries its trade-off and the constraints it breaks', () => {
  const g = bridgeGate({ tensions: [{ topic: 'Ship a sync too?', lens: 'business', accepts: 'Users download a file for now', sides: [
    { who: 'PO', position: 'Later.', recommended: true, tradeoff: { business: 'One feature at a time' } },
    { who: 'UX', position: 'Now.', tradeoff: { business: 'Users never download' }, violates: ['K1'] }
  ] }] });
  const t1 = item(page(g), 'T1');
  const ux = t1.options.find(o => o.value === 'UX');
  assert.deepStrictEqual(ux.violates, ['K1']);
  assert.deepStrictEqual(ux.tradeoff, { business: 'Users never download' });
  assert.deepStrictEqual(ids(t1.bridge), ['K1']);
  delete g.tensions[0].accepts;
  rejects(g, /tensions\[0\] \("T1"\) recommends an option with a "tradeoff" but has no "accepts"/);
});

test('lens values are business or tech, on items and entries', () => {
  const a = bridgeGate(); a.decisions[0].lens = 'ux';
  rejects(a, /decisions\[0\] \("D1"\)\.lens must be one of business, tech/);
  const b = bridgeGate(); b.decisions[0].against[0].lens = 'money';
  rejects(b, /decisions\[0\]\.against\[0\]\.lens must be one of business, tech/);
});

test('on a lensed item, an entry with no lens of its own and none from the item is rejected', () => {
  const g = bridgeGate(); delete g.decisions[0].lens;
  rejects(g, /decisions\[0\]\.for\[0\] has no lens and its item none to give/);
});

test('constraints need every field, a known lens and status, and a unique id', () => {
  const a = bridgeGate(); delete a.decisions[0].constraints[0].source;
  rejects(a, /decisions\[0\]\.constraints\[0\] needs "id", "text" and "source"/);
  const b = bridgeGate(); b.constraints[0].lens = 'legal';
  rejects(b, /constraints\[0\] \("K1"\)\.lens must be one of business, tech/);
  const c = bridgeGate(); c.constraints[0].status = 'maybe';
  rejects(c, /constraints\[0\] \("K1"\)\.status must be one of confirmed, assumed, contested/);
  const d = bridgeGate(); d.decisions[0].constraints[0].id = 'K1';
  rejects(d, /duplicate constraint id "K1"/);
});

test('violates names constraints on the page or the item', () => {
  const a = bridgeGate(); a.decisions[0].options[1].violates = ['K9'];
  rejects(a, /decisions\[0\] \("D1"\) option "buy" violates unknown constraint "K9"/);
  const b = bridgeGate(); b.decisions[0].options[1].violates = 'K2';
  rejects(b, /option "buy": "violates" must be an array of constraint ids/);
});

test('tradeoff takes business and/or tech, one line of at most 80 characters each', () => {
  const a = bridgeGate(); a.decisions[0].options[0].tradeoff = {};
  rejects(a, /option "build": "tradeoff" needs "business" and\/or "tech"/);
  const b = bridgeGate(); b.decisions[0].options[0].tradeoff = { tech: 'One new table', ux: 'Fewer clicks' };
  rejects(b, /option "build": tradeoff key "ux" must be one of business, tech/);
  const c = bridgeGate(); c.decisions[0].options[0].tradeoff.tech = 'x'.repeat(81);
  rejects(c, /option "build": tradeoff\.tech is 81 characters \(max 80\)/);
});

test('accepts is required beside a recommended trade-off and holds at most 160 characters', () => {
  const a = bridgeGate(); delete a.decisions[0].accepts;
  rejects(a, /decisions\[0\] \("D1"\) recommends an option with a "tradeoff" but has no "accepts"/);
  const b = bridgeGate(); b.decisions[0].accepts = 'x'.repeat(161);
  rejects(b, /decisions\[0\] \("D1"\)\.accepts is 161 characters \(max 160\)/);
});

test('a recommended option never violates a constraint, whatever its status', () => {
  const swap = status => {
    const g = bridgeGate();
    g.decisions[0].constraints[0].status = status;
    g.decisions[0].options[0].recommended = false;
    g.decisions[0].options[1].recommended = true;
    return g;
  };
  rejects(swap('confirmed'), /decisions\[0\] \("D1"\) option "buy" is recommended but violates K2 — only the CEO lifts a constraint/);
  rejects(swap('contested'), /option "buy" is recommended but violates K2/);
});

test('a default option never violates a constraint', () => {
  const g = bridgeGate();
  g.decisions.push({ id: 'D2', title: 'Cache the export', minor: true, default: 'cache', options: [
    { value: 'cache', label: 'Cache it', violates: ['K1'] }, { value: 'skip', label: 'Skip' }
  ] });
  rejects(g, /decisions\[1\] \("D2"\) option "cache" is the default but violates K1/);
});

test('--preset reads a choice that lifts a constraint', () => {
  const gate = shareGate({ constraints: [{ id: 'K9', lens: 'business', text: 'Invoices already sent stay as they are', source: 'CEO, framing', status: 'confirmed' }] });
  gate.decisions[1].options[1].violates = ['K9'];
  const file = writeGate(gate);
  const preset = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'ceo-preset-')), 'g.share.txt');
  fs.writeFileSync(preset, 'CEO SHARE — Gate\nF1 = round (lifts K9) | note: finance agreed\n');
  const r = render(file, '--share', '--preset=' + preset);
  assert.strictEqual(r.code, 0, r.stderr);
  const data = pageData(fs.readFileSync(file.replace(/\.ceo\.json$/, '.share.html'), 'utf8'));
  assert.deepStrictEqual(data.preset, { F1: { choice: 'round', note: 'finance agreed' } });
});

const TEMPLATE = path.join(path.dirname(RENDER), 'template.html');

// The page's own decisionsBlock, loaded from the PROMPT block as render.js --accept-recommended does.
function decisionsBlock(data, state) {
  const src = fs.readFileSync(TEMPLATE, 'utf8').match(/\/\*PROMPT-START\*\/([\s\S]*?)\/\*PROMPT-END\*\//)[1];
  return vm.runInNewContext(src + '\ndecisionsBlock;')(data, data.items, state);
}

test('the decisions block marks a lifted constraint, before the note', () => {
  const data = page(bridgeGate());
  assert.match(decisionsBlock(data, { D1: { choice: 'buy', note: 'the vendor hosts it' } }), /^D1 = buy \(lifts K2\) \| note: the vendor hosts it$/m);
  assert.match(decisionsBlock(data, { D1: { choice: 'build' } }), /^D1 = build$/m);
});

test('auto-accept takes the recommendations and never lifts a constraint', () => {
  const r = render(writeGate(bridgeGate()), '--accept-recommended');
  assert.strictEqual(r.code, 0, r.stderr);
  assert.match(r.stdout, /^D1 = build$/m);
  assert.doesNotMatch(r.stdout, /lifts/);
});

test('the page script parses', () => {
  const src = fs.readFileSync(TEMPLATE, 'utf8').match(/<script>\n([\s\S]*?)<\/script>/)[1];
  assert.doesNotThrow(() => new vm.Script(src));
});

test('the template draws the bridge, lens chips, per-card tabs and the lens filter', () => {
  const html = fs.readFileSync(TEMPLATE, 'utf8');
  assert.match(html, /\.card\[data-lens="business"\] \[data-lens="tech"\], \.card\[data-lens="tech"\] \[data-lens="business"\] \{ display: none; \}/);
  assert.ok(html.includes("lc.appendChild(lensMark('tag lens', l))"));
  assert.ok(html.includes("g.setAttribute('role', 'group')"));
  assert.match(html, /\(e\.key === 'b' \|\| e\.key === 't'\) && c && c\.tabs/);
  assert.ok(html.includes("pills('Lens', 'lens'"));
  assert.ok(html.includes("(filters.lens === 'all' || !it.lenses || it.lenses.indexOf(filters.lens) >= 0)"));
  assert.ok(html.includes("'No ' + l + ' argument raised.'"));
  assert.ok(html.includes("el('b', null, 'Accepts: ')"));
  // A breaking option stays choosable: no strike-through, a badge naming what choosing it lifts.
  assert.ok(html.includes("el('span', 'lift', 'lifts ' + o.violates.join(', '))"));
  assert.doesNotMatch(html, /line-through/);
  assert.ok(html.includes("'<kbd>b</kbd> / <kbd>t</kbd>'"));
});
