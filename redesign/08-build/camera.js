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

  function running() {
    return !!(stream && stream.getTracks().some(function (t) {
      return t.readyState === 'live';
    }));
  }

  function stop() {
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

  g.LKCam = {
    supported: supported,
    start: start,
    attach: attach,
    running: running,
    stop: stop,
    frame: frame,
    shot: shot
  };
})(typeof window !== 'undefined' ? window : globalThis);
