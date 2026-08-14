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

  // Universal Purchase — one App Store record serves both iPhone and Mac,
  // so a single link is correct for both platforms.
  var STORE_URL = 'https://apps.apple.com/us/app/vyron/id6778002261';

  /* ---------- Shared nav + footer ---------- */

  function chrome() {
    var wrap = document.querySelector('.wrap');
    if (!wrap) return;
    var current = wrap.getAttribute('data-page') || '';

    var nav = document.createElement('nav');
    nav.className = 'nav';

    // Compact wordmark, revealed only once the nav sticks — so the title never
    // disappears completely as you scroll. Hidden at the top, where the big
    // one is already on screen.
    var brand = document.createElement('a');
    brand.className = 'nav-brand chrome';
    brand.href = 'index.html';
    brand.setAttribute('data-chrome', 'vyron');
    brand.setAttribute('aria-label', 'VYRON — home');
    brand.textContent = 'VYRON';
    nav.appendChild(brand);

    PAGES.forEach(function (p) {
      var a = document.createElement('a');
      a.href = p.href;
      a.textContent = p.label;
      if (p.id === current) { a.className = 'on'; a.setAttribute('aria-current', 'page'); }
      nav.appendChild(a);
    });

    // Get VYRON — distinct colour so it reads as an action, not a page.
    var cta = document.createElement('a');
    cta.className = 'nav-cta';
    cta.href = STORE_URL;
    cta.target = '_blank';
    cta.rel = 'noopener';
    cta.textContent = 'Get VYRON';
    nav.appendChild(cta);

    var header = wrap.querySelector('.brand');
    if (header && header.nextSibling) wrap.insertBefore(nav, header.nextSibling);
    else wrap.insertBefore(nav, wrap.firstChild);

    // chrome.js has already run by now, so render this one explicitly.
    if (window.vyronChrome) window.vyronChrome(nav);

    var foot = document.createElement('footer');
    var links = PAGES.filter(function (p) { return p.id !== current; })
      .map(function (p) { return '<a href="' + p.href + '">' + p.label + '</a>'; })
      .join(' &nbsp;·&nbsp; ');
    foot.innerHTML =
      '<a class="footer-cta" href="' + STORE_URL + '" target="_blank" rel="noopener">Get VYRON on the App Store</a>' +
      '<p style="margin-top:14px">' + links + '</p>' +
      '<p style="margin-top:12px">© 2026 David Foreman &nbsp;·&nbsp; ' +
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
    // threshold MUST stay 0. It is a fraction of the *element*, not the screen,
    // so a tall element can never reach a non-zero threshold on a small viewport:
    // the Database panel is ~19,000px on a phone, of which one screen is 2.7% —
    // under a 0.05 threshold it never fired and the whole page stayed invisible.
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0 });
    Array.prototype.forEach.call(items, function (el) { io.observe(el); });

    // Safety net: if anything is still hidden shortly after load, show it.
    // Content must never be invisible because an animation didn't fire.
    setTimeout(function () {
      Array.prototype.forEach.call(items, function (el) {
        if (!el.classList.contains('in') &&
            el.getBoundingClientRect().top < window.innerHeight) {
          el.classList.add('in');
        }
      });
    }, 1200);
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
