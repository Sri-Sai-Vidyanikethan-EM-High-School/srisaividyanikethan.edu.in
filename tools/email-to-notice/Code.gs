/**
 * Sri Sai Vidyanikethan — email → website notice.
 *
 * Runs as a Google Apps Script project owned by ssvn.em.high.school@gmail.com (setup: README.md beside this file).
 * Every 5 minutes it looks for emails that account SENT to ssvn.em.high.school+notice@gmail.com and:
 *   - a new email          → publishes a notice: _notices/YYYY-MM-DD-slug.md (+ attachments in assets/notices/)
 *   - a reply with text    → replaces that notice's text (and attachments, if the reply has any)
 *   - a reply "remove"     → takes the notice down
 * and replies in the same email thread to say what happened.
 *
 * Why "SENT": anyone can email the +notice address, but only the account itself can put mail in its Sent folder,
 * so a forged sender address can't publish anything.
 *
 * Script Properties (Project settings → Script properties):
 *   GITHUB_TOKEN    required  fine-grained token: this repository only, Contents read and write
 *   TOKEN_EXPIRES   required  the token's expiry date, YYYY-MM-DD (a reminder email is sent 30 days before)
 *   GITHUB_REPO     optional  default Sri-Sai-Vidyanikethan-EM-High-School/srisaividyanikethan.edu.in
 *   GITHUB_BRANCH   optional  default main
 *   NOTICE_ADDRESS  optional  default ssvn.em.high.school+notice@gmail.com
 *   SITE_URL        optional  default https://srisaividyanikethan.edu.in
 */

var DEFAULTS = {
  GITHUB_REPO: 'Sri-Sai-Vidyanikethan-EM-High-School/srisaividyanikethan.edu.in',
  GITHUB_BRANCH: 'main',
  NOTICE_ADDRESS: 'ssvn.em.high.school+notice@gmail.com',
  SITE_URL: 'https://srisaividyanikethan.edu.in',
  COMMIT_NAME: 'Website notices (email)',
  COMMIT_EMAIL: 'mail@srisaividyanikethan.edu.in',
};

var TIME_ZONE = 'Asia/Kolkata';
var SEARCH_DAYS = 30;            // replies can update a notice for this long after it was first sent
var URGENT_DAYS = 7;             // urgent styling lasts this many days
var MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
var MAX_TRIES = 3;               // GitHub errors: retry on the next runs, then give up and say so
var ROBOT_MARKER = 'website-notice-robot';
var CATEGORIES = ['Holiday', 'Admissions', 'Academics', 'Event', 'Celebration', 'General'];
var ATTACHMENT_TYPES = { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

/* =====================================================================================================
 * Entry points (run from the Apps Script editor or by triggers)
 * ===================================================================================================== */

/** One-time setup: checks the settings and the GitHub token, then creates the two triggers. */
function setup() {
  var token = setting_('GITHUB_TOKEN');
  if (!token) throw new Error('Add GITHUB_TOKEN in Project settings → Script properties first.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(setting_('TOKEN_EXPIRES'))) throw new Error('Add TOKEN_EXPIRES (YYYY-MM-DD) in Script properties.');
  var repo = setting_('GITHUB_REPO'), branch = setting_('GITHUB_BRANCH');
  githubRequest_('GET', '/repos/' + repo + '/git/ref/heads/' + encodeURIComponent(branch));
  Logger.log('GitHub token works for ' + repo + ' (' + branch + ').');

  ScriptApp.getProjectTriggers().forEach(function (t) { ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('processNotices').timeBased().everyMinutes(5).create();
  ScriptApp.newTrigger('checkTokenExpiry').timeBased().everyDays(1).atHour(8).create();
  Logger.log('Triggers created. Notices sent to ' + setting_('NOTICE_ADDRESS') + ' will be published within about 5 minutes.');
}

/** Every 5 minutes: publish, update or remove notices from new emails. */
function processNotices() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return; // the previous run is still going
  try {
    var address = setting_('NOTICE_ADDRESS').toLowerCase();
    var threads = GmailApp.search('in:sent to:' + address + ' newer_than:' + SEARCH_DAYS + 'd', 0, 50);
    threads.reverse(); // oldest first, so notices are published in the order they were sent
    for (var i = 0; i < threads.length; i++) processThread_(threads[i], address);
    pruneState_();
  } catch (e) {
    if (e.isAuthError) alertOnce_('auth', 'Website notices: the GitHub token stopped working',
      'The school website could not publish a notice because GitHub rejected the access token (' + e.message + ').\n\n' +
      'Notices sent by email are waiting and will be published once the token is renewed.\n' +
      'How to renew it: tools/email-to-notice/README.md in the website repository, "Renew the GitHub token".');
    else throw e;
  } finally {
    lock.releaseLock();
  }
}

/** Daily: remind the account owner before the GitHub token expires. */
function checkTokenExpiry() {
  var expires = setting_('TOKEN_EXPIRES');
  if (!expires) return;
  var daysLeft = Math.floor((new Date(expires + 'T00:00:00+05:30') - new Date()) / 86400000);
  if (daysLeft > 30) return;
  alertOnce_('expiry', 'Website notices: renew the GitHub token' + (daysLeft >= 0 ? ' within ' + daysLeft + ' days' : ' — it has expired'),
    'The GitHub token that lets this email account publish notices on the school website ' +
    (daysLeft >= 0 ? 'expires on ' + expires + '.' : 'expired on ' + expires + '. Emailed notices are not being published.') + '\n\n' +
    'How to renew it (about 2 minutes): tools/email-to-notice/README.md in the website repository, "Renew the GitHub token".', 7);
}

/* =====================================================================================================
 * Processing
 * ===================================================================================================== */

function processThread_(thread, address) {
  var key = 'thread_' + thread.getId();
  var state = loadState_(key) || { processed: [], tries: {} };
  var messages = thread.getMessages();
  var changed = false;

  for (var i = 0; i < messages.length; i++) {
    var msg = messages[i];
    var id = msg.getId();
    if (state.processed.indexOf(id) >= 0) continue;
    changed = true;

    var parsed = parseEmail_(msg.getSubject(), msg.getPlainBody());
    if (!isNoticeMessage_(msg, parsed, address)) { state.processed.push(id); continue; }

    try {
      var result = handleMessage_(msg, parsed, state);
      state.processed.push(id);
      reply_(msg, result);
    } catch (e) {
      if (e.isAuthError) { saveState_(key, state); throw e; }
      if (e.isUserError) {
        state.processed.push(id);
        reply_(msg, 'This notice was not published: ' + e.message);
        continue;
      }
      var tries = (state.tries[id] || 0) + 1;
      state.tries[id] = tries;
      console.error('Notice ' + id + ' failed (try ' + tries + '): ' + e.stack);
      if (tries >= MAX_TRIES) {
        state.processed.push(id);
        reply_(msg, 'This notice could not be published after ' + tries + ' tries. Please send it again later, ' +
          'or ask the website maintainer to check the script\'s Executions log.\n\nError: ' + e.message);
      }
    }
  }
  if (changed) { state.updated = Date.now(); saveState_(key, state); }
}

/** A message counts only if it was sent from this account (Sent label) to the notice address and isn't a robot reply. */
function isNoticeMessage_(msg, parsed, address) {
  var recipients = (msg.getTo() + ',' + msg.getCc()).toLowerCase();
  if (recipients.indexOf(address) < 0) return false;
  if (parsed.fromRobot) return false;
  var labels = Gmail.Users.Messages.get('me', msg.getId(), { format: 'minimal' }).labelIds || [];
  return labels.indexOf('SENT') >= 0;
}

/** Publishes, updates or removes the notice for one email. Returns the text of the confirmation reply. */
function handleMessage_(msg, parsed, state) {
  var site = setting_('SITE_URL').replace(/\/$/, '');
  var notes = parsed.unknownTags.length ? ['Not understood in the subject (ignored): ' + parsed.unknownTags.map(function (t) { return '[' + t + ']'; }).join(' ')] : [];

  if (parsed.command === 'remove') {
    if (!state.path || state.removed) return 'There is no published notice in this email thread to take down.';
    commit_(state.path, null, [], state.attachments || [], 'Remove notice: ' + state.title);
    state.removed = true;
    return 'Taken down: "' + state.title + '". It will disappear from the website in about 2 minutes.';
  }

  if (!parsed.title) throw userError_('the subject is empty. The subject becomes the notice title.');
  if (parsed.title.length > 150) throw userError_('the subject is longer than 150 characters. Please shorten the title.');

  var isNew = !state.path;
  var sent = msg.getDate();
  var day = Utilities.formatDate(sent, TIME_ZONE, 'yyyy-MM-dd');
  var path = state.path || uniqueNoticePath_(day, slugify_(parsed.title));
  var base = path.replace(/^_notices\//, '').replace(/\.md$/, '');

  var files = collectAttachments_(msg, base);
  notes = notes.concat(files.skipped);
  var attachments = files.saved.length ? files.saved : (state.attachments || []);
  var staleAttachments = (state.attachments || []).filter(function (p) {
    return files.saved.length && !files.saved.some(function (f) { return f.path === p; });
  });

  var noticeDate = isNew ? Utilities.formatDate(sent, TIME_ZONE, 'yyyy-MM-dd HH:mm:ss Z') : state.date;
  var expires = parsed.urgent ? Utilities.formatDate(new Date(sent.getTime() + URGENT_DAYS * 86400000), TIME_ZONE, 'yyyy-MM-dd') : '';
  var markdown = buildNoticeMarkdown_({
    title: parsed.title, titleTe: parsed.titleTe, date: noticeDate, category: parsed.category,
    urgent: parsed.urgent, expires: expires, text: parsed.text,
    attachments: attachments.map(function (a) { return '/' + (a.path || a); }),
  });

  var newFiles = files.saved.map(function (f) { return { path: f.path, bytes: f.bytes }; });
  commit_(path, markdown, newFiles, staleAttachments, (isNew ? 'Notice: ' : 'Update notice: ') + parsed.title);

  state.path = path;
  state.title = parsed.title;
  state.date = noticeDate;
  state.attachments = attachments.map(function (a) { return a.path || a; });
  state.removed = false;

  var url = site + '/notices/' + base + '/';
  return (isNew ? 'Published' : 'Updated') + ': "' + parsed.title + '"\n\n' +
    'It will be on the website in about 2 minutes:\n' + url + '\n\n' +
    (notes.length ? notes.join('\n') + '\n\n' : '') +
    'To change it, reply to this email with the corrected text.\n' +
    'To take it down, reply with just the word: remove';
}

/* =====================================================================================================
 * Email parsing (pure functions — tested outside Apps Script)
 * ===================================================================================================== */

/** Subject → title, category and urgency; body → text and optional Telugu title. */
function parseEmail_(subject, body) {
  var title = String(subject || '').replace(/^\s*((re|fwd?|fw|aw)\s*:\s*)+/i, '');
  var tags = [];
  title = title.replace(/\[([^\]]*)\]/g, function (_, tag) { tags.push(tag.trim()); return ' '; }).replace(/\s+/g, ' ').trim();

  var urgent = false, category = 'General', unknownTags = [];
  tags.forEach(function (tag) {
    if (!tag) return;
    if (tag.toLowerCase() === 'urgent') { urgent = true; return; }
    var match = CATEGORIES.filter(function (c) { return c.toLowerCase() === tag.toLowerCase(); })[0];
    if (match) category = match; else unknownTags.push(tag);
  });

  var text = cleanBody_(body);
  var fromRobot = text.indexOf(ROBOT_MARKER) >= 0;
  var titleTe = '';
  var lines = text.split('\n');
  if (/^\s*telugu\s*:/i.test(lines[0] || '')) {
    titleTe = lines.shift().replace(/^\s*telugu\s*:/i, '').trim();
    text = lines.join('\n').trim();
  }
  var command = /^(remove|delete)[.!]?$/i.test(text.trim()) ? 'remove' : '';
  return { title: title, titleTe: titleTe, category: category, urgent: urgent, unknownTags: unknownTags, text: text, command: command, fromRobot: fromRobot };
}

/** Removes quoted replies, signatures and "Sent from my phone" lines from a plain-text email body. */
function cleanBody_(body) {
  var lines = String(body || '').replace(/\r\n?/g, '\n').split('\n');
  var out = [];
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    var trimmed = line.trim();
    if (/^>/.test(trimmed)) break;                                   // quoted text
    if (/^On\b/.test(trimmed)) {                                     // "On Thu, 15 Oct 2026 … <a@b.c> wrote:" (may wrap)
      var joined = [trimmed, (lines[i + 1] || '').trim(), (lines[i + 2] || '').trim()].join(' ');
      if (/\bwrote:/.test(joined) && /\d|@/.test(joined)) break;
    }
    if (/^-{2,}\s*(Original Message|Forwarded message)/i.test(trimmed)) break;
    if (/^--\s*$/.test(line)) break;                                 // signature separator
    if (/^Sent from my\b/i.test(trimmed) || /^Get Outlook for\b/i.test(trimmed)) break;
    out.push(line.replace(/\s+$/, ''));
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

/** A notice title → a short URL-safe slug ("School closed on 20 October" → "school-closed-on-20-october"). */
function slugify_(title) {
  var slug = String(title || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  if (slug.length > 60) slug = slug.slice(0, 60).replace(/-[^-]*$/, '');
  return slug || 'notice';
}

/** Email text → safe Markdown: no HTML, and nothing Jekyll's Liquid templating would try to run. */
function escapeText_(text) {
  return String(text || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\{%-?\s*endraw\s*-?%\}/g, '');
}

/** The notice file: YAML front matter + the text inside {% raw %} so Liquid never runs on it. */
function buildNoticeMarkdown_(n) {
  var q = function (s) { return JSON.stringify(String(s)); }; // a JSON string is a valid YAML double-quoted string
  var lines = ['---', 'title: ' + q(n.title)];
  if (n.titleTe) lines.push('title_te: ' + q(n.titleTe));
  lines.push('date: ' + n.date, 'category: ' + n.category);
  if (n.urgent) lines.push('urgent: true', 'expires: ' + n.expires);
  if (n.attachments && n.attachments.length) {
    lines.push('attachments:');
    n.attachments.forEach(function (p) { lines.push('  - ' + q(p)); });
  }
  lines.push('source: email', '---', '{% raw %}', escapeText_(n.text), '{% endraw %}', '');
  return lines.join('\n');
}

/** A safe file name for an attachment: "Holiday Circular (1).PDF" → "holiday-circular-1.pdf". */
function attachmentFileName_(name, ext) {
  var stem = String(name || '').replace(/\.[^.]*$/, '');
  return slugify_(stem).slice(0, 40).replace(/-+$/, '') + '.' + ext;
}

/* =====================================================================================================
 * Attachments, state and replies
 * ===================================================================================================== */

function collectAttachments_(msg, base) {
  var saved = [], skipped = [], used = {};
  msg.getAttachments({ includeInlineImages: false }).forEach(function (a) {
    var ext = ATTACHMENT_TYPES[a.getContentType()];
    if (!ext) { skipped.push('Attachment not added (only PDF, JPG, PNG and WEBP are allowed): ' + a.getName()); return; }
    if (a.getSize() > MAX_ATTACHMENT_BYTES) { skipped.push('Attachment not added (larger than 5 MB): ' + a.getName()); return; }
    var name = base + '-' + attachmentFileName_(a.getName(), ext);
    while (used[name]) name = name.replace(/(\.[a-z]+)$/, '-' + saved.length + '$1');
    used[name] = true;
    saved.push({ path: 'assets/notices/' + name, bytes: a.getBytes() });
  });
  return { saved: saved, skipped: skipped };
}

/** Replies in the thread. replyAll keeps the +notice address, so a reply to this message can update the notice. */
function reply_(msg, text) {
  msg.replyAll(text + '\n\n— Sent automatically by the school website (' + ROBOT_MARKER + ').');
}

function loadState_(key) {
  var raw = PropertiesService.getScriptProperties().getProperty(key);
  return raw ? JSON.parse(raw) : null;
}

function saveState_(key, state) {
  PropertiesService.getScriptProperties().setProperty(key, JSON.stringify(state));
}

/** Forget threads untouched for 60 days (beyond the 30-day reply window). */
function pruneState_() {
  var props = PropertiesService.getScriptProperties();
  var all = props.getProperties();
  var cutoff = Date.now() - 60 * 86400000;
  Object.keys(all).forEach(function (key) {
    if (key.indexOf('thread_') !== 0) return;
    try { if ((JSON.parse(all[key]).updated || 0) < cutoff) props.deleteProperty(key); } catch (e) { props.deleteProperty(key); }
  });
}

/** Emails the account owner, at most once every `days` days per kind of alert. */
function alertOnce_(kind, subject, body, days) {
  var props = PropertiesService.getScriptProperties();
  var key = 'alert_' + kind;
  var last = Number(props.getProperty(key) || 0);
  if (Date.now() - last < (days || 1) * 86400000) return;
  GmailApp.sendEmail(Session.getEffectiveUser().getEmail(), subject, body + '\n\n— ' + ROBOT_MARKER);
  props.setProperty(key, String(Date.now()));
}

function setting_(key) {
  return PropertiesService.getScriptProperties().getProperty(key) || DEFAULTS[key] || '';
}

function userError_(message) {
  var e = new Error(message);
  e.isUserError = true;
  return e;
}

/* =====================================================================================================
 * GitHub
 * ===================================================================================================== */

/** "_notices/2026-10-14-slug.md", adding -2, -3 … if a notice with that name already exists. */
function uniqueNoticePath_(day, slug) {
  for (var n = 1; n < 50; n++) {
    var path = '_notices/' + day + '-' + slug + (n > 1 ? '-' + n : '') + '.md';
    if (!fileExists_(path)) return path;
  }
  throw new Error('Could not find a free file name for ' + slug);
}

function fileExists_(path) {
  var repo = setting_('GITHUB_REPO'), branch = setting_('GITHUB_BRANCH');
  return githubRequest_('GET', '/repos/' + repo + '/contents/' + encodePath_(path) + '?ref=' + encodeURIComponent(branch), null, true) !== null;
}

/**
 * One commit: write the notice (or delete it when markdown is null), add new attachment files and delete stale ones.
 * Retries if the branch moved while committing.
 */
function commit_(noticePath, markdown, newFiles, deletePaths, message) {
  var repo = setting_('GITHUB_REPO'), branch = setting_('GITHUB_BRANCH');
  var api = '/repos/' + repo + '/git';
  var entries = [];

  var blob = function (base64) { return githubRequest_('POST', api + '/blobs', { content: base64, encoding: 'base64' }).sha; };
  if (markdown !== null) entries.push({ path: noticePath, mode: '100644', type: 'blob', sha: blob(Utilities.base64Encode(markdown, Utilities.Charset.UTF_8)) });
  newFiles.forEach(function (f) { entries.push({ path: f.path, mode: '100644', type: 'blob', sha: blob(Utilities.base64Encode(f.bytes)) }); });
  var deletes = (markdown === null ? [noticePath] : []).concat(deletePaths || []);
  deletes.forEach(function (p) { if (fileExists_(p)) entries.push({ path: p, mode: '100644', type: 'blob', sha: null }); });
  if (!entries.length) return null;

  for (var attempt = 1; attempt <= 3; attempt++) {
    var head = githubRequest_('GET', api + '/ref/heads/' + encodeURIComponent(branch)).object.sha;
    var baseTree = githubRequest_('GET', api + '/commits/' + head).tree.sha;
    var tree = githubRequest_('POST', api + '/trees', { base_tree: baseTree, tree: entries }).sha;
    var commit = githubRequest_('POST', api + '/commits', {
      message: message, tree: tree, parents: [head],
      author: { name: setting_('COMMIT_NAME'), email: setting_('COMMIT_EMAIL'), date: new Date().toISOString() },
    }).sha;
    try {
      githubRequest_('PATCH', api + '/refs/heads/' + encodeURIComponent(branch), { sha: commit, force: false });
      return commit;
    } catch (e) {
      if (!e.isConflict || attempt === 3) throw e; // someone else pushed meanwhile: rebuild on the new head
    }
  }
}

function githubRequest_(method, path, payload, allow404) {
  var options = {
    method: method.toLowerCase(),
    headers: {
      Authorization: 'Bearer ' + setting_('GITHUB_TOKEN'),
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    muteHttpExceptions: true,
  };
  if (payload) { options.contentType = 'application/json'; options.payload = JSON.stringify(payload); }
  var res = UrlFetchApp.fetch('https://api.github.com' + path, options);
  var code = res.getResponseCode();
  var text = res.getContentText();
  if (code === 404 && allow404) return null;
  if (code === 401 || code === 403) {
    var authError = new Error('GitHub ' + code + ': ' + text.slice(0, 200));
    authError.isAuthError = true;
    throw authError;
  }
  if (code >= 300) {
    var error = new Error('GitHub ' + method + ' ' + path + ' → ' + code + ': ' + text.slice(0, 300));
    error.isConflict = code === 409 || code === 422;
    throw error;
  }
  return text ? JSON.parse(text) : {};
}

function encodePath_(path) {
  return path.split('/').map(encodeURIComponent).join('/');
}

/* Lets the tests in tools/email-to-notice/test.js load this file in Node. Apps Script ignores it. */
if (typeof module !== 'undefined') {
  module.exports = { parseEmail_: parseEmail_, cleanBody_: cleanBody_, slugify_: slugify_, escapeText_: escapeText_, buildNoticeMarkdown_: buildNoticeMarkdown_, attachmentFileName_: attachmentFileName_ };
}
