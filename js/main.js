// KatieOS 1.0 — progressive-enhancement behavior shared by every page.
// Every feature here is optional: if a script fails to load, the underlying
// content (windows, photos, project cards, the contact form) is still visible
// and usable through plain HTML/CSS.
(function () {
  'use strict';

  // Matrix-style "decode" text reveal. Reusable: applies to any element
  // marked [data-decode], using its data-decode value or existing text
  // content as the target string. Respects prefers-reduced-motion.
  var SCRAMBLE_CHARS = '!<>-_\\/[]{}—=+*^?#________';

  function decodeText(el) {
    var text = el.getAttribute('data-decode') || el.textContent;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.textContent = text;
      return;
    }

    var letters = text.split('');
    el.textContent = '';
    var timeouts = [];
    var intervals = [];

    var spans = letters.map(function (letter) {
      var span = document.createElement('span');
      span.textContent = letter;
      span.className = 'decode-char';
      span.style.opacity = '0';
      if (letter === ' ') span.style.minWidth = '0.3em';
      el.appendChild(span);
      return span;
    });

    spans.forEach(function (span, index) {
      var letter = letters[index];
      var iterations = 0;
      var startTimeout = setTimeout(function () {
        var interval = setInterval(function () {
          if (iterations < 10) {
            span.textContent = SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
            span.style.opacity = '1';
            span.className = 'decode-char decode-char--scrambling';
          } else {
            span.textContent = letter;
            span.style.opacity = '1';
            span.className = 'decode-char decode-char--settled';
            clearInterval(interval);
          }
          iterations++;
        }, 50);
        intervals.push(interval);
      }, index * 100);
      timeouts.push(startTimeout);
    });

    window.addEventListener('pagehide', function cleanup() {
      timeouts.forEach(clearTimeout);
      intervals.forEach(clearInterval);
      window.removeEventListener('pagehide', cleanup);
    });
  }

  document.querySelectorAll('[data-decode]').forEach(decodeText);

  // Silent "how it works" demo clips: autoplay + loop like a living screenshot,
  // unless the visitor prefers reduced motion (they just see the poster frame).
  if (!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) {
    document.querySelectorAll('.screen-shot video.fill-img').forEach(function (v) {
      v.play().catch(function () {});
    });
  }

  function updateClock() {
    var el = document.getElementById('os-clock');
    if (!el) return;
    var d = new Date();
    var hr = d.getHours() % 12 || 12;
    var clock = String(d.getMonth() + 1).padStart(2, '0') + '/' + String(d.getDate()).padStart(2, '0') +
      '/2001 · ' + hr + ':' + String(d.getMinutes()).padStart(2, '0') + ' ' + (d.getHours() < 12 ? 'AM' : 'PM');
    el.textContent = clock;
  }
  updateClock();
  setInterval(updateClock, 20000);

  // Window minimize / reopen (About page's two overlapping windows)
  document.querySelectorAll('[data-close]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var win = document.getElementById(btn.getAttribute('data-close'));
      var reopen = document.getElementById(btn.getAttribute('data-close') + '-reopen');
      if (win) win.hidden = true;
      if (reopen) reopen.hidden = false;
    });
  });
  document.querySelectorAll('[data-open]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var win = document.getElementById(btn.getAttribute('data-open'));
      var reopen = document.getElementById(btn.getAttribute('data-open') + '-reopen');
      if (win) win.hidden = false;
      if (reopen) reopen.hidden = true;
    });
  });

  // Photo carousel (About page)
  var photoFileEl = document.getElementById('photo-file');
  if (photoFileEl) {
    var photos = [
      { file: 'PHOTO-01.JPG', src: 'images/about/photo-1.jpeg', alt: 'Katie walking a Seoul side street holding a white umbrella.', caption: 'Me in my favorite city in the world, Seoul!', pos: '50% 75%', zoom: 'scale(1.2)', origin: '75% 50%' },
      { file: 'PHOTO-02.JPG', src: 'images/about/photo-2.jpeg', alt: 'Six figure skaters posing with joined hands at Princeton’s Baker Rink.', caption: 'I figure skate on Princeton\'s Synchronized Skating team!' },
      { file: 'PHOTO-03.JPG', src: 'images/about/photo-3.jpeg', alt: 'Two ribbed crochet beanies, maroon and white, each with an embroidered logo.', caption: 'I love to crochet! This design is featured on my YouTube channel @kaytikrochets.' },
      { file: 'PHOTO-04.JPG', src: 'images/about/photo-5.jpeg', alt: 'Group photo at night on a rooftop set with lighting equipment.', caption: 'Filming a dance cover to GO! by Cortis. Dancing is the most fun study break.' },
      { file: 'PHOTO-05.JPG', src: 'images/about/photo-4.jpeg', alt: 'Katie standing beside a giant doll statue outside a storefront.', caption: 'If you watched Squid Game, you might recognize this friendly doll...' }
    ];
    var photoIdx = 0;
    var slotEl = document.getElementById('photo-slot');
    var captionEl = document.getElementById('photo-caption');
    var countEl = document.getElementById('photo-count');

    function renderPhoto() {
      var p = photos[photoIdx];
      photoFileEl.textContent = p.file;
      slotEl.src = p.src;
      slotEl.alt = p.alt;
      slotEl.style.objectPosition = p.pos || 'center';
      slotEl.style.transform = p.zoom || 'none';
      slotEl.style.transformOrigin = p.origin || 'center';
      captionEl.textContent = p.caption;
      countEl.textContent = (photoIdx + 1) + ' of ' + photos.length;
    }
    var prevBtn = document.getElementById('photo-prev');
    var nextBtn = document.getElementById('photo-next');
    if (prevBtn) prevBtn.addEventListener('click', function () {
      photoIdx = (photoIdx + photos.length - 1) % photos.length;
      renderPhoto();
    });
    if (nextBtn) nextBtn.addEventListener('click', function () {
      photoIdx = (photoIdx + 1) % photos.length;
      renderPhoto();
    });
  }

  // Projects index — instant client-side filter
  var filterTabs = document.querySelectorAll('.filter-tab');
  if (filterTabs.length) {
    var cards = document.querySelectorAll('[data-project-type]');
    filterTabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        filterTabs.forEach(function (t) { t.setAttribute('aria-selected', 'false'); });
        tab.setAttribute('aria-selected', 'true');
        var f = tab.getAttribute('data-filter');
        cards.forEach(function (card) {
          card.hidden = !(f === 'All' || card.getAttribute('data-project-type') === f);
        });
      });
    });
  }

  // Contact form — validates, then hands off to mailto (no backend, per the brief)
  var form = document.getElementById('contact-form');
  if (form) {
    var subjectEl = document.getElementById('csubject');
    var msgEl = document.getElementById('cmsg');
    var errorEl = document.getElementById('form-error');
    var defaultState = document.getElementById('form-state-default');
    var sentState = document.getElementById('form-state-sent');
    var resetBtn = document.getElementById('form-reset');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var subjectText = subjectEl.value.trim();
      var msg = msgEl.value.trim();
      if (!subjectText || !msg) {
        errorEl.textContent = 'Add a subject and a message before sending.';
        return;
      }
      errorEl.textContent = '';
      var subject = encodeURIComponent(subjectText);
      var body = encodeURIComponent(msg);
      window.location.href = 'mailto:kl9484@princeton.edu?subject=' + subject + '&body=' + body;
      defaultState.hidden = true;
      sentState.hidden = false;
    });

    if (resetBtn) resetBtn.addEventListener('click', function () {
      form.reset();
      errorEl.textContent = '';
      sentState.hidden = true;
      defaultState.hidden = false;
    });
  }
})();
