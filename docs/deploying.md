# Deploying and running the API

The game itself is static. The shared leaderboard and AI coach notes need serverless functions and a small private Blob store, so the simplest host is Vercel.

## Prerequisites

- Node.js 18 or newer
- A Vercel account and the CLI: `npm i -g vercel`
- Optional: an Anthropic API key, for AI coach notes

## Deploy your own copy

```bash
git clone https://github.com/batool-fariha/pm-arena.git
cd pm-arena
npm install
vercel login
vercel link                       # create or choose a project
```

Create a private Blob store and connect it to the project (this sets `BLOB_READ_WRITE_TOKEN`):

```bash
vercel blob create-store pm-arena-board --access private \
  --environment production --environment preview --environment development --yes
```

Deploy:

```bash
vercel --prod
```

The page and the leaderboard work now. Without further setup the AI coach stays off.

## Turn on AI coach notes

Add the key in your own terminal, so it never lands in shell history or chat:

```bash
vercel env add ANTHROPIC_API_KEY production
```

Recommended starting settings, which you can change later without code changes:

```bash
vercel env add ANTHROPIC_MODEL production        # for example claude-haiku-5-5 to start cheap
vercel env add AI_DAILY_GLOBAL production        # for example 100
vercel env add AI_DAILY_PER_CLIENT production    # for example 5
vercel --prod                                    # redeploy to pick up new variables
```

Also set a **monthly spend limit** in your Anthropic console. The daily caps count requests, not money, so the spend limit is the real safety net.

Check it:

```bash
curl https://YOUR-DOMAIN/api/grade      # {"enabled":true}
```

## Run locally

Static only:

```bash
python3 -m http.server 8000
```

With the API:

```bash
vercel link
vercel env pull          # writes .env.local with BLOB_READ_WRITE_TOKEN
vercel dev
```

`vercel dev` talks to your **real** Blob store, so test posts show up on the real leaderboard. To keep tests separate, set `LB_PATH=test-leaderboard.json` in your local environment and delete that blob afterwards.

## Tests and CI

```bash
npm test
```

GitHub Actions runs the same command on every push and pull request (`.github/workflows/test.yml`).

## Things to know

- **Public domains.** Vercel can put deployment-specific URLs behind a login. Share your project's production domain, not a per-deployment URL.
- **Caching.** `GET /api/scores` is cached for about 10 seconds at the edge and the page bypasses the cache right after you post, so other visitors may see a new score up to roughly 40 seconds late.
- **Resetting the board.** Delete the `leaderboard.json` blob. It is recreated on the next post.
- **Usage counters.** `ai-usage.json` resets by UTC day.
