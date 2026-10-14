const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { render, pageData } = require('./helpers');

const EX = path.join(__dirname, '..', '..', 'examples');

function copyTo(dir, rel) {
  const to = path.join(dir, path.basename(rel));
  fs.copyFileSync(path.join(EX, rel), to);
  return to;
}

test('the refactor example renders and is not shareable', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ex-'));
  const file = copyTo(dir, 'refactor-gate/invoice.ceo.json');
  fs.cpSync(path.join(EX, 'refactor-gate', 'invoice'), path.join(dir, 'invoice'), { recursive: true }); // the figures it references
  assert.strictEqual(render(file).code, 0);
  assert.strictEqual(render(file, '--share').code, 1);
});

test('the review example renders, shares, and builds a GitHub review without the declined finding', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ex-'));
  const file = copyTo(dir, 'review-gate/refund.ceo.json');
  const diff = path.join(EX, 'review-gate/refund.diff');
  const preset = path.join(EX, 'review-gate/refund.share.txt');
  assert.strictEqual(render(file).code, 0);
  const s = render(file, '--share', '--preset=' + preset);
  assert.strictEqual(s.code, 0, s.stderr);
  assert.strictEqual(pageData(fs.readFileSync(file.replace(/\.ceo\.json$/, '.share.html'), 'utf8')).kind, 'review');
  const r = render(file, '--share', '--preset=' + preset, '--review=github', '--head=9b1e4c7a2f3d5e6b8c0a1d2e3f4a5b6c7d8e9f01', '--diff=' + diff);
  assert.strictEqual(r.code, 0, r.stderr);
  const payload = JSON.parse(fs.readFileSync(file.replace(/\.ceo\.json$/, '.review.github.json'), 'utf8'));
  const ids = payload.comments.map(c => c.body.match(/^\*\*([A-Z]+-\d+)/)[1]);
  assert.deepStrictEqual(ids.sort(), ['CR-1', 'CR-2', 'IN-1', 'SE-1']);
  assert.ok(!JSON.stringify(payload).includes('CR-3'));
  assert.match(payload.comments.find(c => c.body.startsWith('**CR-1')).body, /```suggestion\n/);
});
