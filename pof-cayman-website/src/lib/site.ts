/* Facts and settings used across pages. Verified facts only. */
export const SITE = {
  name: 'Protect Our Future Cayman',
  shortName: 'Protect Our Future',
  abbr: 'POF',
  url: 'https://protectourfuturecayman.org',
  email: 'protectourfuturecayman@gmail.com',
  instagram: { handle: '@protectourfuture.eco', url: 'https://www.instagram.com/protectourfuture.eco/' },
  facebook: { handle: '@protectourfuture.eco', url: 'https://www.facebook.com/protectourfuture.eco' },
  founded: 2018,
  boilerplate:
    'Protect Our Future (POF) is a youth-led grassroots environmental organisation in the Cayman Islands. Founded in 2018 by four students at Cayman International School, it now has around 180 active members across four high schools and works on three fronts: protecting natural habitats through legislation, educating the public on behaviour, and sustainable development. POF campaigned for years against cruise berthing in George Town Harbour; on 30 April 2025, 63.66% of referendum voters said no. Members have represented the Cayman Islands at COP25, COP26, COP27 and COP28.',
  fiscalPartner: { name: 'Sustainable Cayman', npo: 'NPO-612' },
};

export const NAV = [
  { label: 'About', href: '/about' },
  { label: 'Our Work', href: '/our-work' },
  { label: 'Get Involved', href: '/get-involved' },
  { label: 'Events', href: '/events' },
  { label: 'News', href: '/news' },
] as const;

/* Verified numbers. Each carries a date or a source. Update on /about when a figure changes. */
export const STATS = [
  { value: '180', label: 'active student members', source: 'Cayman News Service, March 2026' },
  { value: '4', label: 'high school chapters', source: 'Generation Green, 2026' },
  { value: '63.66%', label: 'voted no to cruise berthing', source: 'Referendum, 30 April 2025' },
  { value: '2 tons', label: 'of plastic removed in one day', source: 'World Cleanup Day, 13 sites, 300 volunteers' },
] as const;

/* Environment-driven integrations. Each has a defined fallback when unset. */
const env = import.meta.env;
export const INTEGRATIONS = {
  formspree: {
    contact: env.PUBLIC_FORMSPREE_CONTACT || '',
    volunteer: env.PUBLIC_FORMSPREE_VOLUNTEER || '',
    chapter: env.PUBLIC_FORMSPREE_CHAPTER || '',
  },
  mailchimp: env.PUBLIC_MAILCHIMP_ACTION || '',
  fygaro: env.PUBLIC_FYGARO_URL || '',
  overseasGiving: env.PUBLIC_OVERSEAS_GIVING_URL || '',
  cfAnalytics: env.PUBLIC_CF_ANALYTICS_TOKEN || '',
};
