# Contributing

Thanks for helping. PM Arena is small on purpose: plain HTML and JavaScript, no build step.

## Setup

```bash
git clone https://github.com/batool-fariha/pm-arena.git
cd pm-arena
npm install
npm test
python3 -m http.server 8000
```

See [docs/deploying.md](docs/deploying.md) to run the API too.

## Ground rules

- **Scores stay honest.** Anything user-facing that describes scoring must keep saying heuristic, not a hiring assessment. No claims of expert or employer credentials.
- **One source of truth.** The scoring logic lives only in `engine.js`, and the server re-scores with the same file. Do not duplicate it.
- **Privacy first.** Nothing leaves the device unless the user presses a button for it, and the docs table in the README must stay accurate. If you add a network call, update it.
- **Keep it dependency-light.** The only runtime dependency is `@vercel/blob`, used by the API.

## Adding a case type

1. In `engine.js`, add an entry to `TYPES` and a generator in `GEN` that returns `type`, `diagnostic`, `drivers`, `clarify`, `title`, `prompt`, `facts` and a `sample` object with one fix per dimension.
2. Add a driver list to `DRIVERS` (the case-specific causes used by Hypothesis quality) if the existing ones do not fit.
3. Add a topic pattern for the case in `topicFor`, using terms from the case itself, so off-topic answers are caught.
4. Add an icon for it in `TICON` in `index.html`.
5. Run `npm test`. The suite checks that every type generates, rebuilds identically on the server, and scores.
6. Update the case list in `README.md` and `docs/scoring.md`.

## Changing a scoring signal

1. Edit the dimension in `scoreAnswer`.
2. Add a test in `test/engine.test.js` with an answer that shows the change in behavior.
3. Run `npm test`. The calibration suite removes each dimension's block from a strong answer and requires that dimension to drop, so a signal that is too easy to satisfy will fail it. Check the effect on a strong and a weak sample answer, so scores do not drift up for everyone.
4. Update `docs/scoring.md`.

## Pull requests

- Keep each pull request focused.
- Describe what changed and why, and say how you tested it (for example the answer you scored).
- `npm test` must pass. CI runs it for you. It also checks that every link and heading anchor in the Markdown files resolves.
- Add a line to the top of [CHANGELOG.md](CHANGELOG.md) for anything a user would notice, and update the docs that describe the behavior.
- UI changes: check phone width and keyboard use, and respect `prefers-reduced-motion`.

## Updating the screenshots

`docs/images/` holds four captures of the live site (`hero.png`, `result.png`, `critique.png`, `mobile.png`), used by the README and the user guide. Regenerate them after a visual change with the script, which plays a scripted round and never posts to the leaderboard:

```bash
npm i --no-save playwright-core
CHROME_PATH=/path/to/chromium-or-chrome-headless-shell node scripts/capture-screenshots.js
```

Playwright's own Chromium works (`npx playwright install chromium` downloads it). Set `URL` to capture a local or preview deployment instead of the live site. Look at the three files before committing: the whole scoring card and the ticker should be in frame, the result should show a mid-range score with the biggest weakness expanded, and the phone image should show an on-topic result (a warning about the case means the scripted answer no longer matches it).

## Reporting bugs

Open an issue with the case type, your answer (if relevant), what you expected and what you saw. For security problems see [SECURITY.md](SECURITY.md) instead.
