/* LOCKED — the anatomical figure, as a component.

   Two screens draw this body: the Exercise Library, where tapping a muscle
   is how you find its exercises, and the body-map mockup, which adds the
   zoom into a group's regions. Neither owns it. This file builds the figure,
   answers taps and reports which group was chosen; everything around it --
   headers, search, lists, cards -- belongs to the screen.

       var map = LKBodyMap.mount(hostElement, {
         groups: { chest: { name: 'Chest', n: 30 }, ... },
         order:  ['chest', 'back', ...],
         onSelect: function (gid) { ... }
       });
       map.setView('back');        // front | back
       map.select('chest');        // or null to clear
       map.view, map.selected      // what it is showing now

   Two options make it a picture rather than a control, which is what the
   exercise sheet wants: `interactive: false` takes the muscles out of the tab
   order and off the pointer, and `view: 'back'` opens on the far side. A
   figure like that still answers `select`, so the sheet lights the one group
   the exercise works and nothing else.

   The art itself is in vendor/body-art.js, with its licence and the reason
   it is there. This file is the geometry, the hit model and the paint.
*/
(function (global) {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';

  function n2(v) { return Math.round(v * 10) / 10; }

  var ART = global.LKBodyArt;
  if (!ART) throw new Error('LKBodyMap: vendor/body-art.js must load first');
  var FIGURE = { front: [53, 96, 622, 1244], back: [773, 97, 622, 1245] };
  var TOP = 12, BOTTOM = 411, MID = 100;

  function fitOf(view) {
    var b = FIGURE[view];
    var s = (BOTTOM - TOP) / b[3];
    return { s: s, tx: MID - (b[0] + b[2] / 2) * s, ty: TOP - b[1] * s };
  }
  var FIT = { front: fitOf('front'), back: fitOf('back') };
  /* The body's centre line, in the frame's coordinates. */
  function midX(view) {
    var f = FIT[view], b = FIGURE[view];
    return (b[0] + b[2] / 2) * f.s + f.tx;
  }
  function fitAttr(view) {
    var f = FIT[view];
    return 'translate(' + n2(f.tx) + ' ' + n2(f.ty) + ') scale(' + (Math.round(f.s * 1e5) / 1e5) + ')';
  }
  /* A measured box, in the frame's coordinates rather than the art's. */
  function boxIn(view, b) {
    var f = FIT[view];
    return { x: b[0] * f.s + f.tx, y: b[1] * f.s + f.ty, w: b[2] * f.s, h: b[3] * f.s };
  }

  var MEASURED = {"front": {"chest": [255, 317, 218, 118], "abs": [256, 417, 217, 299], "biceps": [182, 406, 365, 87], "back": [284, 280, 160, 32], "shoulders": [195, 303, 339, 94], "adduc": [274, 647, 180, 251], "quads": [241, 667, 246, 281], "calves": [251, 973, 226, 259], "forearms": [126, 498, 477, 188]}, "back": {"back": [956, 297, 255, 342], "shoulders": [914, 311, 339, 87], "triceps": [899, 382, 370, 153], "forearms": [839, 518, 490, 170], "glutes": [976, 619, 214, 159], "adduc": [1039, 784, 88, 79], "hams": [962, 741, 243, 266], "calves": [970, 972, 227, 318]}};
  /* The thinnest single belly in each group, measured: what a finger is
     actually aiming at when it goes for that group. */
  var THIN = {"front": {"chest": 103, "abs": 15, "biceps": 41, "back": 31, "shoulders": 84, "adduc": 19, "quads": 19, "calves": 30, "forearms": 57}, "back": {"back": 35, "shoulders": 67, "triceps": 22, "forearms": 17, "glutes": 50, "adduc": 33, "hams": 20, "calves": 18}};

  /* ---- ANATOMY, AS TWO ANGLES ---------------------------------------

     BAND_AXIS is the direction a sheet of muscle divides along, in
     degrees from vertical. The pectoral's heads stack up the chest but
     the boundaries between them rise towards the shoulder, so the cut is
     turned rather than level. A group with no entry divides level, which
     is right for anything stacked straight up the body.

     FIBRE is the direction the fibres themselves run, which is a
     different question and often close to a right angle to the first.
     Pectoral fibres converge on the humerus, so they run flatter than
     the cut: the clavicular head's fibres angle down and out, the costal
     head's angle up and out, and the sternal head's run across. Degrees
     from horizontal, positive clockwise on screen.

     Neither is decoration. A striation running the wrong way makes a
     muscle read as fabric. */
  /* ---- WHERE ONE HEAD ENDS AND THE NEXT BEGINS ----------------------

     A pectoral is not three equal slices. The clavicular head is a strap
     off the collarbone crossing the sternal fan diagonally, and the
     abdominal head is a small slip along the bottom edge: roughly a
     third, a half and a fifth, with two borders that run at different
     angles. Thirds at one angle drew none of that.

     `at` is how far down the muscle a border sits, `deg` the angle it
     runs at, clockwise from level. It is mirrored on the far side of the
     body, because a border that rises toward one shoulder rises toward
     both. */
  var BAND_PLAN = {
    /* Positive falls away from the midline: the clavicular head is
       thickest at the shoulder and tapers toward the sternum, and the
       abdominal slip does the opposite but far more gently. Negative had
       both of them fat at the breastbone and pinched at the arm, which
       is the muscle inside out. */
    chest: [{ at: 0.42, deg: 26 }, { at: 0.80, deg: 8 }],
    /* A deltoid is three heads around one joint, and a view shows two:
       from the front the lateral head wraps the outside of the shoulder
       and the anterior head faces forward, so their border runs down the
       arm rather than across it. `at` is measured along the cut, which
       for a 90 degree axis is across the limb from the outside in. */
    shoulders: [{ at: 0.55, deg: 90 }]
  };
  var BAND_AXIS = { chest: -14, shoulders: 90, biceps: 90 };
  /* A CUT ACROSS A PAIR IS A CUT BETWEEN THE PAIR. The biceps and the
     delts divide from the outside of the arm inwards, and one gradient
     laid across the whole figure divides the LEFT arm from the RIGHT
     one instead -- two heads, one per side, both wrong. These get a
     gradient per side, each running from that side's outer edge to the
     midline, so "outer" means outer on both arms. */
  var MIRROR = { shoulders: true, biceps: true, chest: true };
  var FIBRE = {
    chest: { Upper: 22, Mid: 4, Lower: -16 },
    back: { Traps: 28, Lats: -38, 'Lower Back': 84 },
    /* A limb's fibres run along the limb. These are all close to
       vertical, with the small angles the bellies actually take: the
       vastus lateralis wraps forward, the gastrocnemius heads converge
       on the tendon, the hamstrings run straight. */
    quads: { Outer: 78, 'Rectus Femoris': 88, Inner: 80 },
    triceps: { 'Lateral Head': 80, 'Long Head': 88, 'Medial Head': 84 },
    hams: { Outer: 84, Inner: 88 },
    calves: { Gastrocnemius: 86, Soleus: 88 },
    glutes: { 'Gluteus Medius': 55, 'Gluteus Maximus': 38 },
    abs: { Upper: 4, Lower: 4 },
    forearms: { Extensors: 80, Flexors: 84 }
  };
  function fibreAngle(gid, view, name, i, bands) {
    var byName = FIBRE[gid] && FIBRE[gid][name];
    if (typeof byName === 'number') return byName;
    /* An unnamed part fans with its position: the top of a sheet angles
       one way and the bottom the other, which is true of most of them and
       reads as anatomy rather than as a grid wherever it is not. */
    if (bands > 1) return 18 - (36 * i) / (bands - 1);
    return 0;
  }

  /* WHICH SIDE OF THE BODY A PATH IS ON, from the first point it moves
     to. A body is mirrored and its fibres are mirrored with it: run them
     the same way on both pectorals and the two meet at the sternum in a
     chevron that exists on no person. The art draws each side as its own
     path, so the first coordinate settles it without measuring anything.
     A path that cannot be read sits on the right, which is the same
     answer the old code gave for every path. */
  function sideOf(d, view) {
    var m = /[Mm]\s*(-?[\d.]+)/.exec(String(d || ''));
    if (!m) return 1;
    var mid = FIGURE[view][0] + FIGURE[view][2] / 2;
    return Number(m[1]) < mid ? -1 : 1;
  }

  /* The striation. A pattern rather than drawn lines, so one definition
     tiles the whole belly however the muscle is shaped, and the browser
     does the clipping. Two strokes per tile, a dark one and a light one
     beside it, because a fibre reads as a ridge rather than as a scratch
     only when it has a lit side. */
  function fibrePattern(api, uid, deg) {
    var id = uid + '-f';
    if (api.defs.querySelector('#' + id)) return id;
    /* THE TILE IS IN THE ART'S UNITS, NOT THE SCREEN'S. The paths it
       fills sit inside the figure's fit transform, which is about a
       third, so a 3-unit tile rendered a one-pixel corduroy. Eleven units
       is roughly a 3.5px fibre on a phone: visible as texture, invisible
       as stripes. */
    var p = api.el('pattern', {
      id: id, patternUnits: 'userSpaceOnUse', width: '11', height: '11',
      patternTransform: 'rotate(' + (Math.round(deg * 10) / 10) + ')'
    });
    p.appendChild(api.el('rect', { width: '11', height: '11', fill: 'transparent' }));
    p.appendChild(api.el('line', { x1: '0', y1: '3.6', x2: '11', y2: '3.6',
                                   stroke: 'rgba(0,0,0,0.20)', 'stroke-width': '2.2' }));
    p.appendChild(api.el('line', { x1: '0', y1: '6.4', x2: '11', y2: '6.4',
                                   stroke: 'rgba(255,255,255,0.09)', 'stroke-width': '1.4' }));
    api.defs.appendChild(p);
    return id;
  }

  /* Where a group divides into real muscles, each one measured too. */
  var PART_BOX = {"front": {"back": {"Traps": [284, 280, 160, 32]}}, "back": {"back": {"Traps": [1003, 297, 162, 176], "Lats": [956, 323, 255, 263], "Lower Back": [984, 487, 199, 152]}}};

  /* HIT AREAS

     A rectangle over a group's extent cannot work here, because a paired
     muscle's extent spans both arms: the triceps box is 370 units wide and
     swallows the whole chest between them. So the muscle itself is the
     target. A tap on the pectoral selects Chest because that is what was
     tapped, which is also the only rule a person would guess.

     What a shape cannot give is size. Several bellies are drawn narrower
     than a finger -- the trapezius above the collarbone is 10 CSS px tall
     on this frame, against the 44 the rest of the app holds itself to -- so
     each muscle also carries a copy of itself in a transparent stroke wide
     enough to bring it up to 44. A stroke grows a shape along its own
     outline rather than into a box around it, so a thin muscle gains reach
     without covering the muscle beside it.

     The strokes live in one layer above the paint, laid down largest first,
     so where two grown outlines overlap the smaller muscle -- the harder
     target, and the one a finger near it was aiming at -- wins. */
  /* The frame every figure is drawn into. mount() keeps its own copy for
     the camera; this is the same rectangle, available to anything that
     has to stay inside the picture. */
  var VBOX = { x: -16, y: 8, w: 240, h: 402 };
  var MIN_HIT = 44;
  /* How wide a viewBox unit is on screen. The frame is 240 units across and
     renders at the width of the frame it is IN, which is the thing that was
     wrong here: it read window.innerWidth, and above the phone breakpoint
     .phone is a fixed 393px inside whatever the window happens to be. On a
     desktop window the clamp returned 430/240 = 1.79 where the truth is
     393/240 = 1.64, so every muscle measured 9% wider than it rendered, the
     shortfall came out too small, and the thin ones ended up with a target
     UNDER the 44px this file exists to guarantee.

     It measures the host now, and falls back to the window only when the
     host is not in the document yet. */
  var FRAME_UNITS = 240;
  var FRAME_UNITS_H = 402;
  function unitPx(host) {
    var w = 0, h = 0;
    if (host && host.getBoundingClientRect) {
      var hb = host.getBoundingClientRect();
      w = hb.width; h = hb.height;
    }
    if (!w) {
      var frame = host && host.closest && host.closest('.phone');
      if (frame) { var fb = frame.getBoundingClientRect(); w = fb.width; h = h || fb.height; }
    }
    if (!w) w = Math.min(global.innerWidth || 390, 430);
    /* THE VIEWBOX IS LETTERBOXED, AND THIS ONLY LOOKED AT THE WIDTH.
       .map__svg is width:100% height:100% over a viewBox of 240 x 402.
       That is preserveAspectRatio="xMidYMid meet" by default, so the art
       is fitted to whichever axis runs out first and centred on the
       other. On a phone the map frame is 393 wide and 387 tall: the
       HEIGHT runs out, the figure renders 231px wide, and one viewBox
       unit is 0.96px.

       This returned 393/240 = 1.64. Seventy percent too big, on every
       phone, which is where the app is. Each muscle was measured as
       seventy percent wider than it draws, the shortfall came out far too
       small, and the thinnest groups were handed a stroke that left them
       under the 44px this file exists to guarantee. Hit-testing the
       shipped build found triceps at 700px2 of reachable area, about a
       26px square, against the 44 it promises.

       The earlier fix here caught the same class of error from the
       desktop side and still only looked at one axis. Both axes now, the
       way the browser fits it. */
    var sx = w / FRAME_UNITS;
    var sy = h ? h / FRAME_UNITS_H : sx;
    return Math.min(sx, sy);
  }
  /* How much stroke a group needs, in CSS pixels, to bring its thinnest
     belly up to 44. The group's own bounding box is no use here, because a
     paired muscle's box spans both arms and reports a width no finger will
     ever meet; THIN holds the measured thinnest single belly instead.

     A stroke lies half outside the shape, so clearing a shortfall of d takes
     a stroke of d. It is capped at 44, past which a margin says more about the empty space
     around a muscle than about the muscle. The exact-shape layer above keeps
     a margin from ever taking a tap that landed on another muscle. */
  function reachOf(view, gid, host) {
    var t = THIN[view] && THIN[view][gid];
    if (!t) return 0;
    var thin = t * unitPx(host) * FIT[view].s;
    return Math.max(0, Math.min(MIN_HIT - thin, 44));
  }

  /* THE MARGIN IS IN PIXELS AND THE ATTRIBUTE IS IN ART UNITS.

     reachOf answers in CSS pixels, because 44 is a number about fingers.
     Its answer was written straight into stroke-width, which is measured
     in the art's own coordinates, inside a group already carrying the fit
     transform. One art unit draws at 0.309px on a phone, so a margin
     asking for 8.8px of reach was drawn 2.7px wide: every reach margin in
     the map came out about three times too small, and the 44px guarantee
     this file is built around never held anywhere.

     Hit-testing the shipped build showed it. Triceps had 700px2 of
     reachable area, roughly a 26px square, against the 44 promised.

     One conversion, at the one place the two units meet. */
  function reachUnits(view, gid, host) {
    var px = reachOf(view, gid, host);
    if (!px) return 0;
    var artPx = unitPx(host) * FIT[view].s;
    if (!(artPx > 0)) return px;
    return px / artPx;
  }

  function el(tag, attrs, doc) {
    var n = (doc || document).createElementNS(NS, tag);
    for (var k in attrs) if (attrs[k] != null) n.setAttribute(k, attrs[k]);
    return n;
  }

  /* The per-group fill rules, generated from the palette so the twelve hues
     are declared once, in tokens.css, and nowhere else. Written once per
     document, however many maps that document holds. */
  /* The hue rules go into the root the map is actually IN, not into the top
     document. In the assembled demo every screen lives in its own shadow
     root: a stylesheet appended to document.head never reaches the map, so
     .mg__gnd fell back to its inherited fill and the whole figure rendered
     solid black. getElementById is a document-level lookup for the same
     reason, so it also had to go: it found the top document's copy and
     returned early for every shadow root after the first.

     `root` is the shadow root when there is one and the document otherwise,
     which is what both `appendChild` and the duplicate guard need. */
  function installHues(host, doc, order) {
    var root = host.getRootNode ? host.getRootNode() : doc;
    if (!root || root.nodeType !== 11) root = doc;         /* 11 = DOCUMENT_FRAGMENT */
    if (root.querySelector('#lk-anat-hues')) return;
    var style = doc.createElement('style');
    style.id = 'lk-anat-hues';
    style.textContent = order.map(function (gid) {
      var v = 'var(--anat-' + gid + ')';
      /* The belly carries the hue itself. The seam between two bellies is the
         same hue taken most of the way to black, so a muscle border reads as
         shadow between two masses rather than as an ink outline. */
      /* THREE SHADES OF THE SAME MUSCLE. Once the camera is in close, a
         group that divides honestly is drawn as its parts, and they have
         to be told apart at a glance without becoming three different
         muscles. So it is one hue at three lightnesses rather than three
         hues: the part nearest the top of the body is the lightest, which
         is also how the light falls on the figure already. */
      return '.mg--' + gid + ' .mg__gnd { fill: ' + v + '; ' +
             'stroke: color-mix(in srgb, ' + v + ' 22%, #000); }\n' +
             /* Wider apart than they were. The bands blend into each
                other now, and a blend halves whatever separation it is
                given, so the values have to start further out to end up
                telling three heads apart. */
             '.part--' + gid + '[data-i="0"] { fill: color-mix(in srgb, ' + v + ' 62%, #fff); }\n' +
             '.part--' + gid + '[data-i="1"] { fill: ' + v + '; }\n' +
             '.part--' + gid + '[data-i="2"] { fill: color-mix(in srgb, ' + v + ' 58%, #000); }\n' +
             '.part--' + gid + '[data-i="3"] { fill: color-mix(in srgb, ' + v + ' 40%, #000); }\n' +
             '.lab--' + gid + ' { color: ' + v + '; }\n' +
             '.pick__dot--' + gid + ' { background: ' + v + '; }';
    }).join('\n');
    (root.head || root).appendChild(style);
  }

  /* Which of a group's sub-regions are real on this figure.

     Only two of the twelve divide honestly. Back divides into three muscles
     the art draws separately: the trapezius, the latissimus and the erectors.
     Chest divides into upper, mid and lower, which are the clavicular,
     sternal and costal heads of one continuous sheet -- there is no border
     between them to draw, so they are the pectoral clipped into three bands.
     That is what the heads are.

     The other ten do not. Front, side and rear deltoid are three faces of one
     mass and two of them are on the far side of the body; the heads of the
     triceps and biceps are stacked, not banded; and the Abs group's own
     sub-regions, Weighted and Bodyweight, are a way of choosing an exercise
     rather than a part of anybody. Drawing regions on those would be
     inventing anatomy, so a screen sends those groups straight to their
     exercises. */
  /* EVERY GROUP THAT HAS PARTS TO PICK, not only the two that divide
     anatomically. Chest and back are still drawn as what they are: the
     back's three muscles are separate shapes in the art, and the chest's
     three heads are one sheet cut into bands, which is what the heads are.

     For the rest the bands are a way of choosing rather than a diagram,
     and that is a deliberate trade, made on purpose and worth naming. A
     rear delt is on the far side of the shoulder; the triceps heads are
     stacked, not banded from top to bottom. A band cannot be literally
     where those muscles are. What it can be is a large, unambiguous
     target that lands on the right list, in the right order, on a body
     already in front of you, against scrolling past the same three
     headings in a list of ninety-eight.

     The names come from the caller, because the catalogue decides which
     parts exist and this file has no business holding a second copy of
     that list to forget to update. A group with one region has nothing to
     pick between and returns nothing, which sends the screen straight to
     its exercises, as it always did. */
  /* ---- EVERY MUSCLE DIVIDES, AND THE ART ALREADY KNEW HOW -----------

     Only chest and back divided, because only those two had a declared
     part list. The rest went straight to the exercise list, so tapping
     the quadriceps gave a muscle that plainly has three heads drawn on
     it and no way to choose one.

     They were there the whole time. The figure draws six shapes for the
     quads -- three a leg -- six for the triceps, eight for the
     hamstrings, four for the glutes. Grouping those shapes IS the
     division, and it is the accurate one: no band, no guessed boundary,
     the anatomy the artist drew.

     Each entry says how to read them. `lat` orders a side's shapes from
     the outside of the body inwards, which is how the quadriceps and the
     triceps are named. `vert` orders them top to bottom, which is how a
     gastrocnemius sits above a soleus. The shapes are measured rather
     than counted, so a redrawn figure regroups itself. */
  var DERIVED = {
    quads:    { axis: 'lat',  names: ['Outer', 'Rectus Femoris', 'Inner'] },
    triceps:  { axis: 'lat',  names: ['Lateral Head', 'Long Head', 'Medial Head'] },
    hams:     { axis: 'lat',  names: ['Outer', 'Inner'] },
    calves:   { axis: 'vert', names: ['Gastrocnemius', 'Soleus'] },
    glutes:   { axis: 'vert', names: ['Gluteus Medius', 'Gluteus Maximus'] },
    abs:      { axis: 'vert', names: ['Upper', 'Lower'] },
    forearms: { axis: 'lat',  names: ['Extensors', 'Flexors'] }
  };

  /* Measured in the document, because a path's extent is a question only
     the renderer can answer: parsing the numbers out of a `d` string
     counts control points, which sit outside the curve they bend. */
  var derivedCache = {};
  var spanCache = {};

  /* HOW WIDE THE MUSCLE ITSELF IS, EITHER SIDE OF THE SPINE. A group's
     measured box runs from one limb to the other, so half of it is the
     body in between: for a chest that gap is nothing, for a pair of
     deltoids it is the whole ribcage. A vertical border placed at the
     middle of that half-box therefore landed off the far edge of a delt
     and cut it into a muscle and a sliver. Asked of the art instead, so
     the answer is where the tissue is. */
  function sideSpan(api, gid, view) {
    var key = gid + '|' + view;
    if (spanCache[key] !== undefined) return spanCache[key];
    var ds = (ART[view].groups[gid] || []);
    if (!ds.length) { spanCache[key] = null; return null; }
    var probe = api.el('g', { transform: fitAttr(view), opacity: '0' });
    var nodes = ds.map(function (d) {
      var p = api.el('path', { d: d });
      probe.appendChild(p);
      return p;
    });
    api.cam.appendChild(probe);
    var rows = null;
    try {
      rows = nodes.map(function (p) {
        var b = p.getBBox();
        return [b.x, b.x + b.width];
      });
    } catch (e) { rows = null; }
    api.cam.removeChild(probe);
    if (!rows) { spanCache[key] = null; return null; }
    var mid = FIGURE[view][0] + FIGURE[view][2] / 2;
    var out = { l: null, r: null };
    rows.forEach(function (r) {
      var k = (r[0] + r[1]) / 2 < mid ? 'l' : 'r';
      if (!out[k]) out[k] = [r[0], r[1]];
      else { out[k][0] = Math.min(out[k][0], r[0]); out[k][1] = Math.max(out[k][1], r[1]); }
    });
    ['l', 'r'].forEach(function (k) {
      if (!out[k]) return;
      var fr = boxIn(view, [out[k][0], 0, out[k][1] - out[k][0], 1]);
      out[k] = [fr.x, fr.x + fr.w];
    });
    spanCache[key] = out;
    return out;
  }
  function derivePaths(api, gid, view) {
    var key = gid + '|' + view;
    if (derivedCache[key] !== undefined) return derivedCache[key];
    var spec = DERIVED[gid];
    var ds = (ART[view].groups[gid] || []);
    if (!spec || ds.length < spec.names.length * 2) { derivedCache[key] = null; return null; }

    var probe = api.el('g', { transform: fitAttr(view), opacity: '0' });
    var nodes = ds.map(function (d) {
      var p = api.el('path', { d: d });
      probe.appendChild(p);
      return p;
    });
    api.cam.appendChild(probe);
    var rows;
    try {
      rows = nodes.map(function (p, i) {
        var b = p.getBBox();
        return { d: ds[i], cx: b.x + b.width / 2, cy: b.y + b.height / 2,
                 w: b.width, h: b.height };
      });
    } catch (e) { rows = null; }
    api.cam.removeChild(probe);
    if (!rows) { derivedCache[key] = null; return null; }

    var mid = FIGURE[view][0] + FIGURE[view][2] / 2;
    var sides = [rows.filter(function (r) { return r.cx < mid; }),
                 rows.filter(function (r) { return r.cx >= mid; })];
    var out = {};
    spec.names.forEach(function (nm) { out[nm] = []; });
    var ok = false;
    sides.forEach(function (side) {
      if (side.length < spec.names.length) return;
      ok = true;
      side.sort(function (a, b) {
        if (spec.axis === 'vert') return a.cy - b.cy;
        /* Outermost first, measured from the body's own midline. */
        return Math.abs(b.cx - mid) - Math.abs(a.cx - mid);
      });
      /* Nearly-equal chunks, remainder to the first parts, which are the
         bigger bellies in every group here. */
      var n = spec.names.length, per = Math.floor(side.length / n), extra = side.length % n, at = 0;
      spec.names.forEach(function (nm, i) {
        var take = per + (i < extra ? 1 : 0);
        side.slice(at, at + take).forEach(function (r) { out[nm].push(r.d); });
        at += take;
      });
    });
    derivedCache[key] = ok ? { kind: 'muscles', names: spec.names, paths: out } : null;
    return derivedCache[key];
  }

  /* A DELT HAS THREE HEADS AND A VIEW SHOWS TWO OF THEM. Passing the
     catalogue's three through to the front of the body draws a rear delt
     on a chest, which is not a labelling problem, it is a lie about where
     a muscle is. Each view gets the heads it can actually show, ordered
     from the outside of the body inwards, which is the order the bands
     are cut in. */
  var VIEW_PARTS = {
    shoulders: { front: ['Side Delt', 'Front Delt'], back: ['Side Delt', 'Rear Delt'] },
    biceps: { front: ['Long Head', 'Short Head'] }
  };
  function viewNames(gid, view, names) {
    var byView = VIEW_PARTS[gid] && VIEW_PARTS[gid][view];
    return byView || names;
  }

  function partsOf(gid, view, names) {
    var real = ART[view].parts && ART[view].parts[gid];
    /* One part is not a choice. From the front, the only piece of the back
       the art draws is the trapezius, so this returned a split of one: a
       layer built, drawn and thrown away, and a muscle that looked like it
       was about to ask a question and then did not. */
    if (real && Object.keys(real).length > 1) {
      return { kind: 'muscles', names: Object.keys(real), paths: real };
    }
    /* And where the art draws only one piece of a group, that group does
       not divide on this view at all. From the front the back is a
       trapezius sliver either side of the neck; cutting it into the
       catalogue's four bands would draw Lats and Lower Back across a
       shape that contains neither. It goes to the list. */
    if (real) return null;
    if (names && names.length > 1) return { kind: 'bands', names: names.slice() };
    if (gid === 'chest') return { kind: 'bands', names: ['Upper', 'Mid', 'Lower'] };
    return null;
  }

  /* DRAWING

     The art already carries both sides of the body, so nothing is mirrored
     here and nothing is generated: each path is drawn where the anatomy put
     it. A group is one <g> holding every path the twelve-group mapping gave
     it, which is what makes a tap anywhere on either pectoral select Chest.

     Depth comes from the shapes rather than from shading tricks. Adjacent
     bellies share a hairline in a darker tone of the same hue, so the eight
     abdominal segments, the two heads of the calf and the three of the
     quadriceps read as separate muscles without a single extra line being
     invented. Over that sits one soft top-down wash per group. */

  function shadeDefs(api) {
    if (api.defs.querySelector('#mg-shade')) return;
    var g = api.el('linearGradient', { id: 'mg-shade', x1: '0', y1: '0', x2: '0', y2: '1' });
    g.appendChild(api.el('stop', { offset: '0', 'stop-color': '#fff', 'stop-opacity': '0.20' }));
    g.appendChild(api.el('stop', { offset: '0.5', 'stop-color': '#fff', 'stop-opacity': '0.02' }));
    g.appendChild(api.el('stop', { offset: '1', 'stop-color': '#000', 'stop-opacity': '0.14' }));
    api.defs.appendChild(g);
  }

  function drawPaths(api, host, paths, cls) {
    paths.forEach(function (d) { host.appendChild(api.el('path', { d: d, class: cls })); });
  }

  function buildView(api, view) {
    var art = ART[view], fit = fitAttr(view);
    var slot = api.views[view];
    var GROUPS = api.groups, ORDER = api.order;

    /* The inert body first: head, neck, hands, feet, knees, ankles and the
       shin. It carries no hue and never takes a tap, and it is the reason
       the figure reads as a person rather than a chart.

       The silhouette under it is not an outline: it is the union of the inert
       body and every muscle, laid down once in the ground tone under a fat
       round stroke, so a gap between two masses reads as body rather than as
       the screen behind it. */
    var base = api.el('g', { transform: fit });
    var union = art.inert.slice();
    ORDER.forEach(function (gid) {
      if (art.groups[gid]) union = union.concat(art.groups[gid]);
    });
    drawPaths(api, base, union, 'sil');
    drawPaths(api, base, art.inert, 'inert');
    slot.base.appendChild(base);

    var host = slot.groups;
    var made = {};
    function groupFor(gid) {
      if (made[gid]) return made[gid];
      /* The group sits in the frame's coordinates, so its hit rectangles are
         written in the same numbers a label or a zoom camera uses. Only the
         art inside it is fitted. */
      var meta = GROUPS[gid] || { name: gid, n: 0 };
      /* A figure that is not a control carries no role, no tab stop and no
         name: the whole picture is labelled by whatever mounted it, and
         twelve unreachable buttons inside it would be noise to a screen
         reader and a trap to a keyboard. */
      var g = api.el('g', api.interactive ? {
        class: 'mg mg--' + gid, tabindex: '0', role: 'button',
        'data-g': gid, 'data-testid': 'mg-' + gid,
        'aria-label': meta.name + (meta.n ? ', ' + meta.n + ' exercises' : '')
      } : {
        class: 'mg mg--' + gid, 'data-g': gid, 'aria-hidden': 'true'
      });
      host.appendChild(g);
      made[gid] = g;
      return g;
    }

    ORDER.forEach(function (gid) {
      var paths = art.groups[gid];
      if (!paths || !paths.length) return;
      var g = groupFor(gid);
      var inner = api.el('g', { transform: fit });
      drawPaths(api, inner, paths, 'mg__gnd');

      /* One gradient wash over the whole group, clipped to it, so the light
         falls across the mass rather than across each segment of it. */
      var clip = 'mgc-' + api.uid + '-' + view + '-' + gid;
      var cp = api.el('clipPath', { id: clip, clipPathUnits: 'userSpaceOnUse' });
      drawPaths(api, cp, paths, '');
      api.defs.appendChild(cp);
      var b = MEASURED[view][gid];
      var wash = api.el('g', { 'clip-path': 'url(#' + clip + ')', class: 'mg__wash' });
      wash.appendChild(api.el('rect', { x: b[0], y: b[1], width: b[2], height: b[3],
        fill: 'url(#mg-shade)' }));
      inner.appendChild(wash);
      g.appendChild(inner);
    });

    /* Nothing to grow when nothing can be tapped. */
    if (!api.interactive) return;

    /* The reach paths sit in one layer of their own after every group, rather
       than inside the groups, because a layer inside a group would still be
       painted under the next group along. They carry the group id themselves,
       and the tap handler reads that id rather than the group element.
       Largest reach first, so the thinnest muscle ends up on top. */
    var reach = ORDER.filter(function (gid) {
      return art.groups[gid] && reachOf(view, gid, api.frame) > 0;
    }).sort(function (x, y) { return reachOf(view, y, api.frame) - reachOf(view, x, api.frame); });
    /* LARGEST MARGIN FIRST, and it has to stay that way. Reading the
       comment above as an inversion and flipping the sort does make
       triceps better, 39px to 56px, and wrecks the map around it: glutes
       fall from a 56px target to 15px, biceps and shoulders drop with
       them. A thin muscle earns a large margin, and a large margin laid
       down last covers the small precise targets sitting inside it. The
       order is tuned for the worst case across all twelve, not for any
       one of them. Measured both ways before touching it. */

    var reachLayer = api.el('g', { class: 'reach', transform: fit, 'aria-hidden': 'true' });
    reach.forEach(function (gid) {
      art.groups[gid].forEach(function (d) {
        reachLayer.appendChild(api.el('path', { d: d, class: 'hit', 'data-g': gid,
          'stroke-width': Math.round(reachUnits(view, gid, api.frame) * 10) / 10 }));
      });
    });
    host.appendChild(reachLayer);

    /* Above the grown margins, every muscle's exact shape. The rule this
       settles is that a muscle's own outline always beats a neighbour's
       margin: the abdominal wall is thin enough to need 30px of reach, which
       would otherwise spill over the adductor beside it and take taps meant
       for the muscle a finger was on. Within this layer the paint order
       stands, so where the deltoid genuinely covers the pectoral, tapping the
       overlap selects the deltoid, as the picture says it should. */
    var exactLayer = api.el('g', { class: 'exact', transform: fit, 'aria-hidden': 'true' });
    ORDER.forEach(function (gid) {
      if (!art.groups[gid]) return;
      art.groups[gid].forEach(function (d) {
        exactLayer.appendChild(api.el('path', { d: d, class: 'hit hit--exact', 'data-g': gid }));
      });
    });
    host.appendChild(exactLayer);
  }

  /* ---------------------------------------------------------------
     Mounting
     --------------------------------------------------------------- */

  var nextUid = 0;

  function mount(host, opts) {
    opts = opts || {};
    var doc = host.ownerDocument || document;
    var GROUPS = opts.groups || {};
    var ORDER = opts.order || Object.keys(GROUPS);
    installHues(host, doc, ORDER);

    var mk = function (t, a) { return el(t, a, doc); };
    var interactive = opts.interactive !== false;
    var startView = opts.view === 'back' ? 'back' : 'front';
    var svg = mk('svg', interactive ? {
      class: 'map__svg', viewBox: '-16 8 240 402',
      preserveAspectRatio: 'xMidYMid meet',
      role: 'group', 'aria-label': 'Muscle map, ' + startView + ' view'
    } : {
      class: 'map__svg map__svg--static', viewBox: '-16 8 240 402',
      preserveAspectRatio: 'xMidYMid meet', 'aria-hidden': 'true', focusable: 'false'
    });
    var defs = mk('defs');
    var cam = mk('g', { class: 'cam' });
    svg.appendChild(defs);
    svg.appendChild(cam);

    var views = {};
    ['front', 'back'].forEach(function (v) {
      var wrap = mk('g', { class: 'view' });
      if (v !== startView) wrap.setAttribute('data-hidden', 'true');
      var base = mk('g'), groups = mk('g');
      wrap.appendChild(base);
      wrap.appendChild(groups);
      cam.appendChild(wrap);
      views[v] = { wrap: wrap, base: base, groups: groups };
    });

    var api = {
      element: svg, svg: svg, defs: defs, cam: cam, views: views, doc: doc,
      /* The element the map was mounted into. Reach is measured against the
         frame this renders in, not against the window: above the phone
         breakpoint .phone is a fixed 393px inside a window of any width. */
      frame: host,
      uid: ++nextUid, el: mk, interactive: interactive,
      view: startView, selected: null,
      groups: GROUPS, order: ORDER,
      /* The geometry, so a screen that zooms can frame a group without
         measuring the DOM. */
      measured: MEASURED, thin: THIN, partBox: PART_BOX, figure: FIGURE,
      fitAttr: fitAttr, boxIn: boxIn, fit: FIT, n2: n2, partsOf: partsOf, art: ART
    };

    /* ---- ZOOMING TO A MUSCLE -------------------------------------------
       The camera group exists so a screen can frame one group without
       measuring the DOM, and until now nothing used it: tapping a muscle
       filtered the list and left the figure at full height, so the part
       somebody had just chosen was the same thumbnail-sized shape it had
       been a moment earlier.

       The box is the measured extent of that group, in the frame's own
       coordinates. It is padded, capped so a small muscle does not fill
       the screen at absurd magnification, and clamped so the figure never
       leaves the frame. Passing null returns to the whole body.

       Nothing here is animated in JavaScript: the transform changes and
       CSS carries it, so a person who has asked for less motion gets the
       cut rather than the move. */
    var VB = { x: -16, y: 8, w: 240, h: 402 };

    /* ---- ONE CAMERA, TWO DRIVERS ---------------------------------------
       zoomTo frames a muscle when one is chosen. Fingers move the same
       camera. They have to share a state and a clamp, or a pinch after a
       tap fights the transform the tap left behind. */
    var cam3 = { s: 1, tx: 0, ty: 0 };
    var MAX_S = 4;
    /* How far past the stops a gesture may push before the spring takes
       over. A quarter of the range either way is enough to feel, and
       little enough that nobody arrives somewhere they cannot get back
       from. */
    var SOFT_S = 1.25;

    /* WHERE THE CAMERA IS ALLOWED TO BE, at a given magnification. */
    function camLimits(s) {
      return { minTx: VB.x + VB.w - s * (VB.x + VB.w), maxTx: VB.x - s * VB.x,
               minTy: VB.y + VB.h - s * (VB.y + VB.h), maxTy: VB.y - s * VB.y };
    }

    /* PAST THE EDGE, WITH RESISTANCE. A hard stop at the limit reads as a
       broken control: the finger keeps moving and the picture does not.
       The overshoot is let through, damped harder the further it goes,
       and released it springs back. The shape is the one every touch
       platform uses -- a hyperbola, so resistance rises without ever
       quite refusing -- with the frame's own size as the scale. */
    function rubber(over, dim) {
      var d = Math.abs(over);
      var give = d * 0.55 / (1 + d / (dim * 0.42));
      return over < 0 ? -give : give;
    }

    function clampCam(s, tx, ty, soft) {
      var lo = soft ? 1 / SOFT_S : 1, hi = soft ? MAX_S * SOFT_S : MAX_S;
      s = Math.max(lo, Math.min(s, hi));
      if (soft) {
        if (s > MAX_S) s = MAX_S + rubber(s - MAX_S, 1);
        else if (s < 1) s = 1 + rubber(s - 1, 1);
      }
      /* Never show past the figure's own edges. */
      var L = camLimits(s);
      if (soft) {
        if (tx > L.maxTx) tx = L.maxTx + rubber(tx - L.maxTx, VB.w);
        else if (tx < L.minTx) tx = L.minTx + rubber(tx - L.minTx, VB.w);
        if (ty > L.maxTy) ty = L.maxTy + rubber(ty - L.maxTy, VB.h);
        else if (ty < L.minTy) ty = L.minTy + rubber(ty - L.minTy, VB.h);
        return { s: s, tx: tx, ty: ty };
      }
      return { s: s,
               tx: Math.max(Math.min(tx, L.maxTx), L.minTx),
               ty: Math.max(Math.min(ty, L.maxTy), L.minTy) };
    }

    function setCam(s, tx, ty, soft) {
      var c = clampCam(s, tx, ty, soft);
      cam3 = c;
      cam.setAttribute('transform',
        'translate(' + n2(c.tx) + ' ' + n2(c.ty) + ') scale(' + (Math.round(c.s * 1e4) / 1e4) + ')');
      cam.setAttribute('data-zoomed', c.s > 1.02 ? 'true' : 'false');
      /* Text inside the camera is scaled by the camera. A label that
         doubles with the zoom stops being a label and becomes a banner,
         so the scale is published and the stylesheet divides by it. */
      svg.style.setProperty('--cam-s', String(Math.round(c.s * 1e3) / 1e3));
      /* A figure at rest lets the page scroll under a finger. A figure
         that has been zoomed into keeps the finger for panning, which is
         the only way to reach the parts now off-frame. Scoped to the SVG,
         so nothing else on the screen changes behaviour. */
      svg.style.touchAction = c.s > 1.02 ? 'none' : 'pan-y';
      return c;
    }
    api.cam3 = function () { return { s: cam3.s, tx: cam3.tx, ty: cam3.ty }; };

    /* ---- A ZOOM THE READER SET THEMSELVES OUTRANKS A RE-SYNC ----------
       The screen calls zoomTo on every paint, so the camera follows the
       chosen group rather than being reset behind it. That is right for a
       new choice and wrong for everything else: a pinch was wiped by the
       very next render, which on this screen is any state change at all.
       Zoom in by hand, and the figure snapped back before the fingers
       were off it.

       So a repeat of the SAME instruction is a re-sync and leaves a
       hand-set camera alone. A different group, or a different side of
       the body, is a new instruction and takes the camera back. */
    var userCam = false;
    var lastTarget = null;
    function held(gid, v) {
      var key = (gid || '') + '|' + v;
      if (userCam && key === lastTarget) return true;
      lastTarget = key;
      userCam = false;
      return false;
    }
    api.zoomHeld = function () { return userCam; };

    api.zoomTo = function (gid, view) {
      var v = view || api.view;
      if (held(gid, v)) return cam3.s > 1.02;
      var box = gid && MEASURED[v] && MEASURED[v][gid];
      if (!box) {
        setCam(1, 0, 0);
        return false;
      }
      /* A PAIRED MUSCLE IS TWO MUSCLES WIDE, and framing both of them is
         barely framing anything. The measured box for triceps spans from
         one arm to the other across the whole figure, so the camera could
         only reach 1.59x and the "zoom" left the entire body on screen.
         Chest fills the frame at 2.6x because a chest is one shape in the
         middle; an arm is two shapes at the edges.

         So a group wider than half the figure is taken as a pair and
         framed on one side of it. The other side is the same muscle
         mirrored, and losing it buys a close-up where the parts are big
         enough to read and to hit. Measured against the figure's own
         width rather than a list of which groups are paired, so the arms,
         the forearms and the delts are all caught without naming any of
         them. */
      var fig = FIGURE[v];
      var paired = box[2] > fig[2] * 0.5;
      if (paired) {
        var mid = fig[0] + fig[2] / 2;
        /* A little past the midline, so the inner edge of the muscle is
           not shaved off by the frame. */
        box = [box[0], box[1], Math.max(1, (mid + fig[2] * 0.04) - box[0]), box[3]];
      }
      var b = boxIn(v, box);
      /* CLOSE ENOUGH TO HIT. The frame used to stop at 2.6x whatever it
         was looking at, which is a fair crop of a chest and nowhere near
         enough for a biceps: the muscle stayed a sliver, the parts inside
         it were a few pixels each, and people missed them. The camera now
         goes as close as the muscle needs, to 4x, with the padding
         proportional rather than fixed so a small muscle is not framed
         with the same 26 units of air as a back. */
      var pad = Math.max(10, Math.min(26, Math.min(b.w, b.h) * 0.30));
      var s = Math.min((VB.w - pad * 2) / b.w, (VB.h - pad * 2) / b.h);
      /* A LIMB IS MOSTLY LENGTH. Framing a forearm's whole bounding box
         fits a long diagonal into a tall frame and leaves the muscle a
         ribbon down the middle with the torso either side of it: the
         camera reads 2.4x and the thing being looked at is still tiny.
         Where the parts sit side by side -- a forearm's two bellies, an
         arm's two heads, a delt's -- the ends of the muscle can run off
         the frame and nothing is lost, so the camera is allowed to crop
         the long axis and come in by as much again.

         Where the parts are stacked ALONG the muscle -- upper and lower
         abs, the calf's two heads, the back's three -- cropping the
         length would cut off a part the reader is about to choose, so
         those keep the whole muscle in frame. */
      var stacked = (DERIVED[gid] && DERIVED[gid].axis === 'vert') ||
                    (BAND_PLAN[gid] && BAND_PLAN[gid][0] && Math.abs(BAND_PLAN[gid][0].deg) < 45) ||
                    (!DERIVED[gid] && !BAND_PLAN[gid]);
      if (!stacked) {
        var crop = b.h > b.w
          ? Math.min((VB.w - pad * 2) / b.w, VB.h / (b.h * 0.62))
          : Math.min(VB.w / (b.w * 0.62), (VB.h - pad * 2) / b.h);
        s = Math.max(s, crop);
      }
      s = Math.max(1, Math.min(s, MAX_S));
      var cx = b.x + b.w / 2, cy = b.y + b.h / 2;
      setCam(s, (VB.x + VB.w / 2) - s * cx, (VB.y + VB.h / 2) - s * cy);
      return true;
    };

    /* ---- THE SECOND TAP ------------------------------------------------

       Tapping a muscle used to take the body off the screen and replace it
       with every exercise for that group, which on chest is ninety-eight
       rows with the parts written into headers you scroll past. The body
       is the reason the map is here, and it left at the moment it became
       most useful.

       So the first tap frames the muscle and splits it. partsOf has been
       in this file, exported and called by nothing, since the map was
       built: chest is the clavicular, sternal and costal heads of one
       continuous sheet, which have no border to draw and are therefore
       three bands clipped out of the pectoral; back on the rear view is
       three muscles the art already draws apart. The other ten do not
       divide honestly, and for those this returns nothing and the screen
       goes straight to the exercises, as it always did.

       The layer lives inside the camera group, so it arrives with the
       zoom rather than after it. */
    var partsLayer = null;
    var partSel = null;
    api.clearParts = function () {
      if (partsLayer && partsLayer.parentNode) partsLayer.parentNode.removeChild(partsLayer);
      partsLayer = null;
      svg.removeAttribute('data-parts');
      svg.removeAttribute('data-part-on');
    };

    /* WHICH PART IS CHOSEN, ON THE BODY. The list below could be filtered
       to Upper Chest while all three bands sat there equally lit, so the
       figure and the list disagreed about what was being looked at. The
       chosen one keeps its colour and the others step back; the split is
       still legible, and what is selected is not a guess.

       Remembered across a redraw, because the layer is rebuilt from
       scratch every time the screen repaints and would otherwise forget. */
    api.selectPart = function (name) {
      partSel = name || null;
      if (!partsLayer) return;
      if (partSel) svg.setAttribute('data-part-on', partSel);
      else svg.removeAttribute('data-part-on');
      Array.prototype.forEach.call(partsLayer.querySelectorAll('[data-part]'), function (g) {
        if (partSel && g.getAttribute('data-part') === partSel) g.setAttribute('data-on', '');
        else g.removeAttribute('data-on');
      });
      Array.prototype.forEach.call(partsLayer.querySelectorAll('.part__label, .part__label-lift'), function (t) {
        if (partSel && t.getAttribute('data-for') === partSel) t.setAttribute('data-on', '');
        else t.removeAttribute('data-on');
      });
    };

    api.showParts = function (gid, view) {
      api.clearParts();
      var v = view || api.view;
      /* The art's declared parts first, because chest and back are
         authored. Everything else is derived from the shapes the figure
         already draws, which needs the document and therefore cannot
         live in partsOf. */
      /* THE SHAPES OUTRANK THE NAMES. The screen passes the catalogue's
         sub-muscle list, and for some groups that list is not anatomy at
         all: abs comes through as "Weighted, Bodyweight", which are how
         the exercises are filed, not parts of a person. Where the figure
         draws the parts, the figure decides. */
      var spec = derivePaths(api, gid, v) ||
                 partsOf(gid, v, viewNames(gid, v, (opts.parts || {})[gid]));
      if (!spec) return null;
      var box = MEASURED[v] && MEASURED[v][gid];
      if (!box) return null;

      var layer = api.el('g', { class: 'parts', 'data-g': gid });
      var names = [];
      var labels = [];
      /* Every part, kept so its label can be anchored to what actually
         rendered rather than to a box somebody measured once. A derived
         part has no entry in PART_BOX at all -- that table only ever
         covered the two authored groups -- so quads, triceps and glutes
         came out divided and unlabelled. */
      var parts = [];
      /* A limb's parts sit one per side. Labelling the union of both puts
         the word on the midline, between the two arms, which is the one
         place the muscle is not. */
      var paired = (DERIVED[gid] && DERIVED[gid].axis === 'lat') || !!MIRROR[gid];

      if (spec.kind === 'muscles') {
        /* The art draws these apart already, so each is its own shape. */
        spec.names.forEach(function (nm, i) {
          var g = api.el('g', { class: 'part part--' + gid, 'data-i': String(i),
                                'data-part': nm, role: 'button',
                                tabindex: '0', 'aria-label': nm });
          var inner = api.el('g', { transform: fitAttr(v) });
          (spec.paths[nm] || []).forEach(function (d) {
            inner.appendChild(api.el('path', { d: d, class: 'part__gnd' }));
          });
          g.appendChild(inner);
          /* The same striation the bands get. These parts are separate
             muscles rather than one sheet, so each takes its own fibre
             direction: the lats run to the armpit, the erectors run
             straight up the spine. */
          var mdeg = fibreAngle(gid, v, nm, i, spec.names.length);
          var mid = 'prt-' + api.uid + '-' + v + '-' + gid + '-' + i;
          var mR = fibrePattern(api, mid + 'r', mdeg);
          var mL = fibrePattern(api, mid + 'l', -mdeg);
          var mover = api.el('g', { class: 'part__fib', transform: fitAttr(v) });
          (spec.paths[nm] || []).forEach(function (d) {
            mover.appendChild(api.el('path', {
              d: d, stroke: 'none',
              fill: 'url(#' + (sideOf(d, v) < 0 ? mL : mR) + ')'
            }));
          });
          g.appendChild(mover);
          layer.appendChild(g);
          /* Kept so it can be labelled. These shapes carry no anchor of
             their own -- a band knows the wedge it was cut to, a drawn
             muscle only knows where it rendered -- so the measuring pass
             below finds it. Left out of this list, quads, triceps and
             the back came out divided and unnamed. */
          parts.push({ el: g, name: nm, i: i, gid: gid });
          names.push(nm);
        });
      } else {
        /* BANDS, AND WHY THEY ARE NOT SLICES.

           A pectoral is one continuous sheet, and its three heads are
           where the fibres run rather than where anybody drew a line.
           Cutting it with a hard horizontal rect gave three stripes with
           two razor edges through the middle of a muscle: readable, and
           nothing like a body.

           Three things fix it, all in the mask rather than in more ink.
           The cut runs along the muscle's own axis, so the clavicular
           head's boundary rises laterally the way the head does. The
           boundary is a gradient rather than an edge, so one head fades
           into the next the way the tissue does. And each band carries a
           striation turned to its own fibre direction, which is what
           makes a filled shape read as muscle. */
        var b = boxIn(v, box);
        var bands = spec.names.length;
        var mirrored = !!MIRROR[gid];
        var cx = b.x + b.w / 2, cy = b.y + b.h / 2;
        var mxv = midX(v);
        /* Where the borders are and how they run. A plan gives each one
           its own place and angle; without one the muscle divides evenly
           along a single axis, which is right for anything stacked
           straight up the body. */
        var plan = BAND_PLAN[gid];
        if (!plan) {
          plan = [];
          for (var q = 1; q < bands; q++) plan.push({ at: q / bands, deg: 90 - (BAND_AXIS[gid] || 0) });
        }

        /* A BORDER IS A BORDER. The first version feathered each one
           with a gradient mask, which read as a wash rather than as two
           heads: an anatomy chart draws these edges crisply because the
           fibres change direction there, and that IS the visible line on
           a person. So the region is a clipped wedge, and the softness
           comes from the striation crossing it rather than from blurring
           the boundary away. */
        /* The same border as a hard edge, for the tap target. */
        function cutClip(uid, cut, keepAbove, flip, lo, hi, m) {
          var deg = (flip ? -cut.deg : cut.deg);
          var py = b.y + b.h * cut.at;
          /* PIVOT ON THE MUSCLE, NOT ON THE BODY. Rotating a border about
             the figure's midline means that by the time the line reaches
             a pectoral it has swung half the muscle's height away from
             where it was placed: the band came out covering most of one
             side and almost none of the other. Each side turns about its
             own centre, so `at` means the same thing on both. */
          var pivot = (lo + hi) / 2;
          /* A STEEP BORDER IS PLACED ACROSS THE MUSCLE, NOT DOWN IT. At
             ninety degrees the line is vertical and its height means
             nothing: where it falls is entirely the point it turns
             about. That point is `at` measured across the muscle's own
             width, from the midline outwards, so a delt divides into a
             front and a side head rather than a head and a sliver. */
          if (m && Math.abs(cut.deg) >= 45) {
            var lo2 = Math.min(m.in, m.out), hi2 = Math.max(m.in, m.out);
            var t = flip ? 1 - cut.at : cut.at;
            pivot = lo2 + (hi2 - lo2) * t;
          }
          var cp = api.el('clipPath', { id: uid + (keepAbove ? '-ca' : '-cb'),
                                        clipPathUnits: 'userSpaceOnUse' });
          cp.appendChild(api.el('rect', {
            x: n2(lo - b.w), y: n2(keepAbove ? py - (b.h + 80) : py),
            width: n2((hi - lo) + b.w * 2), height: n2(b.h + 80),
            transform: 'rotate(' + n2(deg) + ' ' + n2(pivot) + ' ' + n2(py) + ')'
          }));
          api.defs.appendChild(cp);
          return cp.getAttribute('id');
        }

        /* The clip still reaches to the midline so nothing is left
           unpainted between the two, but the border is placed against
           the muscle's own edges. */
        var span = sideSpan(api, gid, v);
        var sideBox = function (k, lo, hi) {
          var sp = span && span[k];
          return { in: sp ? sp[0] : lo, out: sp ? sp[1] : hi };
        };
        var sides = mirrored ? [{ k: 'r', flip: false, lo: mxv, hi: b.x + b.w + 20,
                                  m: sideBox('r', mxv, b.x + b.w) },
                                { k: 'l', flip: true, lo: b.x - 20, hi: mxv,
                                  m: sideBox('l', b.x, mxv) }]
                             : [{ k: 'x', flip: false, lo: b.x - 20, hi: b.x + b.w + 20,
                                  m: { in: b.x, out: b.x + b.w } }];

        spec.names.forEach(function (nm, i) {
          var uid0 = 'prt-' + api.uid + '-' + v + '-' + gid + '-' + i;
          var g = api.el('g', { class: 'part part--' + gid, 'data-i': String(i),
                                'data-part': nm, role: 'button',
                                tabindex: '0', 'aria-label': nm + ' ' + (GROUPS[gid] ? GROUPS[gid].name : gid) });
          var deg = fibreAngle(gid, v, nm, i, bands);

          sides.forEach(function (S2) {
            var uid = uid0 + '-' + S2.k;
            /* Two borders make a band: below the one above it, above the
               one below it. Nested rather than combined, because that is
               how two masks intersect. */
            var top = i > 0 ? plan[i - 1] : null;
            var bot = i < bands - 1 ? plan[i] : null;

            var paint = api.el('g');
            var inner = api.el('g', { transform: fitAttr(v) });
            (ART[v].groups[gid] || []).forEach(function (d) {
              inner.appendChild(api.el('path', { d: d, class: 'part__gnd' }));
            });
            paint.appendChild(inner);
            var fibR = fibrePattern(api, uid + 'r', S2.flip ? -deg : deg);
            var over = api.el('g', { class: 'part__fib', transform: fitAttr(v) });
            (ART[v].groups[gid] || []).forEach(function (d) {
              over.appendChild(api.el('path', { d: d, fill: 'url(#' + fibR + ')', stroke: 'none' }));
            });
            paint.appendChild(over);

            /* ---- THE SEAM ------------------------------------------
               A clipped wedge meets its neighbour at a hard step, which
               reads as two colours touching rather than as one muscle
               changing. Each band keeps its hard edge for the tap target
               and gains a narrow overlap that fades out across the
               border: the two tones cross for a few units either side,
               which is what the eye reads as tissue.

               Drawn as a copy of this band's paint, clipped to the other
               side of the border and masked to fade away from it. Cheap,
               local, and it cannot move the border itself. */
            var node = paint;
            if (bot) {
              var wrapB = api.el('g', { 'clip-path': 'url(#' + cutClip(uid + '-pb', bot, true, S2.flip, S2.lo, S2.hi, S2.m) + ')' });
              wrapB.appendChild(node); node = wrapB;
            }
            if (top) {
              var wrapT = api.el('g', { 'clip-path': 'url(#' + cutClip(uid + '-pt', top, false, S2.flip, S2.lo, S2.hi, S2.m) + ')' });
              wrapT.appendChild(node); node = wrapT;
            }
            /* And the side itself, so a mirrored plan never paints across
               the midline onto the other pectoral. */
            if (mirrored) {
              var sideClip = api.el('clipPath', { id: uid + '-side', clipPathUnits: 'userSpaceOnUse' });
              sideClip.appendChild(api.el('rect', { x: n2(S2.lo), y: n2(b.y - 40),
                                                    width: n2(S2.hi - S2.lo), height: n2(b.h + 80) }));
              api.defs.appendChild(sideClip);
              var wrapS = api.el('g', { 'clip-path': 'url(#' + uid + '-side)' });
              wrapS.appendChild(node); node = wrapS;
            }
            g.appendChild(node);

            /* The overlap. One per border this band has, drawn past the
               border into the neighbour and faded to nothing within a
               few units of it. */
            [[bot, true], [top, false]].forEach(function (pair, pi) {
              var cut = pair[0], isBot = pair[1];
              if (!cut) return;
              var sid = uid + (isBot ? '-sb' : '-st');
              var deg2 = (S2.flip ? -cut.deg : cut.deg);
              var py2 = b.y + b.h * cut.at;
              var pivot2 = (S2.lo + S2.hi) / 2;
              var rad2 = deg2 * Math.PI / 180;
              /* Across the border, which is its normal. */
              var nx2 = -Math.sin(rad2), ny2 = Math.cos(rad2);
              var reach2 = Math.max(2.5, b.h * 0.10);
              var sgn = isBot ? 1 : -1;
              var gr = api.el('linearGradient', { id: sid + '-g', gradientUnits: 'userSpaceOnUse',
                x1: n2(pivot2), y1: n2(py2),
                x2: n2(pivot2 + nx2 * reach2 * sgn), y2: n2(py2 + ny2 * reach2 * sgn) });
              gr.appendChild(api.el('stop', { offset: '0', 'stop-color': '#fff', 'stop-opacity': '0.85' }));
              gr.appendChild(api.el('stop', { offset: '1', 'stop-color': '#fff', 'stop-opacity': '0' }));
              api.defs.appendChild(gr);
              var mk2 = api.el('mask', { id: sid + '-m', maskUnits: 'userSpaceOnUse',
                                         x: n2(S2.lo - b.w), y: n2(b.y - 60),
                                         width: n2((S2.hi - S2.lo) + b.w * 2), height: n2(b.h + 120) });
              mk2.appendChild(api.el('rect', { x: n2(S2.lo - b.w), y: n2(b.y - 60),
                                               width: n2((S2.hi - S2.lo) + b.w * 2), height: n2(b.h + 120),
                                               fill: 'url(#' + sid + '-g)' }));
              api.defs.appendChild(mk2);

              var bleed = api.el('g', { class: 'part__bleed',
                                        mask: 'url(#' + sid + '-m)' });
              var bclip = api.el('g', { 'clip-path': 'url(#' +
                cutClip(sid, cut, !isBot, S2.flip, S2.lo, S2.hi, S2.m) + ')' });
              var binner = api.el('g', { transform: fitAttr(v) });
              (ART[v].groups[gid] || []).forEach(function (d) {
                binner.appendChild(api.el('path', { d: d, class: 'part__gnd' }));
              });
              bclip.appendChild(binner);
              bleed.appendChild(bclip);
              if (mirrored) {
                var bs = api.el('g', { 'clip-path': 'url(#' + uid + '-side)' });
                bs.appendChild(bleed);
                g.appendChild(bs);
              } else {
                g.appendChild(bleed);
              }
            });

            /* PAINT SOFTLY, HIT SHARPLY. A mask feathers a boundary and
               does nothing to pointer events, so every band would cover
               the whole muscle and the last one drawn would take every
               tap. The target is a transparent copy with hard edges. */
            var hit = api.el('g', { class: 'part__hit' });
            var hinner = api.el('g', { transform: fitAttr(v) });
            (ART[v].groups[gid] || []).forEach(function (d) {
              hinner.appendChild(api.el('path', { d: d, fill: 'transparent', stroke: 'none' }));
            });
            hit.appendChild(hinner);
            var hnode = hit;
            if (bot) {
              var hb = api.el('g', { 'clip-path': 'url(#' + cutClip(uid + '-b', bot, true, S2.flip, S2.lo, S2.hi, S2.m) + ')' });
              hb.appendChild(hnode); hnode = hb;
            }
            if (top) {
              var ht = api.el('g', { 'clip-path': 'url(#' + cutClip(uid + '-t', top, false, S2.flip, S2.lo, S2.hi, S2.m) + ')' });
              ht.appendChild(hnode); hnode = ht;
            }
            if (mirrored) {
              var hs = api.el('g', { 'clip-path': 'url(#' + uid + '-side)' });
              hs.appendChild(hnode); hnode = hs;
            }
            g.appendChild(hnode);
          });

          layer.appendChild(g);
          /* WHERE THE WEDGE IS, NOT WHERE THE MUSCLE IS. Every band holds
             a clipped copy of the whole muscle, so measuring its shapes
             gives the same box three times and stacks the three words on
             one spot. The borders already say where each band sits: the
             label goes between the one above it and the one below. */
          var fromT = i > 0 ? plan[i - 1].at : 0;
          var toT = i < bands - 1 ? plan[i].at : 1;
          var midT = (fromT + toT) / 2;
          /* A CUT WORD NEEDS SOMETHING TO CUT INTO. The label used to sit
             on the figure's midline whenever the camera framed a whole
             group, which for a chest is the gap between the two
             pectorals: white-in-black read there, engraved ink does not,
             because there is no muscle behind it to be cut. Every
             mirrored group now labels one side, the side the camera
             favours, and the word lands in the meat. */
          var camPairs = box[2] > FIGURE[v][2] * 0.5;
          var onSide = camPairs || MIRROR[gid];
          /* The side the camera favours, measured where the tissue is
             rather than half way to the spine: a pectoral runs up to the
             sternum and a deltoid stops at the shoulder, and the middle
             of the second one's half-box is the middle of a pec. */
          var sp = span && span.l;
          var sLo = sp ? sp[0] : b.x, sHi = sp ? sp[1] : mxv;
          var labX = onSide ? (sLo + sHi) / 2 : cx;
          /* A BAND CUT ACROSS THE MUSCLE IS PLACED ACROSS IT TOO. The
             deltoid divides down its length, so its two heads are side
             by side and their names belong side by side: sliding them up
             and down the shoulder, the way a pectoral's three heads
             stack, put both words on the same spot. */
          var steepCut = plan.length && Math.abs(plan[0].deg) >= 45;
          if (steepCut) {
            var edge = function (k) {
              if (k < 0) return sLo;
              if (k > plan.length - 1) return sHi;
              var t = 1 - plan[k].at;
              return sLo + (sHi - sLo) * t;
            };
            var e0 = edge(i - 1), e1 = edge(i);
            var xa = Math.min(e0, e1), xb = Math.max(e0, e1);
            /* Set a little apart down the muscle as well, so two names
               on a shoulder are not one line of type with a gap in it. */
            var ry = bands > 1 ? 0.40 + (0.26 * i) / (bands - 1) : 0.52;
            parts.push({ el: g, name: nm, i: i, gid: gid,
                         at: { x: (xa + xb) / 2, y: b.y + b.h * ry,
                               w: xb - xa } });
            names.push(nm);
            return;
          }
          /* A WEDGE IS NOT CENTRED ON THE MUSCLE. The clavicular head
             sits high and towards the shoulder, the abdominal head low
             and towards the sternum, so a label at the band's vertical
             middle lands on the head above or below it. It slides along
             the border's own direction: outward as the band rises,
             inward as it falls. */
          if (onSide) {
            var halfW = (sHi - sLo) / 2;
            labX = labX - (0.5 - midT) * halfW * 0.8;
            /* And held inside the side it names. A word that slides past
               the sternum is engraved half in muscle and half in the gap
               between the two, where there is nothing to cut. */
            labX = Math.max(sLo + halfW * 0.45, Math.min(labX, sHi - halfW * 0.45));
          }
          parts.push({ el: g, name: nm, i: i, gid: gid,
                       at: { x: labX, y: b.y + b.h * midT,
                             w: onSide ? (sHi - sLo) : b.w } });
          names.push(nm);
        });
      }

      cam.appendChild(layer);

      /* WHERE THE PART ACTUALLY IS. Measured after it is in the document,
         which is the only way to ask. A paired part is labelled on one
         limb rather than across the gap between two. */
      /* MEASURED IN THE ART'S OWN UNITS, NOT THE FRAME'S. A part's shapes
         live inside the figure's fit transform, so a child path reports
         its box in the coordinates the art was drawn in while the part
         group reports the frame's. Mixing the two put every label in the
         gap between the legs: the union of both quadriceps is centred on
         a space with no muscle in it. One space, converted once at the
         end, and a paired part measures the shapes on one side only. */
      var artMid = FIGURE[v][0] + FIGURE[v][2] / 2;
      parts.forEach(function (P) {
        /* A band knows its own place; a derived part has to be measured. */
        if (P.at) {
          labels.push({ x: Math.max(VBOX.x + 42, Math.min(P.at.x, VBOX.x + VBOX.w - 42)),
                        y: P.at.y, w: P.at.w, name: P.name, i: P.i, gid: P.gid });
          return;
        }
        var shapes = P.el.querySelectorAll('.part__gnd');
        var x0 = null, y0 = null, x1 = null, y1 = null;
        var take = function (b) {
          if (x0 === null || b.x < x0) x0 = b.x;
          if (y0 === null || b.y < y0) y0 = b.y;
          if (x1 === null || b.x + b.width > x1) x1 = b.x + b.width;
          if (y1 === null || b.y + b.height > y1) y1 = b.y + b.height;
        };
        /* A PART DRAWN TWICE IS A PART WITH A GAP DOWN THE MIDDLE. The
           lats, the traps and the abs are each a pair of shapes either
           side of the spine, and the union of the pair is centred on the
           spine, where the muscle is not. Asked of the shapes rather
           than of a table, so it is true of whatever the art draws:
           anything with tissue on both sides is labelled on one. */
        var onLeft = false, onRight = false;
        Array.prototype.forEach.call(shapes, function (sh) {
          var b;
          try { b = sh.getBBox(); } catch (e) { return; }
          if (!b || !b.width) return;
          if (b.x + b.width / 2 > artMid) onRight = true; else onLeft = true;
        });
        var twoSided = paired || (onLeft && onRight);
        var any = false;
        Array.prototype.forEach.call(shapes, function (sh) {
          var b;
          try { b = sh.getBBox(); } catch (e) { return; }
          if (!b || !b.width) return;
          /* THE SIDE THE CAMERA FRAMES. zoomTo treats a muscle wider than
             half the figure as a pair and frames from the box's left edge
             to just past the midline, so labels placed on the right limb
             sat outside the picture entirely -- clamped to a frame the
             camera was no longer showing. Same side as the zoom. */
          if (twoSided && (b.x + b.width / 2) > artMid) return;
          take(b); any = true;
        });
        if (!any) {
          /* Nothing on the right: a part drawn on one side only, which
             the left leg's shapes still answer for. */
          Array.prototype.forEach.call(shapes, function (sh) {
            var b;
            try { b = sh.getBBox(); } catch (e) { return; }
            if (!b || !b.width) return;
            take(b); any = true;
          });
        }
        if (!any) {
          /* NOTHING MEASURED MEANS NOTHING RENDERED. A split built while
             the figure is off-screen -- the library in search results,
             a sheet not yet opened -- reports every box as zero, and a
             label that gives up then never comes back, because the layer
             is not rebuilt when the figure reappears. The group's own
             measured extent answers instead: coarser, always there, and
             replaced by the real measurement on the next build. */
          var mb = MEASURED[v] && MEASURED[v][gid];
          if (!mb) return;
          var n = Math.max(1, parts.length);
          x0 = mb[0]; x1 = mb[0] + mb[2];
          y0 = mb[1] + (mb[3] / n) * P.i;
          y1 = y0 + mb[3] / n;
        }
        var fr = boxIn(v, [x0, y0, x1 - x0, y1 - y0]);
        /* A LIMB IS NARROW AND THE HEADS SIT SIDE BY SIDE, so three words
           at three centroids land on top of each other: "Rectus Femoris"
           is wider than the muscle it names. Each one drops to its own
           height down the belly, which keeps the word over its own head
           horizontally and clear of its neighbours vertically. Stacked
           groups -- chest, glutes, the back -- are already apart and
           stay at their centres. */
        var ly = fr.y + fr.h / 2;
        if (paired && parts.length > 1) {
          ly = fr.y + fr.h * (0.30 + (0.32 * P.i) / (parts.length - 1));
        }
        /* Held inside the frame. A triceps sits at the edge of the
           figure and "Lateral Head" is wider than the arm, so the word
           ran off the picture. The margin is half of a long label at the
           size these render. */
        var lx = Math.max(VBOX.x + 42, Math.min(fr.x + fr.w / 2, VBOX.x + VBOX.w - 42));
        labels.push({ x: lx, y: ly, w: fr.w, name: P.name, i: P.i, gid: P.gid });
      });

      /* Every label after every shape, so no part paints over a word.
         They take no pointer events, so a tap on a label is a tap on the
         part under it -- which is what anybody aiming at the word means. */
      /* THE WORD THAT FITS THE MUSCLE. A triceps head is narrower than
         the words "Lateral Head", and a name engraved wider than the
         tissue runs onto the background, where a cut letter has nothing
         to be cut into. Every one of these names is two words with one
         doing the work: the heads are Lateral, Long and Medial, the
         glutes are Maximus and Medius. The shared word is the one worth
         dropping, so each label keeps the word its neighbours do not
         have and falls back to its whole name when every word is its
         own. */
      var wordCount = {};
      labels.forEach(function (L) {
        var seen = {};
        L.name.split(/\s+/).forEach(function (w) {
          if (seen[w]) return; seen[w] = 1;
          wordCount[w] = (wordCount[w] || 0) + 1;
        });
      });
      labels.forEach(function (L) {
        var own = L.name.split(/\s+/).filter(function (w) { return wordCount[w] === 1; });
        L.short = own.length ? own[0] : L.name;
      });

      labels.forEach(function (L) {
        /* ENGRAVED, NOT PRINTED ON. White text in a black outline is a
           sticker laid over anatomy: it reads as a caption about the
           picture rather than as part of it. A cut letter is two things,
           a dark trough and a lit edge just below it where the light
           catches the far wall, so each label is drawn twice: a highlight
           a hair lower, then the ink over it. Both take their colour from
           the muscle rather than from ink and paper. */
        var lift = api.el('text', { class: 'part__label-lift', x: n2(L.x), y: n2(L.y),
                                    'data-for': L.name, 'aria-hidden': 'true' });
        lift.textContent = L.name;
        layer.appendChild(lift);
        var t = api.el('text', { class: 'part__label', x: n2(L.x), y: n2(L.y),
                                 'data-for': L.name, 'aria-hidden': 'true' });
        t.textContent = L.name;
        layer.appendChild(t);
        /* AND IT HAS TO FIT THE MUSCLE IT IS CUT INTO. "Lateral Head" is
           wider than an upper arm, so at one size the word ran off the
           tissue onto the background, where a cut letter has nothing to
           be cut into and simply disappears. The text and the part are
           measured in the same space, so the ratio is the answer: the
           word steps down until it sits inside its own shape, and never
           below two thirds, where it would be a footnote instead of a
           name. */
        var room = L.w;
        if (!room) return;
        var fits = function () {
          var len = 0;
          try { len = t.getComputedTextLength(); } catch (e) { return true; }
          return !len || len <= room * 0.80;
        };
        if (fits()) return;
        /* The short name first: a smaller word is still the app's type,
           a shrunk one is a footnote. */
        if (L.short !== L.name) {
          lift.textContent = L.short; t.textContent = L.short;
          if (fits()) return;
        }
        var len2 = 0;
        try { len2 = t.getComputedTextLength(); } catch (e) { return; }
        if (!len2) return;
        var k = Math.max(0.62, (room * 0.8) / len2);
        [lift, t].forEach(function (node) {
          node.style.fontSize = 'calc(' + n2(9.5 * k) + 'px / var(--cam-s, 1))';
          node.style.letterSpacing = 'calc(' + n2(0.38 * k) + 'px / var(--cam-s, 1))';
        });
      });

      partsLayer = layer;
      svg.setAttribute('data-parts', gid);
      if (partSel) api.selectPart(partSel);

      var pPressed = null;
      function pUnpress() {
        if (pPressed) pPressed.removeAttribute('data-press');
        pPressed = null;
      }
      layer.addEventListener('pointerdown', function (e) {
        var t = e.target && e.target.closest ? e.target.closest('[data-part]') : null;
        if (!t) return;
        pUnpress();
        pPressed = t;
        t.setAttribute('data-press', '');
      });
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) {
        layer.addEventListener(ev, pUnpress);
      });

      layer.addEventListener('click', function (e) {
        var t = e.target && e.target.closest ? e.target.closest('[data-part]') : null;
        if (!t) return;
        e.preventDefault();
        if (opts.onPart) opts.onPart(gid, t.getAttribute('data-part'));
      });
      layer.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        var t = e.target && e.target.closest ? e.target.closest('[data-part]') : null;
        if (!t) return;
        e.preventDefault();
        if (opts.onPart) opts.onPart(gid, t.getAttribute('data-part'));
      });
      return names;
    };

    shadeDefs(api);
    buildView(api, 'front');
    buildView(api, 'back');
    host.appendChild(svg);

    api.setView = function (v) {
      if (v !== 'front' && v !== 'back') return;
      api.view = v;
      views.front.wrap.setAttribute('data-hidden', String(v !== 'front'));
      views.back.wrap.setAttribute('data-hidden', String(v !== 'back'));
      if (interactive) svg.setAttribute('aria-label', 'Muscle map, ' + v + ' view');
    };

    api.select = function (gid) {
      api.selected = gid || null;
      /* The flag goes on the figure, not on whatever contains it. A figure in
         a sheet has no map frame around it, and a rule that reached for one
         left every muscle lit. */
      if (api.selected) svg.setAttribute('data-selected', api.selected);
      else svg.removeAttribute('data-selected');
      Array.prototype.forEach.call(svg.querySelectorAll('.mg[data-g]'), function (g) {
        if (g.getAttribute('data-g') === api.selected) g.setAttribute('data-on', '');
        else g.removeAttribute('data-on');
      });
    };

    /* Rings of probes around a point, nearest first, answering with the
       first group whose own shape is under one of them. Eight around a
       circle is enough to find an edge in any direction and cheap enough
       to run on a tap; the radii stop at 14px, which is a fingertip's
       worth of slop and not a second muscle away. */
    function nearestExact(cx, cy) {
      var root = svg.getRootNode ? svg.getRootNode() : document;
      if (!root || !root.elementFromPoint) root = document;
      var radii = [0, 7, 14];
      for (var ri = 0; ri < radii.length; ri++) {
        var rad = radii[ri];
        var n = rad ? 8 : 1;
        for (var i = 0; i < n; i++) {
          var a = (Math.PI * 2 * i) / n;
          var el = root.elementFromPoint(Math.round(cx + Math.cos(a) * rad),
                                         Math.round(cy + Math.sin(a) * rad));
          if (!el || !el.closest) continue;
          if (el.closest('.parts')) return null;
          var ex = el.closest('.hit--exact');
          if (ex) return ex.getAttribute('data-g');
        }
      }
      return null;
    }

    function choose(target, e) {
      /* A TAP INSIDE THE SPLIT BELONGS TO THE PART. The parts layer sits
         over the muscle it came from, so a tap on a band reaches this
         handler as well. It used to carry data-g, which made it look like
         the muscle itself: choosing Upper Chest re-selected Chest, which
         redrew the split, which put the screen back exactly where it had
         been. The band was tappable, the handler ran, and nothing moved.

         The parts do not carry data-g any more, and this refuses anything
         inside the layer regardless, because the two handlers overlap by
         design and only one of them can win. */
      if (target && target.closest && target.closest('.parts')) return false;
      var t = target && target.closest ? target.closest('[data-g]') : null;
      if (!t) return false;
      if (e) e.preventDefault();
      var gid = t.getAttribute('data-g');
      /* THE MUSCLE UNDER THE FINGER BEATS THE ONE NEAR IT. Every thin
         muscle carries a margin so it can be hit at all, and those
         margins lie over their neighbours: a tap a few pixels off the
         forearm landed in the triceps' margin and chose the triceps,
         while the forearm's own outline was nearer. When the tap lands
         on a margin rather than on a shape, the shapes within a
         fingertip of it are asked as well, and the nearest one wins. */
      if (t.classList && !t.classList.contains('hit--exact') && e &&
          (e.clientX != null || (e.touches && e.touches[0]))) {
        var near = nearestExact(e.clientX != null ? e.clientX : e.touches[0].clientX,
                                e.clientY != null ? e.clientY : e.touches[0].clientY);
        if (near) gid = near;
      }
      api.select(gid);
      if (opts.onSelect) opts.onSelect(gid);
      return true;
    }

    if (interactive) {
      /* One listener on the figure. '[data-g]' rather than '.mg', because the
         reach paths carry the group id but sit outside the groups, so a thin
         muscle can be grown without being painted over by the next group. */
      svg.addEventListener('click', function (e) { choose(e.target, e); });

      /* Touch-down feedback. A muscle has to answer the finger before the
         click resolves, the same 80ms every other control in the build
         honours. The group is found from the reach path's own id, because
         the path that took the press is not inside the group it belongs to. */
      var pressed = null;
      function unpress() {
        if (pressed) pressed.removeAttribute('data-press');
        pressed = null;
      }
      svg.addEventListener('pointerdown', function (e) {
        unpress();
        var t = e.target.closest ? e.target.closest('[data-g], [data-part]') : null;
        if (!t) return;
        var g = t.getAttribute('data-g');
        pressed = t.hasAttribute('data-part') ? t : (g ? svg.querySelector('.mg--' + g) : null);
        if (pressed) pressed.setAttribute('data-press', '');
      });
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) {
        svg.addEventListener(ev, unpress);
      });

      /* Enter and Space on a focused muscle, so the map is not mouse-only.
         Groups are already focusable, in anatomical order. */
      svg.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return;
        choose(e.target, e);
      });

      /* ---- FINGERS ON THE FIGURE, AND NOWHERE ELSE --------------------
         Pinch to zoom, drag to pan once zoomed, double-tap to go in and
         out. All of it bound to the SVG, so the page around it keeps the
         behaviour it had: at rest the element allows pan-y and a finger
         dragged over the body scrolls the screen as before; once zoomed
         it takes the finger, because panning is the only way to reach the
         parts now outside the frame.

         The transform is animated by CSS. During a gesture that animation
         is the enemy -- it lags the fingers by 300ms -- so the element is
         flagged for the duration and the stylesheet drops the transition.
         A person who asked for reduced motion already gets the cut. */
      var pinch = null, pan = null, lastTap = 0;
      /* Anything a finger does to the camera is the reader's, and stays
         until they choose a different muscle. */
      function mine(s, tx, ty, soft) { userCam = true; return setCam(s, tx, ty, soft); }

      /* ---- THE CAMERA AFTER THE FINGERS LEAVE ------------------------

         Everything below runs on rAF rather than on a CSS transition,
         because a transition can only go from where it is to where it
         was told, at a fixed rate, and neither of those is what a
         released gesture wants. A flick carries on and slows down. An
         overshoot is pulled back by a spring whose strength depends on
         how far out it is. Both of those are a state integrated frame by
         frame, so they are written that way.

         One loop at a time: a new gesture cancels whatever the last one
         was still doing, which is what makes grabbing a moving picture
         feel like grabbing rather than like queueing. */
      var glide = null;
      function stopGlide() {
        if (glide) { cancelAnimationFrame(glide); glide = null; }
      }

      /* A critically damped spring: no wobble, no second pass, arrives
         and stops. Wobble is right for a button and wrong for a camera --
         a picture that bounces at the end of a pan reads as loose. */
      function settle(done) {
        stopGlide();
        var target = clampCam(cam3.s, cam3.tx, cam3.ty);
        var vs = 0, vx = 0, vy = 0;
        var K = 0.055, D = 0.78;      /* stiffness, damping per frame */
        var last = 0;
        live(true);
        glide = requestAnimationFrame(function step(now) {
          if (!last) last = now;
          /* Frames are 16ms on a good day and 33 on a bad one, so the
             step is scaled rather than assumed. Capped, or a tab coming
             back from the background integrates one enormous jump. */
          var f = Math.min(3, (now - last) / 16.667) || 1;
          last = now;
          target = clampCam(cam3.s, cam3.tx, cam3.ty);
          vs = (vs + (target.s - cam3.s) * K * f) * Math.pow(D, f);
          vx = (vx + (target.tx - cam3.tx) * K * f) * Math.pow(D, f);
          vy = (vy + (target.ty - cam3.ty) * K * f) * Math.pow(D, f);
          var ns = cam3.s + vs * f, nx = cam3.tx + vx * f, ny = cam3.ty + vy * f;
          var near = Math.abs(target.s - ns) < 0.002 && Math.abs(vs) < 0.002 &&
                     Math.abs(target.tx - nx) < 0.05 && Math.abs(vx) < 0.05 &&
                     Math.abs(target.ty - ny) < 0.05 && Math.abs(vy) < 0.05;
          if (near) {
            mine(target.s, target.tx, target.ty);
            glide = null; live(false);
            if (done) done();
            return;
          }
          mine(ns, nx, ny, true);
          glide = requestAnimationFrame(step);
        });
      }

      /* A FLICK KEEPS GOING. Released mid-pan the picture carries the
         speed it had and loses it to friction, which is the difference
         between dragging a photograph and dragging a scrollbar. It is
         let past the edge on the way, where the same resistance applies,
         and the spring above takes it from wherever it stops. */
      function fling(vx, vy, done) {
        stopGlide();
        var speed = Math.sqrt(vx * vx + vy * vy);
        if (speed < 0.12) { settle(done); return; }
        var last = 0;
        live(true);
        glide = requestAnimationFrame(function step(now) {
          if (!last) last = now;
          var f = Math.min(3, (now - last) / 16.667) || 1;
          last = now;
          vx *= Math.pow(0.935, f); vy *= Math.pow(0.935, f);
          var out = clampCam(cam3.s, cam3.tx, cam3.ty);
          /* Outside the stops the glide dies quickly: a flick that has
             already left the picture has made its point. */
          if (Math.abs(out.tx - cam3.tx) > 0.01 || Math.abs(out.ty - cam3.ty) > 0.01) {
            vx *= Math.pow(0.82, f); vy *= Math.pow(0.82, f);
          }
          if (Math.sqrt(vx * vx + vy * vy) < 0.05) { settle(done); return; }
          mine(cam3.s, cam3.tx + vx * f, cam3.ty + vy * f, true);
          glide = requestAnimationFrame(step);
        });
      }

      function svgPoint(clientX, clientY) {
        var r = svg.getBoundingClientRect();
        if (!r.width || !r.height) return { x: 0, y: 0 };
        /* preserveAspectRatio is xMidYMid meet, so the viewBox is letter-
           boxed inside the element and the scale is the smaller of the
           two ratios. Reading only the width was wrong on any frame that
           is not the viewBox's own aspect. */
        var k = Math.min(r.width / VB.w, r.height / VB.h);
        var ox = r.left + (r.width - VB.w * k) / 2;
        var oy = r.top + (r.height - VB.h * k) / 2;
        return { x: VB.x + (clientX - ox) / k, y: VB.y + (clientY - oy) / k };
      }
      function live(on) {
        if (on) svg.setAttribute('data-gesture', 'true');
        else svg.removeAttribute('data-gesture');
      }
      function dist(a, b) {
        var dx = a.clientX - b.clientX, dy = a.clientY - b.clientY;
        return Math.sqrt(dx * dx + dy * dy) || 1;
      }

      svg.addEventListener('touchstart', function (e) {
        /* A finger on a moving picture stops it where it is. */
        stopGlide();
        splitFrom = cam3.s;
        if (e.touches.length === 2) {
          pan = null;
          var a = e.touches[0], b = e.touches[1];
          var mid = svgPoint((a.clientX + b.clientX) / 2, (a.clientY + b.clientY) / 2);
          pinch = { d: dist(a, b), s: cam3.s, tx: cam3.tx, ty: cam3.ty, mid: mid };
          live(true);
          e.preventDefault();
          return;
        }
        if (e.touches.length === 1 && cam3.s > 1.02) {
          var t = e.touches[0];
          pan = { x: t.clientX, y: t.clientY, tx: cam3.tx, ty: cam3.ty, moved: false,
                  /* The last two samples are the whole of the flick: any
                     longer an average and a finger that stopped before
                     lifting still throws the picture. */
                  vx: 0, vy: 0, at: (e.timeStamp || Date.now()) };
        }
      }, { passive: false });

      svg.addEventListener('touchmove', function (e) {
        if (pinch && e.touches.length === 2) {
          var a = e.touches[0], b = e.touches[1];
          var k = dist(a, b) / pinch.d;
          /* Past the stops under the fingers as well, so a pinch that
             asks for more than there is pushes back instead of ending. */
          var s = pinch.s * k;
          /* Hold the midpoint of the two fingers still: the model point
             under it before the pinch must land under it after. */
          var m = pinch.mid;
          mine(s, m.x - (m.x - pinch.tx) * (s / pinch.s), m.y - (m.y - pinch.ty) * (s / pinch.s), true);
          e.preventDefault();
          return;
        }
        if (pan && e.touches.length === 1) {
          var t = e.touches[0];
          var dx = t.clientX - pan.x, dy = t.clientY - pan.y;
          /* A tap wobbles. Below the slop it is still a tap, and taking
             the event would cost the reader the muscle they meant to
             choose. */
          if (!pan.moved && Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
          if (!pan.moved) { pan.moved = true; live(true); }
          var r = svg.getBoundingClientRect();
          var k2 = Math.min(r.width / VB.w, r.height / VB.h) || 1;
          var ntx = pan.tx + dx / k2, nty = pan.ty + dy / k2;
          var tnow = e.timeStamp || Date.now();
          var dt = tnow - pan.at;
          if (dt > 0) {
            pan.vx = (ntx - cam3.tx) / dt;
            pan.vy = (nty - cam3.ty) / dt;
            pan.at = tnow;
          }
          mine(cam3.s, ntx, nty, true);
          e.preventDefault();
        }
      }, { passive: false });

      /* ---- ZOOM AND DIVIDE ARE ONE GESTURE ---------------------------
         The split arrived with the tap that framed a muscle, and the
         fingers could not reach it: pinching into the same muscle showed
         the same undivided shape, bigger. Close enough IS the condition
         for showing the parts, however the camera got there.

         Two thresholds rather than one, because a single one at the
         boundary flickers the whole split on and off while a finger
         hovers around it. */
      /* The magnification a gesture started at. The split follows the
         camera CROSSING a threshold rather than sitting past one: a tap
         that chooses a head clears the split on purpose, and a re-sync
         that only looks at where the camera is would see a zoomed figure
         with no parts, put them back, and drop the reader out of the
         list they had just opened. */
      var splitFrom = null;

      function syncSplit() {
        var gid = api.selected;
        if (!gid) return;
        var from = splitFrom == null ? cam3.s : splitFrom;
        if (cam3.s >= 1.6 && from < 1.6 && !partsLayer) {
          var names = api.showParts(gid, api.view);
          if (names && names.length > 1 && opts.onSplit) opts.onSplit(gid, names);
          else if (!names || names.length < 2) api.clearParts();
        } else if (cam3.s < 1.3 && from >= 1.3 && partsLayer) {
          api.clearParts();
          if (opts.onSplit) opts.onSplit(null, null);
        }
      }

      function endGesture(e) {
        var flung = null;
        if (pinch && (!e.touches || e.touches.length < 2)) { pinch = null; }
        if (pan && (!e.touches || e.touches.length === 0)) {
          /* A drag is not a tap. Swallow the click the browser is about
             to synthesise, or panning across the figure also picks a
             muscle. */
          if (pan.moved) {
            svg.addEventListener('click', function swallow(ev) {
              ev.stopPropagation(); ev.preventDefault();
              svg.removeEventListener('click', swallow, true);
            }, true);
          }
          /* Per frame rather than per millisecond, which is the unit the
             glide integrates in. */
          if (pan.moved) flung = { x: pan.vx * 16.667, y: pan.vy * 16.667 };
          pan = null;
        }
        if (pinch || pan) return;
        /* Snap home rather than resting at 1.01, where the figure is
           still holding the finger for a pan it no longer needs. */
        if (cam3.s < 1.06) { mine(1, 0, 0); live(false); syncSplit(); return; }
        /* The split follows the camera wherever it comes to rest, not
           where the fingers left it: a flick that carries past the
           threshold should divide the muscle, and one that springs back
           inside it should not. */
        if (flung) fling(flung.x, flung.y, syncSplit);
        else settle(syncSplit);
        /* And straight away as well, so a pinch that is clearly in or
           clearly out does not wait for the spring to finish. */
        syncSplit();
      }
      svg.addEventListener('touchend', endGesture);
      svg.addEventListener('touchcancel', endGesture);

      /* DOUBLE TAP. Two taps in 300ms within a thumb's width of each
         other: in if we are out, out if we are in. */
      svg.addEventListener('pointerup', function (e) {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        stopGlide();
        var now = Date.now();
        var near = lastTap && (now - lastTap) < 300;
        lastTap = near ? 0 : now;
        if (!near) return;
        splitFrom = cam3.s;
        if (cam3.s > 1.02) { mine(1, 0, 0); syncSplit(); return; }
        var p = svgPoint(e.clientX, e.clientY);
        var s = 2.2;
        mine(s, (VB.x + VB.w / 2) - s * p.x, (VB.y + VB.h / 2) - s * p.y);
        syncSplit();
      });

      /* A trackpad pinch arrives as a wheel with ctrlKey. Desktop is not
         the target, but it is where this gets tested. */
      svg.addEventListener('wheel', function (e) {
        if (!e.ctrlKey) return;
        e.preventDefault();
        var p = svgPoint(e.clientX, e.clientY);
        if (splitFrom == null) splitFrom = cam3.s;
        var s = Math.max(1, Math.min(cam3.s * (1 - e.deltaY / 200), MAX_S));
        mine(s, p.x - (p.x - cam3.tx) * (s / cam3.s), p.y - (p.y - cam3.ty) * (s / cam3.s));
      }, { passive: false });

      setCam(1, 0, 0);
    }

    return api;
  }

  /* Whether a view draws a group at all. Turning the figure over with a
     muscle chosen has to know whether that muscle exists on the other
     side: a chest does not, a triceps does. */
  function drawnOn(gid, view) {
    return !!(MEASURED[view] && MEASURED[view][gid]);
  }

  global.LKBodyMap = { mount: mount, partsOf: partsOf, drawnOn: drawnOn };
})(typeof window !== 'undefined' ? window : this);
