# LocalPost: project memory

**What it is:** done-for-you Instagram, Facebook and Google Business posts for small cleaning businesses in the UK and US, built on local market data (local searches, seasonal demand, competitor reviews, the business's own reviews).

- **Offer:** 3 free posts, then 30 posts + 15 Instagram stories a month at $49 (founding price for the first 10, worth $549). Cancel anytime.
- **Live at:** the LocalPost subdomain (`localpost.adsnora.com`), deployed on Railway from `main`.
- **Customers come from:** Instagram posts, DMs and Instagram ads, not Google.

## Read first
- `docs/SYSTEM.md`: what, who, problem, positioning, offer, process, funnel, numbers.
- `docs/LAUNCH.md`: the 14-day plan and outreach scripts.
- `docs/PROMPTING.md`: the locked 6-pillar image prompt format (Nano Banana Pro, 2k) and the story-content direction for model photos.

## Layout
- `public/index.html`: the landing page, quiz and results screen, all in one file. Set `CONFIG` at the top of its script.
- `server.js` + `api.js`: zero-dependency server and lead API. Leads are stored in `$LOCALPOST_DATA_DIR`.
- `pipeline/`: Google Maps link to 3 post images (Apify + Playwright).

## Rules
- This repo is **public**. Never commit leads, tokens or customer data.
- Never promise bookings, growth or "viral".
- No fake reviews or fake before/afters. AI or lifestyle models are never shown as a client's staff.
- Reviews are quoted word for word, and every number on a post must be real.
- Photos in `public/assets/localpost/photos/` are Pexels placeholders. Replace them by keeping the same file names.
- Keep the page simple and visual. The user wants a visitor to get it in 5–10 seconds.
