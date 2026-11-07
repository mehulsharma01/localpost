/**
 * LocalPost lead backup: Google Apps Script web app.
 * Every quiz submission on the site is added as a row in this sheet.
 *
 * Setup (5 minutes):
 *  1. Create a Google Sheet. Extensions > Apps Script. Paste this file. Save.
 *  2. Replace KEY below with your own secret (keep it out of the public repo).
 *  3. Deploy > New deployment > type "Web app". Execute as: Me. Who has access: Anyone.
 *  4. Copy the web app URL. In Hostinger, set the environment variable
 *       LOCALPOST_WEBHOOK_URL = <web app URL>?key=<your KEY>
 *     and restart the app.
 */
const KEY = "REPLACE_WITH_YOUR_SECRET";

const HEADERS = ["Date", "Business", "Town", "Country", "Contact name", "Email", "WhatsApp", "Instagram",
  "Main service", "Services", "Rating", "Review count", "Praise", "Review", "Style", "Colour",
  "Model", "Logo uploaded", "Photo uploaded", "Source", "Lead ID", "Google Maps"];

function doPost(e) {
  if (!e || !e.parameter || e.parameter.key !== KEY) return out({ ok: false, error: "bad key" });
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    if (sh.getLastRow() === 0) { sh.appendRow(HEADERS); sh.setFrozenRows(1); }
    const l = JSON.parse(e.postData.contents || "{}");
    const b = l.business || {}, c = l.contact || {}, br = l.brand || {}, f = l.face || {};
    sh.appendRow([
      l.createdAt ? new Date(l.createdAt) : new Date(), b.name, b.town, b.country,
      c.name, c.email, c.whatsapp, c.instagram,
      l.mainService, (l.services || []).join(", "), l.rating, l.reviewCount,
      (l.praise || []).join(", "), l.review, br.style, br.color,
      f.persona || f.type, br.logo ? "yes" : "no", f.photo ? "yes" : "no",
      l.source, l.id, b.mapsUrl,
    ].map((v) => (v === undefined || v === null ? "" : v)));
    return out({ ok: true });
  } finally { lock.releaseLock(); }
}

function doGet() { return out({ ok: true, service: "localpost-lead-backup" }); }
function out(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
