# LocalPost launch plan: 3 paying clients in 14 days

**Goal:** 3 cleaning businesses paying $49/month by day 14.
**Positioning:** "Your reviews say you're the best cleaner in town. Your Instagram doesn't."
We don't sell posts. We make a business's real reputation visible.

---

## 0. Before launch (day 0, about 1 hour)

Fill these in at the top of the `<script>` in `demo/localpost.html` (`CONFIG`):

| Setting | What to put |
|---|---|
| `founderName` | Your name as clients will see it |
| `stripeLink` | A Stripe **Payment Link** for $49/month recurring. Without it, the unlock button just records interest. |
| `whatsapp` | Your WhatsApp number, digits only (e.g. `447700900123`) |
| `email` | The address clients see in the footer |

Then:

1. **Founder photo:** save a real, friendly photo of yourself as `demo/assets/localpost/founder.jpg` (portrait, about 900×1125). Without it the page shows your initial.
2. **Railway variables:**
   - `LOCALPOST_ADMIN_TOKEN`: any long random string. You'll read leads at `https://<your-site>/api/localpost/leads?token=<it>`.
   - `LOCALPOST_DATA_DIR=/data`: **attach a Railway volume at `/data`**, or leads are wiped on every deploy.
   - `LOCALPOST_WEBHOOK_URL` (optional): a Zapier/Make webhook that pings your phone on every new lead.
3. **Test the page:** open `/localpost`, do the quiz yourself, check the lead shows up.

The page lives at **`/localpost`** on the existing site.

---

## 1. The funnel

1. **DM or email:** a well-wisher message with one free post, no pitch.
2. **Landing page:** `/localpost?ref=dm`.
3. **Quiz:** 7 steps with a live preview. Answers are saved to the database.
4. **Instant preview:** 3 posts in their name, town, colours, review and praise.
5. **Within 24 hours:** you send the researched set (real reviews, local searches, competitor complaints) as ready images.
6. **Unlock:** $49/month (worth $549), cancel anytime.

### The 3 free posts must be the best work you do

The instant preview is good. The 24-hour set is what closes. For every lead:

1. Find them on Google Maps and run the pipeline: `node localpost/run.js --url "<maps link>"`, with `APIFY_TOKEN` set on a plan that runs public Actors.
2. Read their reviews yourself. Choose the one review that would make *you* book them.
3. Check 3–5 competitors in the same town. What do their customers complain about? Lead with the opposite, but only if it's true for this business.
4. Use their real team photo if they gave one. A lifestyle model only for home scenes, never presented as staff.
5. Send the 3 images with captions, plus one sentence on what you found: "Your customers mention 'always on time' 9 times. Other cleaners in Leeds get complaints about no-shows, so I led with that."
6. End with the unlock link and one line: "Want 30 like this every month for $49? Cancel anytime."

---

## 2. Outreach scripts

Rules: about their business, short, nothing to buy in the first message, and something useful attached. Send from your own name, not a brand.

### First message (email or Facebook Messenger)

> Hi Jo,
>
> Not selling anything here, just a heads-up. I was looking at cleaners in Leeds and Brightway has 4.9★ from 47 reviews, better than most. But your Facebook's last post was in April, and a lot of people check Facebook before they book a cleaner. It can make you look closed.
>
> I turned one of your reviews into a post you can use, attached. Free, no catch.
>
> Mehul

### If they have no social pages at all

> Hi Jo,
>
> Quick one. Brightway has great Google reviews, but there's no Instagram or Facebook to go with them. People often look for one before they let a cleaner into their home.
>
> I made you a post from one of your reviews, attached, in case you ever want to start one. It's yours.
>
> Mehul

### If they reply ("thanks!", "how much?", "who are you?")

> Glad it's useful! I do this for a few cleaning businesses: I read your reviews and what people in Leeds search for, and turn it into posts. If you want 2 more free ones made for you, it takes 2 minutes here: [link]/localpost?ref=reply
>
> No obligation, they're yours either way.

### Follow-up after 3 days (once only)

> Hi Jo, did the post work for you? Sarah's review about the oven is a great one to lead with.

### Instagram DM (shortest version)

> Hey! Love your reviews 👏 Made you a post from one of them, free to use. Want me to send it?

**Where to send:** the email on their Google listing or website first, then Facebook Messenger on their business page. Use Instagram DMs last, because that inbox is full of spam.

---

## 3. Who to contact

- Use the Google Maps scraper for "cleaning service", "end of tenancy cleaning", "domestic cleaner" and "house cleaning".
- **Cities:** Leeds, Manchester, Birmingham, Bristol, Glasgow, then Austin, Phoenix, Tampa, Charlotte, Denver.
- **Keep:** 4.5★ or more, 15–150 reviews, and an Instagram or Facebook page that hasn't posted for 30+ days, or no page at all.
- **Skip:** franchises, businesses with fewer than 10 reviews, and anyone who clearly already has an agency (posting daily, polished).

Track every business in a simple sheet: name, town, rating, review count, last post date, channel, date sent, replied, quiz done, paid.

---

## 4. The 14 days

| Days | Do | Numbers |
|---|---|---|
| 0 | Settings, founder photo, Stripe link, Railway volume. Test the quiz. | Page live |
| 1–2 | Build the first 150 leads (5 UK cities). Make 1 free review post for the best 40. | 40 posts ready |
| 3–5 | Send 20 first messages a day. Reply to everything within 2 hours. | 60 sent |
| 6–7 | Follow-ups. Deliver the 24-hour sets to every quiz lead. Ask each one for a yes. | 3–6 quiz leads |
| 8–10 | Add 5 US cities. 20 messages a day. | 60 more sent |
| 11–12 | Follow-ups. First clients get month 1 early. Ask for a testimonial. | 1–3 paid |
| 13–14 | Post each client's before/after feed on your own Instagram. Ask every client for one referral. | **3 paid** |

**Expected funnel:** about 150 messages → 20–30 replies → 8–12 quizzes → 3 paid. If replies are under 10% after 60 messages, change the first line of the message, not the offer.

---

## 5. What not to promise

- No "more bookings", "guaranteed growth" or "viral".
- No fake reviews, fake before-and-afters, or AI people shown as staff.
- Every number on a post comes from Google.
