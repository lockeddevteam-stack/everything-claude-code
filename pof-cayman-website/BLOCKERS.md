# What POF still has to supply

The site is built and passes its checks. Each item below is something only POF can provide. Nothing here has been invented or filled in with a placeholder that could be mistaken for the real thing.

| Item | Where it goes | What the site shows until then |
|---|---|---|
| Vector logo files | `public/press/`, `src/components/Wordmark.astro` | A typographic wordmark in Bricolage Grotesque |
| Official colours and fonts, if any exist | `src/styles/tokens.css` | Palette chosen from Cayman ocean, reef, sand and mangrove tones, checked at 4.5:1 |
| Rights-cleared photography, with consent on file for every identifiable person and parental consent for under-18s | `public/images/` via `scripts/images.mjs`; set `image` and `imageAlt` on campaigns | Solid colour blocks from the palette, hidden from screen readers |
| Confirmation of use rights for photos credited to Heidi Bassett Blair and Courtney Platt | As above | Not used |
| Current leadership roster | `src/content/team/*.md`, `holder` and `school` | Role name with "Current holder to be named for this school year" |
| Per-chapter meeting times, leader names and current projects | `src/content/chapters/*.md` | "Time confirmed each term. Email to be introduced." |
| 2026 to 2027 event schedule | `src/content/events/` (copy `_TEMPLATE-copy-me.md`) | "The next event is being scheduled" plus newsletter signup |
| Confirmed links to press coverage | `src/content/news/*.md`, `url` | Outlet, date and summary without a link |
| Date of the World Cleanup Day figures (13 sites, 300 volunteers, over two tons) | `src/lib/site.ts` STATS source | Source shown without a year |
| Dates for the Mission Blue Hope Spot partnership and the National Conservation Act and National Energy Policy letters | `src/content/news/` | Mentioned without dates |
| Formal statement of legal status and donation handling, agreed with Sustainable Cayman | `/support`, footer | Wording drawn from the brief: not a registered NPO, donations via Sustainable Cayman (NPO-612) |
| Fygaro payment link from Sustainable Cayman | Cloudflare variable `PUBLIC_FYGARO_URL` | "Email to give" button |
| CAF America or GlobalGiving page | `PUBLIC_OVERSEAS_GIVING_URL` | Email instruction |
| Formspree form IDs (three forms), routed to the shared inbox | `PUBLIC_FORMSPREE_CONTACT`, `PUBLIC_FORMSPREE_VOLUNTEER`, `PUBLIC_FORMSPREE_CHAPTER` | Forms open the visitor's email app with the fields filled in |
| Mailchimp embedded form URL | `PUBLIC_MAILCHIMP_ACTION` | Email instruction |
| Cloudflare Web Analytics token | `PUBLIC_CF_ANALYTICS_TOKEN` | No analytics |
| An adult custodian (faculty or alumni) with access to the shared inbox, so under-16 sign-ups are never read by students alone | Privacy page wording, `docs/HANDOVER.md` | Privacy page says POF's current leadership reads the inbox |
| Role-based email addresses on the domain (president@, chapters@, events@, press@) | `src/lib/site.ts`, `docs/HANDOVER.md` | The shared inbox protectourfuturecayman@gmail.com everywhere |
| Domain access for protectourfuturecayman.org, pofcaribbean.org and protectourfuture-eco.com | Cloudflare Pages custom domains | Redirect rules are written in `public/_redirects` and fire once the domains are attached |
| Google Search Console access for the canonical domain | Launch checklist in README | Sitemap is generated at `/sitemap-index.xml` |
