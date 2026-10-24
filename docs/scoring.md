# Scoring rubric

PM Arena scores an answer with transparent heuristics in [`engine.js`](../engine.js). It reads the text of your answer and looks for signals that good PM answers tend to contain. It does **not** understand whether your reasoning is sound.

> Scores are heuristic assessments, not hiring assessments.

## Overall score

Seven dimensions are each scored 0 to 100, then combined:

```
overall = round( sum( dimension_score x weight / 100 ) )
```

| Dimension | Id | Weight |
|---|---|---|
| Problem framing | `framing` | 15 |
| Clarifying questions | `clarify` | 10 |
| Segmentation | `segmentation` | 15 |
| Hypothesis quality | `hypothesis` | 20 |
| Metrics | `metrics` | 15 |
| Prioritization | `prioritization` | 15 |
| Communication | `communication` | 10 |

Bands shown next to the score: 90 and up "Very strong signals", 75 "Strong structure", 60 "Solid, with gaps", 40 "Developing", below 40 "Early draft".

## Biggest weakness

The dimension with the largest weighted shortfall:

```
shortfall = weight x (100 - score)
```

Weighting means a missing hypothesis (weight 20) outranks an equally missing summary line (weight 10).

## Dimensions

Percentages are the share of that dimension's score. Matching is case-insensitive pattern matching on the answer text.

### Problem framing
Share of five signals found, with four of five earning full marks. Signals: defines the problem or goal; states why it matters; states scope or assumptions; announces an approach or structure; and either **checks the data is real** (diagnostic cases: retention, conversion) or **frames the decision and options** (all other cases).

### Clarifying questions
- 35%: number of asking sentences (a question mark, a sentence starting with an interrogative such as what, when, how, or phrases like "I would ask", "need to know", "clarify"), with four earning full marks.
- 50%: how many of the **case-specific** question topics your questions touch (timing, scope, metric definition, recent changes, baseline, goal, target user, strategy, scale, alternatives, success criteria, regulatory limits), with three earning full marks.
- 15%: you asked early, within the first 35% of the answer (at least the first 200 characters).

Only the asking sentences are matched against the topics, so mentioning "regulation" in a statement does not count as asking about it.

### Segmentation
- 75%: how many different cuts you name, with four earning full marks: platform or device, geography, new vs existing or cohort, acquisition channel, persona or user type, plan or value tier, behavior or engagement.
- 25%: you said which segment to look at or start with.

### Hypothesis quality
- 15%: an explicit hypothesis or belief ("I believe", "my guess", "likely").
- 15%: causal reasoning ("because", "due to").
- 25%: a way to test it (validate, experiment, A/B, compare, holdout).
- 30%: **breadth of case-specific causes** considered, with three earning full marks. The categories depend on the case type (see below).
- 15%: what you would expect to see if it is true or false.

### Metrics
- 25%: at least three distinct named metrics (retention, conversion, activation, CAC, and so on).
- 25%: a guardrail or counter-metric.
- 15%: a leading vs lagging distinction.
- 15%: at least two numbers with units.
- 20%: a baseline, target, threshold or lift.

### Prioritization
- 30%: at least two explicit criteria (impact, effort, confidence, reach, RICE, risk).
- 20%: a ranked order or sequence.
- 25%: something explicitly cut or deferred, or a trade-off named.
- 10%: dependencies or constraints.
- 15%: a decisive recommendation ("I would", "I recommend").

### Communication
- 20%: length. Under 60 words scores nothing here, then it ramps up and reaches full marks at 120 words. Past 700 words it eases off, down to a floor of 60% of this share.
- 25%: visible structure (bullets, numbering, labelled sections) or spoken signposts such as first, then, finally.
- 20%: a summary or recommendation.
- 15%: concrete next steps, owners or a timeline.
- 10%: average sentence length of 28 words or fewer.
- 10%: few filler words ("really", "just", "stuff", "maybe").

## Case-specific hypothesis categories

The "breadth of causes" signal uses the categories for the case type.

| Case type | Categories |
|---|---|
| Retention drop, conversion fall | recent release, onboarding, acquisition mix, seasonality, competitor, measurement bug, performance regression, pricing change, checkout friction, notifications |
| Build vs buy | differentiation, total cost, time to market, lock-in and exit, integration and security, hybrid path |
| New market launch | regulation, localization, local competition, market size, go-to-market, unit economics, operations |
| Prioritize five features | impact, effort, confidence, reach, strategic fit, dependencies, learning and risk |
| Design for a user | pain points, jobs, journey, MVP, constraints, alternatives, validation |
| Define success metrics | primary metric, input metrics, guardrails, baseline and target, experiment design, instrumentation, side effects |

## Guards

Guards multiply every dimension score, so they stack.

| Condition | Effect |
|---|---|
| Under 30 words | x 0.3, and the round does not count for streaks, history or the leaderboard |
| 30 to 59 words | x 0.6 |
| Over 40 words with fewer than 40% unique words | x 0.6 (repetition) |
| 30 or more words and none of the case's key terms appear | x 0.5 (off topic) |

The off-topic check uses terms taken from the case itself, such as the country in a launch case or the feature names in a prioritization case, so an answer written for a different case is penalised.

## Limits

- It matches patterns. A coherent answer phrased unusually can score low, and a keyword-stuffed one can score high.
- It cannot tell whether your hypothesis is correct or your numbers are realistic.
- Spoken answers have no punctuation or line breaks, so dictation adds basic punctuation and the scorer accepts spoken signposts, but dictated answers can still read as less structured.

## Changing the rubric

See [CONTRIBUTING.md](../CONTRIBUTING.md). Add a test answer that shows the behavior you are changing.
