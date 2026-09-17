/* LKCam — the live camera, shared by the scanner and the plate reader.

   Both used to be a grey square with a file input behind it. A file
   input opens the system camera, takes you out of the app, and comes
   back with a picture: fine for a photo, useless for a scanner, which
   has to look at many frames a second to find a barcode at all.

   getUserMedia gives the page the frames directly. The same stream then
   serves both jobs: the scanner reads every frame, the plate reader
   grabs one when you press the button.

   Permission is the browser's to ask and the browser asks once. What
   this module owns is stopping the stream the moment the sheet closes,
   because a camera light left on behind a closed sheet is the thing
   people uninstall an app over. */
(function (g) {
  'use strict';

  var stream = null;
  var video = null;

  function supported() {
    return !!(g.navigator && g.navigator.mediaDevices &&
              g.navigator.mediaDevices.getUserMedia);
  }

  /* A denial and a device with no camera are different answers and want
     different sentences, so the reason comes back rather than a false. */
  function start(opts) {
    opts = opts || {};
    if (!supported()) {
      return Promise.resolve({ ok: false, why: 'unsupported',
        message: 'This browser will not give the page a camera.' });
    }
    stop();
    return g.navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: opts.facing || 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    }).then(function (s) {
      stream = s;
      return { ok: true, stream: s };
    }, function (err) {
      var name = (err && err.name) || '';
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        return { ok: false, why: 'denied',
          message: 'The camera is blocked for this app. Allow it in your browser settings.' };
      }
      if (name === 'NotFoundError' || name === 'OverconstrainedError') {
        return { ok: false, why: 'nocamera',
          message: 'No camera on this device.' };
      }
      if (name === 'NotReadableError') {
        return { ok: false, why: 'busy',
          message: 'Another app is using the camera.' };
      }
      return { ok: false, why: 'failed',
        message: 'The camera could not be opened.' };
    });
  }

  /* playsinline and muted are not decoration: without them iOS takes the
     video full screen and the sheet underneath is gone. */
  function attach(el) {
    video = el;
    if (!el || !stream) return Promise.resolve(false);
    try {
      el.srcObject = stream;
      el.setAttribute('playsinline', '');
      el.setAttribute('muted', '');
      el.muted = true;
      var p = el.play();
      return (p && p.then ? p : Promise.resolve()).then(function () { return true; },
                                                        function () { return false; });
    } catch (e) { return Promise.resolve(false); }
  }

  /* ---- THE TORCH ---------------------------------------------------
     A barcode in a cupboard, a pantry shelf, a fridge: the places food
     is scanned are the badly lit ones, and the decoder needs contrast
     between a bar and the paper more than it needs anything else.

     The torch is a constraint on the video track rather than a separate
     API, so it only exists while the camera is open and only on cameras
     that have one. Asked for rather than assumed: getCapabilities is
     the device saying what it can do, and applying a constraint it does
     not have throws. */
  var torchOn = false;

  function track() {
    if (!stream) return null;
    var vs = stream.getVideoTracks();
    return vs && vs.length ? vs[0] : null;
  }

  function torchSupported() {
    var t = track();
    if (!t || !t.getCapabilities) return false;
    try { return !!t.getCapabilities().torch; } catch (e) { return false; }
  }

  function torch(on) {
    var t = track();
    if (!t || !t.applyConstraints) return Promise.resolve(false);
    if (!torchSupported()) return Promise.resolve(false);
    return t.applyConstraints({ advanced: [{ torch: !!on }] })
      .then(function () { torchOn = !!on; return torchOn; },
            function () { return torchOn; });
  }

  function torchIsOn() { return torchOn; }

  function running() {
    return !!(stream && stream.getTracks().some(function (t) {
      return t.readyState === 'live';
    }));
  }

  function stop() {
    /* Off before the track goes. A torch left on by a track that is
       then stopped stays lit on some devices until something else
       claims the camera, which is a phone that will not stop glowing. */
    if (torchOn) { try { torch(false); } catch (e) {} }
    torchOn = false;
    if (stream) {
      try {
        stream.getTracks().forEach(function (t) { t.stop(); });
      } catch (e) {}
      stream = null;
    }
    if (video) {
      try { video.srcObject = null; } catch (e) {}
      video = null;
    }
  }

  /* A FRAME, AT A SIZE THAT SUITS THE JOB.

     The scanner wants width: a barcode's bars are thin and losing them
     to a downscale is the difference between reading a code and not.
     The plate reader wants a small file, because it is going over a
     phone connection to a model that does not need the megapixels. */
  function frame(el, maxW) {
    el = el || video;
    if (!el || !el.videoWidth) return null;
    var w = el.videoWidth, h = el.videoHeight;
    var max = maxW || w;
    if (w > max) { h = Math.round(h * (max / w)); w = max; }
    var c = g.document.createElement('canvas');
    c.width = w; c.height = h;
    c.getContext('2d', { willReadFrequently: true }).drawImage(el, 0, 0, w, h);
    return c;
  }

  function shot(el, maxW, quality) {
    var c = frame(el, maxW || 1280);
    if (!c) return null;
    try { return c.toDataURL('image/jpeg', quality || 0.82); } catch (e) { return null; }
  }

  /* A FILE FROM THE LIBRARY, CUT DOWN TO SIZE.

     A photo off a modern phone is several megabytes and eight megapixels,
     and nothing this app sends one to needs either: a vision model reads
     a 1024px image as well as a 4032px one, an avatar is shown at 96px,
     and the difference is entirely somebody's data allowance on a train.

     This lived inside the Fuel screen. Three screens want it now -- the
     plate, the coach and the profile picture -- and a helper copied three
     times is a helper that will differ three ways within a month. */
  function shrink(file, max, quality) {
    return new Promise(function (done) {
      try {
        var img = new g.Image();
        var url = g.URL.createObjectURL(file);
        var finish = function (v) {
          try { g.URL.revokeObjectURL(url); } catch (e) {}
          done(v);
        };
        img.onload = function () {
          try {
            var cap = max || 1024;
            var w = img.width, h = img.height;
            var f = Math.min(1, cap / Math.max(w, h));
            var cv = g.document.createElement('canvas');
            cv.width = Math.round(w * f);
            cv.height = Math.round(h * f);
            cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
            finish(cv.toDataURL('image/jpeg', quality || 0.82));
          } catch (e) { finish(null); }
        };
        img.onerror = function () { finish(null); };
        img.src = url;
      } catch (e) { done(null); }
    });
  }

  /* SQUARE, FROM THE MIDDLE. An avatar is drawn in a circle, so a
     portrait cropped to a square keeps the face and a portrait squashed
     into one does not. */
  function square(file, size) {
    return new Promise(function (done) {
      try {
        var img = new g.Image();
        var url = g.URL.createObjectURL(file);
        var finish = function (v) {
          try { g.URL.revokeObjectURL(url); } catch (e) {}
          done(v);
        };
        img.onload = function () {
          try {
            var side = size || 512;
            var src = Math.min(img.width, img.height);
            var sx = Math.round((img.width - src) / 2);
            var sy = Math.round((img.height - src) / 2);
            var cv = g.document.createElement('canvas');
            cv.width = side; cv.height = side;
            cv.getContext('2d').drawImage(img, sx, sy, src, src, 0, 0, side, side);
            finish(cv.toDataURL('image/jpeg', 0.85));
          } catch (e) { finish(null); }
        };
        img.onerror = function () { finish(null); };
        img.src = url;
      } catch (e) { done(null); }
    });
  }

  g.LKCam = {
    supported: supported,
    shrink: shrink,
    square: square,
    start: start,
    attach: attach,
    running: running,
    stop: stop,
    frame: frame,
    shot: shot,
    torchSupported: torchSupported,
    torch: torch,
    torchIsOn: torchIsOn
  };
})(typeof window !== 'undefined' ? window : globalThis);
