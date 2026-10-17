# srisaividyanikethan.edu.in

The website of Sri Sai Vidyanikethan E.M School, Adapur, built with Jekyll on the school's **Udaya** design system and hosted on GitHub Pages. GitHub builds and publishes the site on every push to `main`.

**Never delete** `CNAME` (the custom domain) or `pinterest-6e078.html` (Pinterest verification).

## Preview on your computer (Windows)

One-time setup: Ruby 3.3 with DevKit (`winget install RubyInstallerTeam.RubyWithDevKit.3.3`), then in this folder:

```sh
bundle config set --local path vendor/bundle
bundle install
```

Each time:

```sh
bundle exec jekyll serve --config _config.yml,_config.dev.yml --unpublished
```

Open http://127.0.0.1:4000. The extra config and `--unpublished` show the **sample** notices and events, so every component can be checked; the live site never shows them. Drop both flags to see exactly what GitHub Pages will publish.

## Where things live

| To change | Edit |
| --- | --- |
| Phone, email, address, office hours, links (booking, portal, admission form), social channels | `_data/site.yml` |
| Header and footer menus | `_data/navigation.yml` |
| Home-page text, facts, programmes, quick links, values, gallery | `_data/home.yml` |
| School calendar (holidays, exams, events, meetings) | the school's Google Calendar; the script in [tools/email-to-notice/](tools/email-to-notice/README.md) writes it to `_data/events.yml` (don't edit that file) |
| Notices | one Markdown file per notice in `_notices/`. The headmistress posts them by email ([docs/how-to-post-a-notice.md](docs/how-to-post-a-notice.md)); the script and its setup are in [tools/email-to-notice/](tools/email-to-notice/README.md). They can also be edited in Pages CMS (`.pages.yml`) |
| Page frame (head, utility bar, header, footer) | `_includes/frame/` |
| Udaya components | `_includes/sv/` — one file per component, cut from the design system's kit |
| Udaya styles | `assets/css/ssvn.css` — an unedited copy of the kit; replace it, never edit it |
| Site-only styles and behaviour | `assets/css/site.css`, `assets/js/site.js` |

Writing an include? Variables assigned in an include are visible to the page that uses it, so prefix them (`ni_`, `es_`, …). Don't name a parameter `size`, `first` or `last`: Liquid reads those as properties of the parameter list.

Search engines: [docs/seo.md](docs/seo.md) (what's built in, and the Google steps after launch).

The plan for the rest of the site is in `docs/website-plan.md`.
