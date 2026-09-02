import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/*
  Content model. Students edit these files on GitHub in the browser.
  See README.md for step-by-step instructions with no local setup.
*/

const events = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/events' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),            // YYYY-MM-DD. Past dates archive automatically.
    endDate: z.coerce.date().optional(),
    time: z.string().optional(),      // "9:00 am to 12:00 pm"
    location: z.string(),             // "Barkers Beach, West Bay"
    district: z.string().optional(),
    summary: z.string().max(220),
    action: z.object({ label: z.string(), href: z.string() }).optional(),
    bring: z.array(z.string()).optional(),
    cancelled: z.boolean().default(false),
  }),
});

const news = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/news' }),
  schema: z.object({
    title: z.string(),
    outlet: z.string(),               // "Cayman News Service"
    date: z.coerce.date(),
    datePrecision: z.enum(['day', 'month', 'year']).default('day'),
    url: z.string().url().optional(), // add when the link is confirmed
    kind: z.enum(['coverage', 'award', 'milestone']).default('coverage'),
    summary: z.string().max(280),
  }),
});

const chapters = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/chapters' }),
  schema: z.object({
    school: z.string(),
    shortName: z.string().optional(),
    status: z.enum(['active', 'forming']),
    meeting: z.string().optional(),   // "Tuesdays, 3:15 pm, Room 12"
    leaderRole: z.string().default('Chapter Lead'),
    leaderName: z.string().optional(),
    project: z.string().optional(),   // current project; empty is a defined state
    order: z.number().default(50),
  }),
});

const campaigns = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/campaigns' }),
  schema: z.object({
    title: z.string(),
    status: z.enum(['active', 'won', 'ongoing']),
    statusNote: z.string(),           // one line: what the status means right now
    started: z.number().optional(),   // year
    summary: z.string().max(220),
    action: z.object({ label: z.string(), href: z.string() }),
    featured: z.boolean().default(false),
    image: z.string().optional(),     // /images/... once rights-cleared photography exists
    imageAlt: z.string().optional(),
    order: z.number().default(50),
  }),
});

const team = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/team' }),
  schema: z.object({
    role: z.string(),                 // role survives graduation; the name changes
    holder: z.string().optional(),    // current student, blank until confirmed
    school: z.string().optional(),
    responsibility: z.string(),
    order: z.number().default(50),
  }),
});

const partners = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/partners' }),
  schema: z.object({
    name: z.string(),
    url: z.string().url().optional(),
    note: z.string().optional(),
    logo: z.string().optional(),      // /partners/... once each partner supplies a file
    order: z.number().default(50),
  }),
});

export const collections = { events, news, chapters, campaigns, team, partners };
