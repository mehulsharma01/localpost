// Step 1: get a business and its Google reviews.
// Live: Apify Google Maps Scraper (needs APIFY_TOKEN and a plan that can run public Actors).
// Offline: a JSON file in the same shape as that Actor's output.
const fs = require('fs');

const ACTOR = 'compass~crawler-google-places';

async function fromApify(mapsUrl, { maxReviews = 40 } = {}) {
  const token = process.env.APIFY_TOKEN;
  if (!token) throw new Error('APIFY_TOKEN is not set. Export it, or run with --input <file.json>.');
  const input = {
    startUrls: [{ url: mapsUrl }],
    maxCrawledPlacesPerSearch: 1,
    language: 'en',
    maxReviews,
    reviewsSort: 'newest',
    reviewsOrigin: 'google',
    scrapeReviewsPersonalData: false, // we never need reviewer identities
  };
  const url = `https://api.apify.com/v2/acts/${ACTOR}/run-sync-get-dataset-items?timeout=240`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Apify returned ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const items = await res.json();
  if (!Array.isArray(items) || !items.length) throw new Error('Apify returned no place for that URL.');
  return items[0];
}

function fromFile(path) {
  const data = JSON.parse(fs.readFileSync(path, 'utf8'));
  return Array.isArray(data) ? data[0] : data;
}

module.exports = { fromApify, fromFile };
