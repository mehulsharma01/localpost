#!/usr/bin/env node
// LocalPost pipeline: Google Maps link -> reviews -> 3 ready Instagram posts.
//
//   node localpost/run.js --url "https://maps.google.com/?cid=..."      (live, needs APIFY_TOKEN)
//   node localpost/run.js --input localpost/fixtures/sample-place.json   (offline)
//
// Options: --out <dir>  --accent "#FFD84D" --dark "#13302B" --light "#E9F0FB"
const fs = require('fs');
const path = require('path');
const { fromApify, fromFile } = require('./lib/fetch');
const { analyze } = require('./lib/analyze');
const { writePosts } = require('./lib/copy');
const { renderPosts } = require('./lib/render');

function args() {
  const a = process.argv.slice(2), o = {};
  for (let i = 0; i < a.length; i++) if (a[i].startsWith('--')) o[a[i].slice(2)] = a[i + 1]?.startsWith('--') ? true : a[++i];
  return o;
}
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

(async () => {
  const opt = args();
  if (!opt.url && !opt.input) {
    console.error('Usage: node localpost/run.js --url <google maps link> | --input <place.json>');
    process.exit(1);
  }
  console.log('1/4  Fetching business and reviews…');
  const place = opt.url ? await fromApify(opt.url) : fromFile(opt.input);

  console.log('2/4  Analysing reviews…');
  const facts = analyze(place);
  if (place.isSample) facts.isSample = true;

  console.log('3/4  Writing posts…');
  const posts = writePosts(facts);

  const outDir = path.resolve(opt.out || path.join(__dirname, 'out', slug(`${facts.name} ${facts.town}`)));
  fs.mkdirSync(outDir, { recursive: true });
  console.log('4/4  Rendering images…');
  const brand = { accent: opt.accent || '#FFD84D', dark: opt.dark || '#13302B', light: opt.light || '#E9F0FB' };
  const files = await renderPosts(posts, facts, outDir, brand);

  fs.writeFileSync(path.join(outDir, 'facts.json'), JSON.stringify(facts, null, 2));
  fs.writeFileSync(path.join(outDir, 'posts.json'), JSON.stringify(posts.map((p, i) => ({ image: path.basename(files[i]), ...p })), null, 2));
  fs.writeFileSync(path.join(outDir, 'captions.txt'), posts.map((p, i) => `POST ${i + 1} (${p.kind})\n${p.caption}\n`).join('\n'));

  console.log(`\nDone: ${facts.name}, ${facts.town}${facts.isSample ? '  [SAMPLE DATA]' : ''}`);
  console.log(`  ${facts.reviewsAnalysed} reviews analysed · top praise: ${facts.themes.slice(0, 3).map(t => `${t.label} (${t.mentions})`).join(', ') || 'none'}`);
  console.log(`  top service: ${facts.services[0]?.key || 'general'}`);
  files.forEach(f => console.log('  ' + path.relative(process.cwd(), f)));
})().catch(e => { console.error('Error:', e.message); process.exit(1); });
