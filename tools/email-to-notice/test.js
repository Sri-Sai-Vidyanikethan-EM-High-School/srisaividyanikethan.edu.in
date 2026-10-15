// Tests for Code.gs, run in Node with stand-ins for Gmail, Apps Script services and the GitHub API.
//   node --test tools/email-to-notice/test.js
// Set NOTICE_OUT=<folder> to also save the generated notice files there (e.g. to build them with Jekyll).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');

const CODE = fs.readFileSync(path.join(__dirname, 'Code.gs'), 'utf8');
const SELF = 'ssvn.em.high.school@gmail.com';
const NOTICE = 'ssvn.em.high.school+notice@gmail.com';
const REPO = '/repos/Sri-Sai-Vidyanikethan-EM-High-School/srisaividyanikethan.edu.in';

/* ---------- Fake world: a mailbox, Apps Script services and a GitHub repository ---------- */
function makeWorld() {
  const props = { GITHUB_TOKEN: 'test-token', TOKEN_EXPIRES: '2027-10-15' };
  const sentAlerts = [];
  const threads = [];
  let msgSeq = 0;

  // GitHub: blobs, trees (path → blob sha), commits, one branch.
  const sha = (s) => crypto.createHash('sha1').update(s).digest('hex');
  const blobs = {}, trees = {}, commits = {};
  const rootTree = sha('tree0'); trees[rootTree] = { 'CNAME': sha('cname') }; blobs[sha('cname')] = Buffer.from('srisaividyanikethan.edu.in');
  const rootCommit = sha('commit0'); commits[rootCommit] = { tree: rootTree };
  const gh = { head: rootCommit, failNextPatch: false, token: 'test-token', commitMessages: [] };

  function json(code, body) { return { getResponseCode: () => code, getContentText: () => (body === undefined ? '' : JSON.stringify(body)) }; }
  function files() { return trees[commits[gh.head].tree]; }

  function fetch(url, opts) {
    const u = new URL(url);
    const p = decodeURIComponent(u.pathname);
    const method = (opts.method || 'get').toUpperCase();
    const body = opts.payload ? JSON.parse(opts.payload) : null;
    if (opts.headers.Authorization !== 'Bearer ' + gh.token) return json(401, { message: 'Bad credentials' });
    if (!p.startsWith(REPO)) return json(404, {});
    const rest = p.slice(REPO.length);
    if (method === 'GET' && rest === '/git/ref/heads/main') return json(200, { object: { sha: gh.head } });
    if (method === 'GET' && rest.startsWith('/git/commits/')) return json(200, { tree: { sha: commits[rest.split('/').pop()].tree } });
    if (method === 'GET' && rest.startsWith('/contents/')) return files()[rest.slice('/contents/'.length)] ? json(200, {}) : json(404, {});
    if (method === 'POST' && rest === '/git/blobs') { const b = Buffer.from(body.content, 'base64'); const s = sha(b); blobs[s] = b; return json(201, { sha: s }); }
    if (method === 'POST' && rest === '/git/trees') {
      const t = Object.assign({}, trees[body.base_tree]);
      for (const e of body.tree) {
        if (e.sha === null) { if (!t[e.path]) return json(422, { message: 'path not in tree' }); delete t[e.path]; } else t[e.path] = e.sha;
      }
      const s = sha(JSON.stringify(t) + Math.random()); trees[s] = t; return json(201, { sha: s });
    }
    if (method === 'POST' && rest === '/git/commits') { const s = sha(body.message + Math.random()); commits[s] = { tree: body.tree, parent: body.parents[0], message: body.message }; return json(201, { sha: s }); }
    if (method === 'PATCH' && rest === '/git/refs/heads/main') {
      if (gh.failNextPatch) { gh.failNextPatch = false; // someone else pushed: move head, reject this update
        const other = sha('other' + Math.random()); commits[other] = { tree: commits[gh.head].tree }; gh.head = other;
        return json(422, { message: 'Update is not a fast forward' }); }
      if (commits[body.sha].parent !== gh.head) return json(422, { message: 'Update is not a fast forward' });
      gh.head = body.sha; gh.commitMessages.push(commits[body.sha].message); return json(200, {});
    }
    return json(404, { message: 'unhandled ' + method + ' ' + rest });
  }

  function message({ from = SELF, to = NOTICE, subject, body = '', sent = true, date = new Date('2026-10-14T09:30:00+05:30'), attachments = [] }) {
    const id = (++msgSeq).toString(16).padStart(16, '0');
    return {
      id, sent, from, to, subject, body, date, attachments,
      getId: () => id, getSubject: () => subject, getPlainBody: () => body, getTo: () => to, getCc: () => '',
      getDate: () => date,
      getAttachments: () => attachments.map((a) => ({ getName: () => a.name, getContentType: () => a.type, getSize: () => a.bytes.length, getBytes: () => [...a.bytes] })),
      replyAll(text) { this.thread.add(message({ subject: 'Re: ' + subject, body: text, to: SELF + ', ' + NOTICE })); },
    };
  }
  function thread() {
    const t = { id: 'thread' + threads.length, messages: [], getId() { return this.id; }, getMessages() { return this.messages.slice(); },
      add(m) { m.thread = t; t.messages.push(m); return m; } };
    threads.push(t);
    return t;
  }

  const ctx = {
    console: { log() {}, error() {} },
    Logger: { log() {} },
    URL, Buffer,
    Utilities: {
      Charset: { UTF_8: 'utf8' },
      base64Encode: (v) => Buffer.from(typeof v === 'string' ? Buffer.from(v, 'utf8') : Buffer.from(v.map((b) => b & 0xff))).toString('base64'),
      formatDate(d, tz, fmt) {
        if (fmt === 'yyyy-MM-dd HH:mm') return this.formatDate(d, tz, 'yyyy-MM-dd HH:mm:ss Z').slice(0, 16);
        const ist = new Date(d.getTime() + 5.5 * 3600000); const pad = (n) => String(n).padStart(2, '0');
        const ymd = `${ist.getUTCFullYear()}-${pad(ist.getUTCMonth() + 1)}-${pad(ist.getUTCDate())}`;
        if (fmt === 'yyyy-MM-dd') return ymd;
        if (fmt === 'yyyy-MM-dd HH:mm:ss Z') return `${ymd} ${pad(ist.getUTCHours())}:${pad(ist.getUTCMinutes())}:${pad(ist.getUTCSeconds())} +0530`;
        throw new Error('format ' + fmt);
      },
    },
    PropertiesService: { getScriptProperties: () => ({
      getProperty: (k) => (k in props ? props[k] : null), setProperty: (k, v) => { props[k] = v; },
      deleteProperty: (k) => { delete props[k]; }, getProperties: () => Object.assign({}, props) }) },
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock() {} }) },
    Session: { getEffectiveUser: () => ({ getEmail: () => SELF }) },
    GmailApp: {
      search(q) {
        assert.match(q, /in:sent to:ssvn\.em\.high\.school\+notice@gmail\.com/);
        return threads.filter((t) => t.messages.some((m) => m.sent && m.to.includes(NOTICE))).reverse(); // newest first, like Gmail
      },
      sendEmail(to, subject, body) { sentAlerts.push({ to, subject, body }); },
    },
    Gmail: { Users: { Messages: { get: (_, id) => {
      const m = threads.flatMap((t) => t.messages).find((x) => x.id === id);
      return { labelIds: m.sent ? ['SENT', 'INBOX'] : ['INBOX'] };
    } } } },
    UrlFetchApp: { fetch },
  };
  vm.createContext(ctx);
  vm.runInContext(CODE, ctx, { filename: 'Code.gs' });

  const file = (p) => { const s = files()[p]; return s ? blobs[s].toString('utf8') : null; };
  return { ctx, props, gh, files, file, thread, message, sentAlerts, run: () => ctx.processNotices() };
}

const lastReply = (t) => t.messages.filter((m) => m.body.includes('website-notice-robot')).pop().body;
const pdf = { name: 'Holiday Circular (1).PDF', type: 'application/pdf', bytes: Buffer.from('%PDF-1.4 test') };
const exe = { name: 'setup.exe', type: 'application/x-msdownload', bytes: Buffer.from('MZ') };
const PATH = '_notices/2026-10-14-school-closed-on-20-october-for-vijayadashami.md';

/* ---------- Parsing ---------- */
test('subject tags set category and urgency; unknown tags are reported', () => {
  const { ctx } = makeWorld();
  const p = ctx.parseEmail_('Re: Fwd: [Holiday] [urgent] School closed  on 20 October [Sports]', 'Text');
  assert.equal(p.title, 'School closed on 20 October');
  assert.equal(p.category, 'Holiday');
  assert.equal(p.urgent, true);
  assert.deepEqual([...p.unknownTags], ['Sports']);
  assert.equal(ctx.parseEmail_('Plain title', '').category, 'General');
});

test('body: Telugu title line, quoted reply, signature and phone footer are handled', () => {
  const { ctx } = makeWorld();
  const body = 'Telugu: విజయదశమి సెలవు\r\n\r\nSchool will be closed.\r\n\r\n\r\nClasses resume on 21 October.\r\n\r\n--\r\nHeadmistress\r\n';
  const p = ctx.parseEmail_('Holiday', body);
  assert.equal(p.titleTe, 'విజయదశమి సెలవు');
  assert.equal(p.text, 'School will be closed.\n\nClasses resume on 21 October.');
  const reply = 'Corrected text.\n\nOn Wed, 14 Oct 2026 at 09:35, Sri Sai Vidyanikethan <\nssvn.em.high.school@gmail.com> wrote:\n> Published: "x"\n> website-notice-robot';
  const r = ctx.parseEmail_('Re: Holiday', reply);
  assert.equal(r.text, 'Corrected text.');
  assert.equal(r.fromRobot, false);
  assert.equal(ctx.parseEmail_('x', 'Sent from my iPhone').text, '');
  assert.equal(ctx.parseEmail_('x', 'On Monday the school will be closed.').text, 'On Monday the school will be closed.');
});

test('"remove" is a command only when it is the whole text', () => {
  const { ctx } = makeWorld();
  assert.equal(ctx.parseEmail_('Re: x', 'Remove\n\nOn Wed, 14 Oct 2026, a@b.c wrote:\n> old').command, 'remove');
  assert.equal(ctx.parseEmail_('Re: x', 'remove.').command, 'remove');
  assert.equal(ctx.parseEmail_('Re: x', 'Please remove your shoes in the hall.').command, '');
});

test('slugs and attachment names are short and URL-safe', () => {
  const { ctx } = makeWorld();
  assert.equal(ctx.slugify_('Quarterly examination timetable — Classes VI to X'), 'quarterly-examination-timetable-classes-vi-to-x');
  assert.equal(ctx.slugify_('విజయదశమి'), 'notice');
  assert.ok(ctx.slugify_('a '.repeat(80)).length <= 60);
  assert.equal(ctx.attachmentFileName_('Holiday Circular (1).PDF', 'pdf'), 'holiday-circular-1.pdf');
});

test('notice text cannot inject HTML or Liquid', () => {
  const { ctx } = makeWorld();
  const md = ctx.buildNoticeMarkdown_({ title: 'He said "hi": {{ site.title }}', date: '2026-10-14 09:30', category: 'General',
    text: '<script>alert(1)</script> {% endraw %}{{ x }} Q&A', attachments: [] });
  assert.match(md, /^title: "He said \\"hi\\": \{\{ site\.title \}\}"$/m);
  const body = md.split('---\n')[2];
  assert.equal(body, '&lt;script&gt;alert(1)&lt;/script&gt; &#123;% endraw %&#125;&#123;&#123; x &#125;&#125; Q&amp;A\n');
  assert.ok(!/[{}]/.test(body), 'no braces left in the body');
});

/* ---------- The whole flow ---------- */
test('publish → run again → forged email → update by reply → remove by reply', () => {
  const w = makeWorld();
  const t = w.thread();
  t.add(w.message({ subject: '[Holiday] [Urgent] School closed on 20 October for Vijayadashami',
    body: 'Telugu: విజయదశమి సెలవు\n\nSchool will be closed on Tuesday 20 October.\n\nSent from my iPhone', attachments: [pdf, exe] }));
  w.run();

  const md = w.file(PATH);
  assert.ok(md, 'notice file committed');
  assert.match(md, /^category: Holiday$/m);
  assert.match(md, /^urgent: true$/m);
  assert.match(md, /^expires: 2026-10-21$/m);
  assert.match(md, /^title_te: "విజయదశమి సెలవు"$/m);
  assert.match(md, /^date: 2026-10-14 09:30$/m);
  assert.ok(w.files()['assets/notices/2026-10-14-school-closed-on-20-october-for-vijayadashami-holiday-circular-1.pdf'], 'PDF committed');
  assert.ok(!Object.keys(w.files()).some((f) => f.endsWith('.exe')), 'exe not committed');
  assert.match(lastReply(t), /Published: "School closed on 20 October for Vijayadashami"/);
  assert.match(lastReply(t), /https:\/\/srisaividyanikethan\.edu\.in\/notices\/2026-10-14-school-closed-on-20-october-for-vijayadashami\//);
  assert.match(lastReply(t), /only PDF, JPG, PNG and WEBP.*setup\.exe/);
  if (process.env.NOTICE_OUT) fs.writeFileSync(path.join(process.env.NOTICE_OUT, path.basename(PATH)), md);

  w.run(); // nothing new: the robot's own reply must not be treated as a notice
  assert.equal(w.gh.commitMessages.length, 1);

  const forged = w.thread();
  forged.add(w.message({ subject: '[Urgent] School closed for a week', body: 'Fake', sent: false }));
  w.run();
  assert.equal(w.gh.commitMessages.length, 1, 'inbox-only (forged) email is ignored');

  // A forged "remove" that Gmail threads into the real notice thread (same subject, spoofed sender) is ignored too.
  t.add(w.message({ subject: 'Re: [Holiday] [Urgent] School closed on 20 October for Vijayadashami', body: 'remove', sent: false }));
  w.run();
  assert.ok(w.file(PATH), 'forged reply in the real thread did not remove the notice');
  assert.equal(w.gh.commitMessages.length, 1);

  t.add(w.message({ subject: 'Re: [Holiday] [Urgent] School closed on 20 October for Vijayadashami', date: new Date('2026-10-15T10:00:00+05:30'),
    body: 'Classes resume on Thursday 22 October.\n\nOn Wed, 14 Oct 2026 at 09:35, <ssvn.em.high.school@gmail.com> wrote:\n> Published' }));
  w.run();
  const updated = w.file(PATH);
  assert.match(updated, /Classes resume on Thursday 22 October\./);
  assert.match(updated, /^date: 2026-10-14 09:30$/m, 'keeps the original date');
  assert.match(updated, /holiday-circular-1\.pdf/, 'keeps attachments when the reply has none');
  assert.match(lastReply(t), /^Updated: /);

  t.add(w.message({ subject: 'Re: [Holiday] School closed on 20 October for Vijayadashami', body: 'remove' }));
  w.run();
  assert.equal(w.file(PATH), null, 'notice removed');
  assert.ok(!Object.keys(w.files()).some((f) => f.startsWith('assets/notices/')), 'attachments removed');
  assert.match(lastReply(t), /^Taken down: /);
  assert.deepEqual(w.gh.commitMessages, ['Notice: School closed on 20 October for Vijayadashami',
    'Update notice: School closed on 20 October for Vijayadashami', 'Remove notice: School closed on 20 October for Vijayadashami']);
});

test('empty subject gets a helpful reply and nothing is committed', () => {
  const w = makeWorld();
  const t = w.thread();
  t.add(w.message({ subject: '[Holiday]', body: 'No title' }));
  w.run();
  assert.equal(w.gh.commitMessages.length, 0);
  assert.match(lastReply(t), /not published: the subject is empty/);
});

test('two notices with the same title on the same day get different files', () => {
  const w = makeWorld();
  w.thread().add(w.message({ subject: 'Sports day', body: 'One' }));
  w.thread().add(w.message({ subject: 'Sports day', body: 'Two' }));
  w.run();
  assert.ok(w.file('_notices/2026-10-14-sports-day.md'));
  assert.ok(w.file('_notices/2026-10-14-sports-day-2.md'));
});

test('a branch that moves during the commit is retried', () => {
  const w = makeWorld();
  w.gh.failNextPatch = true;
  w.thread().add(w.message({ subject: 'Sports day', body: 'Text' }));
  w.run();
  assert.ok(w.file('_notices/2026-10-14-sports-day.md'));
});

test('a rejected token sends one alert and publishes once the token is fixed', () => {
  const w = makeWorld();
  w.gh.token = 'renewed-token';
  const t = w.thread();
  t.add(w.message({ subject: 'Sports day', body: 'Text' }));
  w.run();
  w.run();
  assert.equal(w.sentAlerts.length, 1);
  assert.match(w.sentAlerts[0].subject, /GitHub token stopped working/);
  assert.equal(w.gh.commitMessages.length, 0);
  w.props.GITHUB_TOKEN = 'renewed-token';
  w.run();
  assert.equal(w.gh.commitMessages.length, 1);
  assert.match(lastReply(t), /^Published/);
});
