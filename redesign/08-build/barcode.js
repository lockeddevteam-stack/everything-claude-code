/* LKBarcode — a real EAN-13, EAN-8 and UPC-A decoder.

   The scan sheet used to say reading a barcode "needs a decoder this
   build does not carry". A decoder is about two hundred lines and the
   format has not changed since 1973, so it carries one now.

   BarcodeDetector is used where the browser has it: it is the platform's
   own decoder, it reads more symbologies, and it runs off the main
   thread. Safari does not have it, and Safari is the browser this app is
   installed from, so the decoder below is the one that will actually run
   on the phone in your hand.

   HOW A BARCODE IS READ. A scanline across the bars is a run of dark and
   light lengths. EAN-13 is 95 modules: a three-module guard, six digits
   of seven modules, a five-module centre guard, six more digits, and a
   closing guard. Each digit is four runs summing to seven, and which of
   three tables a digit matches encodes, between them, the thirteenth
   digit that is not drawn as bars at all.

   Nothing here trusts a single read. Every candidate is checked against
   the format's own checksum before it is returned, so a misread is a
   miss rather than the wrong food. */
(function (g) {
  'use strict';

  /* Run lengths, in modules, for the ten digits on the left in odd
     parity. The right-hand digits use the same widths; the even-parity
     left digits are these reversed. Four runs, seven modules. */
  var L = [
    [3, 2, 1, 1], [2, 2, 2, 1], [2, 1, 2, 2], [1, 4, 1, 1], [1, 1, 3, 2],
    [1, 2, 3, 1], [1, 1, 1, 4], [1, 3, 1, 2], [1, 2, 1, 3], [3, 1, 1, 2]
  ];
  var G = L.map(function (p) { return p.slice().reverse(); });

  /* Which digits on the left were drawn in even parity spells out the
     first digit, which has no bars of its own. */
  var FIRST = [0x00, 0x0B, 0x0D, 0x0E, 0x13, 0x19, 0x1C, 0x15, 0x16, 0x1A];

  function checkEAN13(d) {
    var sum = 0;
    for (var i = 0; i < 12; i++) sum += d[i] * (i % 2 === 0 ? 1 : 3);
    return (10 - (sum % 10)) % 10 === d[12];
  }

  function checkEAN8(d) {
    var sum = 0;
    for (var i = 0; i < 7; i++) sum += d[i] * (i % 2 === 0 ? 3 : 1);
    return (10 - (sum % 10)) % 10 === d[7];
  }

  /* A row of grey values becomes alternating dark and light lengths.
     The threshold is the midpoint of that row rather than a fixed
     number, because a barcode under a kitchen light and one under a
     phone torch are not the same shade of black anywhere. */
  function runsOf(row) {
    var min = 255, max = 0, i;
    for (i = 0; i < row.length; i++) {
      if (row[i] < min) min = row[i];
      if (row[i] > max) max = row[i];
    }
    /* Too flat to be bars. A wall, a tablecloth, the inside of a pocket. */
    if (max - min < 40) return null;
    var mid = (min + max) / 2;
    var out = [];
    var dark = row[0] < mid, len = 0;
    for (i = 0; i < row.length; i++) {
      var d = row[i] < mid;
      if (d === dark) { len++; continue; }
      out.push({ dark: dark, len: len });
      dark = d; len = 1;
    }
    out.push({ dark: dark, len: len });
    return out;
  }

  /* How badly four runs fit a pattern, in modules. Returns a big number
     rather than throwing, so the caller can simply take the best fit and
     reject it if nothing fits well. */
  function fit(runs, at, pattern) {
    var total = 0, i;
    for (i = 0; i < 4; i++) total += runs[at + i].len;
    if (total <= 0) return 1e9;
    var unit = total / 7;
    /* A digit thinner than a couple of pixels a module is noise being
       read as data. */
    if (unit < 0.6) return 1e9;
    var err = 0;
    for (i = 0; i < 4; i++) {
      err += Math.abs(runs[at + i].len / unit - pattern[i]);
    }
    return err;
  }

  function bestDigit(runs, at, tables) {
    var best = -1, bestErr = 0.9, bestTable = -1;
    for (var t = 0; t < tables.length; t++) {
      for (var d = 0; d < 10; d++) {
        var e = fit(runs, at, tables[t][d]);
        if (e < bestErr) { bestErr = e; best = d; bestTable = t; }
      }
    }
    return best < 0 ? null : { digit: best, table: bestTable };
  }

  /* Three runs of one module each: dark, light, dark. */
  function guardAt(runs, at, want) {
    if (at + want > runs.length) return 0;
    if (!runs[at].dark) return 0;
    var total = 0, i;
    for (i = 0; i < want; i++) total += runs[at + i].len;
    var unit = total / want;
    if (unit < 0.6) return 0;
    for (i = 0; i < want; i++) {
      if (Math.abs(runs[at + i].len / unit - 1) > 0.7) return 0;
    }
    return unit;
  }

  /* The centre guard is five runs of one module, light at both ends. */
  function centreAt(runs, at) {
    if (at + 5 > runs.length) return false;
    if (runs[at].dark) return false;
    var total = 0, i;
    for (i = 0; i < 5; i++) total += runs[at + i].len;
    var unit = total / 5;
    if (unit < 0.6) return false;
    for (i = 0; i < 5; i++) {
      if (Math.abs(runs[at + i].len / unit - 1) > 0.8) return false;
    }
    return true;
  }

  function decodeFrom(runs, at) {
    if (!guardAt(runs, at, 3)) return null;
    var i = at + 3;
    var left = [], parity = 0, got;
    for (var k = 0; k < 6; k++) {
      got = bestDigit(runs, i, [L, G]);
      if (!got) return null;
      left.push(got.digit);
      if (got.table === 1) parity |= (1 << (5 - k));
      i += 4;
    }
    if (!centreAt(runs, i)) return null;
    i += 5;
    var right = [];
    for (k = 0; k < 6; k++) {
      got = bestDigit(runs, i, [L]);
      if (!got) return null;
      right.push(got.digit);
      i += 4;
    }
    if (!guardAt(runs, i, 3)) return null;
    var first = FIRST.indexOf(parity);
    if (first < 0) return null;
    var digits = [first].concat(left, right);
    if (!checkEAN13(digits)) return null;
    return digits.join('');
  }

  function decode8(runs, at) {
    if (!guardAt(runs, at, 3)) return null;
    var i = at + 3, k, got;
    var left = [];
    for (k = 0; k < 4; k++) {
      got = bestDigit(runs, i, [L]);
      if (!got) return null;
      left.push(got.digit);
      i += 4;
    }
    if (!centreAt(runs, i)) return null;
    i += 5;
    var right = [];
    for (k = 0; k < 4; k++) {
      got = bestDigit(runs, i, [L]);
      if (!got) return null;
      right.push(got.digit);
      i += 4;
    }
    if (!guardAt(runs, i, 3)) return null;
    var digits = left.concat(right);
    if (!checkEAN8(digits)) return null;
    return digits.join('');
  }

  /* One scanline, read from both ends. A barcode held upside down is
     the same barcode, and a phone does not tell you which way up it is. */
  function decodeRow(row) {
    var runs = runsOf(row);
    if (!runs || runs.length < 20) return null;
    var tries = [runs, runs.slice().reverse()];
    for (var t = 0; t < tries.length; t++) {
      var r = tries[t];
      for (var at = 0; at + 30 < r.length; at++) {
        if (!r[at].dark) continue;
        /* Both lengths tried from the same start. EAN-8 used to be
           reached only after the 13-digit attempt had read six digits
           and failed to find a centre guard -- but an 8 has four digits
           a side, so the sixth "digit" lands in the guard and the
           attempt gives up before it can hand over. They are separate
           formats and they are tried separately. */
        var code = decodeFrom(r, at) || decode8(r, at);
        if (code) return code;
      }
    }
    return null;
  }

  /* SEVERAL LINES, NOT ONE. A barcode is read across whichever line
     happens to cross all the bars cleanly: a finger, a crease in the
     label or a highlight from the flash ruins one line and leaves the
     next one perfect. Lines are tried from the middle outwards, because
     the middle is where somebody points the phone. */
  function fromImageData(img) {
    var w = img.width, h = img.height, data = img.data;
    var lines = Math.min(24, h);
    var order = [];
    for (var i = 0; i < lines; i++) {
      var frac = (i + 0.5) / lines;
      order.push({ y: Math.floor(frac * h), d: Math.abs(frac - 0.5) });
    }
    order.sort(function (a, b) { return a.d - b.d; });
    var row = new Uint8Array(w);
    for (i = 0; i < order.length; i++) {
      var y = order[i].y, base = y * w * 4;
      for (var x = 0; x < w; x++) {
        var p = base + x * 4;
        /* Luma. Green carries most of the perceived brightness and a
           barcode is grey anyway, so this is a shortcut with no cost. */
        row[x] = (data[p] * 299 + data[p + 1] * 587 + data[p + 2] * 114) / 1000;
      }
      var code = decodeRow(row);
      if (code) return code;
    }
    return null;
  }

  var detector = null;
  var detectorTried = false;

  function nativeDetector() {
    if (detectorTried) return detector;
    detectorTried = true;
    try {
      if (typeof g.BarcodeDetector === 'function') {
        detector = new g.BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128']
        });
      }
    } catch (e) { detector = null; }
    return detector;
  }

  /* A canvas in, a code or null out. The platform decoder is asked
     first and this one answers when there is none, which on an iPhone
     is always. */
  function read(canvas) {
    var det = nativeDetector();
    if (det && det.detect) {
      return det.detect(canvas).then(function (found) {
        if (found && found.length && found[0].rawValue) return found[0].rawValue;
        return readHere(canvas);
      }, function () { return readHere(canvas); });
    }
    return Promise.resolve(readHere(canvas));
  }

  function readHere(canvas) {
    try {
      var ctx = canvas.getContext('2d', { willReadFrequently: true });
      return fromImageData(ctx.getImageData(0, 0, canvas.width, canvas.height));
    } catch (e) { return null; }
  }

  g.LKBarcode = {
    read: read,
    fromImageData: fromImageData,
    decodeRow: decodeRow,
    checkEAN13: checkEAN13,
    checkEAN8: checkEAN8,
    native: function () { return !!nativeDetector(); }
  };
})(typeof window !== 'undefined' ? window : globalThis);
