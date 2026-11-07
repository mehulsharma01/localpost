/**
 * LocalPost web app: landing page, quiz and lead API.
 *   GET  /                        landing page + quiz (public/index.html)
 *   POST /api/localpost/lead      save quiz answers
 *   GET  /api/localpost/leads     list leads (needs LOCALPOST_ADMIN_TOKEN)
 * Zero dependencies. Binds 0.0.0.0 on $PORT (Railway).
 */
const http = require("http");
const fs = require("fs");
const path = require("path");
const api = require("./api");

const ROOT = path.join(__dirname, "public");
const PORT = process.env.PORT || 3000;
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".webp": "image/webp", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".txt": "text/plain; charset=utf-8" };

process.on("uncaughtException", e => console.error("uncaughtException:", e && e.stack || e));
process.on("unhandledRejection", e => console.error("unhandledRejection:", e && e.stack || e));

http.createServer((req, res) => {
  const raw = req.url || "/", q = raw.indexOf("?");
  const url = q >= 0 ? raw.slice(0, q) : raw, query = new URLSearchParams(q >= 0 ? raw.slice(q) : "");
  if (url.startsWith("/api/localpost/") && api.handle(req, res, url, query)) return;
  if (req.method !== "GET" && req.method !== "HEAD") { res.writeHead(405).end(); return; }
  let p;
  try { p = decodeURIComponent(url); } catch { res.writeHead(400).end("Bad request"); return; }
  if (p === "/" || p === "/localpost") p = "/index.html";
  const file = path.normalize(path.join(ROOT, p));
  if (!file.startsWith(ROOT)) { res.writeHead(403).end("Forbidden"); return; }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(302, { Location: "/" }); res.end(); return; }
    const ext = path.extname(file).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream",
      "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=604800" });
    res.end(req.method === "HEAD" ? undefined : buf);
  });
}).listen(PORT, "0.0.0.0", () => console.log(`LocalPost live on http://0.0.0.0:${PORT}`));
