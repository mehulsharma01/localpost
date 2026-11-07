/**
 * LocalPost API, mounted by server.js.
 *
 *   POST /api/localpost/lead            quiz answers -> { ok, id }
 *   GET  /api/localpost/leads?token=…   all leads as JSON (needs LOCALPOST_ADMIN_TOKEN)
 *   POST /api/localpost/posts           the 3 free posts (JPEG data URLs) for a lead -> { ok, link, emailed }
 *   GET  /s/<token>                     private share page with the 3 posts and captions
 *
 * Email (optional): set RESEND_API_KEY and LOCALPOST_FROM_EMAIL (a sender on a domain verified
 * in Resend, e.g. "LocalPost <posts@adsnora.com>") and each lead gets their posts by email.
 * LOCALPOST_PUBLIC_URL (e.g. https://localpost.adsnora.com) is used for links; defaults to the request host.
 *
 * Storage: one JSON line per lead in $LOCALPOST_DATA_DIR/localpost-leads.jsonl
 * (defaults to ./ingest). On Railway, mount a volume and point the variable at it,
 * or leads are lost on redeploy. Optional LOCALPOST_WEBHOOK_URL gets each lead
 * (without images) as JSON, e.g. a Zapier/Make hook that pings your phone.
 *
 * Zero dependencies.
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DATA_DIR = process.env.LOCALPOST_DATA_DIR || path.join(__dirname, "data");
const FILE = path.join(DATA_DIR, "localpost-leads.jsonl");
const MAX_BODY = 3 * 1024 * 1024; // images are downscaled in the browser first
const hits = new Map(); // ip -> [timestamps], simple abuse guard

function send(res, code, obj) {
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(obj));
}

function readBody(req, max = MAX_BODY) {
  return new Promise((resolve) => {
    let data = "", size = 0, dead = false;
    req.on("data", (c) => {
      size += c.length;
      if (size > max) { dead = true; req.destroy(); return resolve(null); }
      data += c;
    });
    req.on("end", () => { if (dead) return; try { resolve(JSON.parse(data || "{}")); } catch { resolve(null); } });
  });
}

const str = (v, max = 300) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const list = (v, max = 12) => (Array.isArray(v) ? v.map((x) => str(x, 60)).filter(Boolean).slice(0, max) : []);
const image = (v) => (typeof v === "string" && /^data:image\/(png|jpe?g|webp);base64,/.test(v) && v.length < 1.4e6 ? v : "");

function clientIp(req) {
  const fwd = req.headers["x-forwarded-for"];
  return (typeof fwd === "string" && fwd.split(",")[0].trim()) || req.socket.remoteAddress || "unknown";
}

function limited(ip) {
  const now = Date.now(), win = 60 * 60 * 1000;
  const arr = (hits.get(ip) || []).filter((t) => now - t < win);
  arr.push(now); hits.set(ip, arr);
  return arr.length > 10; // 10 quiz submissions per IP per hour
}

async function createLead(req, res) {
  if (limited(clientIp(req))) return send(res, 429, { error: "Too many requests. Try again in an hour." });
  const b = await readBody(req);
  if (!b) return send(res, 400, { error: "That upload was too large. Try a smaller image." });
  if (str(b.website)) return send(res, 200, { ok: true, id: "x" }); // honeypot field, bots fill it

  const lead = {
    id: crypto.randomBytes(6).toString("hex"),
    createdAt: new Date().toISOString(),
    status: "new", // new -> sent_free_set -> paid / lost
    business: { name: str(b.name, 120), town: str(b.town, 80), country: str(b.country, 4), mapsUrl: str(b.mapsUrl, 500) },
    services: list(b.services), mainService: str(b.mainService, 60),
    praise: list(b.praise, 3), review: str(b.review, 600), rating: str(b.rating, 4), reviewCount: str(b.reviewCount, 6),
    brand: { color: str(b.color, 9), style: str(b.style, 30), logo: image(b.logo) },
    face: { type: str(b.faceType, 20), persona: str(b.persona, 40), photo: image(b.photo) },
    contact: { name: str(b.contactName, 80), email: str(b.email, 120), whatsapp: str(b.whatsapp, 30), instagram: str(b.instagram, 60) },
    consent: b.consent === true,
    source: str(b.source, 60),
  };
  if (!lead.business.name || !lead.business.town) return send(res, 400, { error: "Business name and town are required." });
  if (!lead.contact.email && !lead.contact.whatsapp) return send(res, 400, { error: "Add an email or WhatsApp number so we can send your posts." });
  if (!lead.consent) return send(res, 400, { error: "Please tick the box so we can contact you." });

  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.appendFileSync(FILE, JSON.stringify(lead) + "\n");
  } catch (e) {
    console.error("localpost: could not save lead", e.message);
    return send(res, 500, { error: "We couldn't save that. Please try again, or message us on WhatsApp." });
  }

  const hook = process.env.LOCALPOST_WEBHOOK_URL;
  if (hook) {
    const slim = { ...lead, brand: { ...lead.brand, logo: !!lead.brand.logo }, face: { ...lead.face, photo: !!lead.face.photo } };
    fetch(hook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(slim) })
      .catch((e) => console.error("localpost webhook failed:", e.message));
  }
  send(res, 200, { ok: true, id: lead.id });
}

function listLeads(req, res, query) {
  const token = process.env.LOCALPOST_ADMIN_TOKEN;
  const given = query.get("token") || (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  const ok = token && given && given.length === token.length && crypto.timingSafeEqual(Buffer.from(given), Buffer.from(token));
  if (!ok) return send(res, 401, { error: "Set LOCALPOST_ADMIN_TOKEN and pass it as ?token=" });
  let rows = [];
  try { rows = fs.readFileSync(FILE, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)); } catch { rows = []; }
  send(res, 200, { count: rows.length, leads: rows.reverse() });
}


/* ---------- free posts: save, share page, email ---------- */
const POSTS_DIR = path.join(DATA_DIR, "posts");
const postHits = new Map();
const jpeg = (v) => (typeof v === "string" && /^data:image\/jpeg;base64,/.test(v) && v.length < 1.8e6 ? v : "");
const esc = (s) => String(s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const FOUNDER_WA = process.env.LOCALPOST_WHATSAPP || "971586133561";

function findLead(id) {
  if (!/^[a-f0-9]{12}$/.test(id || "")) return null;
  try {
    const lines = fs.readFileSync(FILE, "utf8").split("\n");
    for (let i = lines.length - 1; i >= 0; i--) { if (lines[i].includes(`"id":"${id}"`)) return JSON.parse(lines[i]); }
  } catch {}
  return null;
}
function baseUrl(req) {
  const env = process.env.LOCALPOST_PUBLIC_URL;
  if (env) return env.replace(/\/+$/, "");
  const host = String(req.headers["x-forwarded-host"] || req.headers.host || "localhost").replace(/[^a-zA-Z0-9.:-]/g, "");
  const proto = req.headers["x-forwarded-proto"] === "http" || /^(localhost|127\.)/.test(host) ? "http" : "https";
  return `${proto}://${host}`;
}

async function sendEmail(lead, link, images) {
  const key = process.env.RESEND_API_KEY, from = process.env.LOCALPOST_FROM_EMAIL;
  if (!key || !from || !lead.contact.email) return false;
  const name = esc(lead.business.name);
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;color:#111;max-width:560px;margin:0 auto;padding:24px">
    <h1 style="font-size:24px;margin:0 0 8px">Your 3 free posts are ready</h1>
    <p style="font-size:15px;line-height:1.5;color:#444;margin:0 0 18px">Made for ${name} in ${esc(lead.business.town)}. They're attached to this email, ready to post on Instagram and Facebook (1080×1350). The captions are on your page:</p>
    <p style="margin:0 0 22px"><a href="${link}" style="background:#111;color:#fff;text-decoration:none;padding:12px 20px;border-radius:99px;font-weight:bold;display:inline-block">Open my posts and captions</a></p>
    ${[1, 2, 3].map((n) => `<img src="${link}/post-${n}.jpg" width="360" alt="Post ${n}" style="display:block;width:100%;max-width:360px;border-radius:10px;margin:0 0 12px">`).join("")}
    <p style="font-size:15px;line-height:1.5;color:#444">Want 30 posts like these every month? Reply to this email or message us on WhatsApp: <a href="https://wa.me/${FOUNDER_WA}">+${FOUNDER_WA}</a>.</p>
    <p style="font-size:12px;color:#888">You're getting this because you asked for free posts on LocalPost.</p></div>`;
  const slug = (lead.business.name || "post").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const body = { from, to: [lead.contact.email], subject: `Your 3 free posts for ${lead.business.name}`, html,
    attachments: images.map((d, i) => ({ filename: `${slug}-post-${i + 1}.jpg`, content: d.split(",")[1] })) };
  try {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 15000);
    const r = await fetch("https://api.resend.com/emails", { method: "POST", signal: ctl.signal,
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
    clearTimeout(t);
    if (!r.ok) console.error("localpost email failed:", r.status, (await r.text()).slice(0, 200));
    return r.ok;
  } catch (e) { console.error("localpost email failed:", e.message); return false; }
}

async function savePosts(req, res) {
  const ip = clientIp(req), now = Date.now();
  const arr = (postHits.get(ip) || []).filter((t) => now - t < 3600e3); arr.push(now); postHits.set(ip, arr);
  if (arr.length > 6) return send(res, 429, { error: "Too many requests. Try again in an hour." });
  const b = await readBody(req, 6 * 1024 * 1024);
  if (!b) return send(res, 400, { error: "Upload too large." });
  const lead = findLead(str(b.lead, 20));
  if (!lead) return send(res, 404, { error: "Lead not found." });
  const images = (Array.isArray(b.images) ? b.images : []).map(jpeg);
  if (images.length !== 3 || !images.every(Boolean)) return send(res, 400, { error: "Expected 3 JPEG posts." });
  const caps = (Array.isArray(b.caps) ? b.caps : []).slice(0, 3).map((c) => str(c, 1200));
  const token = crypto.randomBytes(12).toString("hex"), dir = path.join(POSTS_DIR, token);
  try {
    fs.mkdirSync(dir, { recursive: true });
    images.forEach((d, i) => fs.writeFileSync(path.join(dir, `post-${i + 1}.jpg`), Buffer.from(d.split(",")[1], "base64")));
    fs.writeFileSync(path.join(dir, "meta.json"), JSON.stringify({ lead: lead.id, name: lead.business.name, town: lead.business.town, caps, createdAt: new Date().toISOString() }));
  } catch (e) { console.error("localpost: could not save posts", e.message); return send(res, 500, { error: "Could not save posts." }); }
  const link = `${baseUrl(req)}/s/${token}`;
  const emailed = await sendEmail(lead, link, images);
  send(res, 200, { ok: true, link, emailed, email: emailed ? lead.contact.email : "" });
}

function sharePage(res, token, file) {
  const dir = path.join(POSTS_DIR, token);
  if (file) {
    fs.readFile(path.join(dir, file), (err, buf) => {
      if (err) { res.writeHead(404).end("Not found"); return; }
      res.writeHead(200, { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=604800" }); res.end(buf);
    });
    return;
  }
  let m; try { m = JSON.parse(fs.readFileSync(path.join(dir, "meta.json"), "utf8")); } catch { res.writeHead(404, { "Content-Type": "text/plain" }).end("This link has expired or does not exist."); return; }
  const slug = (m.name || "post").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const wa = `https://wa.me/${FOUNDER_WA}?text=${encodeURIComponent(`Hi, I got my 3 free posts for ${m.name} in ${m.town}. I'd like to unlock 30 posts a month. Ref: ${m.lead}`)}`;
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>Your 3 free posts · ${esc(m.name)}</title><link rel="icon" href="/assets/localpost/logo-mark-blue.png">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap">
<style>*{box-sizing:border-box}body{margin:0;background:#F4F6F2;color:#0E120D;font-family:"Plus Jakarta Sans",system-ui,sans-serif;line-height:1.5}
.w{max-width:1100px;margin:0 auto;padding:28px 16px 60px}.top{display:flex;align-items:center;gap:8px;font-weight:800;font-size:20px;letter-spacing:-.03em}.top img{width:30px;height:30px;mix-blend-mode:multiply}
h1{font-size:clamp(28px,5vw,44px);letter-spacing:-.04em;line-height:1.05;margin:26px 0 6px}p.l{color:#4B5249;margin:0 0 24px}
.g{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}@media(max-width:820px){.g{grid-template-columns:1fr}}
.c{background:#fff;border-radius:22px;padding:12px;box-shadow:0 20px 40px -30px rgba(0,0,0,.35);display:flex;flex-direction:column;gap:10px}
.c img{width:100%;border-radius:12px;display:block}.c pre{white-space:pre-wrap;font:inherit;font-size:14px;color:#333;margin:0;padding:0 4px}
.b{display:flex;gap:8px;flex-wrap:wrap}.b a,.b button{font:inherit;font-weight:700;font-size:14px;border:1.5px solid #DCE0D8;background:#fff;color:#111;border-radius:99px;padding:9px 16px;cursor:pointer;text-decoration:none}
.cta{margin-top:30px;background:#0E120D;color:#fff;border-radius:26px;padding:clamp(22px,4vw,40px);display:flex;flex-wrap:wrap;gap:16px;align-items:center;justify-content:space-between}
.cta b{font-size:22px;letter-spacing:-.02em}.cta a{background:#A3E635;color:#0E120D;font-weight:800;text-decoration:none;border-radius:99px;padding:13px 22px}</style></head>
<body><div class="w"><div class="top"><img src="/assets/localpost/logo-mark-blue.png" alt="">localpost</div>
<h1>Your 3 free posts</h1><p class="l">Made for ${esc(m.name)} in ${esc(m.town)}. Download them, copy the captions, and post. They're yours to keep.</p>
<div class="g">${[1, 2, 3].map((n) => `<div class="c"><img src="/s/${token}/post-${n}.jpg" alt="Post ${n}"><div class="b"><a href="/s/${token}/post-${n}.jpg" download="${slug}-post-${n}.jpg">Download</a><button type="button" data-c="${n - 1}">Copy caption</button></div><pre>${esc(m.caps[n - 1] || "")}</pre></div>`).join("")}</div>
<div class="cta"><b>Want 30 posts like these every month?</b><a href="${wa}">Unlock on WhatsApp</a></div></div>
<script>const C=${JSON.stringify(m.caps).replace(/</g, "\\u003c")};document.querySelectorAll("[data-c]").forEach(b=>b.onclick=()=>{navigator.clipboard&&navigator.clipboard.writeText(C[+b.dataset.c]||"").then(()=>{b.textContent="Copied"})});</script></body></html>`;
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache", "X-Robots-Tag": "noindex" }); res.end(html);
}

/** Returns true when it handled the request. */
function handle(req, res, url, query) {
  if (req.method === "POST" && url === "/api/localpost/lead") { createLead(req, res); return true; }
  if (req.method === "GET" && url === "/api/localpost/leads") { listLeads(req, res, query); return true; }
  if (req.method === "POST" && url === "/api/localpost/posts") { savePosts(req, res); return true; }
  const sm = req.method === "GET" && url.match(/^\/s\/([a-f0-9]{24})(?:\/(post-[123]\.jpg))?$/);
  if (sm) { sharePage(res, sm[1], sm[2]); return true; }
  return false;
}

module.exports = { handle };
