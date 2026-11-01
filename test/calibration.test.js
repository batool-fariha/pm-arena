/* Calibration: guards against silent drift in the scoring heuristics.
   A strong answer is assembled from one block per dimension. Removing a block
   must lower that dimension's score by a clear margin, and complete answers
   must land in sensible bands. Cases are fixed so results are deterministic. */
const test = require('node:test');
const assert = require('node:assert/strict');
const A = require('../engine.js');

const CASES = {
  retention: A.rebuildCase({ type: 'retention', title: 'Day-30 retention is falling', prompt: 'Day-30 retention for a B2B project-management SaaS fell from 51% to 44% over the last 3 weeks. Leadership wants a diagnosis and a plan.' }),
  launch: A.rebuildCase({ type: 'launch', title: 'Launch in Poland', prompt: 'Your company runs a language-learning app and is profitable in the US. The CEO wants to launch in Poland within 3 quarters. You have a cross-functional team of 7. How do you approach it, and would you go?' }),
};

const BLOCKS = {
  retention: {
    framing: 'The goal is to find out whether this drop is real and what to do about it within two weeks. I will assume the tracking is correct until I verify the data. My approach is to check the data, find where it sits, and test causes. This matters because retention drives revenue and is a strategic risk.',
    clarify: 'Questions: When exactly did it start, and was it sudden or gradual? Does it hit all platforms or only one? How is retention defined, and did tracking change? What shipped or launched around then?',
    segmentation: 'Segments: I would cut it by signup cohort, platform, paid versus organic channel, and new versus returning users, and focus on the paid cohorts first.',
    hypothesis: 'Hypotheses: I believe the paid campaign brought lower-intent users, because volume rose while cohort retention fell. I would validate by comparing retention within each channel, and if true it should stay flat. A second possibility is that the redesign hurt onboarding activation, which I would check with a holdout. A third is a tracking bug or seasonality.',
    metrics: 'Metrics: the key metric is day-30 retention by weekly cohort, baseline 51%, target 48% recovery. Guardrails: new-user volume and support tickets must not get worse. Leading metrics are week-one sessions and activation rate.',
    prioritization: 'Priorities: I would rank the causes by likelihood and effort, and start with the channel cut because it is cheapest. Then I would run the redesign test. I would not build new features yet and would defer notification work.',
    communication: 'Recommendation in short: confirm the cause within a week, then act. Next steps this week: analytics runs the cohort cuts in two days, with a decision on Friday.',
  },
  launch: {
    framing: 'The decision is go, no-go or pilot, and the goal is to decide within the quarter. I assume the team of seven is fixed and the budget is limited. My approach is to size the market, check regulation and test with a pilot. It matters for revenue and our strategic position.',
    clarify: 'Questions: What is the goal and the deadline? Who is the target customer there? Are there regulatory or data constraints? What are local competitors doing today?',
    segmentation: 'Segments: I would start with one beachhead city and the persona of existing users already in Poland, then expand by channel, such as partnerships versus paid, and by plan tier.',
    hypothesis: 'Hypotheses: I believe local payment methods are the biggest risk because cards are less common, so I would validate with a six week pilot. If true, conversion on cards should be low versus local methods. Other risks are regulation, localization of language, a well-funded local competitor, and unit economics.',
    metrics: 'Metrics: pilot success is activation rate, CAC payback and retention versus the US baseline of 40%, with a target within 10%. Guardrail: support cost per user must not get worse. Leading metric: first-week activation.',
    prioritization: 'Priorities: I would rank by impact and effort, start with payments and licensing, then localization. I would not do paid marketing yet and would defer it until payback is proven.',
    communication: 'Recommendation in short: a one-city pilot. Next steps this week: legal review and a pilot plan with owners and a six-week timeline.',
  },
};

const ORDER = ['framing', 'clarify', 'segmentation', 'hypothesis', 'metrics', 'prioritization', 'communication'];
const build = (type, skip) => ORDER.filter((d) => d !== skip).map((d) => BLOCKS[type][d]).join('\n');
const dimScore = (r, id) => r.dims.find((d) => d.id === id).score;

for (const type of Object.keys(CASES)) {
  const c = CASES[type];
  const full = A.scoreAnswer(build(type), c);

  test(`${type}: a complete answer lands in the strong band`, () => {
    assert.ok(full.overall >= 80, `overall ${full.overall}`);
    assert.equal(full.flags.length, 0);
  });

  for (const d of ORDER) {
    test(`${type}: removing the ${d} block clearly lowers ${d}`, () => {
      const without = A.scoreAnswer(build(type, d), c);
      const drop = dimScore(full, d) - dimScore(without, d);
      assert.ok(drop >= 20, `${d} dropped only ${drop} (${dimScore(full, d)} -> ${dimScore(without, d)})`);
      assert.ok(without.overall < full.overall, 'overall should fall');
    });
  }

  test(`${type}: a partial answer sits between vague and complete`, () => {
    const partial = A.scoreAnswer([BLOCKS[type].framing, BLOCKS[type].segmentation, BLOCKS[type].hypothesis].join('\n'), c);
    const vague = A.scoreAnswer('I think we should look into it and fix the problems and make users happier with better features and maybe improve things overall for the team and the product going forward.', c);
    assert.ok(vague.overall <= 30, `vague ${vague.overall}`);
    assert.ok(partial.overall > vague.overall + 15, `partial ${partial.overall} vs vague ${vague.overall}`);
    assert.ok(partial.overall < full.overall - 15, `partial ${partial.overall} vs full ${full.overall}`);
  });
}

test('biggest weakness points at the dimension that was removed, for the heaviest dimensions', () => {
  for (const type of Object.keys(CASES)) {
    for (const d of ['hypothesis', 'metrics']) {
      const r = A.scoreAnswer(build(type, d), CASES[type]);
      assert.equal(r.weakest.id, d, `${type}: weakest was ${r.weakest.id}`);
    }
  }
});
