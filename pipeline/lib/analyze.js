// Step 2: turn raw place data into facts we can safely put in posts.
// Rule: we quote customers word for word (only trimmed at sentence ends), and every
// claim on a post must come from the business's own data.

const THEMES = {
  reliable:   { label: 'reliable',        words: ['reliable', 'on time', 'punctual', 'always turn', 'turned up', 'never let', 'dependable', 'consistent'] },
  thorough:   { label: 'thorough',        words: ['thorough', 'spotless', 'attention to detail', 'immaculate', 'sparkling', 'every corner', 'deep clean', 'gleaming'] },
  trust:      { label: 'trustworthy',     words: ['trust', 'honest', 'keys', 'peace of mind', 'safe', 'respectful'] },
  friendly:   { label: 'friendly',        words: ['friendly', 'lovely', 'polite', 'kind', 'helpful', 'pleasure'] },
  value:      { label: 'great value',     words: ['value', 'reasonable', 'fair price', 'affordable', 'worth every'] },
  responsive: { label: 'quick to reply',  words: ['quick to respond', 'responded', 'replied', 'short notice', 'same day', 'last minute', 'fitted us in'] },
};

const SERVICES = {
  end_of_tenancy: ['end of tenancy', 'deposit', 'landlord', 'moving out', 'move out', 'letting agent', 'inventory'],
  oven:           ['oven', 'hob', 'extractor'],
  regular:        ['every week', 'weekly', 'fortnightly', 'regular clean', 'every fortnight', 'come home to'],
  office:         ['office', 'workplace', 'commercial', 'staff'],
  carpet:         ['carpet', 'upholstery', 'sofa', 'rug'],
  airbnb:         ['airbnb', 'guests', 'turnover', 'holiday let'],
};

const count = (texts, words) => texts.filter(t => words.some(w => t.includes(w))).length;

function sentences(text) {
  return (text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || []).map(s => s.trim()).filter(Boolean);
}

// Longest run of whole sentences that fits, so the quote is never reworded.
function quoteFrom(text, max = 170) {
  let out = '';
  for (const s of sentences(text)) {
    const next = out ? `${out} ${s}` : s;
    if (next.length > max) break;
    out = next;
  }
  return out;
}

const hasPersonalInfo = t => /@|\b\d{5,}\b|\+?\d[\d\s]{8,}\d/.test(t);

function scoreReview(r) {
  const t = r.lower;
  let s = 0;
  if (r.stars === 5) s += 10; else if (r.stars === 4) s += 3; else return -1;
  if (r.quote.length >= 60 && r.quote.length <= 170) s += 6;
  if (r.quote.length < 35) s -= 6;
  for (const words of Object.values(SERVICES)) if (words.some(w => t.includes(w))) s += 3; // concrete detail
  for (const th of Object.values(THEMES)) if (th.words.some(w => t.includes(w))) s += 1;
  if (hasPersonalInfo(r.text)) s -= 20;
  return s;
}

function analyze(place) {
  const reviews = (place.reviews || [])
    .map(r => ({ text: (r.text || r.textTranslated || '').replace(/\s+/g, ' ').trim(), stars: r.stars || r.rating || 0, date: r.publishedAtDate || null }))
    .filter(r => r.text.length > 0)
    .map(r => ({ ...r, lower: r.text.toLowerCase(), quote: quoteFrom(r.text) }))
    .filter(r => r.quote);

  const texts = reviews.map(r => r.lower);
  const themes = Object.entries(THEMES)
    .map(([key, th]) => ({ key, label: th.label, mentions: count(texts, th.words) }))
    .filter(t => t.mentions > 0)
    .sort((a, b) => b.mentions - a.mentions);
  const services = Object.entries(SERVICES)
    .map(([key, words]) => ({ key, mentions: count(texts, words) }))
    .filter(s => s.mentions > 0)
    .sort((a, b) => b.mentions - a.mentions);

  const ranked = reviews.map(r => ({ ...r, score: scoreReview(r) })).filter(r => r.score > 0).sort((a, b) => b.score - a.score);

  return {
    name: place.title,
    category: place.categoryName || 'Cleaning service',
    town: place.city || (place.address || '').split(',').slice(-2, -1)[0]?.trim() || '',
    phone: place.phone || '',
    website: place.website || '',
    rating: place.totalScore || null,
    reviewsCount: place.reviewsCount || reviews.length,
    mapsUrl: place.url || '',
    reviewsAnalysed: reviews.length,
    themes,
    services,
    bestReviews: ranked.slice(0, 5).map(({ quote, stars, date, score }) => ({ quote, stars, date, score })),
  };
}

module.exports = { analyze, quoteFrom };
