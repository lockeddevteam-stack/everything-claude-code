/* LKVoice — RECORDING A SENTENCE AND GETTING IT BACK AS TEXT.
   ==========================================================================
   The Worker has transcribed audio since the Gemini migration. Nothing in
   the app ever recorded any: every screen with a microphone on it showed a
   text box and a line of copy explaining that dictation belongs to the
   keyboard. That was true of the build and not of the server.

   WHY THE AUDIO IS CONVERTED BEFORE IT GOES UP. MediaRecorder gives you
   whatever the browser feels like -- webm/opus on Chrome and Android,
   mp4/aac on iOS -- and Gemini's inline audio accepts neither. Sending the
   recorder's own output would fail on every phone, differently, and look
   like a flaky server rather than a format nobody checked. So the clip is
   decoded, mixed to mono, resampled to 16 kHz and written out as a WAV,
   which Gemini does accept and which every browser can produce from what
   its recorder gave it. 16 kHz mono is what speech needs; it also makes a
   thirty-second clip about a megabyte instead of ten.

   WHAT THIS DOES NOT DO. It does not log anything. The transcript lands in
   the field the reader was already parsing, where it can be corrected
   before anything is written down -- a misheard "fifty" that becomes a
   meal is worse than no microphone at all.

   Every failure is its own sentence. Permission refused, no microphone,
   a page that is not on HTTPS, a clip too short to contain a word, a
   server that would not answer, and a recording with nothing intelligible
   in it are six different things, and a screen that says "something went
   wrong" for all six teaches somebody to stop trying.
   ========================================================================== */
(function (g) {
  'use strict';

  var MAX_MS = 30000;      /* a sentence, not a monologue */
  var MIN_MS = 400;        /* shorter than this is a slipped thumb */
  var RATE = 16000;        /* what speech needs, and no more */

  var rec = null, chunks = [], stream = null, startedAt = 0;
  var timer = null, autoStop = null, hooks = {};
  var actx = null, analyser = null, levelData = null;

  function AC() {
    return g.AudioContext || g.webkitAudioContext || null;
  }

  function supported() {
    return !!(g.navigator && g.navigator.mediaDevices &&
              g.navigator.mediaDevices.getUserMedia &&
              g.MediaRecorder && AC());
  }

  /* A microphone needs a secure context. On http the call does not fail
     with a permission prompt, it fails immediately, and the reason is
     worth saying out loud rather than reporting as a refusal. */
  function secure() {
    try {
      if (g.isSecureContext) return true;
      var h = g.location && g.location.hostname;
      return h === 'localhost' || h === '127.0.0.1' || (g.location && g.location.protocol === 'file:');
    } catch (e) { return false; }
  }

  function pickMime() {
    var want = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
    for (var i = 0; i < want.length; i++) {
      try { if (g.MediaRecorder.isTypeSupported(want[i])) return want[i]; } catch (e) {}
    }
    return '';
  }

  function cleanup() {
    if (timer) { clearInterval(timer); timer = null; }
    if (autoStop) { clearTimeout(autoStop); autoStop = null; }
    if (stream) {
      try { stream.getTracks().forEach(function (t) { t.stop(); }); } catch (e) {}
      stream = null;
    }
    if (actx) { try { actx.close(); } catch (e) {} actx = null; }
    analyser = null; levelData = null; rec = null;
  }

  /* 0..1, for whatever the screen wants to draw. Silence reads as silence,
     so a microphone that is muted at the OS looks muted rather than
     looking like it is working. */
  function level() {
    if (!analyser || !levelData) return 0;
    try {
      analyser.getByteTimeDomainData(levelData);
      var peak = 0;
      for (var i = 0; i < levelData.length; i++) {
        var d = Math.abs(levelData[i] - 128);
        if (d > peak) peak = d;
      }
      return Math.min(1, peak / 90);
    } catch (e) { return 0; }
  }

  function seconds() {
    return startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0;
  }

  /* ---- SPEECH TO TEXT, ON THE DEVICE ------------------------------
     The microphone used to record audio, upload it, and ask a language
     model to write down what was said. That works and it is the wrong
     tool three times over: a round trip before you see a word, a model
     billed per call to do a job a recogniser does for nothing, and a
     general model given "transcribe this" will sometimes answer the
     question it heard instead of writing it down.

     SpeechRecognition is the browser's own recogniser. It streams words
     back while you are still talking, which is also a better thing to
     show than a level meter: you can see it hearing you correctly, and
     correct yourself mid-sentence rather than after.

     The recorder stays as the fallback, for browsers without it and for
     a recogniser that fails before it returns anything. */
  var SR = (typeof g.SpeechRecognition === 'function' && g.SpeechRecognition) ||
           (typeof g.webkitSpeechRecognition === 'function' && g.webkitSpeechRecognition) || null;
  var sr = null, srFinal = '', srInterim = '', srDone = null, srStarted = false;
  var srTimer = null, srAutoStop = null, srSecs = 0;

  function srSupported() { return !!SR && secure(); }

  function srCleanup() {
    if (srTimer) { clearInterval(srTimer); srTimer = null; }
    if (srAutoStop) { clearTimeout(srAutoStop); srAutoStop = null; }
    if (sr) {
      try { sr.onresult = sr.onerror = sr.onend = null; } catch (e) {}
      try { sr.stop(); } catch (e) {}
      sr = null;
    }
  }

  function srText() {
    return (srFinal + ' ' + srInterim).replace(/\s+/g, ' ').trim();
  }

  function srStart(opts) {
    return new Promise(function (resolve) {
      var r;
      try { r = new SR(); } catch (e) { resolve(null); return; }
      sr = r;
      srFinal = ''; srInterim = ''; srSecs = 0; srStarted = false; srDone = null;
      r.continuous = true;
      r.interimResults = true;
      r.maxAlternatives = 1;
      try { r.lang = g.navigator && g.navigator.language || 'en-GB'; } catch (e) {}

      var settled = false;
      var settle = function (v) { if (!settled) { settled = true; resolve(v); } };

      r.onresult = function (e) {
        srStarted = true;
        srInterim = '';
        for (var i = e.resultIndex; i < e.results.length; i++) {
          var t = e.results[i][0] && e.results[i][0].transcript || '';
          if (e.results[i].isFinal) srFinal += (srFinal ? ' ' : '') + t.trim();
          else srInterim += t;
        }
        if (opts.onPartial) { try { opts.onPartial(srText()); } catch (err) {} }
      };

      r.onerror = function (e) {
        var name = (e && e.error) || '';
        /* Before it ever started: this route is not available on this
           browser today, whatever the constructor claims. */
        if (!settled) { srCleanup(); settle(null); return; }
        /* Nothing heard is not a failure of the recogniser, it is a
           quiet room. Anything else before the first word means this
           route is not going to work and the recorder should have it. */
        if (name === 'no-speech' || name === 'aborted') { srStarted = true; return; }
        if (!srStarted) { srCleanup(); settle(null); return; }
        if (srDone) { var d = srDone; srDone = null; d({ ok: true, text: srText(), via: 'speech' }); }
      };

      r.onend = function () {
        if (srDone) {
          var d = srDone; srDone = null;
          var text = srText();
          srCleanup();
          d(text
            ? { ok: true, text: text, via: 'speech' }
            : { ok: false, error: 'empty',
                message: 'Nothing was heard. Try again, or type it.' });
        }
      };

      /* WAIT FOR IT TO ACTUALLY START. The first version resolved
         "started" on the next tick, which raced the error: a browser
         that has the constructor but no working recogniser -- a
         headless one, a locked-down one, a phone with the dictation
         service off -- reported a live microphone and then heard
         nothing for ever, and the recorder fallback never ran because
         the promise had already settled.

         onstart is the browser saying the microphone is open. Nothing
         is claimed before it, and an error before it hands the job to
         the recorder. */
      r.onstart = function () {
        srTimer = setInterval(function () {
          srSecs += 1;
          if (opts.onTick) { try { opts.onTick(srSecs, 0); } catch (err) {} }
        }, 1000);
        srAutoStop = setTimeout(function () {
          if (opts.onAuto) { try { opts.onAuto(); } catch (err) {} }
        }, MAX_MS);
        settle({ ok: true, via: 'speech' });
      };

      try { r.start(); } catch (e) { srCleanup(); settle(null); return; }

      /* And a recogniser that neither starts nor errors is one that is
         not going to. Two seconds is long past the point where a
         working one has opened the microphone. */
      setTimeout(function () {
        if (!settled) { srCleanup(); settle(null); }
      }, 2000);
    });
  }

  function srStop() {
    if (!sr) {
      return Promise.resolve({ ok: false, error: 'idle', message: 'Nothing was listening.' });
    }
    return new Promise(function (resolve) {
      srDone = resolve;
      try { sr.stop(); } catch (e) {
        srDone = null;
        var text = srText();
        srCleanup();
        resolve(text ? { ok: true, text: text, via: 'speech' }
                     : { ok: false, error: 'empty', message: 'Nothing was heard.' });
      }
    });
  }

  function start(opts) {
    hooks = opts || {};
    if (!secure()) {
      return Promise.resolve({ ok: false, error: 'insecure',
        message: 'A microphone needs a secure connection. Type it instead.' });
    }
    if (sr || rec) {
      return Promise.resolve({ ok: false, error: 'busy', message: 'Already listening.' });
    }

    /* THE RECOGNISER FIRST. It writes words down while you talk, needs
       no server of ours and costs no model call. Only when the browser
       has none, or its recogniser will not start, does this fall back
       to recording the audio and having it transcribed. */
    if (srSupported()) {
      return srStart(hooks).then(function (r) {
        if (r) return r;
        return startRecorder();
      });
    }
    return startRecorder();
  }

  function startRecorder() {
    var opts = hooks;
    if (!supported()) {
      return Promise.resolve({ ok: false, error: 'unsupported',
        message: 'This browser cannot record audio. Type it instead.' });
    }

    return g.navigator.mediaDevices.getUserMedia({ audio: true }).then(function (s) {
      stream = s;
      chunks = [];
      var mime = pickMime();
      try { rec = mime ? new g.MediaRecorder(s, { mimeType: mime }) : new g.MediaRecorder(s); }
      catch (e) { rec = new g.MediaRecorder(s); }
      rec.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
      rec.start();
      startedAt = Date.now();

      try {
        var Ctor = AC();
        actx = new Ctor();
        analyser = actx.createAnalyser();
        analyser.fftSize = 512;
        levelData = new Uint8Array(analyser.fftSize);
        actx.createMediaStreamSource(s).connect(analyser);
      } catch (e) { analyser = null; }

      if (hooks.onTick) {
        timer = setInterval(function () { hooks.onTick(seconds(), level()); }, 200);
      }
      /* Thirty seconds and it stops itself. A recorder left running by a
         phone going into a pocket is a bill and a privacy problem. */
      autoStop = setTimeout(function () {
        if (hooks.onAuto) hooks.onAuto(); else stop();
      }, MAX_MS);

      return { ok: true };
    }, function (e) {
      var name = String((e && e.name) || e);
      cleanup();
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        return { ok: false, error: 'denied',
          message: 'The microphone is blocked for this site. Allow it in your browser settings, or type it instead.' };
      }
      if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        return { ok: false, error: 'nomic',
          message: 'No microphone was found on this device.' };
      }
      return { ok: false, error: 'mic',
        message: 'The microphone could not be opened. Type it instead.' };
    });
  }

  function cancel() {
    /* Both routes. A recogniser left running after the sheet closes
       keeps the microphone indicator on, same as a recorder does. */
    srDone = null;
    srCleanup();
    if (rec && rec.state !== 'inactive') { try { rec.stop(); } catch (e) {} }
    cleanup();
    chunks = [];
    startedAt = 0;
  }

  function blobFromChunks() {
    var type = (chunks[0] && chunks[0].type) || 'audio/webm';
    return new Blob(chunks, { type: type });
  }

  /* ---- the conversion ---------------------------------------------------
     decodeAudioData reads whatever the recorder produced, an
     OfflineAudioContext at 16 kHz does the mixing and resampling, and the
     result is written out as a plain 16-bit WAV. No library, and nothing
     that has to be right about a codec. */
  function toWav(blob) {
    var Ctor = AC();
    if (!Ctor) return Promise.reject(new Error('no audio context'));
    return blob.arrayBuffer().then(function (buf) {
      var ctx = new Ctor();
      return new Promise(function (resolve, reject) {
        /* The callback form, not the promise form. Safari has supported
           the callbacks far longer, and both are still in the spec. */
        ctx.decodeAudioData(buf, resolve, reject);
      }).then(function (decoded) {
        try { ctx.close(); } catch (e) {}
        return resample(decoded);
      });
    }).then(function (rendered) {
      return encodeWav(rendered.data, rendered.rate);
    });
  }

  /* ---- down to one channel, and to 16 kHz where the browser allows it --
     SAFARI REFUSES AN OfflineAudioContext BELOW 22050 Hz, and that throw
     is the whole feature failing on an iPhone while working on every
     desktop it was written on. So 16 kHz is attempted, then the clip's
     own rate, and if the browser will not render at all the channels are
     mixed by hand and sent at whatever rate they were recorded at.

     Only the file size changes. Gemini reads a WAV at any rate, so the
     worst case here is a larger upload rather than a broken button. */
  function resample(decoded) {
    var OC = g.OfflineAudioContext || g.webkitOfflineAudioContext;
    var native = decoded.sampleRate || 44100;

    function render(rate) {
      if (!OC) return null;
      var frames = Math.max(1, Math.round(decoded.duration * rate));
      var off;
      try { off = new OC(1, frames, rate); } catch (e) { return null; }
      var src = off.createBufferSource();
      src.buffer = decoded;
      src.connect(off.destination);
      src.start(0);
      var out = off.startRendering();
      /* The old callback form returns nothing and calls oncomplete. */
      if (!out || typeof out.then !== 'function') {
        out = new Promise(function (resolve) {
          off.oncomplete = function (e) { resolve(e.renderedBuffer); };
        });
      }
      return out;
    }

    function asData(buf) {
      return { data: buf.getChannelData(0), rate: buf.sampleRate || native };
    }

    var attempt = render(RATE);
    if (!attempt) return Promise.resolve(mixDown(decoded));
    return attempt.then(asData, function () {
      var again = render(native);
      if (!again) return mixDown(decoded);
      return again.then(asData, function () { return mixDown(decoded); });
    });
  }

  /* No resampling, no rendering: just the channels averaged. The last
     thing that can go wrong is nothing going wrong. */
  function mixDown(decoded) {
    var chans = decoded.numberOfChannels || 1;
    var len = decoded.length;
    var out = new Float32Array(len);
    for (var c = 0; c < chans; c++) {
      var d = decoded.getChannelData(c);
      for (var i = 0; i < len; i++) out[i] += d[i] / chans;
    }
    return { data: out, rate: decoded.sampleRate || 44100 };
  }

  function encodeWav(samples, rate) {
    var n = samples.length;
    var buf = new ArrayBuffer(44 + n * 2);
    var v = new DataView(buf);
    function str(off, s) { for (var i = 0; i < s.length; i++) v.setUint8(off + i, s.charCodeAt(i)); }
    str(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); str(8, 'WAVE');
    str(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true);
    v.setUint16(22, 1, true); v.setUint32(24, rate, true);
    v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
    str(36, 'data'); v.setUint32(40, n * 2, true);
    for (var i = 0; i < n; i++) {
      var s = Math.max(-1, Math.min(1, samples[i]));
      v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    return new Blob([buf], { type: 'audio/wav' });
  }

  function stop() {
    if (sr) return srStop();
    if (!rec) {
      return Promise.resolve({ ok: false, error: 'idle', message: 'Nothing was recording.' });
    }
    var held = rec, ms = Date.now() - startedAt;
    if (timer) { clearInterval(timer); timer = null; }
    if (autoStop) { clearTimeout(autoStop); autoStop = null; }

    return new Promise(function (resolve) {
      held.onstop = function () { resolve(); };
      try { held.stop(); } catch (e) { resolve(); }
    }).then(function () {
      cleanup();
      startedAt = 0;
      if (ms < MIN_MS || !chunks.length) {
        chunks = [];
        return { ok: false, error: 'tooshort',
          message: 'That was too short to hear. Hold it while you speak.' };
      }
      var raw = blobFromChunks();
      chunks = [];
      return toWav(raw).then(function (wav) {
        if (!g.LKCloud || !g.LKCloud.voice) {
          return { ok: false, error: 'not_configured',
            message: 'Transcribing is not available right now. Type it instead.' };
        }
        return g.LKCloud.voice(wav).then(function (r) {
          if (!r.ok) return r;
          var text = String((r.data && r.data.transcription) || '').trim();
          if (!text) {
            return { ok: false, error: 'silent',
              message: 'Nothing intelligible was heard. Try again, or type it.' };
          }
          return { ok: true, text: text,
                   action: (r.data && r.data.action) || 'unknown',
                   data: (r.data && r.data.data) || {} };
        });
      }, function (e) {
        /* The browser's own word for what went wrong, in brackets. This
           one failure has half a dozen causes that all look identical
           from the outside, and a person reporting it should not have to
           guess which. */
        var why = String((e && (e.name || e.message)) || e).slice(0, 60);
        return { ok: false, error: 'convert',
          message: 'The recording could not be read on this device (' + why +
                   '). Type it instead.' };
      });
    });
  }

  g.LKVoice = {
    supported: supported,
    /* Whether it is worth OFFERING. A browser that can record and a server
       that can transcribe are both needed; either missing and the screen
       shows the field alone rather than a button that cannot work. */
    /* Whether it is worth OFFERING. It used to need a server, because
       the only route was upload-and-transcribe. A browser with its own
       recogniser needs nothing of ours, so the button is offered on a
       phone with no connection to this app's server at all. */
    available: function () {
      if (!secure()) return false;
      if (srSupported()) return true;
      return supported() &&
             !!(g.LKCloud && g.LKCloud.voice && g.LKCloud.voiceReady && g.LKCloud.voiceReady());
    },
    recording: function () { return !!(sr || rec); },
    /* Which route is live, for a screen that wants to show words
       appearing rather than a level meter that cannot move. */
    listening: function () { return !!sr; },
    speechToText: srSupported,
    seconds: seconds,
    level: level,
    maxSeconds: MAX_MS / 1000,
    start: start,
    stop: stop,
    cancel: cancel
  };
})(typeof window !== 'undefined' ? window : this);
