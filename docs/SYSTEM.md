# LocalPost: the complete system

One page that says what we sell, to whom, why they buy, how we deliver it, and what we do each day.
Everything else (landing page, quiz, outreach, delivery) follows this.

---

## 1. What

**LocalPost** makes a month of Instagram, Facebook and Google Business posts for cleaning businesses.
The posts are built from the business's **real Google reviews** and **research on their own town**.

- **For now, a service:** the customer answers a quiz, sees 3 free posts, and pays $49/month for 30 posts + 15 stories.
- **Later, a product:** once 3–10 clients are paying, the same pipeline becomes self-serve.

## 2. Who (ICP)

| | |
|---|---|
| **Business** | Domestic and end-of-tenancy cleaners, small office cleaners, Airbnb turnover cleaners |
| **Where** | UK first (Leeds, Manchester, Birmingham, Bristol, Glasgow), then US (Austin, Phoenix, Tampa, Charlotte, Denver) |
| **Size** | Owner-operator to about 15 staff. 15–150 Google reviews, 4.5★ or more |
| **Signal** | Instagram or Facebook quiet for 30+ days, or no page at all |
| **Not** | Franchises, businesses with an agency already, fewer than 10 reviews |

**What their day looks like:** they clean all day, quote and invoice at night, and have no time or skill for content.
They get "I'll grow your Instagram" DMs every week and ignore them.

## 3. The problem (in their words)

> "My reviews are great. But I don't have time to post, and when I do it looks rubbish."

What actually happens:
1. A customer finds them on Google: 4.9★. Interested.
2. The customer taps their Instagram or Facebook: the last post was 7 months ago. *Are they still trading?*
3. The customer books the cleaner who **looks** active and trusted.

**The real problem isn't content. Nobody can see how good they are.**
Cleaning is a trust business: people are letting a stranger into their home.

## 4. Positioning

**Statement:**
> For cleaning businesses with great reviews and quiet pages, LocalPost is the creative partner that turns your real reputation into a month of local posts, so your page looks as good as your reviews.

**Headline:** "Your reviews say you're the best cleaner in town. Your Instagram doesn't."

**Why us and not a social media freelancer:**

| Them | Us |
|---|---|
| Generic quotes and stock tips | Your real reviews, quoted exactly |
| The same templates for everyone | Your town's searches and seasons, and what customers complain about at other cleaners near you |
| Instagram only | Instagram, Facebook and Google Business Profile |
| Calls and back and forth | A 2-minute quiz, then download and post |
| 3–6 month contracts | Month to month |

**The perception we build:** "This person read my reviews and studied my town before they ever messaged me. Nobody else does that."

## 5. The offer

**$49/month, worth $549. Founding price for the first 10 businesses, locked for as long as they stay.**

| Included every month | Value |
|---|---|
| 30 designed posts in their brand (logo, colours, photos) | $300 |
| 15 Instagram stories that match the posts | included |
| Local market research: searches, demand peaks, competitor complaints | $99 |
| Every new 5★ review turned into a ready post | $50 |
| Google Business Profile versions | $50 |
| Captions, hashtags and a posting calendar | $50 |
| **Total** | **$549** |

**Risk reversal:**
- 3 free posts first, no card needed.
- First month not right? Full refund, and they keep the posts.
- Posts arrive by the 1st of the month, or that month is free.
- Cancel with one message.

**What we never promise:** more bookings, growth, "viral" results, fake reviews, fake before-and-afters, or AI people shown as staff.

## 6. How (the production process)

For every client, every month:

| # | Step | How | Tool |
|---|---|---|---|
| 1 | **Business details** | The quiz: name, town, services, praise, favourite review, brand, face, contact | Landing page quiz, saved to `/api/localpost/lead` |
| 2 | **Market research** | Their reviews, 3–5 competitors' reviews, local search terms and seasonal peaks | Apify Google Maps, DataForSEO, `localpost/run.js` |
| 3 | **Find the angle** | Top praise ("always on time"), top competitor complaint (no-shows), main service | `facts.json` plus your own read of the reviews |
| 4 | **Choose the face** | The client's team photo (best), or one of 3 lifestyle models for home scenes only | Quiz step 6. Models in `demo/assets/localpost/models/` |
| 5 | **Design inspiration** | A Pinterest style board per style (calm, bold, premium) to set layouts and colours | Pinterest via `studio/scripts/inspo.js` (needs Apify) |
| 6 | **Create posts** | Review, tip, trust, local and offer posts. Text set as HTML, never drawn by an image model | `localpost/run.js` templates |
| 7 | **Quality check** | Name, phone and rating correct. Review quoted exactly. Nothing claimed that isn't true | You, before anything is sent |
| 8 | **Deliver** | A ZIP or folder link with images, captions and the calendar, by email or WhatsApp | Google Drive or WhatsApp |
| 9 | **Get paid** | A $49/month Stripe Payment Link with the lead id | Stripe |

**Mix for the 30 posts:** 8 review/trust, 8 tips, 6 services, 4 local and seasonal, 4 offers.

## 7. The funnel

1. **Find:** scrape Google Maps for cleaners in a city and filter by the ICP signals.
2. **Message:** a well-wisher message with **one free post made from their own review**. No pitch.
3. **Landing page:** `/localpost?ref=dm`.
4. **Quiz:** 7 steps. A live preview updates as they answer.
5. **Instant 3 posts:** shown on screen, made from their answers.
6. **Within 24 hours:** we send the **researched** set of 3 as ready images, plus one line on what we found.
7. **Unlock:** $49/month through the Stripe link.
8. **Deliver month 1** within 48 hours of payment.
9. **Retain:** new reviews become new posts each month. Ask for a referral in week 2.

**Why the free 3 must be the best work we do:** they're the decision moment. The instant preview gets them excited. The 24-hour researched set, with their real review and a town insight, is what closes.

## 8. When (timeline)

| When | What |
|---|---|
| Today (by 12am) | System, landing page, quiz and database ready. Settings filled in. Deployed |
| Days 1–2 | 150 leads from 5 UK cities. One free post made for the best 40 |
| Days 3–5 | 20 messages a day. Reply within 2 hours. Deliver 24-hour sets |
| Days 6–7 | Follow-ups. Ask every quiz lead for a yes |
| Days 8–10 | Add 5 US cities, 20 messages a day |
| Days 11–14 | Close. Deliver month 1. Testimonials and referrals |
| **Target** | **3 paying clients by day 14** |

**Expected funnel:** about 150 messages → 20–30 replies → 8–12 quizzes → 3 paid.
If fewer than 10% reply after 60 messages, change the first line of the message, not the offer.

## 9. Outreach

The rules, and the exact scripts, are in [`LAUNCH.md`](LAUNCH.md). In short:
- About **their** business: their rating, their review, their quiet page.
- **Give first:** one post made from their review, attached.
- **No pitch** in the first message. The link comes only when they reply.
- From a person (you), not a brand. Email or Facebook first, Instagram DMs last.

## 10. Numbers we watch daily

| Metric | Target |
|---|---|
| Messages sent | 20 a day |
| Reply rate | 15% or more |
| Quiz completions | 8–12 by day 10 |
| Quiz → paid | 25–35% |
| Time from quiz to researched set | Under 24 hours |
| Paid clients | 3 by day 14 |

## 11. Where everything lives

| Thing | Path |
|---|---|
| Landing page and quiz | `demo/localpost.html` → `/localpost` |
| Lead database API | `localpost/api.js`. Read leads at `/api/localpost/leads?token=…` |
| Post pipeline | `localpost/run.js` (README in `localpost/README.md`) |
| Outreach scripts and 14-day plan | `localpost/LAUNCH.md` |
| Model images | `demo/assets/localpost/models/` |
| Example posts | `demo/assets/localpost/` |

## 12. Before launch: settings

- `CONFIG` in `demo/localpost.html`: `founderName`, `stripeLink`, `whatsapp`, `email`.
- Founder photo: `demo/assets/localpost/founder.jpg`.
- Railway variables:
  - `LOCALPOST_ADMIN_TOKEN`.
  - `LOCALPOST_DATA_DIR=/data`, with a volume attached at `/data`.
  - `APIFY_TOKEN` on a plan that runs public Actors.
  - `LOCALPOST_WEBHOOK_URL` (optional).
- Network for this workspace: allow `pinterest.com`, `i.pinimg.com` and `api.apify.com` so the Pinterest style boards can be pulled.
