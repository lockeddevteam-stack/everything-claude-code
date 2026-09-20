/* LOCKED — DOM reconciler.

   Loaded by every screen in <head>, next to tokens.css and components.css:

       <script src="app.js"> ... close the tag

   No dependencies, no build step, no network. Works from file://.

   WHY THIS FILE EXISTS
   Every screen renders by building an HTML string and assigning it to a
   container. That is a fine way to describe a screen and a terrible way to
   apply one: `el.innerHTML = html` destroys every node in the container and
   builds new ones, so on every state change the caret leaves the input you
   were typing in, focus lands back on <body>, scroll snaps to the top, and
   every CSS entry animation replays on elements that did not change. That is
   the "screen resets and jumps" people report.

   The fix is to keep the string and change what is done with it. LKPatch
   morphs the container's existing children into the shape the new markup
   describes: it matches nodes, updates the ones that stayed, inserts the ones
   that are new, removes the ones that are gone, and leaves everything else —
   identity, focus, caret, scroll, running animations — exactly where it was.

       LKPatch(container, html);      // instead of container.innerHTML = html

   HOW NODES ARE MATCHED
   By a stable key first: data-testid, then id, then data-key. A keyed node
   that is still described by the new markup keeps its identity and is never
   replaced — it is moved at most. Unkeyed nodes fall back to tag name plus
   position among their siblings, which is what the screens' own lists need.

   THE RULE FOR FORM STATE
   `.value`, `.checked` and `.selected` are live state that diverges from the
   markup the moment a person touches the control. So they are written only
   when the DECLARED value changed — when the new markup says something
   different from what the old markup said — never merely because the live
   value differs from the markup. A re-render fired by a keystroke therefore
   cannot move the caret or clear the field, while a state change that really
   does set a new value still lands.

   ANIMATIONS
   A CSS animation restarts when its element is inserted into the document or
   when the declaration under it changes. Surviving nodes are neither removed
   nor reinserted and their class attribute is written only when it actually
   differs, so an entry animation runs on a genuinely new node and stays quiet
   on every node that merely survived a state change.

   SVG
   Several screens draw charts and a body map inline. SVG children are parsed
   in the SVG namespace and matched by localName, so <path> is never confused
   with an HTML element of the same name and nothing lands in the wrong
   namespace.
*/
(function (global) {
  'use strict';

  var SVG_NS = 'http://www.w3.org/2000/svg';
  var XLINK_NS = 'http://www.w3.org/1999/xlink';

  /* Live properties, keyed by the attribute that declares them. Each entry is
     [property name, attribute name]. */
  var VALUE_PROPS = [
    ['value', 'value'],
    ['checked', 'checked'],
    ['selected', 'selected'],
    ['indeterminate', null]
  ];

  /* ---------------------------------------------------------------
     Keys
     --------------------------------------------------------------- */

  function keyOf(node) {
    if (!node || node.nodeType !== 1 || !node.getAttribute) return null;
    var k = node.getAttribute('data-testid');
    if (k) return 't\u0000' + k;
    k = node.getAttribute('id');
    if (k) return 'i\u0000' + k;
    k = node.getAttribute('data-key');
    if (k) return 'k\u0000' + k;
    return null;
  }

  /* A key that survives being written into a selector, for re-finding a node
     that had to be replaced. */
  function keySelector(key) {
    if (!key) return null;
    var kind = key.charAt(0);
    var val = key.slice(2);
    if (kind === 't') return '[data-testid="' + cssEscape(val) + '"]';
    if (kind === 'i') return '[id="' + cssEscape(val) + '"]';
    return '[data-key="' + cssEscape(val) + '"]';
  }

  function cssEscape(s) {
    return String(s).replace(/["\\]/g, '\\$&');
  }

  /* Two nodes can be morphed into one another only if they are the same kind
     of thing in the same namespace. */
  function sameType(a, b) {
    if (!a || !b) return false;
    if (a.nodeType !== b.nodeType) return false;
    if (a.nodeType !== 1) return true;
    return a.localName === b.localName && a.namespaceURI === b.namespaceURI;
  }

  /* ---------------------------------------------------------------
     Parsing, in the container's own namespace and parse context
     --------------------------------------------------------------- */

  function parseChildren(container, html) {
    var doc = container.ownerDocument || document;

    if (container.namespaceURI === SVG_NS) {
      /* innerHTML on an SVG element is unreliable across engines; parse a
         real SVG document and import what is inside its root. */
      var parsed = new DOMParser().parseFromString(
        '<svg xmlns="' + SVG_NS + '" xmlns:xlink="' + XLINK_NS + '">' + html + '</svg>',
        'image/svg+xml'
      );
      var root = parsed.documentElement;
      if (!root || root.getElementsByTagName('parsererror').length ||
          root.localName === 'parsererror') {
        /* Malformed SVG: fall back to the old behaviour rather than blank the
           chart. Loud in the console, visible in the screen. */
        if (global.console && console.error) {
          console.error('LKPatch: could not parse SVG markup; falling back to innerHTML');
        }
        container.innerHTML = html;
        return null;
      }
      var out = [];
      for (var n = root.firstChild; n; n = n.nextSibling) out.push(doc.importNode(n, true));
      return out;
    }

    /* An element of the same tag parses the string under the same rules the
       container itself would use, so <tr>, <td>, <option> and friends survive
       the round trip. A detached clone with no children costs nothing. */
    var host;
    try {
      host = container.cloneNode(false);
      host.innerHTML = html;
    } catch (e) {
      host = doc.createElement('div');
      host.innerHTML = html;
    }
    var list = [];
    for (var m = host.firstChild; m; m = m.nextSibling) list.push(m);
    /* Detach them from the scratch host so insertBefore is a plain move. */
    for (var i = 0; i < list.length; i++) host.removeChild(list[i]);
    return list;
  }

  /* ---------------------------------------------------------------
     Focus and scroll, captured before and restored after
     --------------------------------------------------------------- */

  /* activeElement, following shadow roots, so this works both in a
     standalone screen and inside the assembled demo where every screen
     lives in its own shadow root. */
  function deepActive(node) {
    var root = node.getRootNode ? node.getRootNode() : document;
    var el = root.activeElement || document.activeElement;
    while (el && el.shadowRoot && el.shadowRoot.activeElement) el = el.shadowRoot.activeElement;
    return el;
  }

  /* Everything a person can Tab to, in reading order. */
  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), ' +
    'select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  function focusables(container) {
    return Array.prototype.filter.call(container.querySelectorAll(FOCUSABLE), function (el) {
      return el.offsetWidth || el.offsetHeight || el.getClientRects().length;
    });
  }

  function captureFocus(container) {
    var el = deepActive(container);
    if (!el || el === document.body || !container.contains(el)) return null;
    var snap = { el: el, key: keyOf(el), start: null, end: null, dir: null,
                 /* Where it sat in reading order, for the case where the
                    control removes itself. See restoreFocus. */
                 index: focusables(container).indexOf(el) };
    try {
      if (typeof el.selectionStart === 'number') {
        snap.start = el.selectionStart;
        snap.end = el.selectionEnd;
        snap.dir = el.selectionDirection;
      }
    } catch (e) { /* selectionStart throws on some input types */ }
    return snap;
  }

  function restoreFocus(container, snap) {
    if (!snap) return;
    var now = deepActive(container);
    if (now === snap.el) return;                       /* never moved: done */

    var target = null;
    if (snap.el.isConnected && container.contains(snap.el)) target = snap.el;
    else if (snap.key) {
      var sel = keySelector(snap.key);
      if (sel) target = container.querySelector(sel);
    }
    /* Still there, but no longer focusable. A control that disables itself
       while it works -- Sync going to "Syncing", a permission toggle while
       the answer is written -- keeps its node and its key, so this found it
       and called focus() on a disabled element, which does nothing and
       leaves the reader on <body>. Treat it as gone and fall through. */
    if (target && (target.disabled ||
                   target.getAttribute('aria-disabled') === 'true' ||
                   target.getAttribute('tabindex') === '-1')) {
      /* A control that disabled itself while it works is still WHERE the
         reader is, even though it can no longer hold focus. Jumping to the
         next control in the document threw them 100px down the settings list
         to "Weight unit", permanently. Hold the region the control sits in
         instead -- it usually carries the status line that says what is
         happening -- and let the reader Tab on from there. */
      var region = target.closest(
        '.row, .card, .card__foot, .actionbar, .sheet__foot, .sess, .seg, li') || null;
      target = null;
      if (region && container.contains(region)) {
        try {
          region.setAttribute('data-lk-focus-holder', '');
          if (!region.hasAttribute('tabindex')) region.tabIndex = -1;
          region.focus({ preventScroll: true });
        } catch (e) {}
        return;
      }
    }
    /* The control removed itself. A row's delete button, an accepted
       suggestion, a chip that filtered itself away: there is no node to go
       back to, and focus was landing on <body>, which restarts the next Tab
       at the top of the document. 125 controls across twelve screens did
       this. Whatever took its place in reading order gets the focus instead,
       which is what the platform does and what a person expects: you stay
       where you were, on the next thing down. */
    if (!target && snap.index >= 0) {
      var after = focusables(container);
      if (after.length) target = after[Math.min(snap.index, after.length - 1)];
    }
    /* Nothing left to focus inside the container -- a Retry that replaced the
       screen with a loading skeleton, a rest strip that skipped itself away,
       an overlay layer that is now empty.

       Climb until something can hold the focus: a real control just after
       where the reader was, or failing that the nearest region that still has
       content. Anything is better than <body>, which restarts the next Tab at
       the top of the document; but an emptied overlay layer is nearly as bad,
       which is why this climbs rather than stopping at the container. The
       holder is not a control and does not draw a ring. */
    if (!target) {
      /* The region itself, while it still has something in it. A Retry that
         swapped the screen for a loading skeleton leaves no control but
         plenty of content, and holding focus there keeps the reader where
         they were -- throwing them to the tab bar because that is the next
         focusable in the document would be worse than the bug. */
      var hasContent = function (el) {
        return el && (el.children.length > 0 ||
                      (el.textContent && el.textContent.trim()));
      };
      var holder = container;
      while (holder && !hasContent(holder)) holder = holder.parentElement;
      /* Only an emptied region climbs, and then only to a real control after
         it -- an empty overlay layer is nearly as bad a place to leave focus
         as <body>. */
      if (!holder) {
        var root = container.getRootNode ? container.getRootNode() : document;
        var host = root.body || root;
        var here = host ? focusables(host) : [];
        for (var k = 0; k < here.length; k++) {
          if (!container.contains(here[k]) &&
              (container.compareDocumentPosition(here[k]) & 4)) { target = here[k]; break; }
        }
        if (!target && here.length) target = here[here.length - 1];
      }
      if (!target) {
        try {
          var hold = holder || container;
          hold.setAttribute('data-lk-focus-holder', '');
          if (!hold.hasAttribute('tabindex')) hold.tabIndex = -1;
          hold.focus({ preventScroll: true });
        } catch (e) {}
        return;
      }
    }
    if (typeof target.focus !== 'function') return;

    try { target.focus({ preventScroll: true }); } catch (e) { target.focus(); }
    if (snap.start !== null && typeof target.setSelectionRange === 'function') {
      try { target.setSelectionRange(snap.start, snap.end, snap.dir || 'none'); } catch (e) {}
    }
  }

  /* Every scroller that could be disturbed: the container, anything scrolled
     inside it, and every scrolling ancestor above it (patching a header must
     not move the body underneath). */
  function captureScroll(container) {
    var seen = [];
    var els = [];
    var push = function (el) {
      if (!el || el.nodeType !== 1 || els.indexOf(el) !== -1) return;
      var t = el.scrollTop, l = el.scrollLeft;
      if (!t && !l) return;
      els.push(el);
      seen.push({ el: el, key: keyOf(el), top: t, left: l, inside: container.contains(el) });
    };

    push(container);
    var all = container.querySelectorAll('*');
    for (var i = 0; i < all.length; i++) push(all[i]);

    /* Up and out, through shadow boundaries, so patching a header cannot
       scroll the body it sits above. */
    var up = container.parentNode;
    while (up) {
      if (up.nodeType === 1) { push(up); up = up.parentNode; }
      else if (up.nodeType === 11) { up = up.host || null; }   /* shadow root */
      else { up = up.parentNode || null; }
    }

    push((container.ownerDocument || document).scrollingElement);
    return seen;
  }

  function restoreScroll(container, snaps) {
    for (var i = 0; i < snaps.length; i++) {
      var s = snaps[i];
      var el = s.el;
      if (!el.isConnected) {
        /* Replaced outright — find the node that took its place. */
        if (!s.inside || !s.key) continue;
        var sel = keySelector(s.key);
        el = sel ? container.querySelector(sel) : null;
        if (!el) continue;
      }
      if (el.scrollTop !== s.top) el.scrollTop = s.top;
      if (el.scrollLeft !== s.left) el.scrollLeft = s.left;
    }
  }

  /* ---------------------------------------------------------------
     Attributes and live properties
     --------------------------------------------------------------- */

  /* ATTRIBUTES THE RUNTIME OWNS AND THE MARKUP NEVER WRITES.

     The removal pass above deletes anything the new markup does not
     declare, which is right for state a screen renders and wrong for
     state chrome.js measured. data-from-trigger is the case that hurt:
     chrome.js sets it the frame a sheet lands, and it swaps the entry
     animation from a rise up the full height of the screen to a 24px
     settle under a scale. Every later paint stripped it, the
     animation-name changed back to sheetUp, and the sheet re-ran a
     626px rise -- so choosing a muscle inside the Add Exercise sheet
     threw the whole sheet off the bottom of the screen and slid it
     back, which reads as a page switch rather than a zoom.

     Neither name is written by any screen's markup, so leaving them
     alone cannot strand one: the runtime that set it is the only thing
     that clears it. */
  var RUNTIME_ATTR = { 'data-from-trigger': 1, 'data-grabber': 1 };

  function syncAttributes(oldEl, newEl) {
    var i, a;

    var na = newEl.attributes;
    for (i = 0; i < na.length; i++) {
      a = na[i];
      if (a.namespaceURI) {
        if (oldEl.getAttributeNS(a.namespaceURI, a.localName) !== a.value) {
          oldEl.setAttributeNS(a.namespaceURI, a.name, a.value);
        }
      } else if (oldEl.getAttribute(a.name) !== a.value) {
        /* Written only when it differs: rewriting class with the same string
           would still be a style invalidation, and a changed animation-name
           is exactly what replays an entry animation. */
        oldEl.setAttribute(a.name, a.value);
      }
    }

    var oa = oldEl.attributes;
    for (i = oa.length - 1; i >= 0; i--) {
      a = oa[i];
      if (a.namespaceURI) {
        if (!newEl.hasAttributeNS(a.namespaceURI, a.localName)) {
          oldEl.removeAttributeNS(a.namespaceURI, a.localName);
        }
      } else if (!newEl.hasAttribute(a.name) && !RUNTIME_ATTR[a.name]) {
        oldEl.removeAttribute(a.name);
      }
    }
  }

  /* Live form state. Written only when the markup's own declaration changed,
     so a re-render fired while someone is typing cannot touch the field under
     their caret, and a genuine state change still lands. */
  function syncLiveProps(oldEl, newEl, declaredBefore) {
    var name = oldEl.localName;
    if (name !== 'input' && name !== 'textarea' && name !== 'select' && name !== 'option') return;

    for (var i = 0; i < VALUE_PROPS.length; i++) {
      var prop = VALUE_PROPS[i][0];
      var attrName = VALUE_PROPS[i][1];
      if (!attrName) continue;
      if (!(prop in oldEl)) continue;

      var before = declaredBefore[attrName];
      var after = newEl.hasAttribute(attrName) ? newEl.getAttribute(attrName) : null;
      if (before === after) continue;              /* markup did not change it */

      if (prop === 'value') {
        var next = after === null ? '' : after;
        if (oldEl.value !== next) {
          var caret = null;
          try { caret = typeof oldEl.selectionStart === 'number' ? [oldEl.selectionStart, oldEl.selectionEnd] : null; } catch (e) {}
          oldEl.value = next;
          if (caret && typeof oldEl.setSelectionRange === 'function') {
            var max = next.length;
            try { oldEl.setSelectionRange(Math.min(caret[0], max), Math.min(caret[1], max)); } catch (e) {}
          }
        }
      } else {
        var on = after !== null;
        if (oldEl[prop] !== on) oldEl[prop] = on;
      }
    }
  }

  /* ---------------------------------------------------------------
     Morph
     --------------------------------------------------------------- */

  function morph(oldNode, newNode) {
    if (oldNode.nodeType !== 1) {
      /* Text and comments: written only when the data actually differs, so a
         re-render does not churn text nodes people may be selecting. */
      if (oldNode.nodeValue !== newNode.nodeValue) oldNode.nodeValue = newNode.nodeValue;
      return oldNode;
    }

    /* Read what the OLD markup declared before the attributes are overwritten;
       syncLiveProps compares declaration to declaration, not to live state. */
    var declaredBefore = {
      value: oldNode.hasAttribute('value') ? oldNode.getAttribute('value') : null,
      checked: oldNode.hasAttribute('checked') ? oldNode.getAttribute('checked') : null,
      selected: oldNode.hasAttribute('selected') ? oldNode.getAttribute('selected') : null
    };

    syncAttributes(oldNode, newNode);
    syncLiveProps(oldNode, newNode, declaredBefore);

    /* <textarea>'s children are its default value; morphing them normally is
       correct and leaves a dirty (typed-in) textarea alone, which is what the
       browser does with defaultValue. */
    patchChildren(oldNode, childArray(newNode));
    return oldNode;
  }

  function childArray(node) {
    var out = [];
    for (var n = node.firstChild; n; n = n.nextSibling) out.push(n);
    return out;
  }

  function patchChildren(parent, incoming) {
    if (!incoming) return;

    /* Every keyed child that is already here, so a keyed node is found even if
       it moved a long way. */
    var keyed = null;
    var n, k;
    for (n = parent.firstChild; n; n = n.nextSibling) {
      k = keyOf(n);
      if (!k) continue;
      if (!keyed) keyed = Object.create(null);
      if (!(k in keyed)) keyed[k] = n;
    }

    var used = typeof Set === 'function' ? new Set() : null;
    var usedList = used ? null : [];
    var isUsed = function (node) { return used ? used.has(node) : usedList.indexOf(node) !== -1; };
    var markUsed = function (node) { if (used) used.add(node); else usedList.push(node); };

    var cursor = parent.firstChild;

    for (var i = 0; i < incoming.length; i++) {
      var nc = incoming[i];
      var nk = keyOf(nc);
      var match = null;

      /* 1. by key — identity wins over position, always */
      if (nk && keyed && keyed[nk] && !isUsed(keyed[nk]) && sameType(keyed[nk], nc)) {
        match = keyed[nk];
      }

      /* 2. by position, but never by stealing a node that carries a different
            key: that node belongs to whichever new child claims its key. */
      if (!match) {
        while (cursor && isUsed(cursor)) cursor = cursor.nextSibling;
        if (cursor && sameType(cursor, nc)) {
          var ck = keyOf(cursor);
          if (!ck || ck === nk) match = cursor;
        }
      }

      if (match) {
        morph(match, nc);
      } else {
        /* Genuinely new. Inserted once, so its entry animation runs once. */
        match = nc;
      }

      markUsed(match);

      if (match === cursor) {
        cursor = cursor.nextSibling;
      } else {
        /* A move is a remove-and-insert as far as CSS animations are
           concerned, so it happens only when the order genuinely changed. */
        parent.insertBefore(match, cursor);
      }
    }

    /* Whatever the new markup no longer describes. */
    var stale = [];
    for (n = parent.firstChild; n; n = n.nextSibling) if (!isUsed(n)) stale.push(n);
    for (var j = 0; j < stale.length; j++) parent.removeChild(stale[j]);
  }

  /* ---------------------------------------------------------------
     Public entry point
     --------------------------------------------------------------- */

  /* Morph `container`'s children into `html`, in place.
     Returns the container, so it reads like the assignment it replaces. */
  function patch(container, html) {
    if (!container) return container;
    if (html == null) html = '';

    /* Empty is a fast path, and still the honest one: everything really is
       gone, so everything really is removed. */
    if (html === '' && !container.firstChild) return container;

    var focusSnap = captureFocus(container);
    var scrollSnaps = captureScroll(container);

    if (html === '') {
      while (container.firstChild) container.removeChild(container.firstChild);
    } else {
      var incoming = parseChildren(container, String(html));
      if (incoming === null) return container;   /* parse failed, already handled */
      patchChildren(container, incoming);
    }

    restoreScroll(container, scrollSnaps);
    restoreFocus(container, focusSnap);
    return container;
  }

  patch.version = '1.0.0';
  patch.keyOf = keyOf;

  global.LKPatch = patch;

  /* ---- KEEPING THE CARET WHERE THE TYPIST LEFT IT --------------------

     A field that drives what is under it repaints the screen as it is
     typed, and a repaint replaces the field. Every one of these screens
     put the caret back afterwards by sending it to the end of the value,
     which is right for the first character and wrong for every edit
     after that: go back and correct the middle of "eggs and toast" and
     each keystroke is teleported to the end, so the sentence comes out
     scrambled and the person has to start again.

     Held and restored by index instead. Clamped to the value's length,
     because a repaint may reformat what is in the field, and quiet on
     the input types that refuse a selection at all. */
  global.LKCaret = {
    hold: function (el) {
      if (!el) return null;
      var s = null, e = null;
      try { s = el.selectionStart; e = el.selectionEnd; } catch (err) {}
      /* THE ROOT THE FIELD IS ACTUALLY IN. Every screen in the assembled
         build lives in a shadow root of its own, and document.getElementById
         does not look inside one: held against the document, the field came
         back null and the caret was left wherever the repaint put it, which
         is the end. A shadow root answers getElementById itself. */
      var root = el.getRootNode ? el.getRootNode() : null;
      if (!root || typeof root.getElementById !== 'function') root = el.ownerDocument || document;
      return { id: el.id, s: s, e: e, doc: root };
    },
    restore: function (h) {
      if (!h || !h.id) return null;
      var doc = h.doc || document;
      var el = doc.getElementById ? doc.getElementById(h.id) : null;
      if (!el) return null;
      try { el.focus({ preventScroll: true }); } catch (err) { try { el.focus(); } catch (e2) {} }
      if (h.s == null) return el;
      try {
        var max = el.value == null ? 0 : String(el.value).length;
        var a = Math.min(h.s, max);
        var b = Math.min(h.e == null ? h.s : h.e, max);
        el.setSelectionRange(a, b);
      } catch (err2) {}
      return el;
    }
  };
  if (!global.LK) global.LK = {};
  global.LK.patch = patch;
})(typeof window !== 'undefined' ? window : this);

/* LOCKED — the spring a gesture hands off to.

   The sampled linear() curves in tokens.css cover everything with a known
   start and end, and they run on the compositor, so they are the right tool
   almost always. What they cannot do is start at the velocity a finger left
   behind. A drag released at 800px/s that finishes on a fixed curve decelerates
   like a web page, and that single detail is the most obvious tell that
   something is not native.

   So this is the other half: a real spring, integrated per frame, seeded with
   the gesture's own velocity.

       var s = LKSpring.to(el, 'x', { from: 120, to: 0, velocity: -800 });
       s.stop();                       // interruptible, always

   Interruption matters as much as the physics. A spring that must finish
   before it will accept a new target is a spring a person can out-run. Calling
   `to` again on the same element and property retakes the current position and
   velocity mid-flight, which is what makes a list feel like it is being handled
   rather than played back.
*/
(function (global) {
  'use strict';

  /* Apple's own parameters, from duration and bounce. Same maths as the
     generator that produced the linear() curves, so a gesture that hands off
     mid-flight matches the curve it is replacing. */
  function params(duration, bounce) {
    var stiffness = Math.pow((2 * Math.PI) / duration, 2);
    var damping = bounce >= 0
      ? ((1 - bounce) * 4 * Math.PI) / duration
      : (4 * Math.PI) / (duration * (1 + bounce));
    return { stiffness: stiffness, damping: damping, mass: 1 };
  }

  var PRESETS = {
    smooth: params(0.5, 0),
    snappy: params(0.5, 0.15),
    bouncy: params(0.5, 0.3),
    /* Response 0.15 and damping 0.86, the interactive pair: short response
       because a drag that lags the thumb is instantly wrong. */
    interactive: (function () {
      var response = 0.15, zeta = 0.86;
      var wn = (2 * Math.PI) / response;
      return { stiffness: wn * wn, damping: 2 * zeta * wn, mass: 1 };
    })()
  };

  var running = [];
  var frame = null;

  /* Settling is judged on both position and velocity. A spring that has
     arrived but is still moving will leave again, and stopping it there is
     what produces a visible snap. */
  var EPS_X = 0.05, EPS_V = 0.05;

  function tick(now) {
    frame = null;
    var i, s, dt;
    for (i = running.length - 1; i >= 0; i--) {
      s = running[i];
      dt = Math.min((now - s.last) / 1000, 1 / 30);   /* a long frame must not explode the integrator */
      s.last = now;

      /* Semi-implicit Euler, substepped. Stiff springs need small steps;
         one step per frame at 158 N/m visibly overshoots. */
      var steps = Math.max(1, Math.ceil(dt / (1 / 240)));
      var h = dt / steps;
      for (var k = 0; k < steps; k++) {
        var a = (-s.p.stiffness * (s.x - s.to) - s.p.damping * s.v) / s.p.mass;
        s.v += a * h;
        s.x += s.v * h;
      }

      s.apply(s.x, s.v);

      if (Math.abs(s.x - s.to) < EPS_X && Math.abs(s.v) < EPS_V) {
        s.x = s.to;
        s.apply(s.x, 0);
        running.splice(i, 1);
        if (s.onDone) s.onDone();
      }
    }
    if (running.length) frame = requestAnimationFrame(tick);
  }

  function schedule() {
    if (frame == null) frame = requestAnimationFrame(function (t) { tick(t); });
  }

  function find(el, key) {
    for (var i = 0; i < running.length; i++) {
      if (running[i].el === el && running[i].key === key) return i;
    }
    return -1;
  }

  /* Reduced motion asks for no spring at all: the value is placed, not
     travelled to. The API is unchanged so no caller has to branch. */
  function reduced() {
    return global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function to(el, key, opts) {
    opts = opts || {};
    var preset = PRESETS[opts.preset || 'snappy'] || PRESETS.snappy;
    var target = opts.to || 0;
    var apply = opts.apply || function (v) {
      el.style.transform = 'translate3d(' + (key === 'y' ? '0,' + v + 'px,0' : v + 'px,0,0') + ')';
    };

    var existing = find(el, key);
    var startX = opts.from, startV = opts.velocity || 0;
    if (existing >= 0) {
      /* Retake the flight rather than restart it. */
      if (startX == null) startX = running[existing].x;
      if (!opts.velocity) startV = running[existing].v;
      running.splice(existing, 1);
    }
    if (startX == null) startX = target;

    if (reduced()) {
      apply(target, 0);
      if (opts.onDone) opts.onDone();
      return { stop: function () {} };
    }

    var s = {
      el: el, key: key, x: startX, v: startV, to: target,
      p: preset, apply: apply, onDone: opts.onDone,
      last: (global.performance || Date).now()
    };
    running.push(s);
    schedule();
    return {
      stop: function () {
        var i = find(el, key);
        if (i >= 0) running.splice(i, 1);
      },
      get value() { return s.x; },
      get velocity() { return s.v; }
    };
  }

  /* iOS rubber-banding. A hard stop at the end of a list is the other tell.
     c = 0.55, from the spec. */
  function rubberBand(offset, dimension, c) {
    c = c || 0.55;
    if (!dimension) return 0;
    var sign = offset < 0 ? -1 : 1;
    var o = Math.abs(offset);
    return sign * (1 - (1 / ((o * c / dimension) + 1))) * dimension;
  }

  global.LKSpring = { to: to, rubberBand: rubberBand, presets: PRESETS };
})(typeof window !== 'undefined' ? window : this);

/* ===================================================================
   LEAVING A SCREEN, FROM CODE RATHER THAN FROM A TAP.

   The demo shell intercepts CLICKS on declared crossings, so a button
   that navigates never reaches its own handler and the router moves the
   route instead. Anything that navigates without a click escapes that:
   sign-in finishes asynchronously and then ran
   `location.href = 'home.html'`, which in the single-file build is a
   real navigation to a file that is not there. The host answered 404 and
   the app was gone -- immediately after signing in, which is the worst
   possible moment.

   LKGo asks the shell first and only falls back to the file when there
   is no shell, which is how the standalone screens still work when
   opened straight from disk.
   =================================================================== */
(function (g) {
  g.LKGo = function (id) {
    if (!id) return;
    var D = g.DEMO;
    if (D && D.screens && D.screens[id]) {
      try {
        var rec = D.screens[id];
        if (rec.tab && typeof D.go === 'function') { D.go(rec.tab); return; }
        if (typeof D.push === 'function') { D.push(id); return; }
      } catch (e) { /* fall through to the file */ }
    }
    try { g.location.href = id + '.html'; } catch (e) {}
  };
}(typeof window !== 'undefined' ? window : this));

/* ===================================================================
   THE LAST TIME YOU DID THIS LIFT, out of the history on the device.

   This existed only on LKFixtures, and the product build deliberately
   ships no fixtures -- so on every real account LKFixtures.lastTime was
   undefined and every caller took its "no earlier session" branch. Silently,
   and everywhere it mattered:

     - the number pad opened at 0 with no "last session" hint, on a lift
       logged four times
     - every set row rendered ---- instead of the load to beat
     - the exercise info sheet said "No earlier session with this lift"
       about a lift in four of your sessions
     - Suggest proposed 22.5 kg to somebody whose top set is 80
     - Review's comparison fell through to a hardcoded demo constant and
       printed a session that does not exist

   One implementation, reading lk_history, with the fixture's exact
   contract so the demo behaves as it always did. History is newest first,
   which is the order every screen already writes and reads it in.
   =================================================================== */
(function (g) {
  function history() {
    if (g.LKStore) {
      var h = g.LKStore.get('lk_history', null);
      if (Array.isArray(h)) return h;
    }
    if (g.LKFixtures && Array.isArray(g.LKFixtures.history)) return g.LKFixtures.history;
    return [];
  }

  g.LKHistory = {
    /* The most recent lift session BEFORE `before` that contains exId.
       Same shape the fixture returned: { date, exercise }. */
    lastTime: function (exId, before) {
      var h = history();
      for (var i = 0; i < h.length; i++) {
        var w = h[i];
        if (!w || w.kind !== 'lift' || !Array.isArray(w.exercises)) continue;
        if (before && String(w.date) >= String(before)) continue;
        for (var j = 0; j < w.exercises.length; j++) {
          var ex = w.exercises[j];
          if (ex && ex.id === exId && Array.isArray(ex.sets)) {
            return { date: w.date, exercise: ex };
          }
        }
      }
      return null;
    },

    /* Working volume and top set of one exercise as it was logged.
       Warm-ups excluded, which is what every other count in the app does. */
    /* BOTH SIDES OF A SET TRACKED LEFT AND RIGHT. It used to arrive as two
       rows and was counted twice over; on one row the right side is
       `repsR` under the same weight, and a sum that ignored it would report
       half the work for every unilateral lift. `kgR` is only ever present
       on a set folded out of the two-row shape whose halves carried
       different weights. The top set is judged on the better arm, which is
       the figure the record was claimed on. */
    liftStats: function (ex) {
      var vol = 0, top = null;
      if (!ex || !Array.isArray(ex.sets)) return { vol: 0, top: null };
      ex.sets.forEach(function (st) {
        if (!st || !st.done || st.warm || st.kg == null || st.reps == null) return;
        vol += st.kg * st.reps;
        if (st.repsR) vol += (st.kgR != null ? st.kgR : st.kg) * st.repsR;
        var r = st.repsR != null ? Math.max(st.reps, st.repsR) : st.reps;
        if (!top || st.kg > top[0] || (st.kg === top[0] && r > top[1])) top = [st.kg, r];
      });
      return { vol: Math.round(vol), top: top };
    },

    /* EVERY SESSION NEEDS AN ID, NOT JUST THE ONES REVIEW HAS SEEN.
       Sessions written before ids existed, and every session a v6 phone
       brings across, carry none. Train builds its row testid out of one,
       so a history full of unstamped sessions rendered a list of buttons
       all called `history-undefined` -- indistinguishable to anything
       addressing them, and the same string for every row.

       Review stamped them, but only on the way past, so a reader who
       never opened Review never got ids at all. Stamping belongs where
       history is read, which is here. The id is built from the session's
       own date, so the same session gets the same id on every device
       rather than a fresh random one per phone. */
    withIds: function (list) {
      var out = Array.isArray(list) ? list : [];
      var seen = {}, stamped = 0;
      out.forEach(function (w, i) {
        if (!w) return;
        if (w.id) { seen[w.id] = true; return; }
        var t = Date.parse(String(w.date || ''));
        var base = 'w_' + (isNaN(t) ? 'x' : t);
        var id = base + '_' + i;
        /* Two sessions on one date, imported in the same order on two
           phones, must not collide into one id. */
        var k = 0;
        while (seen[id]) { k++; id = base + '_' + i + '_' + k; }
        seen[id] = true;
        w.id = id;
        stamped++;
      });
      return { list: out, stamped: stamped };
    },

    /* The stored list with ids, written back when any were missing so the
       stamping happens once rather than on every paint. */
    all: function () {
      var h = history();
      var r = this.withIds(h);
      if (r.stamped && g.LKStore) {
        try { g.LKStore.set('lk_history', r.list); } catch (e) {}
      }
      return r.list;
    }
  };
}(typeof window !== 'undefined' ? window : this));

/* ONE SET IS NOT "1 SETS". Counts were concatenated with a hard-coded
   plural all over the build, so a first session read "1 working sets",
   a one-day split read "1 days", the log's own toast said "1 sets this
   session" beside a header that correctly said "1 working set", and a
   new account's profile read "1 lift · 1 records". Every one of those is
   the first thing a new reader sees, which is the worst place for it. */
(function (g) {
  g.LKPlural = function (count, one, many) {
    var n = Number(count);
    return (n === 1 || n === -1) ? one : (many || (one + 's'));
  };
  /* "3 sets", "1 set" -- the count and its noun together, which is how
     nearly every call site wants it. */
  g.LKCount = function (count, one, many) {
    return count + ' ' + g.LKPlural(count, one, many);
  };
}(typeof window !== 'undefined' ? window : this));

/* A REST TIMER THAT KEEPS TIME WITH THE APP SHUT.
   It used to be a counter decremented once a second by an interval, which
   is only true while the tab is awake. Lock the phone for two minutes of a
   ninety-second rest and you came back to a strip still reading 1:12 and
   still counting -- the one moment the number has to be right is the moment
   you pick the phone back up.

   So the rest is a deadline, not a countdown. What is stored is when it
   ends; what is shown is that minus now. Nothing is lost to a reload, a
   locked screen, a switched app or a killed tab, because none of those can
   change a timestamp. The session clock has worked this way since it was
   written; this brings the rest in line with it.

   The alert is a separate question. A closed PWA runs no JavaScript at all,
   so the strip cannot buzz on its own -- but a service worker outlives the
   page for a while, so the deadline is handed to it when the rest starts
   and it posts the notification. If the worker has been shut down too, the
   catch-up below fires on the next open instead. That is the honest limit:
   the CLOCK is always right, the ALERT is best-effort. */
(function (g) {
  var KEY = 'lk_rest';

  function read() {
    var raw = null;
    try {
      raw = g.LKStore ? g.LKStore.get(KEY, null)
                      : JSON.parse(g.localStorage.getItem(KEY) || 'null');
    } catch (e) { raw = null; }
    if (!raw || typeof raw !== 'object' || !raw.endsAt) return null;
    return raw;
  }

  function write(v) {
    try {
      if (v === null) {
        if (g.LKStore) g.LKStore.remove(KEY); else g.localStorage.removeItem(KEY);
      } else if (g.LKStore) g.LKStore.set(KEY, v);
      else g.localStorage.setItem(KEY, JSON.stringify(v));
    } catch (e) {}
  }

  /* The worker is told the deadline rather than a duration, for the same
     reason the page stores one: a duration handed over at the wrong moment
     is wrong by however long the handover took. */
  function tellWorker(msg) {
    try {
      var sw = g.navigator && g.navigator.serviceWorker;
      if (!sw) return;
      if (sw.controller) { sw.controller.postMessage(msg); return; }
      sw.ready.then(function (reg) {
        if (reg && reg.active) reg.active.postMessage(msg);
      }).catch(function () {});
    } catch (e) {}
  }

  g.LKRest = {
    /* Starts, or restarts, a rest of `secs` seconds. `label` is what the
       notification says it was for, when there is one. */
    start: function (secs, label) {
      var n = Math.max(0, Math.round(Number(secs) || 0));
      if (!n) { this.stop(); return 0; }
      var endsAt = Date.now() + n * 1000;
      write({ endsAt: endsAt, secs: n, label: label || '', fired: false });
      tellWorker({ type: 'lk-rest-arm', endsAt: endsAt, label: label || '' });
      return n;
    },

    /* +30s moves the deadline, so the extension survives the same locked
       screen the rest does. */
    add: function (secs) {
      var r = read();
      if (!r) return 0;
      r.endsAt += Math.round(Number(secs) || 0) * 1000;
      r.fired = false;
      write(r);
      tellWorker({ type: 'lk-rest-arm', endsAt: r.endsAt, label: r.label || '' });
      return this.left();
    },

    /* Keeps the deadline where it is but changes what a fresh rest will be,
       used by the length picker while one is already running. */
    setTo: function (secs) {
      var r = read();
      if (!r) return 0;
      return this.start(secs, r.label);
    },

    stop: function () {
      write(null);
      tellWorker({ type: 'lk-rest-cancel' });
    },

    running: function () {
      var r = read();
      return !!(r && r.endsAt > Date.now());
    },

    left: function () {
      var r = read();
      if (!r) return 0;
      return Math.max(0, Math.ceil((r.endsAt - Date.now()) / 1000));
    },

    endsAt: function () {
      var r = read();
      return r ? r.endsAt : 0;
    },

    /* True once, the first time anyone asks after the deadline has passed.
       This is the catch-up: a rest that ran out while the app was shut is
       still announced when the app comes back, rather than the strip simply
       being gone and nothing ever saying so. */
    justEnded: function () {
      var r = read();
      if (!r || r.fired || r.endsAt > Date.now()) return false;
      r.fired = true;
      write(r);
      return true;
    },

    /* Cleared with the workout it belonged to. */
    clear: function () { this.stop(); }
  };
}(typeof window !== 'undefined' ? window : this));
