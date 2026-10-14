const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const vm = require('node:vm');
const { shareGate, writeGate, render, pageData } = require('./helpers');

// Render a share page and load the buildPrompt it ships, so the test runs the real pipeline.
function load(gate) {
  const file = writeGate(gate);
  const r = render(file, '--share');
  assert.strictEqual(r.code, 0, r.stderr);
  const html = fs.readFileSync(file.replace(/\.ceo\.json$/, '.share.html'), 'utf8');
  const src = html.match(/\/\*PROMPT-START\*\/([\s\S]*?)\/\*PROMPT-END\*\//)[1];
  const data = pageData(html);
  const fns = vm.runInNewContext(src + '\n({ buildPrompt: buildPrompt, missingNeeds: missingNeeds });');
  const build = state => fns.buildPrompt(data, data.items, state);
  build.missingNeeds = (it, state) => fns.missingNeeds(it, data.items, state);
  build.items = data.items;
  return build;
}

const section = (text, heading) => {
  const start = text.indexOf('## ' + heading + '\n');
  if (start < 0) return null;
  const next = text.indexOf('\n## ', start + 1);
  return text.slice(start, next < 0 ? undefined : next);
};

test('a full mix of choices lands in the right sections', () => {
  const prompt = load(shareGate())({
    S1: { choice: 'approve' },
    F1: { choice: 'round', note: '  check   old invoices ' },
    T1: { choice: 'Minimalist' },
    'RS-1': { choice: 'revive' }
  });
  assert.ok(prompt.startsWith('# Mission: tidy x.js'));
  assert.match(prompt, /## To do\n\n### S1/);
  const todo = section(prompt, 'To do');
  assert.match(todo, /### S1 — Extract Constant: RATE\n\nDo S1\./);
  assert.doesNotMatch(todo, /### S1[^#]*Choice:/);
  assert.match(todo, /### F1 — Rounding rule\nChoice: Round\n\nUse Math\.round\./);
  assert.ok(todo.indexOf('### S1') < todo.indexOf('### F1'));
  assert.match(section(prompt, 'Left as is'), /- T1 — Split module\? \(Side with Minimalist\)/);
  assert.match(section(prompt, 'Revived — propose first'), /- RS-1 — Strategy per tier \(Rejected because: One use\)/);
  assert.match(section(prompt, 'My notes'), /- F1: check old invoices/);
  assert.strictEqual(section(prompt, 'Undecided — ask me first'), null);
  assert.match(prompt, /## Finally\nRead the repo's agent instructions \(AGENTS\.md, CLAUDE\.md or similar\)/);
});

test('nothing decided: To do says Nothing and every open item is listed', () => {
  const prompt = load(shareGate())({});
  assert.match(section(prompt, 'To do'), /## To do\n\nNothing\./);
  const open = section(prompt, 'Undecided — ask me first');
  ['S1', 'F1', 'T1'].forEach(id => assert.match(open, new RegExp('- ' + id + ' — ')));
  assert.doesNotMatch(open, /RS-1/);
});

test('the option brief wins over the item brief', () => {
  const gate = shareGate(); gate.decisions[1].brief = 'GENERIC';
  const prompt = load(gate)({ F1: { choice: 'keep' } });
  assert.match(section(prompt, 'To do'), /Add a comment\./);
  assert.doesNotMatch(prompt, /GENERIC/);
});

test('a negative choice on an item with a brief does not leak the brief', () => {
  const prompt = load(shareGate())({ S1: { choice: 'decline' } });
  assert.match(section(prompt, 'Left as is'), /- S1 — Extract Constant: RATE \(Decline\)/);
  assert.doesNotMatch(prompt, /Do S1\./);
});

test('a stale choice counts as undecided', () => {
  const prompt = load(shareGate())({ F1: { choice: 'gone' } });
  assert.match(section(prompt, 'Undecided — ask me first'), /- F1 — Rounding rule/);
  assert.doesNotMatch(section(prompt, 'To do'), /F1/);
});

test('a note on an undecided item still reaches the prompt', () => {
  const prompt = load(shareGate())({ T1: { note: 'talk to Ana' } });
  assert.match(section(prompt, 'My notes'), /- T1: talk to Ana/);
});

test('lang fr switches the headers', () => {
  const prompt = load(shareGate({ lang: 'fr' }))({ S1: { choice: 'approve' }, F1: { choice: 'round' } });
  assert.match(prompt, /## À faire\n/);
  assert.match(prompt, /Choix : Round/);
  assert.match(prompt, /## Pour finir\n/);
  assert.match(prompt, /Lis les instructions pour agents du repo \(AGENTS\.md, CLAUDE\.md ou équivalent\)/);
});

function needsGate(needs) {
  const g = shareGate();
  g.decisions[0].needs = needs;
  return load(g);
}

test('needs: a kept item whose prerequisite is not working carries a warning before its brief', () => {
  const warn = 'Relies on F1, which you did not choose: ask me before doing it without it.';
  const build = needsGate(['F1']);
  const declined = section(build({ S1: { choice: 'approve' }, F1: { choice: 'ask' } }), 'To do');
  assert.ok(declined.includes(warn));
  assert.ok(declined.indexOf(warn) < declined.indexOf('Do S1.'));
  assert.doesNotMatch(section(build({ S1: { choice: 'approve' }, F1: { choice: 'round' } }), 'To do'), /Relies on/);
  assert.ok(section(build({ S1: { choice: 'approve' } }), 'To do').includes(warn));
});

test('needs: several missing ids, and French', () => {
  const many = needsGate(['F1', 'T1'])({ S1: { choice: 'approve' } });
  assert.ok(many.includes('Relies on F1, T1, which you did not choose: ask me before doing it without them.'));
  const g = shareGate({ lang: 'fr' });
  g.decisions[0].needs = ['F1'];
  const fr = load(g)({ S1: { choice: 'approve' } });
  assert.ok(fr.includes("Dépend de F1, que tu n'as pas retenu : demande-moi avant de le faire sans."));
});

test('missingNeeds: lists the needs that are not chosen', () => {
  const g = shareGate();
  g.decisions[0].needs = ['F1', 'T1'];
  const build = load(g);
  const s1 = build.items.find(i => i.id === 'S1');
  const miss = state => JSON.parse(JSON.stringify(build.missingNeeds(s1, state)));
  assert.deepStrictEqual(miss({ F1: { choice: 'round' }, T1: { choice: 'Responsibilities' } }), []);
  assert.deepStrictEqual(miss({ F1: { choice: 'ask' }, T1: { choice: 'Responsibilities' } }), ['F1']);
  assert.deepStrictEqual(miss({}), ['F1', 'T1']);
  const rej = JSON.parse(JSON.stringify(build.missingNeeds({ needs: ['RS-1'] }, {})));
  assert.deepStrictEqual(rej, ['RS-1']);
});
