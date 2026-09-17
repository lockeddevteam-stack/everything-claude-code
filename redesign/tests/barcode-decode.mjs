/* A DECODER, NOT A DISCLAIMER.

   The scan sheet said reading a barcode "needs a decoder this build does
   not carry". This is that decoder, checked against barcodes drawn from
   the spec rather than against a photo somebody happened to take: the
   module patterns below are the ones a printer would lay down, so a
   failure here is the decoder's and not the camera's.

   What has to hold: the thirteenth digit, which is nowhere in the bars,
   is recovered from which of two tables the left-hand digits matched; a
   code held upside down reads the same; a bad checksum is a miss rather
   than a wrong answer; and noise decodes to nothing at all. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const src = readFileSync(path.join(HERE, '../08-build/barcode.js'), 'utf8');
const sandbox = {};
new Function('window', src)(sandbox);
const LK = sandbox.LKBarcode;

let fails = 0, checks = 0;
const ok = (pass, name, detail) => {
  checks++; if (!pass) fails++;
  console.log((pass ? 'PASS ' : 'FAIL ') + name + (detail ? ' — ' + detail : ''));
};

/* The module patterns, straight out of the standard. 1 is a bar. */
const Lp = ['0001101','0011001','0010011','0111101','0100011',
            '0110001','0101111','0111011','0110111','0001011'];
const Gp = ['0100111','0110011','0011011','0100001','0011101',
            '0111001','0000101','0010001','0001001','0010111'];
const Rp = ['1110010','1100110','1101100','1000010','1011100',
            '1001110','1010000','1000100','1001000','1110100'];
const PARITY = ['OOOOOO','OOEOEE','OOEEOE','OOEEEO','OEOOEE',
                'OEEOOE','OEEEOO','OEOEOE','OEOEEO','OEEOEO'];

function ean13Modules(code) {
  const d = code.split('').map(Number);
  const par = PARITY[d[0]];
  let s = '101';
  for (let i = 1; i <= 6; i++) s += (par[i - 1] === 'O' ? Lp : Gp)[d[i]];
  s += '01010';
  for (let i = 7; i <= 12; i++) s += Rp[d[i]];
  return s + '101';
}

function ean8Modules(code) {
  const d = code.split('').map(Number);
  let s = '101';
  for (let i = 0; i < 4; i++) s += Lp[d[i]];
  s += '01010';
  for (let i = 4; i < 8; i++) s += Rp[d[i]];
  return s + '101';
}

/* Drawn the way a label is: a quiet zone, the modules at some width, a
   quiet zone. Grey rather than pure black so the threshold has to do
   real work. */
function draw(modules, { scale = 3, quiet = 12, h = 40, dark = 40, light = 215 } = {}) {
  const w = quiet * 2 + modules.length * scale;
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const m = Math.floor((x - quiet) / scale);
      const on = m >= 0 && m < modules.length && modules[m] === '1';
      const v = on ? dark : light;
      const p = (y * w + x) * 4;
      data[p] = v; data[p + 1] = v; data[p + 2] = v; data[p + 3] = 255;
    }
  }
  return { width: w, height: h, data };
}

function flip(img) {
  const { width: w, height: h, data } = img;
  const out = new Uint8ClampedArray(data.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const s = (y * w + x) * 4, t = (y * w + (w - 1 - x)) * 4;
      for (let k = 0; k < 4; k++) out[t + k] = data[s + k];
    }
  }
  return { width: w, height: h, data: out };
}

console.log('=== real barcodes, drawn from the spec ===\n');

/* A Coca-Cola can, a UK own-brand, a US product as UPC-A with its
   leading zero, and one whose first digit is 0 so no left digit is in
   the second table at all. */
/* 5060123456789 was in this list and the decoder refused it. It was
   right to: 5+0+6+0+1+6+3+12+5+18+7+24 is 87, so the check digit is 3
   and not 9. The made-up code in the test was invalid and the decoder
   caught it, which is the behaviour the last section of this file
   exists to demand. */
const CODES = ['5449000000996', '5060123456783', '0012000001086', '0123456789012'];
for (const code of CODES) {
  const got = LK.fromImageData(draw(ean13Modules(code)));
  ok(got === code, 'EAN-13 ' + code + ' reads back', got || '(nothing)');
}

console.log('\n=== the digit that is not drawn ===\n');

/* The first digit has no bars. It exists only as which of two tables
   each of the six left-hand digits was drawn from, so getting it right
   is the one thing a naive decoder gets wrong. */
const firsts = ['9780201379624', '4006381333931', '8712345678906'];
for (const code of firsts) {
  const got = LK.fromImageData(draw(ean13Modules(code)));
  ok(got === code, 'the leading ' + code[0] + ' is recovered from parity alone',
     got || '(nothing)');
}

console.log('\n=== upside down is the same barcode ===\n');

const up = '5449000000996';
ok(LK.fromImageData(flip(draw(ean13Modules(up)))) === up,
   'a code held the other way round still reads',
   LK.fromImageData(flip(draw(ean13Modules(up)))) || '(nothing)');

console.log('\n=== EAN-8 ===\n');

for (const code of ['96385074', '55123457']) {
  const got = LK.fromImageData(draw(ean8Modules(code)));
  ok(got === code, 'EAN-8 ' + code + ' reads back', got || '(nothing)');
}

console.log('\n=== conditions a kitchen actually has ===\n');

ok(LK.fromImageData(draw(ean13Modules(up), { scale: 2 })) === up,
   'held far away, two pixels a module');
ok(LK.fromImageData(draw(ean13Modules(up), { scale: 8 })) === up,
   'held close, eight');
ok(LK.fromImageData(draw(ean13Modules(up), { dark: 90, light: 150 })) === up,
   'a dim shot with little contrast between bar and paper');
ok(LK.fromImageData(draw(ean13Modules(up), { h: 6 })) === up,
   'and only a sliver of the label in frame');

console.log('\n=== a misread is a miss, not a wrong answer ===\n');

/* One digit changed, so the bars are valid and the checksum is not.
   Returning this would log somebody else's dinner. */
const bad = '5449000000997';
ok(LK.fromImageData(draw(ean13Modules(bad))) === null,
   'a code whose checksum does not add up is refused',
   String(LK.fromImageData(draw(ean13Modules(bad)))));
ok(LK.checkEAN13('5449000000996'.split('').map(Number)) === true,
   'the checksum itself agrees with a real code');

const noise = { width: 300, height: 30,
  data: new Uint8ClampedArray(300 * 30 * 4).map((_, i) =>
    i % 4 === 3 ? 255 : ((i * 7919) % 251)) };
ok(LK.fromImageData(noise) === null, 'noise decodes to nothing',
   String(LK.fromImageData(noise)));

const blank = draw('0'.repeat(95), { dark: 200, light: 205 });
ok(LK.fromImageData(blank) === null, 'and so does a flat surface',
   String(LK.fromImageData(blank)));

console.log('\n' + (fails ? 'FAIL' : 'PASS') + ' — ' + (checks - fails) + '/' + checks);
process.exit(fails ? 1 : 0);
