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

  function captureFocus(container) {
    var el = deepActive(container);
    if (!el || el === document.body || !container.contains(el)) return null;
    var snap = { el: el, key: keyOf(el), start: null, end: null, dir: null };
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
    if (!target || typeof target.focus !== 'function') return;

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
      } else if (!newEl.hasAttribute(a.name)) {
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
  if (!global.LK) global.LK = {};
  global.LK.patch = patch;
})(typeof window !== 'undefined' ? window : this);
