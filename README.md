# PM Arena

**Live:** https://pm-arena-phi.vercel.app

Practice product management interview cases against the clock, by voice or text. You get a random case, a countdown, and a structured critique across seven dimensions that names the **single biggest weakness** in your answer.

Plain HTML, CSS and JavaScript. No framework, no build step, no backend, no account, no API keys.

> **Scores are heuristic assessments of how a written answer matches common PM-answer patterns (structure, keywords, specificity). They are not hiring assessments and do not predict interview outcomes.**

## Problem

PM interview practice is mostly solo and unmeasured. People rehearse cases in their head or with a friend, get vague feedback ("be more structured"), and rarely learn which specific habit costs them the most: skipping clarifying questions, never naming a guardrail metric, listing options without ranking them.

## Target user

Aspiring and working product managers preparing for case-style interviews, who want fast repetition and a concrete next thing to fix, not a verdict.

## Product hypothesis

> If a candidate gets a specific critique in seconds after every timed answer, and sees only one weakness to fix at a time, they will practise more often and improve the weakest dimension first.

Success looks like: repeat rounds per visitor, rising scores on the weakest dimension over time, and daily streaks.

## How a round works

1. **Draw a case.** Six types, generated with random parameters: retention drop, conversion fall, build vs buy, new market launch, prioritize five features, design for a specific user.
2. **Answer on the clock** (5, 10 or 15 minutes), typed or dictated. Section starters (Questions, Segments, Hypothesis, Metrics, Recommend) drop a scaffold into the answer box. Time expiry auto-submits.
3. **Get graded.** Seven scores, a critique per dimension, the biggest weakness, and a shareable result.

## Scoring model

Seven dimensions, each 0-100, combined by weight (weights sum to 100):

| Dimension | Weight | Dimension | Weight |
|---|---|---|---|
| Hypothesis quality | 20 | Metrics | 15 |
| Problem framing | 15 | Prioritization | 15 |
| Segmentation | 15 | Clarifying questions | 10 |
| | | Communication | 10 |

`overall = Σ(score × weight / 100)`. Each dimension is a small rubric of signals detected in the text, for example Metrics looks for named metrics, a guardrail, a leading vs lagging distinction, numbers, and a baseline or target. The scorer is in [`engine.js`](engine.js).

The **biggest weakness** is the dimension with the largest weighted shortfall, `weight × (100 − score)`, so a missing hypothesis outranks a missing summary line.

### Guards

- **Short answers.** Under 30 words: heavily reduced and not counted for streaks or the leaderboard. Under 60 words: reduced.
- **Repetition.** Highly repetitive text is penalised.
- **Relevance.** An answer that contains none of the case's key terms (the country, the capability, the persona, and so on) is halved.
- **Transparency.** Every dimension shows what was detected, what was missing, and a fix written for that case.

### Known limits

This is keyword and structure matching. It cannot judge whether an idea is actually good, and keyword-stuffed answers can still score well. Use the critique, not the number.

## Features

- **Voice dictation** through the browser's built-in speech recognition (Chrome, Edge, Safari). In Chrome the audio is processed by Google's servers; nothing is sent to this app. Basic punctuation is added to dictated text, and you can edit it before submitting.
- **Share:** copy text, native share sheet, or download a score card image.
- **Daily streak** and a **local leaderboard**. Both live in your browser's `localStorage` only; there is no shared leaderboard.
- Accessible controls, `prefers-reduced-motion` respected, works down to phone width.

## Run it locally

```bash
git clone https://github.com/batool-fariha/pm-arena.git
cd pm-arena
python3 -m http.server 8000
```

Open http://localhost:8000. Use `localhost` or https, since the microphone needs a secure context.

## Project structure

- `index.html`: markup, styles and the app (home, case, result views)
- `engine.js`: case generator and heuristic scoring engine (works in the browser and in Node)

## Contributing

Issues and pull requests are welcome. Good first areas: new case types, better scoring signals (with a test answer showing the change), and a shared leaderboard backend.

## License

[MIT](LICENSE)

Designed and built by [Fariha Batool](https://www.linkedin.com/in/fariha-batool/).
