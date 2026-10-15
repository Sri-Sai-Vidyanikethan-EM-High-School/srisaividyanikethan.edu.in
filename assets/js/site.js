/*
 * Sri Sai Vidyanikethan — small helpers, no libraries. Every page works without this file;
 * it adds the mobile menu, the theme toggle, YouTube-on-press and date-aware touches.
 */
(function () {
  var root = document.documentElement;

  // Today as YYYY-MM-DD in the visitor's own time zone (toISOString would use UTC).
  var now = new Date();
  var today = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');

  /* ----- Mobile menu ----- */
  var header = document.querySelector('.sv-header');
  var menuBtn = document.querySelector('.sv-header__menu');
  function setMenu(open) {
    header.classList.toggle('is-open', open);
    menuBtn.setAttribute('aria-expanded', open);
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  if (header && menuBtn) {
    menuBtn.addEventListener('click', function () { setMenu(!header.classList.contains('is-open')); });
    // Links to sections on the same page: close the menu after jumping.
    header.querySelectorAll('.sv-nav__link').forEach(function (a) {
      a.addEventListener('click', function () { setMenu(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && header.classList.contains('is-open')) { setMenu(false); menuBtn.focus(); }
    });
  }

  /* ----- Theme toggle: Dawn (light) / Dhuni (dark); default follows the device ----- */
  var darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
  function currentTheme() { return root.getAttribute('data-theme') || (darkQuery.matches ? 'dhuni' : 'dawn'); }
  function labelToggles() {
    var dark = currentTheme() === 'dhuni';
    document.querySelectorAll('[data-theme-toggle]').forEach(function (b) {
      b.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    });
  }
  document.querySelectorAll('[data-theme-toggle]').forEach(function (b) {
    b.addEventListener('click', function () {
      var next = currentTheme() === 'dhuni' ? 'dawn' : 'dhuni';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('ssvn-theme', next); } catch (e) {}
      labelToggles();
    });
  });
  if (darkQuery.addEventListener) darkQuery.addEventListener('change', labelToggles);
  labelToggles();

  /* ----- VideoCard: load YouTube only when pressed ----- */
  document.querySelectorAll('[data-video]').forEach(function (b) {
    b.addEventListener('click', function () {
      var f = document.createElement('iframe');
      f.className = 'sv-video__frame';
      f.title = b.getAttribute('aria-label');
      f.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(b.dataset.video) + '?autoplay=1&rel=0';
      f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      f.referrerPolicy = 'strict-origin-when-cross-origin';
      f.allowFullscreen = true;
      b.replaceWith(f);
    });
  });

  /* ----- OfficeHours: mark today ----- */
  var day = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()];
  document.querySelectorAll('.sv-hours__row[data-day="' + day + '"]').forEach(function (r) {
    r.classList.add('is-today');
    var t = document.createElement('span');
    t.className = 'sv-hours__now';
    t.textContent = 'Today';
    r.querySelector('.sv-hours__day').appendChild(t);
  });

  /* ----- EventSchedule: fade past events; on Home ("Coming up") hide them ----- */
  document.querySelectorAll('.sv-sched__row[data-end]').forEach(function (r) {
    if (r.dataset.end < today) r.classList.add('is-past');
  });
  document.querySelectorAll('.sv-sched[data-upcoming]').forEach(function (s) {
    s.querySelectorAll('.sv-sched__row.is-past').forEach(function (r) { r.hidden = true; });
    var shown = 0;
    s.querySelectorAll('.sv-sched__month').forEach(function (m) {
      var rows = m.querySelectorAll('.sv-sched__row:not([hidden])').length;
      m.hidden = rows === 0;
      shown += rows;
    });
    var empty = s.querySelector('.sv-empty');
    if (empty) empty.hidden = shown > 0;
  });

  /* ----- NoticeItem: urgent styling ends on its expiry date, even between site rebuilds ----- */
  document.querySelectorAll('.sv-notice--urgent[data-expires]').forEach(function (n) {
    if (n.dataset.expires >= today) return;
    n.classList.remove('sv-notice--urgent');
    var badge = n.querySelector('.sv-badge');
    if (!badge) return;
    badge.classList.remove('sv-badge--kumkum');
    if (n.dataset.tone && n.dataset.tone !== 'neutral') badge.classList.add('sv-badge--' + n.dataset.tone);
    var icon = badge.querySelector('.sv-icon');
    if (icon) icon.remove();
  });
})();
