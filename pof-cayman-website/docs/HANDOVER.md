# Graduation handover checklist

POF is run by students, and students graduate. Every year the people who know how the website, the domain and the accounts work leave school. If a login sits in one person's personal email, it leaves with them. This checklist exists so that nothing is lost at graduation. The rule underneath all of it: every account belongs to a role, not a person.

## Accounts to make role-based

Once email is set up on the organisation's domain, create these addresses and use them for every service:

- [ ] `president@` on the organisation's domain
- [ ] `chapters@` on the organisation's domain
- [ ] `events@` on the organisation's domain
- [ ] `press@` on the organisation's domain

Until domain email exists, the shared inbox `protectourfuturecayman@gmail.com` is the role address for everything.

- [ ] No service is ever registered to a personal email. If one is found, move it to a role address before the holder graduates.

## Shared password manager

Use one shared password manager vault for the organisation. These logins go in it:

- [ ] Domain registrar (where protectourfuturecayman.org is registered)
- [ ] Cloudflare
- [ ] GitHub organisation
- [ ] Formspree
- [ ] Mailchimp
- [ ] Fygaro / Sustainable Cayman contact details for donations
- [ ] Instagram (@protectourfuture.eco)
- [ ] Facebook (@protectourfuture.eco)
- [ ] Google account for the shared inbox
- [ ] Cloudflare Pages deploy hook URL (see README, "Weekly rebuild")

Rules for the vault:

- [ ] The custodian holds the master password. The President has a second copy.
- [ ] Two-factor recovery codes for every account are stored in the vault next to the login.
- [ ] Two-factor is turned on for every account that offers it, using the shared inbox or an authenticator app the custodian can recover.

## Custodian

- [ ] A faculty member or an alumnus is named custodian.
- [ ] The custodian is not a current student.
- [ ] The custodian has owner access to the GitHub organisation, the Cloudflare account, and the domain registrar.
- [ ] The custodian's name and how to reach them are recorded in the vault, not in this file.

## Domain

- [ ] `protectourfuturecayman.org` is registered to the organisation, not to a person.
- [ ] The renewal date is written in the vault and in the shared calendar.
- [ ] Auto-renew is on and the payment method belongs to the organisation.
- [ ] `pofcaribbean.org` and `protectourfuture-eco.com` are kept for at least two years so old links keep redirecting.
- [ ] Both retired domains are attached to the Cloudflare Pages project (see README, "Deploying on Cloudflare Pages").

## Each May or June, before graduation

- [ ] Hold a dated handover meeting with the outgoing and incoming holder of each role.
- [ ] Transfer each role. Walk through what the role does using the README.
- [ ] Rotate every password in the vault. Update the vault.
- [ ] Update the `holder` and `school` fields in `src/content/team/*.md`. Clear the names of graduating students.
- [ ] Update the chapter directory in `src/content/chapters/*.md`: status, meeting time, leader name, current project.
- [ ] Review every campaign status and `statusNote` in `src/content/campaigns/*.md`.
- [ ] Remove graduating students from the GitHub organisation.
- [ ] Remove graduating students as admins on Instagram and Facebook.
- [ ] Confirm the custodian can still log in to GitHub, Cloudflare and the domain registrar.
- [ ] Test every form on the live site: contact, volunteer, start a chapter, newsletter. Confirm each one arrives in the shared inbox.
- [ ] Test the donate button on the support page.

## Each September, for new leadership

- [ ] Confirm the roster and add the new `holder` and `school` to each `src/content/team/*.md` file, with each student's permission.
- [ ] Update the chapter directory for the new term.
- [ ] Review campaign statuses with the new President.
- [ ] Add new leads to the GitHub organisation with write access. Do not give owner access to students.
- [ ] Add new leads as social admins. Remove anyone who has left.
- [ ] Confirm the custodian still has access.
- [ ] Test every form and the donate button on the live site.
- [ ] Check the weekly rebuild is still firing (Cloudflare Pages, Deployments tab).

## Who to call

| Question | Role to ask |
| --- | --- |
| The site is down or a build failed | Communications Lead, then the custodian |
| Domain renewal or DNS | Custodian |
| A login does not work | President (vault access), then the custodian |
| Adding or fixing an event | Events Lead |
| Chapter directory | Chapters Lead |
| Press, news items, social accounts | Communications Lead |
| Campaign status or the numbers on the site | President |
| Donations, Fygaro, Sustainable Cayman | President |
| Photo consent | Communications Lead |

## Sign-off

Complete this block at each handover meeting and keep a copy in the shared inbox.

| | Name | Signature | Date |
| --- | --- | --- | --- |
| Outgoing role holder (role: ______________) | | | |
| Incoming role holder (role: ______________) | | | |
| Custodian | | | |

Date of handover meeting: ______________
