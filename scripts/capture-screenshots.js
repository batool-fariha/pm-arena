#!/usr/bin/env node
/* Regenerates the README screenshots in docs/images:
     hero.png      the home page
     result.png    the result screen after a scripted round
     critique.png  the expanded critique list

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
  console.log(`Wrote hero.png, result.png and critique.png to ${OUT} (score ${info.score}, weakest ${info.weakest}).`);
  await browser.close();
})().catch((e) => { console.error('Capture failed:', e.message); process.exit(1); });
