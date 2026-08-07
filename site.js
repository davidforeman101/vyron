/* VYRON — site behaviour: shared nav/footer, starfield, reveals, lightbox. */

(function () {
  'use strict';

  var PAGES = [
    { id: 'overview', href: 'index.html',    label: 'Overview' },
    { id: 'codex',    href: 'codex.html',    label: 'Codex'    },
    { id: 'database', href: 'database.html', label: 'Database' },
    { id: 'manual',   href: 'manual.html',   label: 'Manual'   },
    { id: 'support',  href: 'support.html',  label: 'Support'  },
    { id: 'privacy',  href: 'privacy.html',  label: 'Privacy'  }
  ];

  /* ---------- Shared nav + footer ---------- */

  function chrome() {
    var wrap = document.querySelector('.wrap');
    if (!wrap) return;
    var current = wrap.getAttribute('data-page') || '';

    var nav = document.createElement('nav');
    nav.className = 'nav';
    PAGES.forEach(function (p) {
      var a = document.createElement('a');
      a.href = p.href;
      a.textContent = p.label;
      if (p.id === current) { a.className = 'on'; a.setAttribute('aria-current', 'page'); }
      nav.appendChild(a);
    });

    var header = wrap.querySelector('.brand');
    if (header && header.nextSibling) wrap.insertBefore(nav, header.nextSibling);
    else wrap.insertBefore(nav, wrap.firstChild);

    var foot = document.createElement('footer');
    var links = PAGES.filter(function (p) { return p.id !== current; })
      .map(function (p) { return '<a href="' + p.href + '">' + p.label + '</a>'; })
      .join(' &nbsp;·&nbsp; ');
    foot.innerHTML = links + '<p style="margin-top:12px">© 2026 David Foreman &nbsp;·&nbsp; ' +
      '<a href="mailto:VyronAdmin@proton.me">VyronAdmin@proton.me</a></p>';
    wrap.appendChild(foot);
  }

  /* ---------- Scroll reveals ---------- */

  function reveals(root) {
    var items = (root || document).querySelectorAll('.panel:not(.in), .stat:not(.in), .shot:not(.in), .card:not(.in)');
    if (!('IntersectionObserver' in window) ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      Array.prototype.forEach.call(items, function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.05 });
    Array.prototype.forEach.call(items, function (el) { io.observe(el); });
  }
  window.vyronReveal = reveals;

  /* ---------- Screenshot lightbox ---------- */

  function lightbox() {
    var shots = document.querySelectorAll('.shot');
    if (!shots.length) return;
    var box = document.createElement('div');
    box.className = 'lightbox';
    box.innerHTML = '<button class="lb-close" aria-label="Close">✕</button>' +
                    '<button class="lb-prev" aria-label="Previous">‹</button>' +
                    '<img alt="">' +
                    '<button class="lb-next" aria-label="Next">›</button>';
    document.body.appendChild(box);
    var img = box.querySelector('img'), srcs = [], idx = 0;

    Array.prototype.forEach.call(shots, function (el, i) {
      srcs.push(el.getAttribute('data-full') || el.querySelector('img').src);
      el.addEventListener('click', function () { open(i); });
      el.setAttribute('tabindex', '0');
      el.setAttribute('role', 'button');
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i); }
      });
    });
    function open(i) { idx = i; img.src = srcs[idx]; box.classList.add('on'); }
    function close() { box.classList.remove('on'); }
    function step(d) { idx = (idx + d + srcs.length) % srcs.length; img.src = srcs[idx]; }

    box.querySelector('.lb-close').addEventListener('click', close);
    box.querySelector('.lb-prev').addEventListener('click', function (e) { e.stopPropagation(); step(-1); });
    box.querySelector('.lb-next').addEventListener('click', function (e) { e.stopPropagation(); step(1); });
    box.addEventListener('click', function (e) { if (e.target === box || e.target === img) close(); });
    document.addEventListener('keydown', function (e) {
      if (!box.classList.contains('on')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
    });
  }

  /* ---------- Sticky nav ---------- */

  function stickyNav() {
    var nav = document.querySelector('.nav');
    if (!nav) return;
    var top = nav.getBoundingClientRect().top + window.scrollY;
    function onScroll() { nav.classList.toggle('stuck', window.scrollY > top + 4); }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }


  /* ---------- Codex creed: one phrase at a time ---------- */

  function creed() {
    var box = document.getElementById('creed');
    if (!box) return;
    var lines = box.querySelectorAll('.creed-line');
    if (lines.length < 2) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      lines[0].classList.add('on');
      return;
    }

    // Fade a phrase in, hold it, fade it out, then start the next —
    // never two on screen at once.
    var FADE = 1200, HOLD = 2100, i = 0;

    function show() {
      lines[i].classList.add('on');
      setTimeout(hide, FADE + HOLD);
    }
    function hide() {
      lines[i].classList.remove('on');
      setTimeout(function () {
        i = (i + 1) % lines.length;
        show();
      }, FADE);
    }
    show();
  }

  function init() { chrome(); reveals(); lightbox(); stickyNav(); creed(); }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
