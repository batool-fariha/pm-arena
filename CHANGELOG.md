# Changelog

All notable changes are listed here, newest first. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). The project has no tagged releases yet, so entries are grouped by date.

## 2026-11-05

### Added
- Hero, result and phone screenshots in the README, a critique screenshot in the user guide, and `scripts/capture-screenshots.js` to regenerate them.

### Fixed
- Pill-shaped button groups ("Set up a round", "New case") stack at full width on phones instead of wrapping unevenly.
- Phone layout: the hero sliders are full width with a 30px touch area and larger thumbs, instead of a 63px-wide strip.
- Tap targets for the logo, section-starter chips, toggles, footer icons and author link, and the drill hints toggle now meet comfortable sizes.
- Button labels no longer wrap in the call-to-action groups, and the scoring card header no longer wraps awkwardly.
- The drill note now matches the word range of each dimension.

## 2026-11-02

### Added
- **Drill mode:** a 3-minute round on one dimension with a checklist of what the scorer looks for and optional hints. Started from the result screen or the progress section.
- Scoring calibration tests: a strong answer is built from one block per dimension, and removing a block must lower that dimension.
- Device test checklist for real phones and browsers.

### Changed
- Segmentation now rewards explicit segmentation language, not passing mentions.
- Hypothesis signals are read only from statements, not questions, and the causal, testing and expectation signals only from hypothesis-like sentences.
- Prioritization ordering needs explicit sequencing language, and generic words (then, next, later, risk) no longer earn credit.
- A word pattern that matched "bet" inside other words now matches only the word.

Scores on the sample answers moved by 3 points or less.

## 2026-10-24

### Changed
- Documentation restructured: README with a privacy table and configuration table, plus scoring, architecture and deploying docs, CONTRIBUTING and SECURITY.

### Fixed
- `npm test` failed on Node 22 in CI because it ran `node --test` on a directory. It now uses a glob.

## 2026-10-14

### Added
- A seventh case type, **Define success metrics**, and more variety in companies, countries, personas and features.
- **Progress and history:** score trend, average per dimension with the weakest flagged, and recent rounds with your answers, stored on your device.
- Interviewer-style **follow-up questions** for the three weakest dimensions.
- Optional **AI coach notes** (`/api/grade`): structured notes with verified quotes and no second score, disabled unless `ANTHROPIC_API_KEY` is set, with daily limits per client and overall.
- Unit tests for the engine and the AI reply validation, and a GitHub Actions workflow.

## 2026-10-12

### Added
- **Shared leaderboard** (`/api/scores`): opt-in posting, server-side re-scoring, per-client rate limiting, and all-time and 7-day views, stored in a private Vercel Blob file.

### Changed
- Round setup is a titled card with a summary line and a single **Start round** button, and the hero button scrolls to it.

### Fixed
- The case prompt was squeezed into a narrow column because it reused a style name from the slider rows.
- The board refresh after posting bypasses the edge cache.

## 2026-10-11

### Added
- First release: random case generation, timed rounds, voice dictation, seven-dimension heuristic scoring with a critique and a single biggest weakness, a shareable result (text and image), daily streak, a device leaderboard, MIT license and a source link in the footer. Deployed on Vercel.
