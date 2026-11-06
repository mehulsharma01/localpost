# LocalPost

Instagram posts for cleaning businesses, built on local market data.

This repo is the web app behind the LocalPost subdomain: the landing page, the 7-step quiz and the lead API.

## Run it

```bash
npm start            # http://localhost:3000
```

No dependencies to install for the site.

## Settings

**In `public/index.html`**, at the top of the `<script>`, fill in `CONFIG`:
- `founderName`
- `stripeLink`: a $49/month Stripe Payment Link
- `whatsapp`: digits only
- `email`

**Railway variables:**

| Variable | What it does |
|---|---|
| `LOCALPOST_ADMIN_TOKEN` | Read leads at `/api/localpost/leads?token=…` |
| `LOCALPOST_DATA_DIR=/data` | Where leads are saved. **Attach a Railway volume at `/data`**, or leads are lost on every deploy |
| `LOCALPOST_WEBHOOK_URL` | Optional. Each new lead is POSTed here (e.g. a Zapier hook to your phone) |

**Never commit leads or secrets.** This repo is public. `data/` and `.env` are git-ignored.

## Tracking ads

Add `?ref=` to links (e.g. `?ref=igad`, `?ref=dm`). The quiz saves it with each lead.

## Folders

- **`public/`**: the landing page and its images. Photos are from Pexels (free licence) and are placeholders until custom images replace them, same file names.
- **`api.js`**: lead storage, validation, rate limit and honeypot.
- **`pipeline/`**: turns a Google Maps link into 3 post images. It needs Playwright and an `APIFY_TOKEN`; see `pipeline/README.md`.
- **`docs/`**:
  - `SYSTEM.md`: the offer, ICP, process and funnel.
  - `LAUNCH.md`: the 14-day plan and outreach scripts.
