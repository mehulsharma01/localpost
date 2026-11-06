# Post design: what we learned from Pinterest

Source: about 140 top pins from 6 searches (Nov 2026), including
"cleaning company instagram post", "cleaning service social media design",
"premium cleaning brand instagram", "real estate instagram post design",
"home cleaning ad creative" and "interior design instagram post layout".
Re-run the searches with `python3 pipeline/pinterest_search.py "<query>"`.
We copy **structures only**, never anyone's images, text or logos.

## What the best posts have in common

1. **One strong photo does the work.** Gloved hands, a gold tap, a spotless
   surface, a bright room. Very little text on top.
2. **Two-line headline, light then bold.** For example "We don't just clean." /
   "We care.", centred near the top over a soft fade.
3. **Phone UI as design.** iOS toggles ("We clean at"), an alert card, a
   Google review card, a Maps result card. People recognise these instantly.
4. **Elegant serif for premium moments.** "Spotless. Every time.", "New slots
   available" with week dots, and question hooks in serif capitals.
5. **Save-worthy utility.** A paper checklist pinned on a bold colour.
6. **Offers are huge numbers.** A giant "15%" over a bright flat-lay.

## Our templates (`ed(kind, business, options)` in `public/index.html`)

| kind | Structure |
|---|---|
| `ad` | Full photo, centred light/bold headline, contact pill |
| `spot` | Moody photo, huge serif italic sign-off |
| `slots` | Serif "New slots available" and week dots |
| `toggles` | "We clean at" with iOS switches |
| `alert` | iOS alert card, such as a guest arriving or a seasonal reminder |
| `ask` | Serif-caps question, then answer |
| `check` | Pinned paper checklist on colour |
| `greview` | Google review card on a photo |
| `maps` | "Cleaners near X?" with a Maps result card |
| `offer` | Giant percentage over a flat-lay |

## Photo direction for Higgsfield

Match this look:
- Bright, natural light.
- Close crops of hands, gloves, products and surfaces.
- Clean minimal rooms.
- One colour accent per frame (yellow gloves, a blue sponge).

Avoid the matching red-uniform team look, because it reads as stock. Never
show a generated person as a client's staff.
