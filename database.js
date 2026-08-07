/* VYRON — enemy database: search, threat filter, detail view.
   Entries live in data-enemies.js; this file only presents them. */

(function () {
  'use strict';

  var cardsEl = document.getElementById('db-cards');
  if (!cardsEl) return;

  var countEl  = document.getElementById('db-count');
  var searchEl = document.getElementById('db-search');
  var detail   = document.getElementById('db-detail');
  var inner    = document.getElementById('db-detail-inner');

  var all = [], threat = 'all', query = '';

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function threatBar(n) {
    return '<span class="threat t' + n + '">' +
           '●'.repeat(n) + '<span style="opacity:.28">' + '●'.repeat(5 - n) + '</span></span>';
  }

  /* Captured gun-camera stills. Two entries have no image on file — they get a
     placeholder rather than a hole in the grid. */
  function portrait(e, cls) {
    if (e.img) {
      return '<div class="portrait ' + cls + '">' +
             '<img src="' + esc(e.img) + '" alt="' + esc(e.name) + '" ' +
             'loading="lazy" decoding="async"></div>';
    }
    return '<div class="portrait ' + cls + ' none"><span>No visual<br>record</span></div>';
  }

  function matches(e) {
    if (threat === '1' && e.threat > 2) return false;
    if (threat === '3' && e.threat !== 3) return false;
    if (threat === '4' && e.threat < 4) return false;
    if (!query) return true;
    var q = query.toLowerCase();
    return e.name.toLowerCase().indexOf(q) >= 0 ||
           e.description.toLowerCase().indexOf(q) >= 0;
  }

  function render() {
    var list = all.filter(matches);
    countEl.textContent = list.length + (list.length === 1 ? ' entry' : ' entries') +
      (threat === 'all' && !query ? ' catalogued' : ' matching');

    cardsEl.innerHTML = '';
    if (!list.length) {
      var empty = document.createElement('p');
      empty.className = 'db-empty';
      empty.textContent = 'No enemies match that. Try a different name, or clear the filter.';
      cardsEl.appendChild(empty);
      return;
    }
    list.forEach(function (e) {
      var b = document.createElement('button');
      b.className = 'card';
      b.innerHTML = portrait(e, 'p-card') +
        '<div class="card-body"><h3>' + esc(e.name) + '</h3>' +
        '<div class="meta">' + threatBar(e.threat) +
        '<span>' + esc(e.speed) + '</span>' +
        '<span>Lv ' + e.level + '</span></div></div>';
      b.addEventListener('click', function () { open(e); });
      cardsEl.appendChild(b);
    });

    if (window.vyronReveal) window.vyronReveal(cardsEl);
  }

  function bullets(title, arr) {
    if (!arr || !arr.length) return '';
    return '<div><h4>' + title + '</h4><ul>' +
      arr.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>';
  }

  function open(e) {
    inner.innerHTML =
      portrait(e, 'p-detail') +
      '<h2 class="chrome" data-chrome="' + esc(e.name.replace(/[^a-zA-Z0-9 ]/g, ' ')) + '">' +
        esc(e.name) + '</h2>' +
      '<div class="badges">' +
        '<span class="badge">Threat ' + e.threat + '/5</span>' +
        '<span class="badge">' + esc(e.speed) + '</span>' +
        '<span class="badge">First seen: level ' + e.level + '</span>' +
      '</div>' +
      '<p>' + esc(e.description) + '</p>' +
      '<div class="dl">' +
        bullets('Behaviour', e.behavior) +
        bullets('Strengths', e.strengths) +
        bullets('Weaknesses', e.weaknesses) +
        bullets('How to defeat', e.defeat) +
      '</div>';

    // Render the name in the chrome font
    if (window.vyronChrome) window.vyronChrome(inner);

    detail.classList.add('on');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    detail.classList.remove('on');
    document.body.style.overflow = '';
  }

  detail.querySelector('.detail-close').addEventListener('click', close);
  detail.addEventListener('click', function (e) { if (e.target === detail) close(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && detail.classList.contains('on')) close();
  });

  searchEl.addEventListener('input', function () { query = searchEl.value.trim(); render(); });

  Array.prototype.forEach.call(document.querySelectorAll('.chip'), function (chip) {
    chip.addEventListener('click', function () {
      Array.prototype.forEach.call(document.querySelectorAll('.chip'), function (c) {
        c.classList.remove('on');
      });
      chip.classList.add('on');
      threat = chip.getAttribute('data-threat');
      render();
    });
  });

  // Data arrives as a global from data-enemies.js, so this works over file:// too
  if (window.VYRON_ENEMIES) {
    all = window.VYRON_ENEMIES;
    render();
  } else {
    countEl.textContent = 'Database unavailable.';
  }
})();
