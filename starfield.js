/* VYRON — deep space background.
   Three parallax star layers with five star colours, per-star twinkle,
   distance haze, and a few pulsing supergiants; plus slow cold-hued nebulae
   drifting behind everything. Counts scale with the viewport. */

(function () {
  'use strict';

  var TAU = Math.PI * 2;

  // Star colours
  var COLOURS = {
    white:  [1.00, 1.00, 1.00],
    blue:   [0.70, 0.85, 1.00],
    yellow: [1.00, 0.95, 0.70],
    orange: [1.00, 0.80, 0.60],
    red:    [1.00, 0.60, 0.50]
  };

  function rand(a, b) { return a + Math.random() * (b - a); }

  /** 50% white, 20% blue, 20% yellow, 10% orange — or a 60% chance of the
      layer's bias colour. */
  function pickColour(bias) {
    if (bias && Math.random() < 0.6) return bias;
    if (bias) {
      var all = ['white', 'blue', 'yellow', 'orange', 'red'];
      return all[(Math.random() * all.length) | 0];
    }
    var roll = Math.random();
    if (roll < 0.5) return 'white';
    if (roll < 0.7) return 'blue';
    if (roll < 0.9) return 'yellow';
    return 'orange';
  }

  function makeStar(w, h, sizeMin, sizeMax, briMin, briMax, bias) {
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      size: rand(sizeMin, sizeMax),
      brightness: rand(briMin, briMax),
      colour: pickColour(bias),
      twinkleSpeed: rand(1.5, 5.0),
      twinklePhase: Math.random() * TAU,
      supergiant: false
    };
  }

  /** Distance haze desaturates toward a cold blue. */
  function hazed(colour, haze) {
    var c = COLOURS[colour], b = haze * 0.3;
    return [c[0] * (1 - b) + 0.6 * b,
            c[1] * (1 - b) + 0.7 * b,
            c[2] * (1 - b) + 1.0 * b];
  }
  function rgba(c, a) {
    return 'rgba(' + (c[0] * 255 | 0) + ',' + (c[1] * 255 | 0) + ',' + (c[2] * 255 | 0) + ',' + a + ')';
  }


  /* ---------- Nebulae ----------
     Cold-hue clouds with overlapping swirl layers, a pulsing core, an
     offset swirl for depth, and a few embedded star points. The slowest
     moving thing on the page. */

  function hsla(h, s, l, a) {
    return 'hsla(' + (h * 360).toFixed(1) + ',' + (s * 100) + '%,' + (l * 100) + '%,' + a + ')';
  }

  function makeNebula(w, h) {
    return {
      x: Math.random() * w,
      y: rand(-h, h),
      size: rand(150, 300) * 1.8,
      colorShiftPhase: Math.random() * TAU,
      swirlPhase: Math.random() * TAU,
      hue: Math.random()
    };
  }

  function drawNebula(ctx, n, t) {
    // Cold hues only — deep blue through purple
    var hueShift = Math.sin(n.colorShiftPhase) * 0.05;
    var coldHue = 0.6 + (n.hue % 0.25);
    var baseHue = (coldHue + hueShift) % 1;
    var layer, g;

    // Three overlapping swirl layers
    for (layer = 0; layer < 3; layer++) {
      var swirl = Math.sin(n.swirlPhase + layer * 1.2) * n.size * 0.1;
      var lx = n.x + swirl;
      var ly = n.y + Math.cos(n.swirlPhase * 0.7 + layer) * n.size * 0.05;
      var alpha = (0.35 - layer * 0.1) * 0.25;
      var radius = (n.size * (1 - layer * 0.2)) / 2;
      if (radius <= 0) continue;
      g = ctx.createRadialGradient(lx, ly, 0, lx, ly, radius);
      g.addColorStop(0, hsla(baseHue, 0.5, 0.5, alpha));
      g.addColorStop(1, hsla(baseHue, 0.5, 0.5, 0));
      ctx.fillStyle = g;
      ctx.fillRect(lx - radius, ly - radius, radius * 2, radius * 2);
    }

    // Pulsing inner core
    var coreAlpha = 0.15 + Math.sin(n.colorShiftPhase * 2) * 0.05;
    var coreR = n.size * 0.25;
    g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, coreR);
    g.addColorStop(0, hsla(baseHue, 0.5, 1.0, coreAlpha));
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(n.x - coreR, n.y - coreR, coreR * 2, coreR * 2);

    // Extra offset swirl for depth
    var ex = Math.sin(n.swirlPhase * 1.3 + 2.5) * n.size * 0.12;
    var exR = n.size * 0.4;
    g = ctx.createRadialGradient(n.x + ex, n.y - ex * 0.5, 0, n.x + ex, n.y - ex * 0.5, exR);
    g.addColorStop(0, hsla(baseHue, 0.5, 0.5, 0.15 * 0.25));
    g.addColorStop(1, hsla(baseHue, 0.5, 0.5, 0));
    ctx.fillStyle = g;
    ctx.fillRect(n.x + ex - exR, n.y - ex * 0.5 - exR, exR * 2, exR * 2);

    // Embedded star points
    for (var i = 0; i < 4; i++) {
      var ang = n.swirlPhase * 0.3 + i * Math.PI / 2;
      var dist = n.size * 0.2;
      var tw = Math.sin(t * 2 + i) * 0.5 + 0.5;
      ctx.fillStyle = 'rgba(255,255,255,' + (0.15 * tw).toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(n.x + Math.cos(ang) * dist, n.y + Math.sin(ang) * dist, 1, 0, TAU);
      ctx.fill();
    }
  }

  function init() {
    var canvas = document.getElementById('stars');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var w, h, dpr, layers = [], nebulae = [], t = 0, last = 0;

    // far / mid / near layers
    var SPEC = [
      { n: 50, speed: 0.5, haze: 0.40, size: [0.3, 1.5], bri: [0.1, 0.7], bias: 'blue' },
      { n: 55, speed: 0.7, haze: 0.20, size: [0.5, 2.5], bri: [0.2, 0.9], bias: null   },
      { n: 35, speed: 1.0, haze: 0.00, size: [1.0, 3.5], bri: [0.3, 1.0], bias: null   }
    ];

    function build() {
      // Scale counts to the viewport so density feels consistent
      var density = Math.max(0.8, Math.min(2.6, (w * h) / (800 * 600)));
      layers = SPEC.map(function (s, li) {
        var stars = [], count = Math.round(s.n * density);
        for (var i = 0; i < count; i++) {
          var st = makeStar(w, h, s.size[0], s.size[1], s.bri[0], s.bri[1], s.bias);
          // A few supergiants live in the near layer
          if (li === 2 && i < 4) {
            st.supergiant = true;
            st.size = rand(3.5, 5.5);
            st.brightness = 1.0;
            st.colour = ['yellow', 'orange', 'red'][(Math.random() * 3) | 0];
          }
          st.rgb = hazed(st.colour, s.haze);
          stars.push(st);
        }
        return { speed: s.speed, haze: s.haze, stars: stars };
      });

      // Nebulae
      nebulae = [];
      for (var ni = 0; ni < 3; ni++) nebulae.push(makeNebula(w, h));
    }

    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    }

    function drawStar(s, haze) {
      var twinkle = reduced ? 0.85 : 0.7 + Math.sin(t * s.twinkleSpeed + s.twinklePhase) * 0.3;
      var bri = s.brightness * twinkle * (1 - haze * 0.2);
      var c = s.rgb;

      if (s.supergiant) {
        var pulse = (reduced ? 1 : Math.sin(t * 0.8 + s.twinklePhase) * 0.15 + 1.0);
        var ps = s.size * pulse;
        ctx.fillStyle = rgba(c, 0.06);
        ctx.beginPath(); ctx.arc(s.x, s.y, ps * 2, 0, TAU); ctx.fill();
        ctx.fillStyle = rgba(c, 0.18);
        ctx.beginPath(); ctx.arc(s.x, s.y, ps * 1.1, 0, TAU); ctx.fill();
        ctx.fillStyle = rgba(c, bri);
        ctx.beginPath(); ctx.arc(s.x, s.y, ps / 2, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.9)';
        ctx.beginPath(); ctx.arc(s.x, s.y, ps * 0.225, 0, TAU); ctx.fill();
        return;
      }

      if (s.size > 2.0) {                       // glow on the larger stars
        ctx.fillStyle = rgba(c, bri * 0.12);
        ctx.beginPath(); ctx.arc(s.x, s.y, s.size * 1.25, 0, TAU); ctx.fill();
      }
      ctx.fillStyle = rgba(c, bri);
      ctx.beginPath(); ctx.arc(s.x, s.y, s.size / 2, 0, TAU); ctx.fill();
    }

    function frame(now) {
      var dt = Math.min(0.05, (now - last) / 1000); last = now;
      t += dt;
      ctx.clearRect(0, 0, w, h);

      // Nebulae sit behind every star layer, drifting at speed 0.1
      for (var ni = 0; ni < nebulae.length; ni++) {
        var n = nebulae[ni];
        if (!reduced) {
          n.y += 1.2 * dt;
          n.colorShiftPhase += dt * 0.3;
          n.swirlPhase += dt * 0.5;
          if (n.y > h + n.size) {
            n.y = -n.size;
            n.x = Math.random() * w;
            n.hue = Math.random();
          }
        }
        drawNebula(ctx, n, t);
      }

      for (var li = 0; li < layers.length; li++) {
        var L = layers[li];
        for (var i = 0; i < L.stars.length; i++) {
          var s = L.stars[i];
          if (!reduced) {
            s.y += 12 * L.speed * dt;           // parallax drift
            if (s.y > h + 4) { s.y = -4; s.x = Math.random() * w; }
          }
          drawStar(s, L.haze);
        }
      }
      requestAnimationFrame(frame);
    }

    size();
    window.addEventListener('resize', size);
    requestAnimationFrame(frame);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
