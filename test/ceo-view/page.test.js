const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { spawn } = require('node:child_process');
const { RENDER, shareGate, writeGate, render, pageData } = require('./helpers');

const TEMPLATE = path.join(path.dirname(RENDER), 'template.html');

test('the template has a hidden Share button and no blocking confirm on reset', () => {
  const html = fs.readFileSync(TEMPLATE, 'utf8');
  assert.match(html, /<button class="btn wide" id="share" type="button" hidden>Share<\/button>/);
  assert.doesNotMatch(html, /confirm\('Clear all decisions/);
  assert.match(html, /share\.hidden = data\.kind !== 'review';/);
  assert.doesNotMatch(html, /share\.hidden = false;/);
  assert.match(html, /data\.mode === 'share'/);
  assert.match(html, /Share this page/);
  assert.match(html, /shareBlock\(output\(\), /);
  assert.match(html, /shareChoices\(data\.channels\)/);
  assert.doesNotMatch(html, /post\(output\(\)\.replace\(\/\^CEO DECISIONS\/, 'CEO SHARE'\)/);
  assert.match(html, /JSON\.parse\(JSON\.stringify\(data\.preset \|\| \{\}\)\)/);
  assert.match(html, /Pre-filled by the reviewer: /);
  assert.match(html, /state = JSON\.parse\(JSON\.stringify\(data\.preset \|\| \{\}\)\);\s*items\.forEach\(function \(it\) \{ cards\[it\.id\]\.note\.value = \(state\[it\.id\] && state\[it\.id\]\.note\) \|\| ''; \}\);/);
  assert.match(html, /var p = data\.preset\[id\]; if \(!p \|\| typeof p !== 'object'\) return;/);
  assert.match(html, /p\.choice !== defaultOf\(id\)/);
  assert.doesNotMatch(html, /Confirm reset/);
  assert.match(html, /recAll'\)\.disabled = /);
  assert.match(html, /'Every card already has a choice'/);
  assert.match(html, /' card' \+ \(n === 1 \? '' : 's'\) \+ ' set to the recommended option\.'/);
  assert.match(html, /'No undecided card has a recommended option\.'/);
  assert.match(html, /\.btn:disabled \{/);
  assert.doesNotMatch(html, /Claude Code/);
});

function post(url, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, { method: 'POST', headers: { 'Content-Type': 'text/plain' } }, res => {
      let text = ''; res.on('data', c => { text += c; }); res.on('end', () => resolve({ status: res.statusCode, text }));
    });
    req.on('error', reject);
    req.end(body);
  });
}

function serveGate(t) {
  const file = writeGate(shareGate());
  const child = spawn(process.execPath, [RENDER, file, '--serve', '--no-open'], { stdio: ['ignore', 'pipe', 'pipe'] });
  t.after(() => { if (child.exitCode === null) child.kill(); });
  let out = '';
  child.stdout.on('data', c => { out += c; });
  const url = new Promise((resolve, reject) => {
    child.stdout.on('data', () => { const m = out.match(/serving (http:\/\/\S+)/); if (m) resolve(m[1]); });
    child.on('close', code => reject(new Error('server exited early: ' + code)));
  });
  const closed = new Promise(resolve => child.on('close', resolve));
  return { file, url, closed, out: () => out };
}

test('the server saves a CEO SHARE block next to the gate, prints it and exits', async t => {
  const s = serveGate(t);
  const body = 'CEO SHARE — Gate\nS1 = approve | note: ask Ana';
  const res = await post((await s.url) + 'decisions', body);
  assert.strictEqual(res.status, 200);
  assert.strictEqual(await s.closed, 0);
  const shareFile = s.file.replace(/\.ceo\.json$/, '.share.txt');
  assert.strictEqual(fs.readFileSync(shareFile, 'utf8'), body + '\n');
  assert.ok(s.out().includes('share requested, choices saved to ' + shareFile + '\n\n' + body));
  assert.strictEqual(fs.existsSync(s.file.replace(/\.ceo\.json$/, '.decisions.txt')), false);
});

test('the server still rejects a body that is neither block', async t => {
  const s = serveGate(t);
  const res = await post((await s.url) + 'decisions', 'hello');
  assert.strictEqual(res.status, 400);
});

test('--channels reaches the served page without changing its _rev', async t => {
  const channels = { review: { label: 'MR !12 (GitLab)' }, link: 'No Artifact tool in this session' };
  const file = writeGate(shareGate());
  const plain = pageData(fs.readFileSync(render(file).stdout.trim().split('\n')[0], 'utf8'));
  const child = spawn(process.execPath, [RENDER, file, '--serve', '--no-open', '--channels=' + JSON.stringify(channels)], { stdio: ['ignore', 'pipe', 'pipe'] });
  t.after(() => { if (child.exitCode === null) child.kill(); });
  let out = '';
  const url = await new Promise((resolve, reject) => {
    child.stdout.on('data', c => { out += c; const m = out.match(/serving (http:\/\/\S+)/); if (m) resolve(m[1]); });
    child.on('close', code => reject(new Error('server exited early: ' + code)));
  });
  const body = await new Promise((resolve, reject) => {
    http.get(url, res => { let b = ''; res.on('data', c => { b += c; }); res.on('end', () => resolve(b)); }).on('error', reject);
  });
  const served = pageData(body);
  assert.deepStrictEqual(served.channels, channels);
  assert.strictEqual(served._rev, plain._rev);
  assert.strictEqual(plain.channels, undefined);
});

test('the template links needs both ways and flags a chosen item whose needs are not chosen', () => {
  const html = fs.readFileSync(TEMPLATE, 'utf8');
  assert.match(html, /missingNeeds\(it, items, state\)/);
  assert.ok(html.includes(' rely on this'));
  assert.ok(html.includes('Relies on '));
  assert.ok(html.includes("you'll be asked before"));
  assert.ok(html.includes('.chip.gap {'));
});

test('the Share dialog forces the review route when the reader gets a review', () => {
  const html = fs.readFileSync(TEMPLATE, 'utf8');
  assert.match(html, /sel\.as === 'review'/);
  assert.match(html, /sel\.via = 'review'/);
});
