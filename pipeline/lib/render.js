// Step 4: render each post as a 1080x1350 Instagram image (HTML/CSS -> PNG).
// Text is set by the browser, never by an image model, so names and numbers are always exact.
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const FONT_DIR = '/usr/share/fonts/opentype/inter';
const fontFace = (file, weight) => fs.existsSync(path.join(FONT_DIR, file))
  ? `@font-face{font-family:LP;font-weight:${weight};src:url("file://${FONT_DIR}/${file}")}` : '';

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function initials(name) {
  return (name || '?').split(/\s+/).filter(w => /^[A-Za-z]/.test(w)).slice(0, 2).map(w => w[0].toUpperCase()).join('');
}

function shell(body, theme) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
${fontFace('InterDisplay-Bold.otf', 800)}${fontFace('InterDisplay-SemiBold.otf', 600)}${fontFace('Inter-Medium.otf', 500)}${fontFace('Inter-Regular.otf', 400)}
*{box-sizing:border-box;margin:0}
html,body{width:1080px;height:1350px}
body{font-family:LP,system-ui,sans-serif;background:${theme.bg};color:${theme.fg};padding:96px 88px;display:flex;flex-direction:column;justify-content:space-between;overflow:hidden;position:relative}
.brand{display:flex;align-items:center;gap:20px;font-size:30px;font-weight:600}
.badge{width:64px;height:64px;border-radius:16px;background:${theme.accent};color:${theme.accentFg};display:grid;place-items:center;font-weight:800;font-size:28px}
.small{font-size:28px;opacity:.75;font-weight:500}
</style></head><body>${body}</body></html>`;
}

function postHtml(post, facts, brand) {
  const brandRow = `<div class="brand"><div class="badge">${esc(initials(facts.name))}</div><div>${esc(facts.name)}<div class="small">${esc(facts.town)}</div></div></div>`;
  if (post.kind === 'review') {
    const theme = { bg: brand.dark, fg: '#F3F7F5', accent: brand.accent, accentFg: brand.dark };
    return shell(`
      <div style="color:${brand.accent};font-size:64px;letter-spacing:10px">${'★'.repeat(post.stars)}</div>
      <div style="font-size:${post.quote.length > 120 ? 66 : 78}px;line-height:1.12;font-weight:600;letter-spacing:-.02em">“${esc(post.quote)}”</div>
      <div style="display:flex;flex-direction:column;gap:40px">
        <div class="small">${esc(post.source)} · ${esc(post.footer)}</div>${brandRow}</div>`, theme);
  }
  if (post.kind === 'tip') {
    const theme = { bg: brand.light, fg: brand.dark, accent: brand.dark, accentFg: brand.light };
    const items = post.items.map(i => `<li style="display:flex;gap:28px;align-items:center"><span style="flex:none;width:44px;height:44px;border:5px solid ${brand.dark};border-radius:10px"></span>${esc(i)}</li>`).join('');
    return shell(`
      <div style="font-size:84px;line-height:1.02;font-weight:800;letter-spacing:-.03em">${esc(post.title)}</div>
      <ul style="list-style:none;padding:0;display:flex;flex-direction:column;gap:34px;font-size:46px;font-weight:600">${items}</ul>
      <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:30px">${brandRow}<div style="font-size:34px;font-weight:800;text-align:right;max-width:420px">${esc(post.cta)}</div></div>`, theme);
  }
  const theme = { bg: brand.accent, fg: brand.dark, accent: brand.dark, accentFg: brand.accent };
  const pills = post.pills.map(p => `<span style="background:${brand.dark};color:${brand.accent};padding:16px 28px;border-radius:99px;font-size:32px;font-weight:600">${esc(p)}</span>`).join('');
  return shell(`
    <div style="position:absolute;right:-120px;top:300px;width:620px;height:620px;border-radius:50%;border:6px dashed ${brand.dark}55;display:grid;place-items:center;font-size:30px;font-weight:600;color:${brand.dark}99;text-align:center;padding:120px">Your team photo<br>goes here</div>
    <div style="font-size:28px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;opacity:.7">What our customers say</div>
    <div style="font-size:118px;line-height:.96;font-weight:800;letter-spacing:-.04em;max-width:640px;position:relative">${esc(post.title)}</div>
    <div style="display:flex;flex-direction:column;gap:44px;position:relative"><div style="display:flex;flex-wrap:wrap;gap:16px;max-width:820px">${pills}</div>${brandRow}</div>`, theme);
}

async function renderPosts(posts, facts, outDir, brand) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
  const files = [];
  for (const [i, post] of posts.entries()) {
    const html = postHtml(post, facts, brand);
    const htmlFile = path.join(outDir, `post-${i + 1}.html`);
    fs.writeFileSync(htmlFile, html);
    await page.goto('file://' + htmlFile);
    await page.evaluate(() => document.fonts.ready);
    const png = path.join(outDir, `post-${i + 1}.png`);
    await page.screenshot({ path: png });
    fs.unlinkSync(htmlFile);
    files.push(png);
  }
  await browser.close();
  return files;
}

module.exports = { renderPosts };
