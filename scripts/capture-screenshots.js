#!/usr/bin/env node
/* Regenerates the README screenshots in docs/images:
     hero.png      the home page
     result.png    the result screen after a scripted round
     critique.png  the expanded critique list
     drill.png         a drill in progress (checklist, case, drafted answer)
     drill-result.png  the result of a passed drill
     mobile.png        home, case and result on a phone, side by side

   Usage:
     npm i --no-save playwright-core
     CHROME_PATH=/path/to/chromium-or-headless-shell node scripts/capture-screenshots.js

   Optional: URL (default the live site), OUT_DIR (default docs/images).
   Renders at 1440 CSS px wide and 1.25x, so the files come out about 1800 px
   wide and need no resizing. Nothing is posted to the leaderboard. */
const path = require('node:path');
const { chromium } = require('playwright-core');

const URL = process.env.URL || 'https://pm-arena-phi.vercel.app/';
const OUT = process.env.OUT_DIR || path.join(__dirname, '..', 'docs', 'images');
const EXE = process.env.CHROME_PATH;
if (!EXE) { console.error('Set CHROME_PATH to a Chromium or chrome-headless-shell binary.'); process.exit(1); }

/* A realistic answer with a few gaps, so the result shows a mid score and a clear weakness. */
/* A metrics-focused drill answer for the retention case. */
const DRILL_ANSWER = `The primary metric is D30 retention by weekly signup cohort, with a baseline of 38% and a target of 36% recovery within two weeks. Supporting metrics are week-one sessions, which is a leading indicator, and onboarding activation rate. Guardrails: new-user volume and support tickets must not get worse. I would measure for four weeks against a holdout cohort, because retention is a lagging metric and moves slowly.`;

const ANSWER = `Questions first: when exactly did it start, and was it sudden or gradual? Does it hit all platforms or only one? How is D30 retention defined, and did tracking change?
The goal is to find out whether this drop is real and recover it within two weeks. I will assume tracking is correct until I verify the data.
I think the paid campaign brought in lower-intent users because volume rose while retention fell, so I would compare retention across channels. It could also be the recent redesign hurting onboarding.
I would cut it by signup cohort and platform, starting with the paid cohorts.
The main metric is D30 retention, and I would watch new-user volume as well.
I would rank the causes by effort and start with the channel comparison, then look at the redesign, and defer any new feature work.`;

(async () => {
  const browser = await chromium.launch({ executablePath: EXE });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 1500 }, deviceScaleFactor: 1.25 })).newPage();

  // Hero: the home page, with the whole scoring card and the ticker in frame.
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForSelector('#prows input');
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(OUT, 'hero.png'), clip: { x: 0, y: 0, width: 1440, height: 1400 } });

  // Result: play a scripted round (retention case, so the answer is on topic).
  await page.selectOption('#type', 'retention');
  await page.click('#go');
  await page.waitForSelector('#ans');
  await page.fill('#ans', ANSWER);
  await page.click('#submit');
  await page.waitForSelector('#drillw');
  await page.waitForTimeout(3500);                       // count-up and entry animations
  await page.evaluate(() => document.querySelectorAll('.confetti').forEach((e) => e.remove()));
  await page.screenshot({ path: path.join(OUT, 'result.png'), clip: { x: 0, y: 0, width: 1440, height: 1100 } });

  // Critique: expand the biggest weakness so "what was missing" is visible.
  await page.evaluate(() => {
    const w = document.querySelector('.wkt h2').textContent.trim();
    const d = [...document.querySelectorAll('details.dim')].find((x) => x.querySelector('summary b').textContent.trim() === w);
    if (d) d.open = true;
  });
  await page.waitForTimeout(400);
  const box = await page.locator('section.sec.cols').first().boundingBox();
  await page.screenshot({ path: path.join(OUT, 'critique.png'), fullPage: true, clip: { x: Math.max(0, box.x - 40), y: box.y - 10, width: Math.min(1440, box.width + 80), height: box.height + 50 } });

  const info = await page.evaluate(() => ({ score: document.querySelector('.ring .num b').textContent, weakest: document.querySelector('.wkt h2').textContent }));

  // Drill: start one from the result. A drill draws a random case, so pin Math.random
  // for that one call to get the first case (a retention case) every time.
  await page.evaluate(() => { window.__random = Math.random; Math.random = () => 0; });
  await page.click('#drillw');
  await page.waitForSelector('.drillbar');
  await page.evaluate(() => { Math.random = window.__random; });
  const dim = await page.textContent('.drillbar h3');
  if (dim.trim() !== 'Metrics') console.warn(`Warning: the drill is for "${dim.trim()}" but the scripted answer is about metrics.`);
  await page.waitForTimeout(1500);
  await page.fill('#ans', DRILL_ANSWER);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(OUT, 'drill.png'), clip: { x: 0, y: 0, width: 1440, height: 940 } });
  await page.click('#submit');
  await page.waitForSelector('#again');
  await page.waitForTimeout(3500);
  await page.evaluate(() => { document.querySelectorAll('.confetti').forEach((e) => e.remove()); window.scrollTo(0, 0); });
  const drill = await page.evaluate(() => ({ verdict: document.querySelector('.rleft h2').textContent, score: document.querySelector('.ring .num b').textContent }));
  if (drill.verdict !== 'Drill passed') console.warn(`Warning: the drill result says "${drill.verdict}" (${drill.score}); the scripted answer should pass.`);
  await page.screenshot({ path: path.join(OUT, 'drill-result.png'), clip: { x: 0, y: 0, width: 1440, height: 740 } });

  // Mobile: three phone-sized screens, composed into one image with simple frames.
  const phone = await (await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage();
  await phone.goto(URL, { waitUntil: 'networkidle' });
  await phone.waitForSelector('#prows input');
  await phone.waitForTimeout(2500);
  const home = await phone.screenshot();
  await phone.selectOption('#type', 'retention');
  await phone.click('#go');
  await phone.waitForSelector('#ans');
  await phone.waitForTimeout(1500);
  const caseShot = await phone.screenshot();
  await phone.fill('#ans', ANSWER);
  await phone.click('#submit');
  await phone.waitForSelector('#drillw');
  await phone.waitForTimeout(3500);
  await phone.evaluate(() => { document.querySelectorAll('.confetti').forEach((e) => e.remove()); window.scrollTo(0, 0); });
  const result = await phone.screenshot();

  const uri = (b) => 'data:image/png;base64,' + b.toString('base64');
  const figures = [['Home', home], ['Case', caseShot], ['Result', result]]
    .map(([t, b]) => `<figure><div class="ph"><img src="${uri(b)}"></div><figcaption>${t}</figcaption></figure>`).join('');
  const sheet = await (await browser.newContext({ viewport: { width: 1200, height: 800 }, deviceScaleFactor: 1.5 })).newPage();
  await sheet.setContent(`<!doctype html><meta charset="utf-8"><style>
    body{margin:0;background:#f1f3f6;font:500 15px/1.3 -apple-system,system-ui,sans-serif;color:#575b68}
    .row{display:flex;justify-content:center;gap:56px;padding:56px 40px 44px}
    figure{margin:0;text-align:center}
    .ph{width:300px;border-radius:38px;border:9px solid #0d0e12;overflow:hidden;box-shadow:0 30px 60px -30px rgba(13,14,18,.45);background:#fff}
    .ph img{display:block;width:100%}
    figcaption{margin-top:18px}</style><div class="row">${figures}</div>`);
  await sheet.screenshot({ path: path.join(OUT, 'mobile.png'), fullPage: true });

  console.log(`Wrote hero.png, result.png, critique.png, drill.png, drill-result.png and mobile.png to ${OUT} (score ${info.score}, weakest ${info.weakest}).`);
  await browser.close();
})().catch((e) => { console.error('Capture failed:', e.message); process.exit(1); });
