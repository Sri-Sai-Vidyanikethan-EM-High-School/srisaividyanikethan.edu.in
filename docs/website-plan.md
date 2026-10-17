# srisaividyanikethan.edu.in — rebuild plan

A plan to replace the current one-page site with a responsive, modular website built on the **Sri Sai Vidyanikethan (Udaya) design system**, still hosted free on GitHub Pages.

Status: revised with decisions · 15 October 2026 · phases 0–6 built on the `redesign` branch (email script: `tools/email-to-notice/`; Pages CMS: `.pages.yml`, `docs/pages-cms.md`)

---

## 1. Where we are today

The current site is one page: [index.html](../index.html), [style.css](../style.css), [carousel.css](../carousel.css) and [script.js](../script.js).

**How it uses the RSS feed** ([script.js:53-150](../script.js#L53-L150)):

- On load, it fetches the Atom feed `https://nsaraswathi.github.io/srisaividyanikethan-updates/feed.xml`. That feed comes from a separate Jekyll blog the headmistress writes in.
- The feed is fetched through **feednami**, a third-party proxy script that converts it to JSON. The proxy isn't needed: GitHub Pages serves the feed with `Access-Control-Allow-Origin: *`, so a browser can read it directly.
- It puts the newest 5 entries into a jQuery carousel that **autoplays every 6 seconds**. Each item shows the title, a date in `dd/mm/yyyy` (it formats dates with the `pt-BR` locale) and "n out of 5".
- `createFeedList` writes the newest 20 entries into a `.list` element that doesn't exist on the page, so that code does nothing.
- Item HTML is built by joining strings together. A title containing `<` or `'` would break the markup.
- The feed has only 2 posts, the latest dated 15 April 2025, with no categories or tags.

**What to keep from it:** a list of dated notices, each with a title, date, short summary and link. In the Udaya system this becomes the **NoticeBoard / NoticeItem** components, and notices now live in this repo (§5). Udaya forbids autoplaying carousels, so the carousel, jQuery and feednami all go. **The old updates blog is left alone:** not edited, not imported, not redirected.

**Other things to change:**

| Today | Change |
| --- | --- |
| Student portal → `eskooly.com/bb/signin.php` | `https://eskooly.com/bb/StudentPortal/signin.php` (decided), opens in a new tab. |
| "Admissions" → Zoho application form | Kept as an "Apply online" link opening in a new tab (§6). "Book an admission visit" becomes the main action. |
| LinkedIn icon linking to `#` | Removed. Udaya's official channels are Facebook, Instagram, YouTube, X and Pinterest. |
| Pulsing WhatsApp button | Replaced by WhatsApp in QuickLink and ContactStrip. Udaya's motion is "a sunrise, not a firework". |
| Manual dark-mode button | Kept as a small toggle; defaults to the device setting (§7). |
| `site.webmanifest` theme white / background black | Set to the Udaya `paper` colour. |

**Files that must survive the rebuild, untouched, at the repo root:**

| File | Why |
| --- | --- |
| `CNAME` | Points GitHub Pages at `srisaividyanikethan.edu.in`. History shows it has been deleted and re-created several times; losing it takes the domain offline. |
| `pinterest-6e078.html` | Pinterest domain verification. Must stay reachable at `/pinterest-6e078.html`. |
| `favicon.ico`, `favicon.svg`, `favicon-96x96.png`, `apple-touch-icon.png`, `web-app-manifest-192x192.png`, `web-app-manifest-512x512.png`, `site.webmanifest` | Browsers and phones request these from the root by fixed names. |
| `SSVN_Logo.png` | The same file as Udaya's `ssvn-emblem.png`. Keep it so old links to it don't break; new pages use `ssvn-emblem-on-chalk.png`. |

---

## 2. Choosing how to build it

Every page shares the same frame (utility bar, header, footer) and draws on the same ~20 components (cards, notice rows, buttons). The build tool decides **how many places you edit when something changes**.

### The options, in plain terms

**A. Plain HTML (what we have now).** Every page is a complete `.html` file. GitHub Pages serves them as they are.
- Good: nothing to learn or install.
- Bad: the header and footer are copied into every page. Adding a menu item or changing the phone number means editing 7+ files by hand, and they drift apart. Notices and events are typed as HTML.

**B. Jekyll (built into GitHub Pages).** You write the header once in `_includes/site-header.html`, and every page pulls it in with `{% include site-header.html %}`. Lists such as events, staff and quick links live in small YAML data files; a page loops over them to produce the cards. When you push to GitHub, **GitHub runs Jekyll for you** and publishes the result. No build setup, no workflow file.
- Good: no tooling to deploy. The templates are just HTML with a few `{% %}` tags. Data files are plain text, which tools like Pages CMS (§5) can edit through forms.
- Bad: previewing on your own computer needs Ruby (or Docker / GitHub Codespaces). GitHub only allows a fixed list of Jekyll plugins.

**C. Eleventy (11ty) + GitHub Actions.** Works much like Jekyll (includes + data files) but runs on Node.js. GitHub Pages doesn't run it natively, so a workflow file builds and deploys the site.
- Good: very flexible; JavaScript instead of Ruby.
- Bad: one more moving part (the workflow, Node versions, npm packages) to keep working for years.

**D. React / Next.js / Astro.** Component frameworks for interactive web apps.
- Good: powerful; Udaya also ships a React bundle (`window.SSVN`).
- Bad: far more tooling than a 7-page school site needs. Pages would depend on JavaScript to show content, and npm dependencies need regular updates or the build breaks. Whoever maintains it next would need React skills.

### Recommendation: **Jekyll**

- **Modular:** each Udaya component becomes one include file (`_includes/sv/notice-item.html`); each site-wide fact (phone, hours, links) lives once in `_data/site.yml`.
- **Easy for the headmistress:** notices and events are plain files that the email script and Pages CMS (§5) both write. She never sees GitHub.
- **Nothing to run or pay for:** GitHub builds it on every push. If no one touches the code for a year, the site still works.
- **Fits Udaya:** the design system has a plain-HTML kit (`kit/ssvn.css` + `kit/home.html` + `kit/page-template.html`) whose markup can be cut straight into includes.
- **Notices without JavaScript:** notices are built into the pages, so they show even if scripts fail.

What you'll need to learn: [Jekyll's step-by-step tutorial](https://jekyllrb.com/docs/step-by-step/01-setup/) (about an hour). Includes, data files and collections are the only three ideas this site uses.

---

## 3. Site structure

Following Udaya's site map (README → "The home page" and "Site map"):

| URL | Page | Sections (each: Section → SectionHeading → one content block) |
| --- | --- | --- |
| `/` | Home | Hero (school motto + Shirdi Sai Baba in a Sannidhi ArchFrame) + FactStrip · ProgramCards + QuickLinks (sandal) · NoticeBoard + EventSchedule "Coming up" (paper) · ValuePillars (sandal) · Gallery + VideoCard (paper, muggu) · CtaBand · Contact (paper) |
| `/about/` | About | Our story · Our inspiration (night, Sannidhi) · Values · Our team (PersonCards) |
| `/academics/` | Academics | Pre-primary · Primary · High School (ProgramCards) · Learning online (InfoCards: Google Classroom, student portal) |
| `/school-life/` | School life | Gallery · Films · Transport |
| `/admissions/` | Admissions | How to apply · Book a visit · Apply online (Zoho link) · Downloads (InfoCards) |
| `/notices/` | Notices | NoticeBoard (all, newest first) · EventSchedule (full year, PDF link) |
| `/notices/<date>-<slug>/` | One notice | PageHeader + notice body + attachments |
| `/contact/` | Contact | ContactStrip · OfficeHours · map link · SocialLinks |
| `/404.html` | Not found | PageHeader + QuickLinks |

Content not yet available (classes offered, staff, the 2026–27 calendar, facilities, transport, downloads, Telugu lines) will be added later. Each page launches with the sections we have content for and gains sections as content arrives; the data files make that a content edit, not a code change.

**Changes from Udaya's home-page recipe** (propose them to the design system):

- The FactStrip is flat (`sv-facts-wrap--flat` in `site.css`): no raised card or overlap with the hero, hairline dividers, four across / two across below 1100px / a list on phones (decided 16 October 2026: the raised card read as one big button).
- The hero's buttons are "Contact us" (primary, calls the office), "WhatsApp" and "Admission form" (decided 16 October 2026). The two secondary buttons use tinted outlines (`sv-btn--tint-neem`, `sv-btn--tint-saffron` in `site.css`): outline and text in the meaning colour, filling with its soft tint on hover.
- The main action is labelled "Plan a visit" (`booking_label` in `_data/site.yml`) instead of "Book an admission visit" (decided 16 October 2026).
- The hero's headline is the Telugu school motto with its English meaning, beside Shirdi Sai Baba in a Sannidhi arch (decided 16 October 2026). This replaces the campus photo and the separate night "Our inspiration" band, keeping one devotional image per page.
-  Udaya puts an enquiry form in the contact section, but GitHub Pages can't receive form submissions (§6). The contact section shows ContactStrip (call, WhatsApp, email, visit) + OfficeHours instead. Propose this change to the design system so its recipe matches.

---

## 4. Repository layout

```
CNAME                        ← keep, untouched
pinterest-6e078.html         ← keep, untouched (copied through as-is: no front matter)
favicon*, apple-touch-icon.png, web-app-manifest-*.png, site.webmanifest, SSVN_Logo.png  ← keep
_config.yml                  ← site settings, plugins, collections, excludes (docs/, tools/, README)
Gemfile                      ← `github-pages` gem, only for local preview
.pages.yml                   ← Pages CMS: what the headmistress can edit (§5)

_layouts/
  default.html               ← the page frame: head, icon sprite, UtilityBar, SiteHeader, {{ content }}, CtaBand?, SiteFooter, scripts
  page.html                  ← default + PageHeader (breadcrumbs, title, Telugu line, lede)
  notice.html                ← a single notice

_includes/
  frame/                     ← head.html, icon-sprite.html, utility-bar.html, site-header.html, site-footer.html, cta-band.html, theme-toggle.html
  sv/                        ← one file per Udaya component, taking parameters:
                               section-heading, info-card, quick-link, notice-item, notice-board,
                               event-schedule, program-card, value-pillar, person-card, gallery-card,
                               video-card, arch-frame, fact-strip, contact-strip, office-hours,
                               social-links, badge, button, shloka, sun-mark

_data/
  site.yml                   ← the "Calls to action" table: phone, WhatsApp, email, booking URL, portal URL, Zoho form URL, address, hours, socials
  navigation.yml             ← header and footer links (header ≤ 6)
  events.yml                 ← the school calendar (start, end, title, type, note)
  programmes.yml, quick_links.yml, values.yml, team.yml, gallery.yml, facts.yml

_notices/                    ← one Markdown file per notice (§5)
  2026-10-14-vijayadashami-holiday.md

index.html, about.html, academics.html, school-life.html, admissions.html, notices.html, contact.html, 404.html

assets/
  css/ssvn.css               ← copied from the Udaya kit, never edited here
  css/site.css               ← small site-only additions, tokens only (e.g. the theme toggle)
  js/site.js                 ← menu, theme toggle, lazy video, "today" in office hours, past events; no jQuery
  fonts/                     ← optional self-hosted Udaya fonts (woff2 + OFL licences)
  images/emblem/, images/campus/, images/devotional/
  notices/                   ← PDFs and photos attached to notices

tools/
  email-to-notice/Code.gs    ← the Google Apps Script (§5), kept here for version history; not published

.github/workflows/check.yml  ← on pull requests: Jekyll build + link/HTML check

docs/                        ← this plan and the maintainers' guide (not published)
```

**How a component include looks** (illustrative):

```liquid
{% for notice in site.notices reversed limit: 5 %}
  {% include sv/notice-item.html notice=notice %}
{% endfor %}
```

`_includes/sv/notice-item.html` holds the kit's `<li class="sv-notice">…</li>` markup once, filling in the date tile, badge, title and link from the notice.

**Keeping Udaya in sync:** `assets/css/ssvn.css` is a straight copy of the design system's `kit/ssvn.css`. A header comment records the design system version it came from. When Udaya changes, copy the new file over; don't edit it in this repo. Anything new the site needs gets proposed to the design system first (Udaya's rule): the theme toggle (§7) and the form-free contact section (§3).

---

## 5. Notices: the headmistress emails them in

The headmistress can't use GitHub, so she gets two ways to manage notices. Neither shows her GitHub:

- **Email** (`ssvn.em.high.school@gmail.com`) to post a notice in seconds from her phone.
- **Pages CMS**, a simple web editor, to fix, remove or list notices and to update the school calendar.

Both write the same files in this repo:

```
 Gmail (headmistress)  ──► Apps Script in that Gmail account ──►┐
                                                                  ├──► _notices/*.md ──► GitHub Pages rebuilds (~1–2 min)
 Pages CMS web editor (headmistress, invited by email) ─────────►┘
```

### 5.1 What a notice is

One small Markdown file per notice in `_notices/`:

```markdown
---
title: School closed on 20 October for Vijayadashami
title_te: విజయదశమి సందర్భంగా అక్టోబర్ 20న పాఠశాలకు సెలవు
date: 2026-10-14
category: Holiday          # Holiday · Admissions · Academics · Event · Celebration · General
urgent: true               # kumkum date tile; at most one at a time
expires: 2026-10-21        # urgent styling and home-page listing drop after this date
attachments:
  - assets/notices/2026-10-14-holiday-circular.pdf
---
School will be closed on Tuesday 20 October for Vijayadashami. Classes resume on Wednesday 21 October.
```

Jekyll turns these into the home-page NoticeBoard (newest 3–5), the full `/notices/` list, a page per notice, and a **`/notices/feed.xml`** RSS feed (the built-in `jekyll-feed` plugin). The board starts empty; the first email fills it.

### 5.2 Posting by email

**What the headmistress does:** from `ssvn.em.high.school@gmail.com`, she sends an email to **`ssvn.em.high.school+notice@gmail.com`**. That's the same inbox: Gmail ignores everything after the `+`, and the script uses it to spot notices. She can save it as a contact named "Website notice".

| Part of the email | Becomes |
| --- | --- |
| Subject | The notice title. Optional tags anywhere in it: `[Urgent]`, `[Holiday]`, `[Admissions]`, `[Academics]`, `[Event]`, `[Celebration]`. With no tag, the category is General. |
| Body | The notice text. A first line starting `Telugu:` becomes the Telugu title. Signatures and quoted replies are stripped. |
| Attachments | PDFs and JPG/PNG photos (up to 5 MB each) are saved to `assets/notices/` and listed as downloads. |
| Date sent | The notice date. For urgent notices, `expires` is set 7 days later. |

Within about 5 minutes she gets a reply in the same email thread: *"Published: School closed on 20 October… — will be live at srisaividyanikethan.edu.in/notices/… in about 2 minutes."* If something failed, the reply says what to fix.

**Fixing or removing by email:** she replies in the same thread.
- A reply with new text replaces the notice.
- A reply containing just the word `remove` takes it down.

**How it works (for the maintainer):**
- A **Google Apps Script** project owned by `ssvn.em.high.school@gmail.com` (free) runs every 5 minutes.
- It searches `in:sent to:ssvn.em.high.school+notice@gmail.com` for threads with messages it hasn't handled yet, and checks **every message** for Gmail's `SENT` label. Outsiders can email the `+notice` address (and a forged reply can even land in a real notice's thread), but they can't put mail in the account's Sent folder, so forged emails are ignored.
- It writes the notice file (and any attachments) to this repo through the GitHub API, in one commit, and labels the thread `website/published`. The thread → file mapping is kept in the script's private storage, not in the public repo.
- Access: a **fine-grained GitHub token** limited to this one repository with *Contents: read and write* only, stored in the script's Script Properties (never in the repo).
- Pushes made with a personal token trigger the normal GitHub Pages build, so no GitHub Actions workflow is needed.
- **Yearly upkeep:** GitHub org policy caps fine-grained tokens at 366 days by default. The script emails the account 30 days before the stored expiry date, and immediately if GitHub rejects the token. Renewing takes 2 minutes (steps in `docs/maintainers.md`).
- Gmail and Apps Script free quotas are far above what a school notice board needs.
- The script's source lives in `tools/email-to-notice/` in this repo, so changes are tracked. It's pasted into the Apps Script editor when updated.

### 5.3 Editing with Pages CMS

[Pages CMS](https://pagescms.org) is a free hosted web editor for content stored in a GitHub repo. A `.pages.yml` file in the repo describes the forms she sees:

- **Notices:** a list of all notices. She can edit title, Telugu title, date, category, urgent, expiry, text and attachments, or delete a notice.
- **School calendar:** `_data/events.yml` as a list of events (start, end, title, type, note).
- **Photos:** upload to `assets/images/campus/` (consent is collected offline).

The maintainer installs Pages CMS on the repo once and **invites the headmistress by email as a collaborator**. Collaborators sign in with their email address, with no GitHub account, and can edit content and media but **can't change the site's settings or code**.

### 5.4 Safeguards

- Notices are public once posted (the repo is public, which is fine). The maintainers' guide reminds posters: no student names or phone numbers in notices.
- Udaya: "Never machine-translate a notice". The Telugu title is optional and written by a teacher.
- Nothing depends on scheduled GitHub Actions, which GitHub disables after 60 days without activity on public repos. The email script runs on Google's schedule; Pages builds run on every push.
- If the email script ever stops, Pages CMS still works, and so does editing a file on github.com.

**Events** (holidays, exams, meetings) are a separate list: `_data/events.yml`, shown by EventSchedule and edited in Pages CMS. Home shows the next few; the small script fades past dates (as the Udaya kit does), so the list stays correct between rebuilds.

---

## 6. Admissions and forms

**Update, 16 October 2026:** the admission form is now a **Google Form** (https://forms.gle/fUD2fsfQXaqXvpwZ7), linked from the home hero ("Admission form") and the Admissions page ("Apply online"), opening in a new tab. `application_url` in `_data/site.yml`. The Zoho notes below are kept for the record.

The school is on Zoho's **Free** plan. Custom themes and the "redirect after submit" option need a paid plan, and the HTML embed loses captcha. So **no embedding: links only.**

| Action | How |
| --- | --- |
| **Book an admission visit** (primary, site-wide) | Google Calendar booking link, new tab. |
| **Apply online** | The existing Zoho `SchoolApplicationForm` link, new tab. Shown as an InfoCard on Admissions and a QuickLink on Home. URL kept in `_data/site.yml`. |
| **Enquiries** | Call, WhatsApp, and email in ContactStrip. No on-site form. |

If an online enquiry form is wanted later, a second free Zoho form can be linked the same way.

---

## 7. Dark mode

- The default follows the device (`prefers-color-scheme`), as Udaya ships.
- A small sun/moon toggle in the UtilityBar sets `data-theme="dawn"` or `data-theme="dhuni"` on `<html>` and remembers the choice in `localStorage` (wrapped in try/catch).
- A tiny inline script in `<head>` applies the saved choice before the page paints, so there's no flash of the wrong theme.
- The toggle is a new component, so it gets proposed back to the Udaya design system ("ThemeToggle") for the catalogue.

---

## 8. Phases

| # | Phase | Delivers | Done when |
| --- | --- | --- | --- |
| 0 | **Set-up** | `redesign` branch; Jekyll skeleton; `_config.yml` (plugins: `jekyll-feed`, `jekyll-seo-tag`, `jekyll-sitemap`; exclude `docs/`, `tools/`); Udaya `ssvn.css`, fonts and images copied in; root files untouched; local preview working (Ruby, Docker or Codespaces). | `bundle exec jekyll serve` shows a framed blank page; `CNAME` and `pinterest-6e078.html` are present in `_site/`. |
| 1 | **Frame** | `default`/`page` layouts; UtilityBar (with theme toggle), SiteHeader (mobile menu), SiteFooter, CtaBand includes; `_data/site.yml` and `navigation.yml`; `site.js`. | Frame matches `kit/page-template.html` at 390px and 1280px, in both themes, with visible focus rings. |
| 2 | **Components** | The `_includes/sv/` library, built from the kit's markup. | A hidden `/styleguide/` page renders every include once. |
| 3 | **Home page** | Home sections from data files, with placeholder-free content only; campus photos copied from the Google Maps library into `assets/images/campus/`. | Home matches `kit/home.html`; Lighthouse ≥ 95 for accessibility and SEO. |
| 4 | **Notices on the site** | `_notices` collection, notice layout, `/notices/` page, `feed.xml`, `_data/events.yml`. | A hand-written sample notice and event appear on Home and `/notices/`. |
| 5 | **Email → notice** | Apps Script in `ssvn.em.high.school@gmail.com`; fine-grained token; confirmation replies; reply-to-update / `remove`; token-expiry reminder. | A notice emailed from the headmistress's phone is live in under 7 minutes; replying `remove` takes it down. |
| 6 | **Pages CMS** | `.pages.yml` for notices, events and photos; headmistress invited by email. | The headmistress edits a notice and adds an event without help. |
| 7 | **Inner pages** | About, Academics, School life, Admissions (Apply online + Book a visit), Contact, 404. | Each page follows the page frame with the sections we have content for. |
| 8 | **Checks** | `check.yml` on pull requests: Jekyll build + `html-proofer` (broken links, missing alt text). Manual pass: 390px, Dhuni, keyboard only, Telugu line-height. | The workflow passes on the `redesign` PR. |
| 9 | **Launch** | Merge `redesign` → `main`. Verify custom domain + HTTPS, `/pinterest-6e078.html`, favicons, sitemap. Submit the sitemap to Google Search Console. | The live site is served from the new build. |
| 10 | **Handover** | `docs/maintainers.md`: renew the GitHub token, update the Apps Script, add a Pages CMS collaborator, update Udaya, what never to delete (CNAME, Pinterest file). A one-page "How to post a notice" for the headmistress. | The headmistress posts a real notice using only the one-pager. |

Phases 0–5 give a launch-ready core. Phases 6–7 can launch together or follow, and inner-page content fills in as it arrives.

---

## 9. Decisions log

| # | Question | Decision (15 October 2026) |
| --- | --- | --- |
| 1 | Who posts notices? | The headmistress, without GitHub: **email from `ssvn.em.high.school@gmail.com`** to post, **Pages CMS** to edit. |
| 2 | Missing content | Added later; pages launch with what we have. |
| 3 | Student portal | `https://eskooly.com/bb/StudentPortal/signin.php` |
| 4 | Parents' consent for photos | Collected offline. |
| 5 | Admission form | Google Form, linked in a new tab (replaced the Zoho form on 16 October 2026). |
| 6 | Old updates blog | Left untouched; not imported. |
| 7 | Repo visibility | Public is fine. |
| 8 | Official name | "Sri Sai Vidyanikethan E.M School, Adapur", matching Google Maps (16 October 2026). Udaya's naming rule ("…E.M. High School, Adapur" in footers) should be updated to match. |
| 9 | Board, type, district | Andhra Pradesh State Board; co-educational; YSR Kadapa district. |
| 10 | Events | From the school's public Google Calendar, synced into `_data/events.yml` by the Apps Script on every change (17 October 2026). Type by `[tag]`, else event colour. Pages CMS edits notices only. |

**Still to confirm during Phase 5:** that the GitHub organisation (`Sri-Sai-Vidyanikethan-EM-High-School`) allows fine-grained tokens for its repos. An org owner may need to approve the token once.

---

Sources: [Zoho Forms — embed a form using HTML/CSS codes](https://help.zoho.com/portal/en/kb/forms/user-guide/embedding-forms/embedding-forms-in-webpages/articles/embed-a-form-using-html-css-codes) · [Zoho Forms plan comparison](https://zoho.com/sites/default/files/forms/zoho-forms-plan-comparison-usd.pdf) · [Pages CMS — collaborators](https://pagescms.org/docs/configuration/collaborators/) · [GitHub Docs — personal access token policy for organizations](https://docs.github.com/en/organizations/managing-programmatic-access-to-your-organization/setting-a-personal-access-token-policy-for-your-organization) · [GitHub Docs — disabling and enabling a workflow (60-day rule)](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/disable-and-enable-workflows)
