/* Documentation checks: every relative link in the Markdown files must point
   at a file that exists, and every #anchor must match a heading. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
  if (e.name === 'node_modules' || e.name.startsWith('.git') && e.name !== '.github') return [];
  const p = path.join(dir, e.name);
  return e.isDirectory() ? walk(p) : p.endsWith('.md') ? [p] : [];
});
const files = walk(ROOT);

const slug = (h) => h.trim().toLowerCase().replace(/[`*_]/g, '').replace(/[^\p{L}\p{N} -]/gu, '').replace(/ /g, '-');
const anchorsOf = (file) => new Set((fs.readFileSync(file, 'utf8').match(/^#{1,6} .+$/gm) || []).map((h) => slug(h.replace(/^#+ /, ''))));

test('there are Markdown files to check', () => assert.ok(files.length >= 8));

for (const file of files) {
  const rel = path.relative(ROOT, file);
  test(`links resolve in ${rel}`, () => {
    const text = fs.readFileSync(file, 'utf8').replace(/```[\s\S]*?```/g, '');
    const links = [...text.matchAll(/\]\(([^)\s]+)\)/g)].map((m) => m[1]).filter((l) => !/^(https?:|mailto:)/.test(l));
    for (const link of links) {
      const [target, hash] = link.split('#');
      const dest = target ? path.resolve(path.dirname(file), target) : file;
      assert.ok(fs.existsSync(dest), `${rel}: broken link ${link}`);
      if (hash && dest.endsWith('.md')) assert.ok(anchorsOf(dest).has(hash), `${rel}: no heading for #${hash} in ${path.relative(ROOT, dest)}`);
    }
  });
}
