/* Shared leaderboard API.
   GET  /api/scores  -> { all: [...], week: [...] }
   POST /api/scores  -> { ok, score, rank, nick }

   The server recomputes the score from the submitted answer with the same
   engine the browser uses, so a client cannot post an arbitrary number.
   Answers are used for verification only and are never stored. */
const crypto = require('crypto');
const { put, get } = require('@vercel/blob');
const Arena = require('../engine.js');

const PATH = process.env.LB_PATH || 'leaderboard.json';
const WEEK = 7 * 864e5;
const MIN_GAP_MS = 20000;

const empty = () => ({ entries: [], seen: {} });

async function load() {
  const r = await get(PATH, { access: 'private', useCache: false });
  if (!r || r.statusCode !== 200) return { data: empty(), etag: null };
  const data = JSON.parse(await new Response(r.stream).text());
  return { data: { entries: data.entries || [], seen: data.seen || {} }, etag: r.blob.etag };
}

const byScore = (a, b) => b.score - a.score || a.ts - b.ts;

function trim(data, now) {
  const keep = new Set();
  data.entries.slice().sort(byScore).slice(0, 100).forEach((e) => keep.add(e.id));
  data.entries.filter((e) => e.ts > now - WEEK).sort(byScore).slice(0, 200).forEach((e) => keep.add(e.id));
  data.entries = data.entries.filter((e) => keep.has(e.id));
  Object.keys(data.seen).forEach((k) => { if (now - data.seen[k] > 600000) delete data.seen[k]; });
}

const pub = (e) => ({ nick: e.nick, score: e.score, type: e.type, ts: e.ts });

async function save(data, etag) {
  await put(PATH, JSON.stringify(data), {
    access: 'private', contentType: 'application/json', addRandomSuffix: false,
    allowOverwrite: true, ...(etag ? { ifMatch: etag } : {}),
  });
}

function clientKey(req) {
  const ip = String(req.headers['x-forwarded-for'] || (req.socket && req.socket.remoteAddress) || '').split(',')[0].trim();
  return crypto.createHash('sha256').update(ip + '|pm-arena').digest('hex').slice(0, 16);
}

function cleanNick(v) {
  const n = String(v || '').normalize('NFKC').replace(/[^\p{L}\p{N} ._-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 20);
  return n || 'Anonymous';
}

function send(res, code, body, headers) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  Object.entries(headers || {}).forEach(([k, v]) => res.setHeader(k, v));
  res.end(JSON.stringify(body));
}

module.exports = async (req, res) => {
  try {
    if (req.method === 'GET') {
      const { data } = await load();
      const now = Date.now();
      const all = data.entries.slice().sort(byScore).slice(0, 50).map(pub);
      const week = data.entries.filter((e) => e.ts > now - WEEK).sort(byScore).slice(0, 50).map(pub);
      return send(res, 200, { all, week }, { 'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30' });
    }
    if (req.method !== 'POST') return send(res, 405, { error: 'method_not_allowed' }, { Allow: 'GET, POST' });

    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = null; } }
    if (!body || typeof body !== 'object') return send(res, 400, { error: 'bad_request' });

    const answer = String(body.answer || '');
    if (answer.length > 8000) return send(res, 400, { error: 'answer_too_long' });
    const c = Arena.rebuildCase(body.case);
    if (!c) return send(res, 400, { error: 'bad_case' });
    const result = Arena.scoreAnswer(answer, c);
    if (!result.counts) return send(res, 400, { error: 'answer_too_short' });

    const nick = cleanNick(body.nick), key = clientKey(req);
    for (let attempt = 0; attempt < 4; attempt++) {
      const { data, etag } = await load();
      const now = Date.now();
      if (data.seen[key] && now - data.seen[key] < MIN_GAP_MS) return send(res, 429, { error: 'slow_down' });
      data.seen[key] = now;
      const dup = data.entries.find((e) => e.nick === nick && e.score === result.overall && e.type === c.label && now - e.ts < 60000);
      if (!dup) data.entries.push({ id: crypto.randomBytes(4).toString('hex'), nick, score: result.overall, type: c.label, ts: now });
      trim(data, now);
      try { await save(data, etag); } catch (e) {
        if (e && e.name === 'BlobPreconditionFailedError') continue;
        throw e;
      }
      const rank = 1 + data.entries.filter((e) => e.score > result.overall).length;
      return send(res, 200, { ok: true, score: result.overall, rank, nick, ts: (data.entries.find((e) => e.nick === nick && e.score === result.overall && e.type === c.label) || {}).ts });
    }
    return send(res, 503, { error: 'busy' });
  } catch (e) {
    console.error('scores error', e && e.name, e && e.message);
    return send(res, 500, { error: 'unavailable' });
  }
};
