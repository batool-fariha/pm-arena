# Privacy

PM Arena is a hobby project with no accounts, no cookies, no advertising and no analytics. It keeps data on your device by default and only sends something when you press a button for it. This page says what, where and for how long.

This is a plain description of what the code does, not legal advice.

## Summary

| Feature | What is sent | To whom | What is kept |
|---|---|---|---|
| Playing, scoring, history, streak, drills | Nothing | n/a | Your browser's `localStorage` only |
| Voice dictation | Your voice audio | Your browser's speech service: Google (Chrome, Edge) or Apple (Safari) | Not by PM Arena |
| Post my score | Your name, answer text, the case | PM Arena's server | Name, score, case type, time. **Not the answer** |
| AI coach notes | Your answer text and the case | PM Arena's server, which forwards it to Anthropic's API | Nothing by PM Arena |
| Loading the page | A normal page request | Vercel (hosting), Google Fonts, unpkg | Standard request logs at those providers |

## On your device

Stored under the key `pmarena.v1` in `localStorage`: your last name and settings, your streak and counters, your top 50 scores, your last 30 scored rounds **including the answers you wrote** (up to 6000 characters each), and your last 50 drill results. It never leaves your browser unless you use one of the features above. Press **Clear history** on the home page to remove the rounds, or clear the site's data in your browser to remove everything.

## On the server

### Shared leaderboard

When you press **Post my score**, the server receives your name, your answer and the case. It re-scores the answer to verify the number, then stores **only** your sanitised name (up to 20 characters), the score, the case type and the time. **The answer is discarded.**

For rate limiting it also keeps a **truncated SHA-256 hash of your IP address** (salted, 16 hex characters, not the address itself) with the time of your last post, for up to 10 minutes.

Entries are kept until they fall out of the stored set: the top 100 scores of all time plus up to 200 from the last 7 days. The leaderboard is public: anyone can read the names and scores.

### AI coach notes

When enabled and requested, your answer and the case are sent to Anthropic's API to generate the notes, and PM Arena does not store them. To enforce a daily limit it keeps, for the current UTC day, a count of requests per truncated hash of your IP address. The counters reset daily. How Anthropic handles API data is governed by Anthropic's own terms and privacy documentation.

## Third parties

| Provider | Role | What they see |
|---|---|---|
| Vercel | Hosting, serverless functions, Blob storage | Request logs (IP address, user agent, path) and stored files |
| Anthropic | AI coach notes, only when you request them | The answer and case text for that request |
| Google Fonts | Delivers the Geist font | A normal request from your browser |
| unpkg | Delivers the Phosphor icon set | A normal request from your browser |
| Browser speech service | Voice dictation, only when you use it | The audio |

## Your choices

- Do not post, and do not request AI notes, and nothing about your answers leaves your device.
- Use a private window or clear site data to remove the local data.
- To have a leaderboard entry removed, contact the maintainer through [LinkedIn](https://www.linkedin.com/in/fariha-batool/) with the name and score. Removal is manual, because entries have no account attached to them.

## Changes

This page changes with the code and its history is in the repository. Material changes are listed in the [changelog](../CHANGELOG.md).
