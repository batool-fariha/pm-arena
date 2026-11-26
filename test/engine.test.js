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

const STRONG_PRICING = 'What is the goal, and who are the customers on this plan? The decision is whether the extra revenue per customer outweighs the customers we lose. First I would segment customers by tenure, usage and annual versus monthly, because willingness to pay and churn risk differ between them. I believe the plan is worth more than today because competitors charge more, so I would validate with a price test on new customers and a survey of existing ones. Metrics: net revenue per customer, with a baseline from current churn and a break-even on churn, and guardrails on downgrades and support contacts. I would rank by revenue impact and effort, and defer a broad change. Roll out in stages, grandfather annual customers, give notice, and name the result that would make us roll back. Next steps this week: pull churn by segment and design the test.';

test('a pricing answer that covers the drivers beats a vague one and drops without them', () => {
  for (let i = 0; i < 20; i++) {
    const c = A.generateCase('pricing');
    assert.equal(c.type, 'pricing');
    assert.match(c.prompt, /raising the .+ plan from \$\d+ to \$\d+/);
    assert.ok(A.driverLabels(c).includes('willingness to pay'));
    const strong = A.scoreAnswer(STRONG_PRICING, c).overall;
    const weak = A.scoreAnswer(WEAK, c).overall;
    assert.ok(strong - weak >= 25, `strong ${strong} vs weak ${weak}`);
  }
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

test('every dimension has a drill with a complete checklist', () => {
  for (const d of A.DIMS) {
    for (const diagnostic of [true, false]) {
      const info = A.drillInfo(d.id, diagnostic);
      assert.ok(info && info.focus, d.id);
      assert.ok(info.checklist.length >= 3, d.id);
      assert.ok(info.checklist.every((x) => typeof x === 'string' && x.length > 5), `${d.id} has an empty checklist item`);
    }
  }
  assert.equal(A.drillInfo('nope'), null);
});

test('hypothesis drill hints exist for every case type', () => {
  for (const t of A.TYPES) assert.ok(A.driverLabels(A.generateCase(t.id)).length >= 5, t.id);
});

const STRONG_BVB = 'What is the goal, and how strategic is this capability? The decision is whether it is a source of advantage or a commodity we should rent. First I would check scale, the total cost of ownership over three years, and lock-in and exit options. I believe a staged path is right: buy now to ship faster, then revisit building at a defined trigger, because speed matters more than control today. I would validate with a pilot and a security review. Metrics: time to live and the business KPI it moves, with a guardrail on latency and quality versus today. I would rank by impact and effort, and say what flips the recommendation. Next steps this week: vendor shortlist and a pilot plan.';
const STRONG_METRICS = 'What is the goal and who is the target user? The decision is full rollout, iterate or stop. First I would define one primary metric, two input metrics and two guardrails, with a baseline from existing behavior and a target lift. I believe the feature raises engagement because it removes a step, so I would validate with an A/B test using a holdout control group, a sample size from the minimum detectable effect, and a four week duration. Guardrails: cannibalization of existing revenue screens and support contacts must not get worse. I would rank metrics by impact and set the threshold that triggers go, iterate or stop. Next steps this week: instrument the events and size the experiment.';

test('launch, build-vs-buy and metrics cases vary their facts, and a reasonable answer scores well on every variant', () => {
  const answers = { launch: STRONG_LAUNCH, buildvsbuy: STRONG_BVB, metrics: STRONG_METRICS };
  for (const [type, strong] of Object.entries(answers)) {
    const variants = new Set();
    for (let i = 0; i < 200; i++) {
      const c = A.generateCase(type);
      assert.equal(c.facts.length, 3, `${type} has exactly 3 facts`);
      assert.equal(new Set(c.facts).size, 3, `${type} facts are distinct`);
      variants.add(c.facts.join('|'));
      const s = A.scoreAnswer(strong, c).overall;
      const w = A.scoreAnswer(WEAK, c).overall;
      assert.ok(s >= 55, `${type}: strong answer scored ${s}`);
      assert.ok(s - w >= 25, `${type}: strong ${s} vs weak ${w}`);
    }
    assert.equal(variants.size, 3, `${type} should have three fact sets`);
  }
});

const OVERNIGHT_ANSWER = 'When exactly did it start, and did the definition or tracking change? Is it on all platforms? The goal is to find out whether the drop is real before we fix anything. First I would check the data: a step-change this big on one day looks like a measurement problem. I would segment retention by app version, platform and country, and start with old versus new release users. I believe the analytics SDK upgrade changed how returning sessions are counted, because revenue and support are flat. I would test it by comparing raw server logs with the dashboard. Metrics: week-1 retention rebuilt from server logs against the baseline, with revenue as a guardrail. I would rank checks by cost and likelihood and check tracking first. Next steps today: pull server-side retention and tell the CEO by tomorrow.';

test('the overnight retention case appears, rebuilds, and rewards checking the data first', () => {
  let seen = 0;
  for (let i = 0; i < 200 && seen < 10; i++) {
    const c = A.generateCase('retention');
    if (c.variant !== 'overnight') continue;
    seen++;
    assert.equal(c.facts.length, 3);
    assert.match(c.prompt, /in a single day/);
    const r = A.rebuildCase({ type: c.type, title: c.title, prompt: c.prompt });
    assert.equal(r.topic, c.topic);
    const strong = A.scoreAnswer(OVERNIGHT_ANSWER, c).overall;
    const weak = A.scoreAnswer(WEAK, c).overall;
    assert.ok(strong >= 60 && strong <= 100, `strong ${strong}`);
    assert.ok(strong - weak >= 25, `strong ${strong} vs weak ${weak}`);
    assert.equal(A.scoreAnswer(OVERNIGHT_ANSWER, r).overall, strong, 'server re-score matches');
  }
  assert.equal(seen, 10);
});

const round =(scores) => ({ dims: Object.fromEntries(A.DIMS.map((d) => [d.id, scores[d.id] ?? 85])) });

test('adaptive practice waits for enough rounds', () => {
  assert.equal(A.adaptiveFocus([]), null);
  assert.equal(A.adaptiveFocus([round({ segmentation: 20 }), round({ segmentation: 20 })]), null);
});

test('adaptive practice targets the dimension with the largest weighted shortfall', () => {
  const h = [round({ segmentation: 30, clarify: 40 }), round({ segmentation: 40, clarify: 40 }), round({ segmentation: 35, clarify: 40 })];
  const f = A.adaptiveFocus(h);
  assert.equal(f.dim, 'segmentation');
  assert.equal(f.avg, 35);
  assert.equal(f.rounds, 3);
  assert.ok(f.types.length > 0);
});

test('adaptive practice backs off once the weak dimension improves', () => {
  assert.equal(A.adaptiveFocus([round({}), round({}), round({})]), null, 'nothing below target');
  const recovering = [round({ metrics: 20 }), round({ metrics: 20 }), round({ metrics: 30 }), round({ metrics: 75 }), round({ metrics: 80 })];
  assert.equal(A.adaptiveFocus(recovering), null, 'last two rounds at or above target');
});

test('adaptive cases lean towards matching types about two rounds in three', () => {
  const h = [round({ prioritization: 20 }), round({ prioritization: 25 }), round({ prioritization: 30 })];
  let leaned = 0;
  for (let i = 0; i < 600; i++) {
    const { c, focus } = A.adaptiveCase(h);
    assert.ok(c && c.type);
    if (focus) { leaned++; assert.ok(['prioritize', 'buildvsbuy'].includes(c.type), c.type); }
  }
  assert.ok(leaned > 330 && leaned < 470, `leaned ${leaned}/600`);
  const off = A.adaptiveCase([round({}), round({}), round({})], () => 0);
  assert.equal(off.focus, null);
});
