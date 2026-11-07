/**
 * LocalPost API, mounted by server.js.
 *
 *   POST /api/localpost/lead            quiz answers -> { ok, id }
 *   GET  /api/localpost/leads?token=…   all leads as JSON (needs LOCALPOST_ADMIN_TOKEN)
 *
 * Storage: one JSON line per lead in $LOCALPOST_DATA_DIR/localpost-leads.jsonl
 * (defaults to ~/localpost-data, outside the app folder, so redeploys on Hostinger
 * never wipe it). Optional LOCALPOST_WEBHOOK_URL gets each lead
 * (without images) as JSON, e.g. a Zapier/Make hook that pings your phone.
 *
 * Zero dependencies.
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const os = require("os");

// Leads live OUTSIDE the app folder by default (~/localpost-data), so a
// redeploy that replaces the app folder never wipes them.
const OLD_DIR = path.join(__dirname, "data");
function pickDataDir() {
  const tries = [process.env.LOCALPOST_DATA_DIR, path.join(os.homedir(), "localpost-data"), OLD_DIR].filter(Boolean);
  for (const dir of tries) {
    try { fs.mkdirSync(dir, { recursive: true }); fs.accessSync(dir, fs.constants.W_OK); return dir; } catch {}
  }
  return OLD_DIR;
}
const DATA_DIR = pickDataDir();
const FILE = path.join(DATA_DIR, "localpost-leads.jsonl");

// One-time rescue: copy leads saved in the old in-app folder into the new file.
(function migrateOldLeads() {
  const oldFile = path.join(OLD_DIR, "localpost-leads.jsonl");
  if (path.resolve(oldFile) === path.resolve(FILE) || !fs.existsSync(oldFile)) return;
  try {
    const ids = (f) => new Set((fs.existsSync(f) ? fs.readFileSync(f, "utf8") : "").split("\n").filter(Boolean)
      .map((l) => { try { return JSON.parse(l).id; } catch { return null; } }).filter(Boolean));
    const have = ids(FILE);
    const add = fs.readFileSync(oldFile, "utf8").split("\n").filter(Boolean)
      .filter((l) => { try { return !have.has(JSON.parse(l).id); } catch { return false; } });
    if (add.length) fs.appendFileSync(FILE, add.join("\n") + "\n");
    console.log(`localpost: leads stored in ${DATA_DIR} (moved ${add.length} from old folder)`);
  } catch (e) { console.error("localpost: lead migration failed", e.message); }
})();
const MAX_BODY = 3 * 1024 * 1024; // images are downscaled in the browser first
const hits = new Map(); // ip -> [timestamps], simple abuse guard

function send(res, code, obj) {
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(obj));
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = "", size = 0, dead = false;
    req.on("data", (c) => {
      size += c.length;
      if (size > MAX_BODY) { dead = true; req.destroy(); return resolve(null); }
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

/** Returns true when it handled the request. */
function handle(req, res, url, query) {
  if (req.method === "POST" && url === "/api/localpost/lead") { createLead(req, res); return true; }
  if (req.method === "GET" && url === "/api/localpost/leads") { listLeads(req, res, query); return true; }
  return false;
}

module.exports = { handle };
