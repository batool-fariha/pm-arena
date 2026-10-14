const test = require('node:test');
const assert = require('node:assert/strict');
const A = require('../engine.js');
const { validate } = require('../api/grade.js');

const STRONG_LAUNCH = 'What is the goal and the timeline? Which regulations apply? First I would check the market. Then I would pick a beachhead city and run a pilot. I believe local payments are the biggest risk because cards are rare, so I would validate with a 6 week pilot. Metrics: activation, CAC payback, retention vs the US baseline of 40 percent, with a guardrail on support cost. I would rank by impact and effort and defer marketing spend. Next steps this week: legal review and a pilot plan.';
const WEAK = 'I think the app got worse. We should fix it and make users happier with new features and maybe notifications, and also improve things overall for everyone involved in the product.';

test('weights sum to 100', () => {
  assert.equal(A.DIMS.reduce((a, d) => a + d.weight, 0), 100);
});

test('every case type generates, rebuilds identically, and scores without throwing', () => {
  for (const t of A.TYPES) {
    for (let i = 0; i < 25; i++) {
      const c = A.generateCase(t.id);
      const r = A.rebuildCase({ type: c.type, title: c.title, prompt: c.prompt, list: c.list });
      assert.equal(r.topic, c.topic, `topic parity for ${t.id}`);
      const s = A.scoreAnswer(STRONG_LAUNCH, r);
      assert.ok(s.overall >= 0 && s.overall <= 100);
      assert.equal(s.dims.length, 7);
    }
  }
});

test('empty answer scores zero', () => {
  assert.equal(A.scoreAnswer('', A.generateCase('retention')).overall, 0);
});

test('a structured on-topic answer beats a vague one by a wide margin', () => {
  let better = 0;
  for (let i = 0; i < 20; i++) {
    const c = A.generateCase('launch');
    const strong = A.scoreAnswer(STRONG_LAUNCH, c).overall;
    const weak = A.scoreAnswer(WEAK, c).overall;
    if (strong - weak >= 25) better++;
  }
  assert.equal(better, 20);
});

test('short answers are capped and do not count', () => {
  const r = A.scoreAnswer('First I would ask what the goal is and who the user is?', A.generateCase('retention'));
  assert.equal(r.counts, false);
  assert.ok(r.overall < 20);
});

test('an off-topic answer is penalised', () => {
  let penalised = 0;
  for (let i = 0; i < 20; i++) {
    const c = A.generateCase('launch');
    const retentionAnswer = 'What is the goal and the timeline? First I would check the data. I would segment retention by cohort and platform. I believe the paid campaign brought low-intent users because volume rose, so I would validate by comparing retention per channel. Metrics: D30 retention baseline 45 percent, guardrail volume. I would rank by effort and defer notifications. Next steps this week.';
    if (A.scoreAnswer(retentionAnswer, c).flags.some((f) => /does not appear to address/.test(f))) penalised++;
  }
  assert.equal(penalised, 20);
});

test('biggest weakness is the dimension with the largest weighted shortfall', () => {
  const r = A.scoreAnswer(STRONG_LAUNCH, A.generateCase('launch'));
  const expected = r.dims.slice().sort((a, b) => b.weight * (100 - b.score) - a.weight * (100 - a.score))[0].id;
  assert.equal(r.weakest.id, expected);
});

test('follow-up questions exist for every dimension', () => {
  for (const d of A.DIMS) assert.ok(A.followUps(d.id).length >= 2, d.id);
});

test('rebuildCase rejects unknown types', () => {
  assert.equal(A.rebuildCase({ type: 'nope' }), null);
  assert.equal(A.rebuildCase(null), null);
});

test('AI notes: invented quotes are dropped, bad dimensions rejected, lists capped', () => {
  const answer = 'First I would check the market. Then I would run a pilot.';
  const ok = validate({
    summary: 'x', stronger_sentence: 'y',
    biggest_weakness: { dimension: 'framing', why: 'w', evidence_quote: 'First I would check the market.', fix: 'f' },
    dimension_notes: [{ dimension: 'metrics', note: 'n', quote: 'never said this' }, { dimension: 'metrics', note: 'dup' }, { dimension: 'bogus', note: 'z' }],
    follow_up_questions: ['a', 'b', 'c', 'd'],
  }, answer);
  assert.equal(ok.biggest_weakness.evidence_quote, 'First I would check the market.');
  assert.equal(ok.dimension_notes.length, 1);
  assert.equal(ok.dimension_notes[0].quote, '');
  assert.equal(ok.follow_up_questions.length, 3);
  assert.equal(validate({ biggest_weakness: { dimension: 'nope' } }, answer), null);
  assert.equal(validate(null, answer), null);
});
