# PM Arena

**Live:** https://pm-arena-phi.vercel.app

Practice product management interview cases against the clock, by voice or text. You get a random case, a countdown, and a structured critique across seven dimensions that names the **single biggest weakness** in your answer.

Plain HTML, CSS and JavaScript on the front end, one small serverless function for the shared leaderboard. No framework, no build step, no account.

> **Scores are heuristic assessments of how a written answer matches common PM-answer patterns (structure, keywords, specificity). They are not hiring assessments and do not predict interview outcomes.**

## Problem

PM interview practice is mostly solo and unmeasured. People rehearse cases in their head or with a friend, get vague feedback ("be more structured"), and rarely learn which specific habit costs them the most: skipping clarifying questions, never naming a guardrail metric, listing options without ranking them.

## Target user

Aspiring and working product managers preparing for case-style interviews, who want fast repetition and a concrete next thing to fix, not a verdict.

## Product hypothesis

> If a candidate gets a specific critique in seconds after every timed answer, and sees only one weakness to fix at a time, they will practise more often and improve the weakest dimension first.

Success looks like: repeat rounds per visitor, rising scores on the weakest dimension over time, and daily streaks.

## How a round works

1. **Draw a case.** Seven types, generated with random parameters: retention drop, conversion fall, build vs buy, new market launch, prioritize five features, design for a specific user, define success metrics.
2. **Answer on the clock** (5, 10 or 15 minutes), typed or dictated. Section starters (Questions, Segments, Hypothesis, Metrics, Recommend) drop a scaffold into the answer box. Time expiry auto-submits.
3. **Get graded.** Seven scores, a critique per dimension, the biggest weakness, interviewer-style follow-up questions for your weakest areas, and a shareable result.

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
- **Progress and history:** a trend of your recent scores, your average per dimension (with the weakest flagged), and the last rounds with your answers, all stored on your device. Clear it any time.
- **AI coach notes** (optional, needs an API key; see below).
- **Daily streak** and a **device leaderboard** stored in your browser's `localStorage`.
- **Shared leaderboard** (opt-in): after a round you can post your score to a global board with an all-time and a 7-day view. See below.
- Accessible controls, `prefers-reduced-motion` respected, works down to phone width.

## AI coach notes

An optional second opinion. After a round, **Get AI coach notes** asks a Claude model to read the answer and write specific notes: what the answer did, the biggest weakness with a quote from the answer, a note per dimension, and one sentence that would have helped.

- It returns **notes only, no second score**, so the deterministic heuristic score stays the single source of truth for the leaderboard.
- Quotes are **verified against your answer** on the server and dropped if they are not verbatim, so the coach cannot invent things you never said.
- The answer is treated as untrusted data and the model is forced to reply through one structured tool call.
- It is **opt-in per round**. Pressing the button sends your answer and the case to Anthropic's API through `api/grade.js`. Nothing is stored here.
- It is **disabled unless `ANTHROPIC_API_KEY` is set**; the button does not appear otherwise. Optional env vars: `ANTHROPIC_MODEL`, `AI_DAILY_PER_CLIENT` (default 8), `AI_DAILY_GLOBAL` (default 400). Daily caps are counted in the same Blob store.
- Notes are generated and can be wrong. They are not a hiring assessment.

## Shared leaderboard

Posting is opt-in. Nothing is sent unless you press **Post my score**.

- `POST /api/scores` receives your name, your answer text and the case, **re-scores the answer on the server with the same `engine.js`**, and stores only the name, score, case type and timestamp. The score is never taken from the client, so a made-up number cannot be posted.
- Your **answer text is used only for that verification and is not stored**.
- Names are sanitised, answers under 30 words are rejected, and each client is limited to one post every 20 seconds.
- `GET /api/scores` returns the top entries (all time and last 7 days).
- Storage is a single JSON file in a private [Vercel Blob](https://vercel.com/docs/vercel-blob) store, updated with ETag-based optimistic concurrency.

This is a practice leaderboard, not a competitive one: scoring is heuristic, so a determined person can still keyword-stuff an answer to score well.

## Run it locally

The front end needs no build. For the static page only:

```bash
git clone https://github.com/batool-fariha/pm-arena.git
cd pm-arena
python3 -m http.server 8000
```

Open http://localhost:8000. Use `localhost` or https, since the microphone needs a secure context. Without the API running, the shared board shows as unavailable and the device board still works.

To run the API too, link the project to a Vercel project that has a Blob store (`vercel link`, `vercel env pull`) and use `vercel dev`.

## Project structure

- `index.html`: markup, styles and the app (home, case, result views)
- `engine.js`: case generator and heuristic scoring engine (works in the browser and in Node)
- `api/scores.js`: shared leaderboard serverless function (verifies scores with `engine.js`)
- `api/grade.js`: optional AI coach notes function
- `test/`: unit tests for the engine and the AI-response validation

## Tests

```bash
npm install
npm test
```

Covers the scoring engine (weights, case generation and server-side rebuild parity, short and off-topic guards, biggest-weakness selection) and the validation applied to AI coach replies. CI runs them on every push.

## Contributing

Issues and pull requests are welcome. Good first areas: new case types, better scoring signals (with a test answer showing the change), and abuse protection for the shared board.

## License

[MIT](LICENSE)

Designed and built by [Fariha Batool](https://www.linkedin.com/in/fariha-batool/).
