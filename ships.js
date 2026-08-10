/* VYRON — ship showcase and distant patrol.
   Fleet display: each hull flies in, holds while its name is shown, then
   banks away as the next arrives. Ships are shaded 3D models. */

(function () {
  'use strict';

  var PERSP = 3.5;
  var LX = 0.267, LY = -0.535, LZ = 0.802;
  var AMB = 0.40;

  var TIER_NAMES = ['VANGUARD', 'INTERCEPTOR', 'DESTROYER', 'DREADNOUGHT',
                    'LEVIATHAN', 'WARLORD', 'TITAN', 'COLOSSUS'];
  // Hull name colours
  var TIER_NAME_COLOURS = [
    '0,255,255', '0,230,179', '255,128,51', '179,51,204',
    '255,217,77', '255,51,38', '179,51,255', '242,230,179'
  ];
  var WINGSPAN = [18, 22, 25, 28, 32, 36, 40, 45];

  function shade(cat, bri, accent, hash) {
    var tint = (hash - 0.5) * 0.03, r, g, b;
    switch (cat) {
      case 0: r = 0.58 * bri; g = 0.60 * bri; b = 0.65 * bri; break;
      case 1: r = 0.38 * bri; g = 0.40 * bri; b = 0.44 * bri; break;
      case 2: r = accent[0] * bri * 0.6 + 0.15;
              g = accent[1] * bri * 0.6 + 0.10;
              b = accent[2] * bri * 0.6 + 0.10; break;
      case 3: r = 0.50 * bri; g = 0.52 * bri; b = 0.56 * bri; break;
      case 4: r = 0.28 * bri; g = 0.30 * bri; b = 0.34 * bri; break;
      case 5: r = accent[0] * bri * 0.35 + 0.10;
              g = accent[1] * bri * 0.35 + 0.08;
              b = accent[2] * bri * 0.35 + 0.08; break;
      default: r = 0.50 * bri; g = 0.52 * bri; b = 0.56 * bri;
    }
    return [Math.max(0, Math.min(1, r + tint)) * 255,
            Math.max(0, Math.min(1, g + tint)) * 255,
            Math.max(0, Math.min(1, b + tint)) * 255];
  }

  function drawShip(ctx, mesh, roll, scale, tierIdx, t) {
    var meshScale = scale * mesh.scale;
    var cosR = Math.cos(roll), sinR = Math.sin(roll);
    var verts = mesh.verts, faces = mesh.faces, accent = mesh.accent;
    var i, v, n = verts.length;

    var txf = new Array(n), proj = new Array(n);
    for (i = 0; i < n; i++) {
      v = verts[i];
      var tx = v[0] * cosR + v[2] * sinR, ty = v[1], tz = -v[0] * sinR + v[2] * cosR;
      txf[i] = [tx, ty, tz];
      var pS = PERSP / (PERSP - tz) * meshScale;
      proj[i] = [tx * pS, -ty * pS];
    }

    var render = [];
    for (i = 0; i < faces.length; i++) {
      var fv = faces[i].v;
      if (fv.length < 3) continue;
      var cx = 0, cy = 0, cz = 0, k;
      for (k = 0; k < fv.length; k++) { cx += txf[fv[k]][0]; cy += txf[fv[k]][1]; cz += txf[fv[k]][2]; }
      cx /= fv.length; cy /= fv.length; cz /= fv.length;
      var t0 = txf[fv[0]], t1 = txf[fv[1]], t2 = txf[fv[2]];
      var nx = (t1[1] - t0[1]) * (t2[2] - t0[2]) - (t1[2] - t0[2]) * (t2[1] - t0[1]);
      var ny = (t1[2] - t0[2]) * (t2[0] - t0[0]) - (t1[0] - t0[0]) * (t2[2] - t0[2]);
      var nz = (t1[0] - t0[0]) * (t2[1] - t0[1]) - (t1[1] - t0[1]) * (t2[0] - t0[0]);
      var len = Math.sqrt(nx * nx + ny * ny + nz * nz);
      if (len < 1e-4) continue;
      if (nx * cx + ny * cy + nz * cz < 0) { nx = -nx; ny = -ny; nz = -nz; }
      var ax = nx / len, ay = ny / len, az = nz / len;
      if (az <= -0.15) continue;
      var bri = AMB + Math.max(0, ax * LX + ay * LY + az * LZ) * (1 - AMB);
      var hx = LX, hy = LY, hz = LZ + 1;
      var hl = Math.sqrt(hx * hx + hy * hy + hz * hz);
      bri = Math.min(1, bri + Math.pow(Math.max(0, (ax * hx + ay * hy + az * hz) / hl), 16) * 0.4);
      render.push({ i: i, z: cz, bri: bri });
    }
    render.sort(function (a, b) { return a.z - b.z; });

    ctx.lineJoin = 'miter';
    var baseAlpha = ctx.globalAlpha;
    for (i = 0; i < render.length; i++) {
      var fd = render[i], face = faces[fd.i], fvv = face.v;
      var c = shade(face.c, fd.bri, accent, ((fd.i * 7919 + 104729) % 256) / 256);
      ctx.beginPath();
      ctx.moveTo(proj[fvv[0]][0], proj[fvv[0]][1]);
      for (var k2 = 1; k2 < fvv.length; k2++) ctx.lineTo(proj[fvv[k2]][0], proj[fvv[k2]][1]);
      ctx.closePath();
      ctx.fillStyle = 'rgb(' + (c[0]|0) + ',' + (c[1]|0) + ',' + (c[2]|0) + ')';
      ctx.fill();
      ctx.strokeStyle = 'rgb(' + ((c[0]*0.92)|0) + ',' + ((c[1]*0.92)|0) + ',' + ((c[2]*0.92)|0) + ')';
      ctx.lineWidth = 0.5;
      ctx.stroke();
      if (face.c === 2 || face.c === 5) {
        var gm = face.c === 2 ? 0.35 : 0.20, ga = face.c === 2 ? 0.6 : 0.4;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        // Multiply, don't overwrite — otherwise a faded ship's glow blazes
        // at full strength (visible on the distant patrol and on fade-outs)
        ctx.globalAlpha = ga * baseAlpha;
        ctx.fillStyle = 'rgb(' + ((accent[0]*gm*255)|0) + ',' + ((accent[1]*gm*255)|0) + ',' + ((accent[2]*gm*255)|0) + ')';
        ctx.fill();
        ctx.restore();
      }
    }

    // The game's DL1+ detail pass — stripes, rivets, and the animated
    // per-tier lights and effects
    if (tierIdx !== undefined) {
      drawDetail(ctx, mesh, proj, accent, tierIdx, t, scale / 42, meshScale);
    }
  }


  /* ---------- Hull detailing ----------
     Accent stripes, rivets and the per-hull running lights: energy veins,
     scanner sweeps, nav blinkers, strobes, beacons and coronas. Sizes are
     scaled by dk so they stay proportional at any display size. */

  var TAU = Math.PI * 2;

  function dot(ctx, x, y, r, col) {
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  }
  function line(ctx, a, b, col, wdt) {
    ctx.strokeStyle = col; ctx.lineWidth = wdt;
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
  }
  function acc(a, m, add, alpha) {
    add = add || 0;
    return 'rgba(' + ((a[0] * m + add) * 255 | 0) + ',' + ((a[1] * m + add) * 255 | 0) + ',' +
           ((a[2] * m + add) * 255 | 0) + ',' + alpha + ')';
  }
  function lerp(p, q, f) { return [p[0] + (q[0] - p[0]) * f, p[1] + (q[1] - p[1]) * f]; }

  var WING_STRIPE_W = [3.5, 4.0, 5.0, 5.5, 7.0, 5.5, 6.0, 6.0];

  function drawDetail(ctx, mesh, proj, accent, tierIdx, t, dk, meshScale) {
    var ribs = mesh.ribCount, i, wb, w, rootLE, tipLE, tip, p, pulse, px, py, a;
    var wings = [mesh.rwBase, mesh.lwBase];
    var ribTop = function (n) { return proj[1 + n * 4]; };
    var ribSide = function (n, s) { return proj[1 + n * 4 + s]; };

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // --- Wing leading-edge accent stripes ---
    w = WING_STRIPE_W[tierIdx] * dk;
    for (i = 0; i < 2; i++) {
      wb = wings[i];
      line(ctx, proj[wb], proj[wb + 1], acc(accent, 0.20, 0, 0.50), w);
      line(ctx, proj[wb], proj[wb + 1], acc(accent, 0.30, 0.10, 0.30), w * 0.4);
    }
    // --- Nose accent ---
    ctx.strokeStyle = acc(accent, 0.20, 0, 0.45); ctx.lineWidth = 3.5 * dk;
    ctx.beginPath(); ctx.moveTo(proj[0][0], proj[0][1]);
    ctx.lineTo(proj[1][0], proj[1][1]); ctx.lineTo(proj[5][0], proj[5][1]); ctx.stroke();
    ctx.strokeStyle = acc(accent, 0.30, 0.10, 0.25); ctx.lineWidth = 1.4 * dk;
    ctx.beginPath(); ctx.moveTo(proj[0][0], proj[0][1]);
    ctx.lineTo(proj[1][0], proj[1][1]); ctx.lineTo(proj[5][0], proj[5][1]); ctx.stroke();
    ctx.restore();

    // --- Rivets (T5 Leviathan has a clean hull) ---
    if (tierIdx !== 4) {
      ctx.fillStyle = 'rgba(204,209,217,.30)';
      for (i = 0; i < ribs; i++) {
        for (var j = 0; j < 4; j++) {
          p = proj[1 + i * 4 + j];
          ctx.beginPath(); ctx.arc(p[0], p[1], 0.8 * dk, 0, TAU); ctx.fill();
        }
      }
    }

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    switch (tierIdx) {

    case 0: {   // T1 VANGUARD — veins, cockpit bleed, wing lights, engine glow
      ctx.strokeStyle = acc(accent, 0.15, 0, 0.40); ctx.lineWidth = 1.5 * dk;
      ctx.beginPath();
      for (i = 0; i < ribs; i++) { p = ribTop(i); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }
      ctx.stroke();
      var v1 = (t * 1.2) % 1;
      for (i = 0; i < ribs; i++) {
        a = Math.max(0, 0.50 - Math.abs(i / Math.max(1, ribs - 1) - v1) * 1.5);
        if (a > 0.01) {
          p = ribTop(i);
          dot(ctx, p[0], p[1], 3 * dk, acc(accent, 0.4, 0, a));
          dot(ctx, p[0], p[1], 5 * dk, acc(accent, 0.2, 0, a * 0.4));
        }
      }
      var cg = 0.45 + Math.sin(t * 3) * 0.15;
      var bleed = lerp(ribTop(Math.min(1, ribs - 1)), proj[0], 0.4);
      dot(ctx, bleed[0], bleed[1], 4 * dk, acc(accent, 0.35, 0, cg * 0.5));
      dot(ctx, bleed[0], bleed[1], 8 * dk, acc(accent, 0.15, 0, cg * 0.25));
      for (i = 0; i < 2; i++) {
        wb = wings[i]; pulse = (t * 1.0) % 1;
        p = lerp(proj[wb], proj[wb + 1], pulse); a = Math.sin(pulse * Math.PI) * 0.6;
        dot(ctx, p[0], p[1], 2.5 * dk, acc(accent, 0.5, 0, a));
        dot(ctx, p[0], p[1], 5 * dk, acc(accent, 0.25, 0, a * 0.4));
        tip = proj[wb + 1];
        dot(ctx, tip[0], tip[1], 2.5 * dk, acc(accent, 0.4, 0, 0.6));
        dot(ctx, tip[0], tip[1], 5 * dk, acc(accent, 0.15, 0, 0.25));
      }
      p = proj[mesh.tailIdx]; var ex = 0.5 + Math.sin(t * 8) * 0.2;
      dot(ctx, p[0], p[1], 3 * dk, 'rgba(' + (accent[0]*0.5*255|0) + ',' + (accent[1]*0.5*255|0) + ',' + (accent[2]*0.8*255|0) + ',' + ex + ')');
      dot(ctx, p[0], p[1], 7 * dk, 'rgba(' + (accent[0]*0.2*255|0) + ',' + (accent[1]*0.2*255|0) + ',' + (accent[2]*0.4*255|0) + ',' + (ex*0.35) + ')');
      break;
    }

    case 1: {   // T2 INTERCEPTOR — racing stripes, scanner sweep, nav blinkers
      for (var s = 0; s < 2; s++) {
        ctx.strokeStyle = 'rgba(13,77,31,.45)'; ctx.lineWidth = 1.8 * dk;
        ctx.beginPath();
        for (i = 0; i < ribs; i++) {
          var mid = lerp(ribSide(i, s ? 3 : 1), ribTop(i), 0.5);
          i ? ctx.lineTo(mid[0], mid[1]) : ctx.moveTo(mid[0], mid[1]);
        }
        ctx.stroke();
      }
      for (i = 0; i < 2; i++) {
        tip = proj[wings[i] + 1];
        dot(ctx, tip[0], tip[1], 2.5 * dk, 'rgba(26,128,51,.6)');
        dot(ctx, tip[0], tip[1], 1 * dk, 'rgba(51,230,102,.35)');
      }
      var sp = (t * 0.8) % 1, sa = Math.sin(sp * Math.PI) * 0.45;
      p = lerp(ribTop(Math.min(1, ribs - 1)), proj[0], sp);
      dot(ctx, p[0], p[1], 2 * dk, 'rgba(38,204,89,' + sa + ')');
      dot(ctx, p[0], p[1], 5 * dk, 'rgba(20,115,46,' + (sa * 0.3) + ')');
      var aft = Math.min(ribs - 1, 4), eng = 0.5 + Math.sin(t * 7) * 0.2;
      [1, 3].forEach(function (sd) {
        var q = ribSide(aft, sd);
        dot(ctx, q[0], q[1], 2.5 * dk, 'rgba(26,191,77,' + (eng * 0.7) + ')');
        dot(ctx, q[0], q[1], 5 * dk, 'rgba(13,102,38,' + (eng * 0.25) + ')');
      });
      if (Math.sin(t * 6) > 0.3) {
        var nr = Math.min(ribs - 1, 3);
        [1, 3].forEach(function (sd) {
          var q = ribSide(nr, sd);
          dot(ctx, q[0], q[1], 2 * dk, 'rgba(26,217,77,.8)');
          dot(ctx, q[0], q[1], 4 * dk, 'rgba(13,128,38,.3)');
        });
      }
      break;
    }

    case 2: {   // T3 DESTROYER — yellow markings, insignia, pod charge, engine heat
      line(ctx, proj[0], proj[1], 'rgba(89,71,13,.55)', 4.0 * dk);
      line(ctx, proj[0], proj[1], 'rgba(128,107,26,.30)', 1.8 * dk);
      for (i = 0; i < 2; i++) {
        wb = wings[i];
        var rLE = proj[wb], tLE = proj[wb + 1], tTE = proj[wb + 2], rTE = proj[wb + 3];
        line(ctx, lerp(rLE, rTE, 0.15), lerp(tLE, tTE, 0.15), 'rgba(89,71,13,.50)', 2.5 * dk);
        line(ctx, lerp(rLE, rTE, 0.35), lerp(tLE, tTE, 0.35), 'rgba(89,71,13,.40)', 2.0 * dk);
      }
      var sc = ribTop(1), sr = 2.5 * dk;
      ctx.fillStyle = 'rgba(89,71,13,.55)'; ctx.beginPath();
      for (i = 0; i < 8; i++) {
        var ang = i * Math.PI / 4, rr = i % 2 === 0 ? sr : sr * 0.4;
        var sx = sc[0] + Math.cos(ang) * rr, sy = sc[1] + Math.sin(ang) * rr;
        i ? ctx.lineTo(sx, sy) : ctx.moveTo(sx, sy);
      }
      ctx.closePath(); ctx.fill();
      for (i = 0; i < 2; i++) {
        wb = wings[i]; pulse = (t * 1.2) % 1;
        p = lerp(proj[wb], proj[wb + 1], pulse); a = Math.sin(pulse * Math.PI) * 0.6;
        dot(ctx, p[0], p[1], 3 * dk, 'rgba(102,82,20,' + a + ')');
        dot(ctx, p[0], p[1], 6 * dk, 'rgba(64,51,10,' + (a * 0.4) + ')');
      }
      var pod = 0.3 + Math.sin(t * 4) * 0.25;
      for (i = 0; i < 2; i++) {
        tip = proj[wings[i] + 1];
        dot(ctx, tip[0], tip[1], 3.5 * dk, 'rgba(128,77,13,' + pod + ')');
        dot(ctx, tip[0], tip[1], 6 * dk, 'rgba(77,46,8,' + (pod * 0.35) + ')');
      }
      p = proj[mesh.tailIdx]; var heat = 0.4 + Math.sin(t * 6) * 0.15;
      dot(ctx, p[0], p[1], 3 * dk, 'rgba(128,71,13,' + heat + ')');
      dot(ctx, p[0], p[1], 7 * dk, 'rgba(77,38,5,' + (heat * 0.30) + ')');
      break;
    }

    case 3: {   // T4 DREADNOUGHT — wing fill, panel lines, strobes, red exhaust
      for (i = 0; i < 2; i++) {
        wb = wings[i];
        var rl = proj[wb], tl = proj[wb + 1], tt = proj[wb + 2], rt = proj[wb + 3];
        var rm = lerp(rl, rt, 0.5), tm = lerp(tl, tt, 0.5);
        ctx.fillStyle = acc(accent, 0.12, 0.03, 0.35);
        ctx.beginPath(); ctx.moveTo(rl[0], rl[1]); ctx.lineTo(tl[0], tl[1]);
        ctx.lineTo(tm[0], tm[1]); ctx.lineTo(rm[0], rm[1]); ctx.closePath(); ctx.fill();
      }
      for (i = 1; i < ribs; i += 2) line(ctx, ribSide(i, 3), ribSide(i, 1), 'rgba(20,20,26,.40)', 0.6 * dk);
      [[2, 3], [4, 5]].forEach(function (pr) {
        if (pr[1] < ribs) {
          var l0 = ribSide(pr[0], 3), r0 = ribSide(pr[0], 1);
          var m0 = lerp(l0, r0, 0.5), m1 = lerp(ribSide(pr[1], 3), ribSide(pr[1], 1), 0.5);
          line(ctx, l0, r0, 'rgba(77,82,92,.5)', 0.7 * dk);
          line(ctx, m0, m1, 'rgba(77,82,92,.5)', 0.7 * dk);
        }
      });
      var ag = 0.25 + Math.sin(t * 2.5) * 0.10;
      [2, 3].forEach(function (n) {
        if (n < ribs) { var q = ribTop(n); dot(ctx, q[0], q[1], 2.5 * dk, acc(accent, 0.25, 0, ag)); }
      });
      if (Math.sin(t * 8) > 0) {
        for (i = 0; i < 2; i++) {
          tip = proj[wings[i] + 1];
          dot(ctx, tip[0], tip[1], 2 * dk, 'rgba(230,38,26,.7)');
          dot(ctx, tip[0], tip[1], 5 * dk, 'rgba(230,26,13,.25)');
        }
      }
      p = proj[mesh.tailIdx]; var rex = 0.45 + Math.sin(t * 5) * 0.2;
      dot(ctx, p[0], p[1], 4 * dk, 'rgba(153,31,13,' + rex + ')');
      dot(ctx, p[0], p[1], 8 * dk, 'rgba(89,15,5,' + (rex * 0.30) + ')');
      break;
    }

    case 4: {   // T5 LEVIATHAN — trim bands, conduit veins, crown jewel
      [2, 5].forEach(function (n) {
        if (n < ribs) {
          line(ctx, ribSide(n, 3), ribSide(n, 1), acc(accent, 0.20, 0, 0.45), 2.0 * dk);
          line(ctx, ribSide(n, 3), ribSide(n, 1), acc(accent, 0.35, 0, 0.25), 0.8 * dk);
        }
      });
      var v5 = (t * 1.0) % 1;
      for (i = 0; i < ribs; i++) {
        a = Math.max(0, 0.60 - Math.abs(i / Math.max(1, ribs - 1) - v5) * 1.3);
        if (a > 0.01) {
          p = ribTop(i);
          dot(ctx, p[0], p[1], 3.5 * dk, acc(accent, 0.45, 0, a));
          dot(ctx, p[0], p[1], 6 * dk, acc(accent, 0.2, 0, a * 0.35));
        }
      }
      var cp = 0.4 + Math.sin(t * 4) * 0.3;
      dot(ctx, proj[0][0], proj[0][1], 3 * dk, acc(accent, 0.6, 0, cp));
      dot(ctx, proj[0][0], proj[0][1], 1.5 * dk, 'rgba(255,255,255,' + (cp * 0.5) + ')');
      if ((t * 2) % 1 < 0.08) dot(ctx, proj[0][0], proj[0][1], 8 * dk, acc(accent, 0.3, 0, 0.35));
      for (i = 0; i < 2; i++) {
        wb = wings[i]; pulse = (t * 1.5) % 1;
        p = lerp(proj[wb], proj[wb + 1], pulse); a = Math.sin(pulse * Math.PI) * 0.6;
        dot(ctx, p[0], p[1], 3 * dk, acc(accent, 0.5, 0, a));
        dot(ctx, p[0], p[1], 6 * dk, acc(accent, 0.25, 0, a * 0.4));
      }
      break;
    }

    case 5: {   // T6 WARLORD — battle scoring, pod charge, alternating blinkers
      ctx.restore(); ctx.save();
      ctx.strokeStyle = 'rgba(31,31,36,.35)'; ctx.lineWidth = 0.8 * dk;
      [1, 3, 4].forEach(function (n) {
        if (n < ribs) {
          var nx = n + 1 < ribs ? ribTop(n + 1) : proj[mesh.tailIdx];
          ctx.beginPath(); var q = ribSide(n, 1);
          ctx.moveTo(q[0], q[1]); ctx.lineTo(nx[0], nx[1]); ctx.stroke();
        }
      });
      ctx.restore(); ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      var wc = 0.3 + Math.sin(t * 5) * 0.3;
      for (i = 0; i < 2; i++) {
        wb = wings[i]; p = lerp(proj[wb], proj[wb + 1], 0.25);
        dot(ctx, p[0], p[1], 2.5 * dk, 'rgba(' + (accent[0]*0.5*255|0) + ',' + (accent[1]*0.3*255|0) + ',13,' + wc + ')');
        dot(ctx, p[0], p[1], 5 * dk, 'rgba(' + (accent[0]*0.25*255|0) + ',' + (accent[1]*0.15*255|0) + ',5,' + (wc*0.3) + ')');
      }
      for (i = 0; i < 2; i++) {
        if (Math.sin(t * 5 + (i ? Math.PI : 0)) > 0) {
          tip = proj[wings[i] + 1];
          dot(ctx, tip[0], tip[1], 2.5 * dk, 'rgba(' + (accent[0]*0.8*255|0) + ',' + (accent[1]*0.6*255|0) + ',13,.75)');
          dot(ctx, tip[0], tip[1], 6 * dk, 'rgba(' + (accent[0]*0.5*255|0) + ',' + (accent[1]*0.3*255|0) + ',5,.30)');
        }
      }
      break;
    }

    case 6: {   // T7 TITAN — spine pulse, canard veins, beacon, shield shimmer
      var pp = (t * 1.5) % 1;
      for (i = 0; i < ribs; i++) {
        a = Math.max(0, 0.7 - Math.abs(i - pp * ribs) * 0.18);
        if (a > 0.01) {
          p = ribTop(i);
          dot(ctx, p[0], p[1], 5 * dk, acc(accent, 0.5, 0, a));
          dot(ctx, p[0], p[1], 8 * dk, acc(accent, 0.3, 0, a * 0.4));
        }
      }
      for (i = 0; i < 2; i++) {
        wb = wings[i]; var cpz = (t * 2.5) % 1;
        p = lerp(proj[wb], proj[wb + 1], cpz);
        dot(ctx, p[0], p[1], 2 * dk, acc(accent, 0.4, 0, Math.sin(cpz * Math.PI) * 0.45));
      }
      if ((t * 3) % 1 < 0.15 && 3 < ribs) {
        p = ribTop(3);
        dot(ctx, p[0], p[1], 4.5 * dk, acc(accent, 0.8, 0, 0.9));
        dot(ctx, p[0], p[1], 9 * dk, acc(accent, 0.4, 0, 0.36));
      }
      if ((t * 0.6) % 1 < 0.06) {
        var mr = Math.floor(ribs / 2), pv = Math.max(0, mr - 1), nx2 = Math.min(ribs - 1, mr + 1);
        ctx.strokeStyle = 'rgba(' + (accent[0]*0.3*255|0) + ',' + (accent[1]*0.3*255|0) + ',' + (accent[2]*0.5*255|0) + ',.20)';
        ctx.lineWidth = 1.2 * dk;
        var hx = [ribSide(pv,1), ribTop(mr), ribSide(pv,3), ribSide(nx2,3), ribSide(nx2,2), ribSide(nx2,1)];
        ctx.beginPath(); ctx.moveTo(hx[0][0], hx[0][1]);
        for (i = 1; i < 6; i++) ctx.lineTo(hx[i][0], hx[i][1]);
        ctx.closePath(); ctx.stroke();
      }
      break;
    }

    case 7: {   // T8 COLOSSUS — corona, veins, sparkles, wing pulses, shimmer
      var cor = ribTop(Math.min(2, ribs - 1)), cpulse = 0.35 + Math.sin(t * 2) * 0.10;
      dot(ctx, cor[0], cor[1], 16 * dk, acc(accent, 0.15, 0, cpulse * 0.30));
      dot(ctx, cor[0], cor[1], 10 * dk, acc(accent, 0.25, 0, cpulse * 0.20));
      var v8 = (t * 1.3) % 1;
      for (i = 0; i < ribs; i++) {
        a = Math.max(0, 0.65 - Math.abs(i / Math.max(1, ribs - 1) - v8) * 1.2);
        if (a > 0.01) {
          p = ribTop(i);
          dot(ctx, p[0], p[1], 4 * dk, acc(accent, 0.5, 0, a));
          dot(ctx, p[0], p[1], 7 * dk, acc(accent, 0.25, 0, a * 0.35));
        }
      }
      [[0,0],[0.3,1.5],[-0.3,3.0],[0.15,4.5],[-0.15,6.0]].forEach(function (spk) {
        if (Math.sin(t * 6 + spk[1]) > 0.85) {
          dot(ctx, proj[0][0] + spk[0] * meshScale * 0.1, proj[0][1] - 2 * dk, 1.5 * dk, 'rgba(255,255,242,.85)');
        }
      });
      for (i = 0; i < 2; i++) {
        wb = wings[i]; pulse = (t * 2) % 1;
        p = lerp(proj[wb], proj[wb + 1], pulse); a = Math.sin(pulse * Math.PI) * 0.7;
        dot(ctx, p[0], p[1], 3.5 * dk, acc(accent, 0.5, 0, a));
        dot(ctx, p[0], p[1], 6 * dk, acc(accent, 0.3, 0, a * 0.4));
        tip = proj[wb + 1];
        dot(ctx, tip[0], tip[1], 3 * dk, 'rgba(' + (accent[0]*0.35*255|0) + ',' + (accent[1]*0.35*255|0) + ',' + (accent[2]*0.25*255|0) + ',.55)');
        dot(ctx, tip[0], tip[1], 1.5 * dk, 'rgba(255,247,230,.35)');
      }
      var shp = (t * 0.8) % 1, sri = Math.floor(shp * ribs);
      if (sri < ribs) {
        line(ctx, ribSide(sri, 3), ribSide(sri, 1),
             'rgba(255,247,230,' + (Math.sin(shp * Math.PI) * 0.18) + ')', 2.5 * dk);
      }
      break;
    }
    }

    ctx.restore();
  }

  /** Green side guns along each wing — fitted to about a quarter of hulls. */
  function drawSideGuns(ctx, tier, shipScale) {
    var k = shipScale / 42;          // detail units per display unit
    var span = WINGSPAN[Math.min(tier, 7)] * k;
    for (var side = -1; side <= 1; side += 2) {
      for (var g = 0; g < 3; g++) {
        var off = (g * 6 + 8) * k;
        var gx = side * (span - off), gy = (g * 3 + 2) * k;
        ctx.fillStyle = 'rgba(77,255,102,.5)';
        ctx.beginPath(); ctx.ellipse(gx, gy, 4 * k, 4 * k, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgb(51,204,77)';
        ctx.fillRect(gx - 1.5 * k, gy - 6 * k, 3 * k, 8 * k);
        ctx.fillStyle = 'rgb(77,77,77)';
        ctx.beginPath(); ctx.ellipse(gx, gy + 0.5 * k, 3 * k, 2.5 * k, 0, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  /** Engine exhaust: drifting smoke puffs plus bright sparks. */
  function drawExhaust(ctx, t, alpha, shipScale) {
    var k = shipScale / 42;          // detail units per display unit
    var i;
    for (i = 0; i < 12; i++) {
      var cyc = (t * 3 + i * 0.5) % 1;
      var py = (18 + cyc * 45) * k;
      var px = (Math.sin(t * 2 + i * 1.7) * cyc * 8) * k;
      var ps = (4 + cyc * 12) * k;
      var pa = (1 - cyc) * 0.4 * alpha;
      var grey = 0.4 + (i % 3) * 0.1;
      ctx.fillStyle = 'rgba(' + ((grey*0.8*255)|0) + ',' + ((grey*0.9*255)|0) + ',' + ((grey*255)|0) + ',' + pa.toFixed(3) + ')';
      ctx.beginPath(); ctx.ellipse(px, py, ps / 2, ps / 2, 0, 0, Math.PI * 2); ctx.fill();
    }
    for (i = 0; i < 4; i++) {
      var sp = (t * 8 + i * 1.5) % 1;
      var sy = (16 + sp * 12) * k;
      var sx = (Math.sin(t * 9 + i * 2.3) * 3) * k;
      ctx.fillStyle = 'rgba(153,204,255,' + ((1 - sp) * 0.7 * alpha).toFixed(3) + ')';
      ctx.fillRect(sx - 1 * k, sy, 2 * k, 3 * k);
    }
  }

  /* ---------- Showcase ---------- */

  function initStage(canvas, meshes) {
    var ctx = canvas.getContext('2d');
    var nameEl = canvas.parentNode.querySelector('.ship-name');
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var w, h, dpr, k;                       // k = scale factor vs the game's canvas

    // Display timings
    var FLY_SPEED = 250, HOVER_DURATION = 4.0, NAME_FADE_DIST = 50;
    var SHIP = 54;                  // display scale

    var tier = 0, phase = 0, flyY = 0, targetY = 0, hoverT = 0;
    var nameAlpha = 0, bank = 1, sideGuns = false;
    var out = null;                          // outgoing ship
    var last = 0, t = 0;

    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      k = Math.max(0.95, Math.min(1.5, h / 300));   // proportional to the stage;
      // floor raised for the short hero stage on phones, where h/300 would
      // otherwise pin the ship at its smallest and leave the frame looking empty
      targetY = h * 0.52;
      if (flyY === 0) flyY = h + 60 * k;
    }

    function label() {
      if (!nameEl) return;
      var n = TIER_NAMES[tier] + (sideGuns ? ' WITH SIDE GUNS' : '');
      if (nameEl.getAttribute('data-name') !== n) {
        nameEl.setAttribute('data-name', n);
        nameEl.textContent = n;
        nameEl.style.color = 'rgb(' + TIER_NAME_COLOURS[tier] + ')';
        nameEl.style.textShadow = '0 0 20px rgba(' + TIER_NAME_COLOURS[tier] + ',.45)';
      }
      nameEl.style.opacity = nameAlpha.toFixed(2);
    }

    function advance() {
      out = { tier: tier, y: targetY, alpha: 1, guns: sideGuns, bank: bank };
      tier = (tier + 1) % meshes.length;
      sideGuns = Math.random() < 0.25;       // about a quarter carry them
      bank = -bank;
      flyY = h + 60 * k;
      nameAlpha = 0;
      phase = 2;
    }

    function frame(now) {
      var dt = Math.min(0.05, (now - last) / 1000); last = now;
      t += dt;
      ctx.clearRect(0, 0, w, h);

      if (reduced) {
        nameAlpha = 1; label();
        ctx.save(); ctx.translate(w / 2, targetY);
        drawShip(ctx, meshes[tier], 0, SHIP * k, tier, t);
        ctx.restore();
        requestAnimationFrame(frame);
        return;
      }

      var speed = FLY_SPEED * k;

      if (phase === 0 || phase === 2) {                    // flying in
        flyY -= speed * dt;
        if (flyY - targetY < NAME_FADE_DIST * k) nameAlpha = Math.min(1, nameAlpha + dt * 2);
        if (flyY <= targetY) { flyY = targetY; phase = 1; hoverT = 0; nameAlpha = 1; }
      }
      if (phase === 1) {                                    // hovering
        flyY = targetY;
        hoverT += dt;
        nameAlpha = 1;
        if (hoverT >= HOVER_DURATION) advance();
      }
      if (out) {                                            // outgoing climbs away
        out.y -= speed * dt;
        if (out.y < 60 * k) out.alpha = Math.max(0, out.y / (60 * k));
        if (out.alpha <= 0) out = null;
      }

      // Outgoing first, behind — banks and drifts as it leaves
      if (out) {
        var prog = Math.max(0, (targetY - out.y) / (targetY + 50 * k));
        ctx.save();
        ctx.globalAlpha = out.alpha;
        ctx.translate(w / 2 + out.bank * 100 * k * prog, out.y);
        drawExhaust(ctx, t, out.alpha, SHIP * k);
        drawShip(ctx, meshes[out.tier], out.bank * 0.35 * prog, SHIP * k, out.tier, t);
        if (out.guns) drawSideGuns(ctx, out.tier, SHIP * k);
        ctx.restore();
      }

      // Current ship — hovers with the menu's gentle oscillation
      var hover = phase === 1 ? Math.sin(t * 2) * 5 * k : 0;
      ctx.save();
      ctx.translate(w / 2, flyY + hover);
      drawExhaust(ctx, t, 1, SHIP * k);
      drawShip(ctx, meshes[tier], 0, SHIP * k, tier, t);
      if (sideGuns) drawSideGuns(ctx, tier, SHIP * k);
      ctx.restore();

      label();
      requestAnimationFrame(frame);
    }

    size();
    window.addEventListener('resize', size);
    flyY = h + 60 * k;
    label();
    requestAnimationFrame(frame);
  }


  /* ---------- Distant patrol ----------
     Far-off traffic in the page margins: hulls at a fraction of the
     showcase scale, drawn without detailing so they stay silhouettes and
     never compete with the content. Confined to the free margins either
     side of the column, and skipped when there isn't room. */

  function initPatrol(canvas, meshes) {
    var ctx = canvas.getContext('2d');
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var w, h, dpr, margin, ships = [], last = 0, spawnT = 0, order = 0;
    var COLUMN = 1000;                    // content column + breathing room
    var MIN_MARGIN = 110;

    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      margin = (w - COLUMN) / 2;
      if (margin < MIN_MARGIN) ships.length = 0;
    }

    /** A band position inside one of the two margins. */
    function bandX() {
      var left = Math.random() < 0.5;
      var pad = 18;
      var lo = left ? pad : w - margin + pad;
      var hi = left ? margin - pad : w - pad;
      return lo + Math.random() * Math.max(1, hi - lo);
    }

    function spawn(startY) {
      // depth 0.44–1.0 drives both size (19–43px) and speed
      var depth = 0.44 + Math.random() * 0.56;
      ships.push({
        mesh: meshes[order++ % meshes.length],
        x: bandX(),
        y: startY === undefined ? h + 40 : startY,
        speed: (48 + Math.random() * 40) * depth,     // brisk transit, still short of the showcase
        scale: 43 * depth,
        roll: Math.random() * Math.PI * 2,
        rollSpeed: (Math.random() - 0.5) * 0.22,
        drift: (Math.random() - 0.5) * 5,
        alpha: 0,
        // Near-opaque: at half alpha the stars show through the hull, which
        // reads as the ship being *behind* the starfield
        peak: 0.86 + Math.random() * 0.14
      });
    }

    function frame(now) {
      var dt = Math.min(0.05, (now - last) / 1000); last = now;
      ctx.clearRect(0, 0, w, h);

      if (margin < MIN_MARGIN) { requestAnimationFrame(frame); return; }

      if (!reduced) {
        spawnT -= dt;
        if (spawnT <= 0 && ships.length < 4) { spawn(); spawnT = 2.2 + Math.random() * 2.6; }
      } else if (!ships.length) {
        spawn(h * 0.4); ships[0].speed = 0; ships[0].alpha = ships[0].peak;
      }

      for (var i = ships.length - 1; i >= 0; i--) {
        var s = ships[i];
        if (!reduced) {
          s.y -= s.speed * dt;
          s.x += s.drift * dt;
          s.roll += s.rollSpeed * dt;
        }
        var fadeIn = Math.min(1, (h + 40 - s.y) / 120);
        var fadeOut = Math.min(1, (s.y + 80) / 140);
        s.alpha = s.peak * Math.max(0, Math.min(fadeIn, fadeOut));

        if (s.y < -90) { ships.splice(i, 1); continue; }

        ctx.save();
        ctx.globalAlpha = s.alpha;
        ctx.translate(s.x, s.y);
        // No hull index → detailing skipped; these are distant shapes
        drawShip(ctx, s.mesh, Math.sin(s.roll) * 0.7, s.scale);
        ctx.restore();
      }
      requestAnimationFrame(frame);
    }

    size();
    window.addEventListener('resize', size);
    // Seed a couple already in view
    spawn(h * 0.35); spawn(h * 0.8);
    spawnT = 3;
    requestAnimationFrame(frame);
  }

  function init(meshes) {
    var patrol = document.getElementById('patrol');
    if (patrol) initPatrol(patrol, meshes);

    var stages = document.querySelectorAll('canvas.ship-stage');
    Array.prototype.forEach.call(stages, function (c) { initStage(c, meshes); });
  }

  function boot() {
    if (!document.querySelector('canvas.ship-stage') && !document.getElementById('patrol')) return;
    if (window.VYRON_SHIPS) { init(window.VYRON_SHIPS); return; }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
