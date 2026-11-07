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
const zlib = require("zlib");
const api = require("./api");

/* Speed: minify inline CSS/JS in HTML (safe, comment/whitespace only) and gzip/brotli text files.
   Results are cached in memory and rebuilt when a file changes. */
const TEXT = new Set([".html", ".js", ".css", ".json", ".svg", ".txt"]);
const cache = new Map(); // file -> { mtime, raw, br, gz }
function minifyCss(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, " ").replace(/\s*([{};,>])\s*/g, "$1").replace(/;}/g, "}").trim();
}
function minifyJs(js) {
  // line-level only: drop blank lines, full-line // comments and indentation. No renaming, so it cannot change behaviour.
  return js.split("\n").map(l => l.trim()).filter(l => l && !/^\/\/(?!#)/.test(l)).join("\n");
}
function minifyHtml(html) {
  return html
    .replace(/<style>([\s\S]*?)<\/style>/g, (m, c) => "<style>" + minifyCss(c) + "</style>")
    .replace(/<script>([\s\S]*?)<\/script>/g, (m, c) => "<script>" + minifyJs(c) + "</script>")
    .replace(/<!--(?!\[)[\s\S]*?-->/g, "")
    .replace(/>\s+</g, "> <");
}
function build(file, ext, buf) {
  let raw = buf;
  if (ext === ".html") raw = Buffer.from(minifyHtml(buf.toString("utf8")));
  else if (ext === ".css") raw = Buffer.from(minifyCss(buf.toString("utf8")));
  const out = { raw };
  if (TEXT.has(ext) && raw.length > 1024) {
    out.br = zlib.brotliCompressSync(raw, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11, [zlib.constants.BROTLI_PARAM_SIZE_HINT]: raw.length } });
    out.gz = zlib.gzipSync(raw, { level: 9 });
  }
  return out;
}

const ROOT = path.join(__dirname, "public");
const PORT = process.env.PORT || 3000;
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".webp": "image/webp", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".txt": "text/plain; charset=utf-8", ".woff2": "font/woff2" };

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
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(302, { Location: "/" }); res.end(); return; }
    const ext = path.extname(file).toLowerCase();
    const send = (entry) => {
      const ae = String(req.headers["accept-encoding"] || "");
      let body = entry.raw, enc = null;
      if (entry.br && /\bbr\b/.test(ae)) { body = entry.br; enc = "br"; } else if (entry.gz && /\bgzip\b/.test(ae)) { body = entry.gz; enc = "gzip"; }
      const immutable = p.startsWith("/fonts/");
      const headers = { "Content-Type": MIME[ext] || "application/octet-stream", "Vary": "Accept-Encoding",
        "Cache-Control": ext === ".html" ? "no-cache" : immutable ? "public, max-age=31536000, immutable" : "public, max-age=604800, stale-while-revalidate=86400",
        "Content-Length": body.length };
      if (enc) headers["Content-Encoding"] = enc;
      res.writeHead(200, headers); res.end(req.method === "HEAD" ? undefined : body);
    };
    const hit = cache.get(file);
    if (hit && hit.mtime === st.mtimeMs) return send(hit);
    fs.readFile(file, (e2, buf) => {
      if (e2) { res.writeHead(302, { Location: "/" }); res.end(); return; }
      const entry = TEXT.has(ext) ? { mtime: st.mtimeMs, ...build(file, ext, buf) } : { mtime: st.mtimeMs, raw: buf };
      if (TEXT.has(ext) || buf.length < 2e6) cache.set(file, entry);
      send(entry);
    });
  });
}).listen(PORT, "0.0.0.0", () => console.log(`LocalPost live on http://0.0.0.0:${PORT}`));
