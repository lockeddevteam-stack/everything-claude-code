# Protect Our Future Cayman website

## What this site is

This is the website for Protect Our Future (POF) Cayman, served at protectourfuturecayman.org. It is a static site built with [Astro](https://astro.build) and hosted on Cloudflare Pages. All the content that changes (events, news, chapters, campaigns, team roles) lives in plain Markdown files under `src/content`. You do not need to install anything to update it. You edit a file on github.com, commit it to the `main` branch, and Cloudflare rebuilds the live site in about two minutes.

The one address you need is `protectourfuturecayman@gmail.com`. Every form and every "email us" link on the site points there.

## How to add an event

Screenshots to be added by the first student who does this.

1. Go to the repository on github.com and open the folder `src/content/events`.
2. Open `_TEMPLATE-copy-me.md`. Click the "Raw" button, select everything, and copy it.
3. Go back to the `src/content/events` folder. Click "Add file", then "Create new file".
4. Name the file `YYYY-MM-DD-short-name.md`. For example `2026-11-07-barkers-cleanup.md`. Use the date the event starts. Use lower-case letters and hyphens, no spaces.
5. The file name must NOT start with an underscore. The site ignores any file that starts with `_`. That is how the template stays hidden.
6. Paste the template into the editor and change each field. The fields are explained below.
7. Scroll down, write a one-line commit message such as "Add Barkers cleanup", choose "Commit directly to the main branch", and click "Commit changes".
8. Wait about two minutes. Refresh protectourfuturecayman.org/events and the event is there.

Every event file starts with a block between two lines of `---`. Each line in that block is a field.

| Field | Required | What to put |
| --- | --- | --- |
| `title` | Yes | The name of the event. Keep it short. |
| `date` | Yes | Start date as `YYYY-MM-DD`, for example `2026-11-07`. |
| `endDate` | No | Last day of a multi-day event, same format. Leave it out for a one-day event. |
| `time` | No | Plain text, for example `8:00 am to 11:00 am`. |
| `location` | Yes | Where to meet, for example `Barkers National Park, West Bay`. |
| `district` | No | The district, for example `West Bay`. |
| `summary` | Yes | One or two sentences, up to 220 characters. This shows on the event list. |
| `action` | No | A button. It has two parts on their own indented lines: `label` (the words on the button) and `href` (where it goes, for example `/get-involved`). Remove all three lines if there is no button. |
| `bring` | No | A list of things to bring, one per line, each starting with `- `. Remove the whole list if it is not needed. |
| `cancelled` | No | Write `cancelled: true` if the event is called off. The event stays listed with a "Cancelled" label and its button is hidden. Do not delete the file. |

Anything you write below the second `---` line shows on the event's own page. Say where to meet, who to look for, and what happens if it rains.

Past events archive themselves. An event is "upcoming" until the end of its last day, Cayman time. The day after, it moves to the archive page on its own. Nobody deletes anything. The site is also rebuilt weekly so this happens even when nobody commits (see "Weekly rebuild" below).

## How to add a news item

News items live in `src/content/news`. Create a new file the same way as an event. Name it by date and a short slug, for example `2026-04-12-compass-cleanup.md`. It must not start with an underscore.

| Field | Required | What to put |
| --- | --- | --- |
| `title` | Yes | The headline. |
| `outlet` | Yes | Who published it, for example `Cayman News Service`. For POF's own milestones write `Protect Our Future`. |
| `date` | Yes | `YYYY-MM-DD`. If you only know the month, use the first of the month. If you only know the year, use `YYYY-01-01`. |
| `datePrecision` | No | How much of the date is real: `day` (default), `month`, or `year`. With `month` the site shows "March 2026". With `year` it shows "2026". This is how you avoid inventing a day. |
| `url` | No | The link to the article. Leave it out until you have confirmed the link works. Without a url the headline shows as plain text. With one it becomes a link. |
| `kind` | No | `coverage` (default), `award`, or `milestone`. |
| `summary` | Yes | One or two sentences, up to 280 characters. |

News files usually have nothing below the second `---`.

## How to update a chapter

Chapters live in `src/content/chapters`, one file per school. Open the file, click the pencil icon to edit, change the fields, and commit.

| Field | Required | What to put |
| --- | --- | --- |
| `school` | Yes | The full school name. |
| `shortName` | No | A shorter version for tight spaces. |
| `status` | Yes | `active` or `forming`. Only active chapters count on the About page. |
| `meeting` | No | When and where the chapter meets, for example `Tuesdays, 3:15 pm, Room 12`. |
| `leaderRole` | No | The title of the chapter lead. Defaults to `Chapter Lead`. |
| `leaderName` | No | The current student lead. Only add a name with that student's permission. |
| `project` | No | What the chapter is working on this term. |
| `order` | No | A number that sets the order on the page. Lower comes first. Defaults to 50. |

Blank fields are a normal state, not a mistake. This is what the site shows when they are empty:

- `meeting` blank: "Time confirmed each term. Email to be introduced."
- `leaderName` blank: "A current student. Ask by email and we will connect you."
- `project` blank: "Project for this term not yet posted. Contact: protectourfuturecayman@gmail.com" (only shown for active chapters).

To add a new school, create a new file in the folder using an existing one as a guide.

## How to update a campaign status

Campaigns live in `src/content/campaigns`. Each one has a status that the President signs off each term.

| Field | Required | What to put |
| --- | --- | --- |
| `title` | Yes | The campaign name. |
| `status` | Yes | `active` (POF is working on it now), `won` (the outcome POF asked for happened), or `ongoing` (a long-running issue with no single finish line). |
| `statusNote` | Yes | One line saying what the status means right now. This is shown next to the status label. Update it whenever the status changes. |
| `started` | No | The year the campaign began. |
| `summary` | Yes | One or two sentences, up to 220 characters. |
| `action` | Yes | A button with `label` and `href`, same as events. |
| `featured` | No | `true` puts this campaign at the top of the Our Work page and on the home page. Only one campaign should be featured at a time. If none is, the site picks the first by `order`. |
| `image` | No | The base name of a rights-cleared photo (see "Photos"). Leave out until one exists. |
| `imageAlt` | No | A description of the photo for screen readers. Required if `image` is set. |
| `order` | No | Sort order. Lower comes first. |

Everything below the second `---` is the campaign's full page. Use `##` headings for sections.

## How to update team roles

Team roles live in `src/content/team`, one file per role. The role stays the same from year to year. The holder changes every school year.

| Field | Required | What to put |
| --- | --- | --- |
| `role` | Yes | The role title, for example `President`. Do not rename roles without a handover meeting. |
| `holder` | No | The current student's name. Leave blank until the roster is confirmed and the student agrees to be named. Blank shows "Current holder to be named for this school year." |
| `school` | No | The holder's school. Shown after the name. |
| `responsibility` | Yes | What the role does, in one or two sentences. |
| `order` | No | Sort order. Lower comes first. |

Each September, update `holder` and `school` in every file. Each June, clear the graduating students' names.

## How to update the numbers

The figures on the home page and the About page come from `STATS` in `src/lib/site.ts`. Each one has a `value`, a `label`, and a `source`. Only change a figure when you have a source you can name: a news article, a government result, or a POF count with a date. Put that source in the `source` field. If you cannot name a source, do not change the number.

The same file holds `SITE.boilerplate`, the standard paragraph about POF used on the press page. Keep it in step with the numbers.

## Photos

There are no photographs in the repository yet. Every photo on the site goes through the `Photo` component in `src/components/Photo.astro`. It expects each image in six files inside `public/images`:

```
/images/<name>-400.avif   /images/<name>-800.avif   /images/<name>-1600.avif
/images/<name>-400.webp   /images/<name>-800.webp   /images/<name>-1600.webp
/images/<name>-400.jpg    /images/<name>-800.jpg    /images/<name>-1600.jpg
```

The `image` field in a campaign file (or the `src` prop in a page) is just `<name>`, with no size and no extension.

Before any photo goes in the repository:

- Every identifiable person in it must have agreed to be on the website.
- Anyone under 18 needs a parent or guardian's written consent.
- Keep the consent record with the shared inbox, not on a personal phone.

Until an image exists, the site shows a solid colour block in its place. That is on purpose. It is never a broken-image icon and nothing needs fixing.

## Settings that live in Cloudflare

Some settings are not in the repository. They are environment variables set in Cloudflare Pages under Settings, then Environment variables. The full list is in `.env.example`. All of them are optional. When one is blank, the site falls back to something honest instead of a dead button.

- `PUBLIC_FORMSPREE_CONTACT`: Formspree form ID for the contact form. Blank: the form opens the visitor's email app with the message filled in.
- `PUBLIC_FORMSPREE_VOLUNTEER`: Formspree form ID for the volunteer form. Blank: same email fallback.
- `PUBLIC_FORMSPREE_CHAPTER`: Formspree form ID for the "start a chapter" form. Blank: same email fallback.
- `PUBLIC_MAILCHIMP_ACTION`: the Mailchimp embedded form action URL. Blank: the newsletter box shows "email us with the word newsletter" instead of a form.
- `PUBLIC_FYGARO_URL`: the Fygaro payment link issued by Sustainable Cayman. Blank: the donate button becomes "Email to give".
- `PUBLIC_OVERSEAS_GIVING_URL`: a CAF America or GlobalGiving page, once one exists. Blank: the support page says to email us to arrange it.
- `PUBLIC_CF_ANALYTICS_TOKEN`: Cloudflare Web Analytics token. Blank: no analytics script is loaded.

Every Formspree form must deliver to the shared POF inbox, never to a personal address. After changing a variable, trigger a new deployment in Cloudflare so it takes effect.

## Deploying on Cloudflare Pages

1. In Cloudflare, go to Workers and Pages, then Create, then Pages, then Connect to Git.
2. Choose the GitHub repository. Set the production branch to `main`.
3. Build settings: root directory `pof-cayman-website`, build command `npm run build`, build output directory `dist`.
4. Under environment variables, set `NODE_VERSION` to `20` (or newer). Add any of the `PUBLIC_*` variables above that you have values for.
5. Save and deploy. The first build takes a few minutes.
6. Under Custom domains, add `protectourfuturecayman.org`. Also add `www.protectourfuturecayman.org`.
7. On the same Pages project, also add `pofcaribbean.org`, `www.pofcaribbean.org`, `protectourfuture-eco.com` and `www.protectourfuture-eco.com` as custom domains. The redirect rules in `public/_redirects` only fire for domains attached to this project. Once attached, every old address and every `www` address sends visitors to the matching page on protectourfuturecayman.org.

`public/_redirects` also maps old Squarespace and Wix paths (for example `/about-us`) to the new pages, so old press links keep working.

## Weekly rebuild

Past events disappear from the upcoming list because the site is rebuilt, not because anyone edits a file. If nobody commits for a month, the site is not rebuilt and a past event would sit on the list. This repository does not use `.github/workflows` for this. Instead:

1. In the Cloudflare Pages project, go to Settings, then Builds and deployments, then Deploy hooks. Create a hook called "weekly" and copy its URL.
2. Call that URL once a week. A Cloudflare Worker with a Cron Trigger can do it, or a free scheduler service such as cron-job.org. Set it to Monday early morning, Cayman time.
3. Store the hook URL in the shared password manager. Anyone with it can trigger a build, so do not paste it in chat.

## Running locally

Almost nobody needs this. If you do, install Node 20 or newer, then in the `pof-cayman-website` folder:

```
npm install        # once
npm run dev        # live preview at http://localhost:4321
npm test           # date and archive logic tests
npm run build      # builds the site into dist/
npm run verify     # checks the built site for broken links, missing titles, and past events
```

Copy `.env.example` to `.env` if you want to test the Formspree, Mailchimp or Fygaro settings locally.

## Where to get help

Email `protectourfuturecayman@gmail.com`. That is the only verified POF address. For account and handover matters, see `docs/HANDOVER.md`.
