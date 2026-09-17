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
             '.part--' + gid + '[data-i="0"] { fill: color-mix(in srgb, ' + v + ' 74%, #fff); }\n' +
             '.part--' + gid + '[data-i="1"] { fill: ' + v + '; }\n' +
             '.part--' + gid + '[data-i="2"] { fill: color-mix(in srgb, ' + v + ' 72%, #000); }\n' +
             '.part--' + gid + '[data-i="3"] { fill: color-mix(in srgb, ' + v + ' 50%, #000); }\n' +
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

    function clampCam(s, tx, ty) {
      s = Math.max(1, Math.min(s, MAX_S));
      /* Never show past the figure's own edges. */
      var minTx = VB.x + VB.w - s * (VB.x + VB.w), maxTx = VB.x - s * VB.x;
      var minTy = VB.y + VB.h - s * (VB.y + VB.h), maxTy = VB.y - s * VB.y;
      return { s: s,
               tx: Math.max(Math.min(tx, maxTx), minTx),
               ty: Math.max(Math.min(ty, maxTy), minTy) };
    }

    function setCam(s, tx, ty) {
      var c = clampCam(s, tx, ty);
      cam3 = c;
      cam.setAttribute('transform',
        'translate(' + n2(c.tx) + ' ' + n2(c.ty) + ') scale(' + (Math.round(c.s * 1e4) / 1e4) + ')');
      cam.setAttribute('data-zoomed', c.s > 1.02 ? 'true' : 'false');
      /* A figure at rest lets the page scroll under a finger. A figure
         that has been zoomed into keeps the finger for panning, which is
         the only way to reach the parts now off-frame. Scoped to the SVG,
         so nothing else on the screen changes behaviour. */
      svg.style.touchAction = c.s > 1.02 ? 'none' : 'pan-y';
      return c;
    }
    api.cam3 = function () { return { s: cam3.s, tx: cam3.tx, ty: cam3.ty }; };

    api.zoomTo = function (gid, view) {
      var v = view || api.view;
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
      var pad = 26;
      var s = Math.min((VB.w - pad * 2) / b.w, (VB.h - pad * 2) / b.h);
      s = Math.max(1, Math.min(s, 2.6));
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
    api.clearParts = function () {
      if (partsLayer && partsLayer.parentNode) partsLayer.parentNode.removeChild(partsLayer);
      partsLayer = null;
      svg.removeAttribute('data-parts');
    };

    api.showParts = function (gid, view) {
      api.clearParts();
      var v = view || api.view;
      var spec = partsOf(gid, v, (opts.parts || {})[gid]);
      if (!spec) return null;
      var box = MEASURED[v] && MEASURED[v][gid];
      if (!box) return null;

      var layer = api.el('g', { class: 'parts', 'data-g': gid });
      var names = [];

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
          layer.appendChild(g);
          names.push(nm);
        });
      } else {
        /* BANDS. One sheet of muscle, cut into three across the body. The
           cut is a clip rather than a border, because there is no border
           on a person: the pectoral is continuous and the heads are where
           the fibres run, not where the ink is. */
        var b = boxIn(v, box);
        var bands = spec.names.length;
        spec.names.forEach(function (nm, i) {
          var clip = 'prt-' + api.uid + '-' + v + '-' + gid + '-' + i;
          var cp = api.el('clipPath', { id: clip, clipPathUnits: 'userSpaceOnUse' });
          cp.appendChild(api.el('rect', {
            x: n2(b.x - 4), y: n2(b.y + (b.h / bands) * i),
            width: n2(b.w + 8), height: n2(b.h / bands + 0.4)
          }));
          api.defs.appendChild(cp);
          var g = api.el('g', { class: 'part part--' + gid, 'data-i': String(i),
                                'data-part': nm, role: 'button',
                                tabindex: '0', 'aria-label': nm + ' ' + (GROUPS[gid] ? GROUPS[gid].name : gid),
                                'clip-path': 'url(#' + clip + ')' });
          var inner = api.el('g', { transform: fitAttr(v) });
          (ART[v].groups[gid] || []).forEach(function (d) {
            inner.appendChild(api.el('path', { d: d, class: 'part__gnd' }));
          });
          g.appendChild(inner);
          layer.appendChild(g);
          names.push(nm);
        });
      }

      cam.appendChild(layer);
      partsLayer = layer;
      svg.setAttribute('data-parts', gid);

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
      api.select(gid);
      if (opts.onSelect) opts.onSelect(gid);
      return true;
    }

    if (interactive) {
      /* One listener on the figure. '[data-g]' rather than '.mg', because the
         reach paths carry the group id but sit outside the groups, so a thin
         muscle can be grown without being painted over by the next group. */
      svg.addEventListener('click', function (e) { choose(e.target, null); });

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
          pan = { x: t.clientX, y: t.clientY, tx: cam3.tx, ty: cam3.ty, moved: false };
        }
      }, { passive: false });

      svg.addEventListener('touchmove', function (e) {
        if (pinch && e.touches.length === 2) {
          var a = e.touches[0], b = e.touches[1];
          var k = dist(a, b) / pinch.d;
          var s = Math.max(1, Math.min(pinch.s * k, MAX_S));
          /* Hold the midpoint of the two fingers still: the model point
             under it before the pinch must land under it after. */
          var m = pinch.mid;
          setCam(s, m.x - (m.x - pinch.tx) * (s / pinch.s), m.y - (m.y - pinch.ty) * (s / pinch.s));
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
          setCam(cam3.s, pan.tx + dx / k2, pan.ty + dy / k2);
          e.preventDefault();
        }
      }, { passive: false });

      function endGesture(e) {
        if (pinch && (!e.touches || e.touches.length < 2)) { pinch = null; live(false); }
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
          pan = null; live(false);
        }
        /* Snap home rather than resting at 1.01, where the figure is
           still holding the finger for a pan it no longer needs. */
        if (!pinch && !pan && cam3.s < 1.03 && cam3.s !== 1) setCam(1, 0, 0);
      }
      svg.addEventListener('touchend', endGesture);
      svg.addEventListener('touchcancel', endGesture);

      /* DOUBLE TAP. Two taps in 300ms within a thumb's width of each
         other: in if we are out, out if we are in. */
      svg.addEventListener('pointerup', function (e) {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        var now = Date.now();
        var near = lastTap && (now - lastTap) < 300;
        lastTap = near ? 0 : now;
        if (!near) return;
        if (cam3.s > 1.02) { setCam(1, 0, 0); return; }
        var p = svgPoint(e.clientX, e.clientY);
        var s = 2.2;
        setCam(s, (VB.x + VB.w / 2) - s * p.x, (VB.y + VB.h / 2) - s * p.y);
      });

      /* A trackpad pinch arrives as a wheel with ctrlKey. Desktop is not
         the target, but it is where this gets tested. */
      svg.addEventListener('wheel', function (e) {
        if (!e.ctrlKey) return;
        e.preventDefault();
        var p = svgPoint(e.clientX, e.clientY);
        var s = Math.max(1, Math.min(cam3.s * (1 - e.deltaY / 200), MAX_S));
        setCam(s, p.x - (p.x - cam3.tx) * (s / cam3.s), p.y - (p.y - cam3.ty) * (s / cam3.s));
      }, { passive: false });

      setCam(1, 0, 0);
    }

    return api;
  }

  global.LKBodyMap = { mount: mount, partsOf: partsOf };
})(typeof window !== 'undefined' ? window : this);
