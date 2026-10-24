# PM Arena

[![test](https://github.com/batool-fariha/pm-arena/actions/workflows/test.yml/badge.svg)](https://github.com/batool-fariha/pm-arena/actions/workflows/test.yml)
[![license](https://img.shields.io/github/license/batool-fariha/pm-arena)](LICENSE)

**Live:** https://pm-arena-phi.vercel.app

Practice product management interview cases against the clock, by voice or text. You get a random case, a countdown, and a structured critique across seven dimensions that names the **single biggest weakness** in your answer.

> **Scores are heuristic assessments of how a written answer matches common PM-answer patterns (structure, keywords, specificity). They are not hiring assessments and do not predict interview outcomes.**

## What you get

- **Seven case types:** retention drop, conversion fall, build vs buy, new market launch, prioritize five features, design for a specific user, define success metrics. Cases are generated with random parameters, so rounds differ.
- **A timed round:** 5, 10 or 15 minutes, typed or dictated. Time running out submits what you have.
- **A critique that points at one thing:** seven scores, what the scorer found and missed in each, a fix written for that case, and the biggest weakness.
- **Follow-up questions** an interviewer could ask about your three weakest areas.
- **Progress on your device:** score trend, average per dimension, recent rounds with your answers, daily streak.
- **Optional extras:** a shared leaderboard and AI coach notes (see [Privacy at a glance](#privacy-at-a-glance)).

## How a round works

1. **Set up.** Pick a time limit and a case type (or leave it random), then press **Start round**.
2. **Answer.** Section starters (Questions, Segments, Hypothesis, Metrics, Recommend) drop a scaffold into the answer box.
3. **Review.** Open each dimension to see what was detected and what was missing. Work through the follow-up questions out loud.

## How scoring works

Seven dimensions, each 0 to 100, combined by weight:

| Dimension | Weight | Dimension | Weight |
|---|---|---|---|
| Hypothesis quality | 20 | Metrics | 15 |
| Problem framing | 15 | Prioritization | 15 |
| Segmentation | 15 | Clarifying questions | 10 |
| | | Communication | 10 |

The **biggest weakness** is the dimension with the largest weighted shortfall, `weight x (100 - score)`. Each dimension is a small rubric of signals detected in the text, with guards against very short, repetitive and off-topic answers.

This is keyword and structure matching. It cannot judge whether an idea is actually good, and keyword-stuffed answers can still score well. Use the critique, not the number.

Full rubric: [docs/scoring.md](docs/scoring.md).

## Privacy at a glance

Everything runs in your browser except the features below, which you start yourself.

| Feature | What leaves your device | Where it goes | Stored? |
|---|---|---|---|
| Playing, scoring, history, streak | Nothing | n/a | Only in your browser (`localStorage`) |
| Voice dictation | Audio | Your browser's speech service (Google for Chrome, Apple for Safari) | Not by this app |
| Post my score | Name, answer text, case | This app's server | Name, score, case type, time. **Not the answer.** |
| AI coach notes | Answer text, case | This app's server, then the Anthropic API | Nothing is stored by this app |

Also worth knowing:

- The page loads the Geist font from Google Fonts and the Phosphor icon set from unpkg, so those hosts see a normal page request.
- To rate-limit, the server keeps a **truncated hash of your IP address** (not the address itself): up to 10 minutes for posting, and for the day for AI coach notes.
- Hosting on Vercel keeps standard request logs.

More detail: [docs/architecture.md](docs/architecture.md).

## Quick start

```bash
git clone https://github.com/batool-fariha/pm-arena.git
cd pm-arena
python3 -m http.server 8000
```

Open http://localhost:8000 (use `localhost` or https; the microphone needs a secure context). With only the static server the game works fully, the shared board shows as unavailable, and the AI coach button stays hidden.

To run the API as well, or to deploy your own copy, see [docs/deploying.md](docs/deploying.md).

## Configuration

All optional. Set them as Vercel environment variables.

| Variable | Default | Purpose |
|---|---|---|
| `BLOB_READ_WRITE_TOKEN` | set by Vercel when a Blob store is linked | Storage for the shared leaderboard and AI usage counters |
| `ANTHROPIC_API_KEY` | unset | Enables AI coach notes. Without it the button is hidden |
| `ANTHROPIC_MODEL` | `claude-sonnet-5-5` | Model used for coach notes |
| `AI_DAILY_PER_CLIENT` | `8` | Coach-note requests per visitor per day |
| `AI_DAILY_GLOBAL` | `400` | Coach-note requests per day across all visitors |
| `LB_PATH` | `leaderboard.json` | Blob file name for the leaderboard (useful for tests) |

## Project structure

```
index.html          markup, styles and the app (home, case, result views)
engine.js           case generator and scoring engine (browser and Node)
api/scores.js       shared leaderboard function
api/grade.js        AI coach notes function
test/               unit tests
docs/               scoring, architecture and API, deploying
vercel.json         function settings
```

## Documentation

- [Scoring rubric](docs/scoring.md): every signal, weight, guard and limit
- [Architecture and API](docs/architecture.md): data flow, endpoints, stored data, security model
- [Deploying](docs/deploying.md): run the API locally, deploy your own copy
- [Contributing](CONTRIBUTING.md): adding case types and scoring signals, tests, pull requests
- [Security](SECURITY.md): reporting a problem

## Tests

```bash
npm install
npm test
```

Covers the scoring engine and the validation applied to AI coach replies. CI runs them on every push.

## Ideas, not promises

More case types, spaced repetition of your weakest dimension, and a sign-in so the AI coach can be limited per person instead of per device.

## License

[MIT](LICENSE). Designed and built by [Fariha Batool](https://www.linkedin.com/in/fariha-batool/).
