/* LOCKED — theme initialiser.

   One file, loaded by every screen in <head> before any stylesheet-
   dependent paint, so the stored appearance is on the root element the
   first time the page is painted and there is no flash of the wrong
   theme. Nothing here touches the DOM beyond the root attribute, so it
   runs safely before <body> exists.

   THREE VALUES, stored in localStorage under lk_theme:
     "dark"    the demo's primary theme, and the default
     "light"   the contrast-checked light palette
     "system"  Match device. The attribute is REMOVED, and the
               prefers-color-scheme rule in tokens.css decides.

   Why the attribute is removed rather than resolved to dark or light:
   the CSS is then the single source of truth for what "match device"
   means, the page keeps following the device if the user changes it
   mid-session with no listener needed, and a screen still themes
   correctly if this script never runs.

   localStorage can throw (private mode, a file:// origin with site data
   blocked). Every access is guarded and the failure mode is the default
   theme, never a broken screen. */
(function () {
  'use strict';

  var KEY = 'lk_theme';
  var VALUES = { dark: 1, light: 1, system: 1 };
  var DEFAULT = 'dark';
  var root = document.documentElement;

  function read() {
    var v;
    try { v = window.localStorage.getItem(KEY); } catch (e) { v = null; }
    return VALUES[v] ? v : DEFAULT;
  }

  function paint(pref) {
    if (pref === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', pref);
  }

  paint(read());

  /* The one API the screens use. Settings writes through set(); every
     other screen only ever reads what Settings stored. */
  window.LKTheme = {
    key: KEY,
    get: read,
    set: function (pref) {
      if (!VALUES[pref]) pref = DEFAULT;
      try { window.localStorage.setItem(KEY, pref); } catch (e) {}
      paint(pref);
      return pref;
    },
    /* "Dark" / "Light" / "Match device", for a row that shows its value. */
    label: function (pref) {
      return pref === 'system' ? 'Match device' : pref === 'light' ? 'Light' : 'Dark';
    }
  };

  /* A second tab, or the same screen reopened behind this one, changing
     the preference. Cheap, and it keeps two open demo screens agreeing. */
  window.addEventListener('storage', function (e) {
    if (e.key === KEY) paint(read());
  });
})();
