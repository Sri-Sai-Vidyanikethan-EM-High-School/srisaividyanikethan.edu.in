# Pages CMS: editing notices in a browser

[Pages CMS](https://pagescms.org) is a free web editor for content stored in a GitHub repository. Its configuration is [`.pages.yml`](../.pages.yml) at the root of this repository. The headmistress signs in **with her email address, no GitHub account needed**, and sees **Notices**: every notice, newest first. She can add, edit or delete one, attach PDFs or photos, and format the text (bold, lists, links).

The school calendar (holidays, exams, events, meetings) is **not** edited here: it comes from the school's Google Calendar ([how-to-post-a-notice.md → Add an event](how-to-post-a-notice.md#add-an-event-to-the-school-calendar)).

Each save is a commit to the repository; GitHub Pages republishes the site about a minute later. As a collaborator she can edit content and upload files, but she **can't change the site's code or settings**.

Notices can still be posted by email ([how-to-post-a-notice.md](how-to-post-a-notice.md)); both write the same kind of file in `_notices/`.

## One-time setup (maintainer, about 10 minutes)

You need a GitHub account with admin access to this repository.

1. Go to https://app.pagescms.org and **sign in with GitHub**.
2. When asked, **install the Pages CMS GitHub app** for the organisation **Sri-Sai-Vidyanikethan-EM-High-School**, with access to **only** the `srisaividyanikethan.edu.in` repository. (An organisation owner may need to approve the install.)
3. Open the repository in Pages CMS and choose the branch:
   - before launch: **`redesign`** (this config only exists there until it's merged);
   - after launch: **`main`**: switch branches in Pages CMS once `redesign` is merged.
4. Check that **Notices** appears in the sidebar. If Pages CMS reports a configuration error, it names the line in `.pages.yml`.
5. **Invite the headmistress:** in the repository's **Collaborators** settings in Pages CMS, add **ssvn.em.high.school@gmail.com**. She gets an email with a sign-in link.

Pages CMS keeps collaborators in its own database, not in `.pages.yml`, so there's nothing to commit for this step.

## For the headmistress

Open **https://app.pagescms.org**, enter **ssvn.em.high.school@gmail.com**, and follow the sign-in link sent to that inbox. Then choose the school website.

### Add a notice

1. **Notices → Add an entry**.
2. **Title:** say what happens and when, e.g. *School closed on 20 October for Vijayadashami*.
3. **Telugu title** (optional): written by a teacher.
4. **Date posted:** today is filled in. Notices are listed newest first by this date.
5. **Category:** Holiday, Admissions, Academics, Event, Celebration or General.
6. **Urgent:** for closures and safety notices only. Set **Urgent until** to the last day it should stay red.
7. **Downloads:** add PDFs or photos.
8. **Notice text:** write the notice. Use the toolbar for bold text and lists.
9. **Save**. The notice is on the website in about a minute.

### Change or delete a notice

Open it from the **Notices** list, edit, and **Save**, or use **Delete** to take it down.

Notices that came in by email can be edited here too. If you later reply to that notice's email thread, the email version replaces your edits, so for each notice use one or the other.

## Good to know

- Everything on the website is **public**. Never include students' names, phone numbers or marks.
- If you make a mistake, the maintainer can restore any earlier version from the repository's history.
- The three **sample** notices in `_notices/` (file names containing `sample`) are hidden from Pages CMS and from the live site. Delete them once real notices exist.

## For the maintainer: how the fields map to the site

| Pages CMS field | Front matter key | Used by |
| --- | --- | --- |
| Title / Telugu title | `title`, `title_te` | notice list rows, notice page header, RSS feed (HTML-escaped) |
| Date posted | `date` (`yyyy-MM-dd HH:mm`, India time) | sorting, date tile, "Posted …" |
| Category | `category` | badge colour (`_data/notice_categories.yml`) |
| Urgent / Urgent until | `urgent`, `expires` (`yyyy-MM-dd`) | kumkum date tile; `site.js` drops it after `expires` |
| Downloads | `attachments` (list of `/assets/notices/…` paths) | download cards on the notice page |
| Notice text | the Markdown body | the notice page and RSS feed |

The templates treat empty strings (`""`, which Pages CMS writes for empty fields) as missing, and accept dates quoted or unquoted. If you add a field in `.pages.yml`, update the templates and `tools/email-to-notice/Code.gs` to match.
