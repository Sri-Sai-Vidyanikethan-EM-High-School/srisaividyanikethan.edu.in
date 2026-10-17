# Email → website notice (setup and upkeep)

The headmistress posts a notice by emailing **ssvn.em.high.school+notice@gmail.com** from **ssvn.em.high.school@gmail.com**. A Google Apps Script running in that Gmail account turns the email into a notice file in this repository; GitHub Pages republishes the site about a minute later. Her instructions: [docs/how-to-post-a-notice.md](../../docs/how-to-post-a-notice.md).

```
Gmail (Sent folder) ──every 5 min──► Code.gs ──GitHub API, one commit──► _notices/*.md (+ assets/notices/*) ──► GitHub Pages
        ▲                                │
        └──── "Published: …" reply ──────┘
```

| File | What it is |
| --- | --- |
| `Code.gs` | The script. Paste it into the Apps Script project. |
| `appsscript.json` | The project manifest: time zone, Gmail advanced service, permissions. |
| `test.js` | Tests with stand-ins for Gmail and GitHub: `node --test tools/email-to-notice/test.js` |

**Safety.** Only email the account *sent* counts (Gmail's Sent label). Anyone can write to the `+notice` address, but nobody else can put mail in the account's Sent folder, so forged emails, including forged replies threaded into a real notice, are ignored. Notice text is published as plain text (no HTML, no Jekyll template code), and titles are escaped on the page. The GitHub token can only change the contents of this one repository.

## One-time setup (about 15 minutes)

You need: the Google login for ssvn.em.high.school@gmail.com, and a GitHub account with write access to this repository.

### 1. Create the GitHub token

1. On GitHub: **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**.
2. Name: `Website notices (email)`. Expiration: the longest allowed (usually 366 days). Write the date down.
3. Resource owner: **Sri-Sai-Vidyanikethan-EM-High-School**. Repository access: **Only select repositories** → `srisaividyanikethan.edu.in`.
4. Repository permissions: **Contents → Read and write**. Leave everything else as "No access".
5. Generate, and copy the token (it is shown once).

If the organisation requires approval for fine-grained tokens, an organisation owner approves it under **Organisation settings → Personal access tokens → Pending requests**.

### 2. Create the Apps Script project

1. Signed in as **ssvn.em.high.school@gmail.com**, open https://script.google.com and choose **New project**. Name it `Website notices`.
2. **Project settings** (gear icon) → tick **Show "appsscript.json" manifest file in editor**.
3. In the editor, replace the contents of `Code.gs` with this folder's `Code.gs`, and `appsscript.json` with this folder's `appsscript.json`. Save.
4. **Project settings → Script properties → Add script property**:

   | Property | Value |
   | --- | --- |
   | `GITHUB_TOKEN` | the token from step 1 |
   | `TOKEN_EXPIRES` | its expiry date, e.g. `2027-10-15` |
   | `GITHUB_BRANCH` | only while testing before launch: `redesign` (default `main`) |

   Optional, with their defaults: `GITHUB_REPO` (`Sri-Sai-Vidyanikethan-EM-High-School/srisaividyanikethan.edu.in`), `NOTICE_ADDRESS` (`ssvn.em.high.school+notice@gmail.com`), `SITE_URL` (`https://srisaividyanikethan.edu.in`).

### 3. Run setup

1. In the editor, choose the function **setup** and press **Run**.
2. Google asks for permission (read and send Gmail, connect to GitHub, run on a schedule). Choose the school account → **Advanced → Go to Website notices (unsafe)** → **Allow**. The warning appears because this is a private script, not a published app.
3. The log should say *"GitHub token works…"* and *"Triggers created…"*. If it says otherwise, the message names the setting to fix.

### 4. Test it

1. From the school Gmail, send an email to `ssvn.em.high.school+notice@gmail.com` with the subject `[Event] Test notice — please ignore` and one line of text.
2. Within about 5 minutes, a reply arrives in the same thread: *"Published: …"* with the link. The commit appears in the repository.
3. Reply to that email with just `remove`. A *"Taken down"* reply follows, and the notice disappears.

While the redesign isn't live yet (`GITHUB_BRANCH` = `redesign`), the notice appears in the branch and in a local preview, not on the live site. **At launch, delete the `GITHUB_BRANCH` property** so notices go to `main`.

## Upkeep

### Renew the GitHub token (once a year)

The script emails the account 30 days before `TOKEN_EXPIRES`, and immediately if GitHub rejects the token.

1. On GitHub, open the token (**Settings → Developer settings → Fine-grained tokens**) and choose **Regenerate token**, or create a new one as in step 1.
2. In the Apps Script project, **Project settings → Script properties**: paste the new value into `GITHUB_TOKEN` and update `TOKEN_EXPIRES`.

Notices emailed while the token wasn't working are published on the next run (within 5 minutes).

### Update the script

Change `Code.gs` in this repository, run the tests, commit, then paste the new `Code.gs` into the Apps Script editor and save. Triggers keep working; there's no need to run `setup` again.

### When something goes wrong

- **No reply after 10 minutes:** in the Apps Script project, open **Executions** to see each run and any error. Check that the email was sent *from* the school account *to* the `+notice` address.
- **A notice failed three times:** the reply says so and shows the error. Usually GitHub was down; sending the email again is enough.
- **Fix a notice without email:** edit or delete it in Pages CMS, or edit its file in `_notices/` on github.com. The script only touches notices that arrived by email, and only when a new email arrives in that notice's thread.
- **Stop the script:** in **Triggers**, delete both triggers. Run `setup` again to restart.

## What the script writes

`_notices/2026-10-14-school-closed-on-20-october.md`, with the same fields Pages CMS edits (see `.pages.yml` and [docs/pages-cms.md](../../docs/pages-cms.md)):

```markdown
---
title: "School closed on 20 October"
title_te: "విజయదశమి సెలవు"
date: 2026-10-14 09:30
category: Holiday
urgent: true
expires: 2026-10-21
attachments:
  - "/assets/notices/2026-10-14-school-closed-on-20-october-holiday-circular.pdf"
source: email
---
School will be closed on Tuesday 20 October for Vijayadashami.
```

The email text is written with `<`, `>`, `&`, `{` and `}` as HTML character codes, so nothing in an email can become HTML or Jekyll template code; they display as normal characters on the page and in Pages CMS.

```mermaid
flowchart TD

subgraph group_site["Public website"]
  node_website["School website"]
  node_home["Home page<br/>[index.html]"]
  node_admissions["Admissions page<br/>[admissions.html]"]
  node_contact["Contact page<br/>[contact.html]"]
  node_notices_page["Notices page<br/>[notices.html]"]
end

subgraph group_content["School content"]
  node_home_content["Home content<br/>[home.yml]"]
  node_site_details["School details<br/>[site.yml]"]
  node_events["School events<br/>[events.yml]"]
  node_notices["Notice records"]
  node_event_types["Event categories<br/>[event_types.yml]"]
  node_notice_categories["Notice categories"]
  node_navigation["Site navigation<br/>[navigation.yml]"]
end

subgraph group_presentation["Site presentation"]
  node_page_frame["Page frame"]
  node_udaya["Udaya components"]
  node_site_styles["Site styles<br/>[site.css]"]
  node_udaya_styles["Udaya styles<br/>[ssvn.css]"]
  node_site_behavior["Site behavior<br/>[site.js]"]
end

subgraph group_publishing["Content publishing"]
  node_email_tool["Email-to-notice script<br/>[Code.gs]"]
end

node_visitor(("Site visitor"))
node_headmistress(("Headmistress"))
node_pages_cms["Pages CMS"]

node_visitor -->|"visits"| node_website
node_home -->|"uses content"| node_home_content
node_contact -->|"uses details"| node_site_details
node_events -->|"categorized by"| node_event_types
node_notices -->|"categorized by"| node_notice_categories
node_headmistress -->|"submits by email"| node_email_tool
node_email_tool -->|"creates notices"| node_notices
node_pages_cms -->|"edits events"| node_events
node_pages_cms -->|"edits notices"| node_notices

click node_home "https://github.com/sri-sai-vidyanikethan-em-high-school/srisaividyanikethan.edu.in/blob/main/index.html"
click node_admissions "https://github.com/sri-sai-vidyanikethan-em-high-school/srisaividyanikethan.edu.in/blob/main/admissions.html"
click node_contact "https://github.com/sri-sai-vidyanikethan-em-high-school/srisaividyanikethan.edu.in/blob/main/contact.html"
click node_notices_page "https://github.com/sri-sai-vidyanikethan-em-high-school/srisaividyanikethan.edu.in/blob/main/notices.html"
click node_home_content "https://github.com/sri-sai-vidyanikethan-em-high-school/srisaividyanikethan.edu.in/blob/main/_data/home.yml"
click node_site_details "https://github.com/sri-sai-vidyanikethan-em-high-school/srisaividyanikethan.edu.in/blob/main/_data/site.yml"
click node_events "https://github.com/sri-sai-vidyanikethan-em-high-school/srisaividyanikethan.edu.in/blob/main/_data/events.yml"
click node_notices "https://github.com/sri-sai-vidyanikethan-em-high-school/srisaividyanikethan.edu.in/tree/main/_notices"
click node_event_types "https://github.com/sri-sai-vidyanikethan-em-high-school/srisaividyanikethan.edu.in/blob/main/_data/event_types.yml"
click node_notice_categories "https://github.com/sri-sai-vidyanikethan-em-high-school/srisaividyanikethan.edu.in/blob/main/_data/notice_categories.yml"
click node_navigation "https://github.com/sri-sai-vidyanikethan-em-high-school/srisaividyanikethan.edu.in/blob/main/_data/navigation.yml"
click node_page_frame "https://github.com/sri-sai-vidyanikethan-em-high-school/srisaividyanikethan.edu.in/tree/main/_includes/frame"
click node_udaya "https://github.com/sri-sai-vidyanikethan-em-high-school/srisaividyanikethan.edu.in/tree/main/_includes/sv"
click node_site_styles "https://github.com/sri-sai-vidyanikethan-em-high-school/srisaividyanikethan.edu.in/blob/main/assets/css/site.css"
click node_udaya_styles "https://github.com/sri-sai-vidyanikethan-em-high-school/srisaividyanikethan.edu.in/blob/main/assets/css/ssvn.css"
click node_site_behavior "https://github.com/sri-sai-vidyanikethan-em-high-school/srisaividyanikethan.edu.in/blob/main/assets/js/site.js"
click node_email_tool "https://github.com/sri-sai-vidyanikethan-em-high-school/srisaividyanikethan.edu.in/blob/main/tools/email-to-notice/Code.gs"

classDef toneNeutral fill:#f8fafc,stroke:#334155,stroke-width:1.5px,color:#0f172a
classDef toneBlue fill:#dbeafe,stroke:#2563eb,stroke-width:1.5px,color:#172554
classDef toneAmber fill:#fef3c7,stroke:#d97706,stroke-width:1.5px,color:#78350f
classDef toneMint fill:#dcfce7,stroke:#16a34a,stroke-width:1.5px,color:#14532d
classDef toneRose fill:#ffe4e6,stroke:#e11d48,stroke-width:1.5px,color:#881337
classDef toneIndigo fill:#e0e7ff,stroke:#4f46e5,stroke-width:1.5px,color:#312e81
classDef toneTeal fill:#ccfbf1,stroke:#0f766e,stroke-width:1.5px,color:#134e4a
class node_website,node_home,node_admissions,node_contact,node_notices_page toneBlue
class node_home_content,node_site_details,node_events,node_notices,node_event_types,node_notice_categories,node_navigation toneAmber
class node_page_frame,node_udaya,node_site_styles,node_udaya_styles,node_site_behavior toneMint
class node_email_tool toneRose
class node_visitor,node_headmistress,node_pages_cms toneIndigo
```
