/* ===================================================================
   LKDial — the amount, as a dial.

   A number field is the right control for a number you already know and
   the wrong one for a number you are deciding. Logging food is deciding:
   you know roughly what a portion is and you want to move around it, not
   type it, and every time you type it the keyboard covers the figures you
   are typing it against.

   So this is a dial. It reads as a watch bezel because a bezel is the one
   dial everybody already knows how to use: a ring of ticks, a marker at
   twelve, minute ticks between the hour ticks, and the numbers where a
   watch puts its numbers. It turns under a finger, it steps rather than
   slides, and every step answers with a tick you can feel.

   WHAT IT IS NOT. It is not a replacement for the field. The field stays
   underneath, because a dial cannot be typed into, cannot be read by a
   screen reader as a number, and is a bad way to enter 237. The dial is
   the fast way and the field is the exact way, and they hold the same
   value.

   STEPPING. The default step is 5, because food is a thing you weigh to
   about five grams and a dial that moved one gram at a time would need
   twenty turns to cross a portion. Finer is a toggle rather than a
   gesture, since a control that changes what it does depending on how
   fast you moved is a control you cannot trust.

   =================================================================== */
(function (global) {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var uid = 0;

  function el(tag, attrs, doc) {
    var n = (doc || document).createElementNS(NS, tag);
    for (var k in attrs) if (attrs[k] != null) n.setAttribute(k, attrs[k]);
    return n;
  }

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  /* Floating point steps of 0.1 do not land on 0.1. Every value is rounded
     to the step's own precision as it is produced, so the readout never
     shows 1.7999999999999998 and the logged figure is the one on screen. */
  function quantise(v, step, min, max) {
    var n = Math.round((v - min) / step) * step + min;
    var dp = (String(step).split('.')[1] || '').length;
    n = Number(n.toFixed(dp));
    return clamp(n, min, max);
  }

  function mount(host, opts) {
    opts = opts || {};
    var doc = host.ownerDocument || document;
    var id = ++uid;

    var state = {
      value: 0,
      step: opts.step || 5,
      min: opts.min != null ? opts.min : 0,
      max: opts.max != null ? opts.max : 1000,
      unit: opts.unit || 'g'
    };

    /* HOW MUCH TURN IS ONE STEP. A bezel has sixty ticks and food does not
       stop at sixty grams, so the ring is not a scale of the whole range:
       it is a rate. Six degrees per step is one minute-tick on a watch,
       which is the rotation a thumb makes without thinking. */
    var DEG_PER_STEP = 6;

    var wrap = doc.createElement('div');
    wrap.className = 'dial';
    wrap.setAttribute('data-testid', opts.testid || 'dial');

    var svg = el('svg', { viewBox: '0 0 200 200', class: 'dial__face',
      'aria-hidden': 'true' }, doc);

    /* The bezel, drawn once. A dark ring with a hairline inside it, the
       way a steel bezel has a polished edge against a brushed face. */
    var grad = el('radialGradient', { id: 'dialface-' + id, cx: '50%', cy: '38%', r: '72%' }, doc);
    grad.appendChild(el('stop', { offset: '0%', 'stop-color': 'var(--dial-hi, #23252B)' }, doc));
    grad.appendChild(el('stop', { offset: '100%', 'stop-color': 'var(--dial-lo, #101116)' }, doc));
    var defs = el('defs', {}, doc);
    defs.appendChild(grad);
    svg.appendChild(defs);

    svg.appendChild(el('circle', { cx: 100, cy: 100, r: 96, class: 'dial__bezel' }, doc));
    svg.appendChild(el('circle', { cx: 100, cy: 100, r: 84,
      fill: 'url(#dialface-' + id + ')', class: 'dial__plate' }, doc));

    /* THE RING THAT TURNS. Sixty ticks, long every fifth, exactly as a
       watch marks its minutes and its hours. The ring rotates; the marker
       at twelve does not, because on a real bezel the ring is what moves
       under your finger and the reference stays put. */
    var ring = el('g', { class: 'dial__ring' }, doc);
    for (var i = 0; i < 60; i++) {
      var major = i % 5 === 0;
      var a = (i / 60) * Math.PI * 2 - Math.PI / 2;
      var r1 = major ? 68 : 74, r2 = 80;
      ring.appendChild(el('line', {
        x1: (100 + Math.cos(a) * r1).toFixed(2), y1: (100 + Math.sin(a) * r1).toFixed(2),
        x2: (100 + Math.cos(a) * r2).toFixed(2), y2: (100 + Math.sin(a) * r2).toFixed(2),
        class: 'dial__tick' + (major ? ' dial__tick--major' : '')
      }, doc));
    }
    svg.appendChild(ring);

    /* The marker: a single wedge at twelve, in the accent, so where the
       ring has got to is readable at a glance rather than by counting. */
    var mark = el('path', { d: 'M100 8 L106 22 L94 22 Z', class: 'dial__marker' }, doc);
    svg.appendChild(mark);

    wrap.appendChild(svg);

    /* The readout sits in the middle of the face, where a watch puts its
       date. HTML rather than SVG text so it inherits the app's type. */
    var read = doc.createElement('div');
    read.className = 'dial__read';
    var big = doc.createElement('span');
    big.className = 'dial__value num';
    big.setAttribute('data-testid', (opts.testid || 'dial') + '-value');
    var small = doc.createElement('span');
    small.className = 'dial__unit t-caption-1';
    read.appendChild(big);
    read.appendChild(small);
    wrap.appendChild(read);

    /* A dial is a picture to a screen reader, so the real control is a
       slider underneath it, focusable and arrow-keyed. It is not hidden
       from sight to be polite: it is the keyboard's way in. */
    var slider = doc.createElement('input');
    slider.type = 'range';
    slider.className = 'dial__slider';
    slider.setAttribute('data-testid', (opts.testid || 'dial') + '-slider');
    slider.setAttribute('aria-label', opts.label || 'Amount');
    wrap.appendChild(slider);

    host.appendChild(wrap);

    var api = { element: wrap };

    function paint() {
      var turns = (state.value - state.min) / state.step;
      ring.setAttribute('transform',
        'rotate(' + (turns * DEG_PER_STEP).toFixed(2) + ' 100 100)');
      big.textContent = String(state.value);
      small.textContent = state.unit;
      slider.min = String(state.min);
      slider.max = String(state.max);
      slider.step = String(state.step);
      slider.value = String(state.value);
      slider.setAttribute('aria-valuetext', state.value + ' ' + state.unit);
    }

    function set(v, quiet) {
      var next = quantise(v, state.step, state.min, state.max);
      if (next === state.value) return false;
      state.value = next;
      paint();
      if (!quiet && opts.onChange) opts.onChange(next);
      return true;
    }
    api.set = function (v, quiet) {
      var next = quantise(v, state.step, state.min, state.max);
      state.value = next; paint();
      if (!quiet && opts.onChange) opts.onChange(next);
    };
    api.value = function () { return state.value; };
    api.setStep = function (s) {
      state.step = s;
      /* The value is re-quantised to the new step, so switching to a
         finer step does not leave a number the coarse dial can never
         return to. */
      state.value = quantise(state.value, state.step, state.min, state.max);
      paint();
      if (opts.onChange) opts.onChange(state.value);
    };
    api.setUnit = function (u, range) {
      state.unit = u;
      if (range) {
        if (range.min != null) state.min = range.min;
        if (range.max != null) state.max = range.max;
        if (range.step != null) state.step = range.step;
      }
      state.value = quantise(state.value, state.step, state.min, state.max);
      paint();
    };

    /* One haptic per step, never per pixel: a buzz that fires on every
       pointermove is not feedback, it is a vibration. */
    function tick() {
      try {
        if (global.navigator && navigator.vibrate) navigator.vibrate(4);
      } catch (e) {}
    }

    /* ---- turning it -------------------------------------------------

       The angle from the centre to the finger, accumulated. Accumulated
       rather than absolute, because a bezel can be turned past twelve as
       many times as you like and an absolute angle would wrap to zero
       every revolution -- which on a food dial means 200 g snapping back
       to 0 because your thumb crossed the top. */
    var drag = null;
    /* THE CENTRE IS FIXED AT THE MOMENT THE FINGER LANDS, and not looked
       up again until it lifts.

       Reading getBoundingClientRect on every move looks harmless and is
       not: turning the dial updates the figures above it, those figures
       change width and the button under them changes its label, the sheet
       reflows by a few pixels, and the dial moves under a finger that has
       not moved. The next angle is then measured from a different centre,
       which reads as a jump of tens of degrees. Dragged twelve steps in
       the portion sheet, the value went up by 1615 grams instead of 60,
       while the same dial on a page with nothing else on it stepped
       perfectly. A control cannot measure itself against a layout its own
       output is changing. */
    function angleAt(cx, cy, e) {
      return Math.atan2(e.clientY - cy, e.clientX - cx) * 180 / Math.PI;
    }
    svg.addEventListener('pointerdown', function (e) {
      if (e.button != null && e.button !== 0) return;
      e.preventDefault();
      try { svg.setPointerCapture(e.pointerId); } catch (err) {}
      var b = svg.getBoundingClientRect();
      var cx = b.left + b.width / 2, cy = b.top + b.height / 2;
      drag = { cx: cx, cy: cy, last: angleAt(cx, cy, e), acc: 0, from: state.value };
      wrap.setAttribute('data-turning', '');
    });
    svg.addEventListener('pointermove', function (e) {
      if (!drag) return;
      e.preventDefault();
      var a = angleAt(drag.cx, drag.cy, e);
      var d = a - drag.last;
      /* Crossing the -180/180 seam is a small move, not a full turn. */
      if (d > 180) d -= 360;
      if (d < -180) d += 360;
      drag.last = a;
      drag.acc += d;
      var steps = Math.round(drag.acc / DEG_PER_STEP);
      if (set(drag.from + steps * state.step)) tick();
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) {
      svg.addEventListener(ev, function () {
        if (!drag) return;
        drag = null;
        wrap.removeAttribute('data-turning');
      });
    });

    /* A trackpad or a mouse wheel turns it too, one step per notch. */
    svg.addEventListener('wheel', function (e) {
      e.preventDefault();
      if (set(state.value + (e.deltaY > 0 ? -state.step : state.step))) tick();
    }, { passive: false });

    slider.addEventListener('input', function () {
      set(Number(slider.value));
    });

    state.value = quantise(opts.value != null ? opts.value : state.min,
                           state.step, state.min, state.max);
    paint();
    return api;
  }

  global.LKDial = { mount: mount, quantise: quantise };
}(typeof window !== 'undefined' ? window : this));
