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
  function unitPx(host) {
    var w = 0;
    if (host && host.getBoundingClientRect) w = host.getBoundingClientRect().width;
    if (!w) {
      var frame = host && host.closest && host.closest('.phone');
      if (frame) w = frame.getBoundingClientRect().width;
    }
    if (!w) w = Math.min(global.innerWidth || 390, 430);
    return w / FRAME_UNITS;
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
      return '.mg--' + gid + ' .mg__gnd { fill: ' + v + '; ' +
             'stroke: color-mix(in srgb, ' + v + ' 22%, #000); }\n' +
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
  function partsOf(gid, view) {
    var real = ART[view].parts && ART[view].parts[gid];
    if (real) return { kind: 'muscles', names: Object.keys(real), paths: real };
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

    var reachLayer = api.el('g', { class: 'reach', transform: fit, 'aria-hidden': 'true' });
    reach.forEach(function (gid) {
      art.groups[gid].forEach(function (d) {
        reachLayer.appendChild(api.el('path', { d: d, class: 'hit', 'data-g': gid,
          'stroke-width': Math.round(reachOf(view, gid, api.frame) * 10) / 10 }));
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

      /* Enter and Space on a focused muscle, so the map is not mouse-only.
         Groups are already focusable, in anatomical order. */
      svg.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return;
        choose(e.target, e);
      });
    }

    return api;
  }

  global.LKBodyMap = { mount: mount, partsOf: partsOf };
})(typeof window !== 'undefined' ? window : this);
