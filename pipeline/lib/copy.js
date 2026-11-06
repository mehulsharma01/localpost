// Step 3: write the 3 posts from the facts. No invented claims:
// headlines come from what customers actually said, numbers come from Google.

const TIPS = {
  end_of_tenancy: {
    title: town => `${town} landlords check these 5 things first`,
    items: ['Inside the oven', 'Limescale on taps', 'Skirting boards', 'Behind the fridge', 'Window tracks'],
    cta: 'Moving out? We do all 5.',
    tags: ['EndOfTenancy', 'MovingOut', 'DepositBack'],
  },
  oven: {
    title: () => 'Your oven, 5 steps from spotless',
    items: ['Racks soaking first', 'Glass door, both sides', 'Seals wiped, not scrubbed', 'Fan cover off', 'Hob and extractor last'],
    cta: 'Or let us do it.',
    tags: ['OvenCleaning', 'CleaningTips'],
  },
  regular: {
    title: () => '5 habits that keep a house clean between visits',
    items: ['Wipe the shower after use', 'One load of washing a day', 'Clear surfaces at night', 'Shoes off at the door', '10-minute reset before bed'],
    cta: 'We handle the rest.',
    tags: ['CleanHome', 'CleaningTips'],
  },
  office: {
    title: () => '5 spots most office cleans miss',
    items: ['Keyboards and phones', 'Door handles', 'Kitchen fridge', 'Under desks', 'Light switches'],
    cta: 'We clean all of them.',
    tags: ['OfficeCleaning', 'CommercialCleaning'],
  },
  carpet: {
    title: () => '5 carpet mistakes that set stains for good',
    items: ['Rubbing instead of blotting', 'Using hot water on blood', 'Too much shampoo', 'Walking on it wet', 'Waiting a week'],
    cta: 'Call us before it sets.',
    tags: ['CarpetCleaning', 'CleaningTips'],
  },
  airbnb: {
    title: () => '5 things guests notice first',
    items: ['Hair in the bathroom', 'Smell on arrival', 'Crumbs in the toaster', 'Dust on the TV', 'Towels folded right'],
    cta: 'We turn it around between guests.',
    tags: ['AirbnbHost', 'HolidayLet'],
  },
  general: {
    title: () => '5 places dust hides in every home',
    items: ['Top of door frames', 'Light fittings', 'Behind the TV', 'Skirting boards', 'Under the bed'],
    cta: 'We get all of them.',
    tags: ['CleaningTips', 'CleanHome'],
  },
};

const TRUST_HEADLINES = {
  reliable: 'They turn up. Every time.',
  thorough: 'Spotless, not just tidy.',
  trust: 'Trusted with the keys.',
  friendly: 'Friendly faces, clean homes.',
  value: 'Proper clean. Fair price.',
  responsive: 'Quick to reply. Quick to help.',
};

const tag = s => '#' + s.replace(/[^A-Za-z0-9]/g, '');

function writePosts(facts) {
  const town = facts.town || 'your area';
  const ratingLine = facts.rating ? `${facts.rating.toFixed(1)}★ from ${facts.reviewsCount} Google reviews` : `${facts.reviewsCount} Google reviews`;
  const townTag = tag(town);
  const best = facts.bestReviews[0];
  if (!best) throw new Error('No usable 4–5★ review found, so there is nothing real to quote.');

  const topService = facts.services[0]?.key || 'general';
  const tip = TIPS[topService] || TIPS.general;
  const topThemes = facts.themes.slice(0, 2);
  const trustKey = topThemes[0]?.key || 'thorough';

  const posts = [
    {
      kind: 'review',
      label: 'Review post · a real Google review, quoted word for word',
      quote: best.quote,
      stars: best.stars,
      source: 'Google review',
      footer: ratingLine,
      caption: `This is why we do it. Thank you for the kind words 🧡\n\n${ratingLine}. Book your clean${facts.phone ? `: ${facts.phone}` : ' today'}.\n\n${townTag} ${tag(town + 'Cleaner')} #CleaningService`,
    },
    {
      kind: 'tip',
      label: `Tip post · built on the service your customers mention most (${topService.replace(/_/g, ' ')})`,
      title: tip.title(town),
      items: tip.items,
      cta: tip.cta,
      caption: `Save this one 📌\n\n${tip.cta}${facts.phone ? ` ${facts.phone}` : ''}\n\n${townTag} ${tip.tags.map(tag).join(' ')}`,
    },
    {
      kind: 'trust',
      label: 'Trust post · from what reviewers praise most, with real counts',
      title: TRUST_HEADLINES[trustKey],
      pills: [
        facts.rating ? `${facts.rating.toFixed(1)}★ on Google` : null,
        `${facts.reviewsCount} reviews`,
        ...topThemes.map(t => `"${t.label}" in ${t.mentions} of ${facts.reviewsAnalysed} recent reviews`),
      ].filter(Boolean).slice(0, 4),
      photoSlot: true,
      caption: `Don't take our word for it. Our customers keep saying the same thing: ${topThemes.map(t => t.label).join(' and ') || 'spotless'}.\n\nAdd your team photo here before posting.\n\n${townTag} #LocalBusiness #CleaningService`,
    },
  ];
  return posts;
}

module.exports = { writePosts };
