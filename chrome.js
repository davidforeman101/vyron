/* VYRON — chrome title font.
   A bitmap typeface: one image per character. Any element carrying
   data-chrome="TEXT" is rendered in it. */

(function () {
  'use strict';

  var GLYPH = {};
  'abcdefghijklmnopqrstuvwxyz'.split('').forEach(function (c) {
    GLYPH[c] = 'font/char_' + c + '.png';
  });
  '0123456789'.split('').forEach(function (d) {
    GLYPH[d] = 'font/digit_' + d + '.png';
  });

  function render(el) {
    var text = (el.getAttribute('data-chrome') || el.textContent || '').toLowerCase();
    var frag = document.createDocumentFragment();
    var any = false;

    // Glyphs are individual images, so they would wrap mid-word. Group each
    // word in a nowrap span — lines then break at spaces, like real text.
    var word = null;
    function wordEl() {
      if (!word) { word = document.createElement('span'); word.className = 'chrome-word'; frag.appendChild(word); }
      return word;
    }

    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (ch === ' ') {
        word = null;                                  // close the current word
        var sp = document.createElement('span');
        sp.className = 'chrome-space';
        frag.appendChild(sp);
        continue;
      }
      if (GLYPH[ch]) {
        var img = document.createElement('img');
        img.src = GLYPH[ch];
        img.alt = ch;
        img.className = 'chrome-glyph';
        img.draggable = false;
        wordEl().appendChild(img);
        any = true;
      } else {
        // Characters the font doesn't include — keep them as text
        var t = document.createElement('span');
        t.className = 'chrome-lit';
        t.textContent = ch;
        wordEl().appendChild(t);
      }
    }

    if (!any) return;                       // nothing renderable; leave as-is
    el.setAttribute('aria-label', el.getAttribute('data-chrome') || el.textContent);
    el.textContent = '';
    el.appendChild(frag);
    el.classList.add('chrome-ready');
  }

  function init(root) {
    // Guard: DOMContentLoaded passes an Event, not a root node
    var scope = (root && typeof root.querySelectorAll === 'function') ? root : document;
    scope.querySelectorAll('[data-chrome]').forEach(render);
  }

  // Let dynamically-inserted markup (e.g. database detail) render too
  window.vyronChrome = init;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { init(); });
  } else {
    init();
  }
})();
