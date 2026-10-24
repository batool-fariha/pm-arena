# Security

## Reporting a vulnerability

Please do not open a public issue for a security problem. Use GitHub's private reporting: open the **Security** tab of this repository and choose **Report a vulnerability**.

Include what you found, steps to reproduce, and the impact you expect. You will get a reply as soon as the maintainer can manage; this is a small hobby project, so there is no guaranteed response time.

## Scope

In scope:

- The two serverless functions, `api/scores.js` and `api/grade.js`
- Anything that lets a client post a score that was not computed from its answer
- Anything that exposes stored data, API keys or other users' information
- Cross-site scripting through names or answers

Known and accepted:

- The scoring is heuristic, so an answer can be written to score well. The leaderboard is for practice.
- Anyone can use the AI coach up to the daily cap, which is why the cap exists.

## Handling secrets

API keys belong in Vercel environment variables only. Do not commit `.env*` files. If you believe a key was exposed, revoke it in the provider's console first, then report it.
