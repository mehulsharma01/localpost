# LocalPost pipeline

Google Maps link → reviews → 3 ready Instagram posts for a cleaning business.

```bash
# Offline test with the made-up sample business
node localpost/run.js --input localpost/fixtures/sample-place.json

# Live, for a real business (needs an Apify token on a plan that can run public Actors)
APIFY_TOKEN=xxx node localpost/run.js --url "https://www.google.com/maps/place/..."

# Brand colours
node localpost/run.js --input place.json --accent "#FFD84D" --dark "#13302B" --light "#E9F0FB"
```

Output goes to `localpost/out/<business-town>/`:

- `post-1.png`, `post-2.png`, `post-3.png`: 1080×1350 Instagram posts
- `captions.txt`: a caption for each post
- `facts.json`: what the pipeline found (rating, praise themes, top service, best reviews)
- `posts.json`: the post content

## What it does

1. **Fetch** (`lib/fetch.js`): the Apify Google Maps Scraper (`compass/crawler-google-places`) pulls the place and its latest 40 Google reviews, with no reviewer personal data. Cost is about $0.02 per business.
2. **Analyse** (`lib/analyze.js`): finds what customers praise (reliable, thorough, trustworthy…) and which service they mention most (end of tenancy, oven, regular, office…), then ranks the best 4–5★ reviews.
3. **Write** (`lib/copy.js`): writes 3 posts:
   - **Review:** the best real review, quoted word for word.
   - **Tip:** a save-worthy checklist for the service customers mention most.
   - **Trust:** a headline from the top praise theme, with real counts, and a slot for the team photo.
4. **Render** (`lib/render.js`): HTML/CSS templates go to PNG with Playwright. The browser sets all text, so names and numbers are always exact.

## Rules built in

- Reviews are quoted exactly, trimmed only at sentence ends. They are never rewritten.
- Reviews containing phone numbers or emails are skipped.
- Every number on a post comes from Google: rating, review count, mention counts.
- No AI people are presented as staff. The trust post leaves a slot for the business's real team photo.

## Next

- Competitor mode: scrape other cleaners in the same town and count their complaints.
- DataForSEO local keywords to plan the 30-day calendar.
- A personal page per business (see the LocalPost mockup) with a $49 Stripe link.
