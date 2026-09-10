/* Pick the most saturated colour at a given hue that still clears the
   contrast bar on the theme's ground. Lightness and chroma are searched in
   CIELCh and converted back to sRGB; anything out of gamut is rejected, so
   every colour that comes out is a colour a screen can actually show. */
import { report, de2000 as deAccent } from './palette.mjs';

const f = t => t > 0.008856 ? Math.cbrt(t) : (7.787*t + 16/116);
const fi = t => t**3 > 0.008856 ? t**3 : (t - 16/116)/7.787;
function lchToHex(L, C, h) {
  const a = C*Math.cos(h*Math.PI/180), b = C*Math.sin(h*Math.PI/180);
  const fy = (L+16)/116, fx = fy + a/500, fz = fy - b/200;
  const X = fi(fx)*0.95047, Y = fi(fy), Z = fi(fz)*1.08883;
  let r =  3.2406*X - 1.5372*Y - 0.4986*Z;
  let g = -0.9689*X + 1.8758*Y + 0.0415*Z;
  let bl =  0.0557*X - 0.2040*Y + 1.0570*Z;
  const gam = v => v <= 0.0031308 ? 12.92*v : 1.055*v**(1/2.4) - 0.055;
  [r,g,bl] = [gam(r), gam(g), gam(bl)];
  if ([r,g,bl].some(v => v < -0.002 || v > 1.002)) return null;
  const c = v => Math.round(Math.min(1, Math.max(0, v))*255).toString(16).padStart(2,'0');
  return '#' + (c(r)+c(g)+c(bl)).toUpperCase();
}
const hexRgb = h => [1,3,5].map(i => parseInt(h.slice(i,i+2),16)/255);
const lum = h => { const [r,g,b] = hexRgb(h).map(v => v <= 0.03928 ? v/12.92 : ((v+0.055)/1.055)**2.4);
  return 0.2126*r + 0.7152*g + 0.0722*b; };
const cr = (a,b) => { const x = lum(a), y = lum(b); return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05); };

/* The most chromatic colour at this hue meeting the bar. Dark themes want the
   lightest such colour, light themes the darkest, so the direction differs. */
function pick(hue, ground, bar, dir, capC, lo, hi) {
  let best = null, bestC = -1;
  for (let L = lo; L <= hi; L += 0.5) {
    for (let C = capC; C >= 10; C -= 1) {
      const hexv = lchToHex(L, C, hue);
      if (!hexv) continue;
      if (cr(hexv, ground) < bar) continue;
      /* Among colours that clear the bar, the most chromatic wins; ties go to
         the one further from the ground, so nothing sits on the edge. */
      const score = C + (dir === 'dark' ? L : -L) * 0.12;
      if (score > bestC) { bestC = score; best = hexv; }
      break;
    }
  }
  return best;
}

/* Hue spacing is decided by which muscles touch, not by an even wheel. The
   quadriceps and the adductors share a thigh, so they are pushed the furthest
   apart of any leg pair; the glutes and hamstrings share the back of a leg
   and take the two hues between them. The arm family keeps its own band. */
const HUE = {
  chest: 28, abs: 72, hams: 105, quads: 132, glutes: 158, adduc: 178,
  forearms: 196, biceps: 220, triceps: 250, back: 276, shoulders: 306, calves: 338
};
/* Chroma is capped rather than maximised. At the top of the gamut these hues
   go fluorescent, and a body painted in twelve fluorescent colours reads as a
   toy. Capped, they read as rich: crimson, royal blue, violet, hot orange. */
/* Lightness is held to a narrow band as well, which is what actually stops
   the greens going fluorescent: at their hues the gamut has room to climb
   almost to white, and a colour that light reads as a highlighter however
   its chroma is capped. Inside one band all twelve sit at the same depth and
   read as one set. */
const build = (ground, bar, dir, cap, lo, hi) => Object.fromEntries(
  Object.entries(HUE).map(([k, h]) => [k, pick(h, ground, bar, dir, cap, lo, hi)]));

const dark = build('#0A0A0B', 4.5, 'dark', 90, 56, 70);
const light = build('#EFEFF2', 3.1, 'light', 90, 42, 56);
/* The accent is the one colour reserved for the primary action on a screen.
   Nothing on the body may be mistaken for it. */
const ACCENT = '#F97316';
report('tough, dark', dark, { bg:'#0A0A0B', silhouette:'#34343B', muted:'#606069' });
report('tough, light', light, { bg:'#EFEFF2', silhouette:'#A8A8B2', muted:'#83838E' });
import { report as _r } from './palette.mjs';
for (const [name, set] of [['dark', dark], ['light', light]]) {
  let near = 999, who = '';
  for (const [k, v] of Object.entries(set)) {
    const d = deAccent(v, ACCENT);
    if (d < near) { near = d; who = k; }
  }
  console.log('  ' + name + ': closest hue to the accent ' + ACCENT + ' is ' +
              who + ' at CIEDE2000 ' + near.toFixed(1));
}
console.log('\ndark  ', JSON.stringify(dark));
console.log('light ', JSON.stringify(light));
