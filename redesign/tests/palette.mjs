/* Anatomy palette check.

   Two different questions, two different measures.

   Against the ground the muscle sits on -- the page, the silhouette, the
   muted state -- the question is WCAG 1.4.11, so it is a contrast ratio, and
   the bar is 3:1. Muscles carry no text, so 4.5 is not the bar.

   Between two hues the question is whether a lifter can tell the chest from
   the shoulder, and a contrast ratio answers that badly: cyan and lime can
   sit at the same luminance and be unmistakable. So hue separation is
   measured as CIEDE2000, the perceptual distance, where roughly 2 is the
   just-noticeable step and anything past 15 is plainly a different colour. */

const hex = h => [1,3,5].map(i => parseInt(h.slice(i,i+2),16)/255);
const lum = h => { const [r,g,b] = hex(h).map(v => v <= 0.03928 ? v/12.92 : ((v+0.055)/1.055)**2.4);
  return 0.2126*r + 0.7152*g + 0.0722*b; };
const cr = (a,b) => { const x = lum(a), y = lum(b); return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05); };

function lab(h) {
  const [r,g,b] = hex(h).map(v => v <= 0.04045 ? v/12.92 : ((v+0.055)/1.055)**2.4);
  let X = (0.4124*r + 0.3576*g + 0.1805*b) / 0.95047;
  let Y = (0.2126*r + 0.7152*g + 0.0722*b);
  let Z = (0.0193*r + 0.1192*g + 0.9505*b) / 1.08883;
  const f = t => t > 0.008856 ? Math.cbrt(t) : (7.787*t + 16/116);
  [X,Y,Z] = [f(X), f(Y), f(Z)];
  return [116*Y - 16, 500*(X - Y), 200*(Y - Z)];
}

function de2000(h1, h2) {
  const [L1,a1,b1] = lab(h1), [L2,a2,b2] = lab(h2);
  const C1 = Math.hypot(a1,b1), C2 = Math.hypot(a2,b2), Cb = (C1+C2)/2;
  const G = 0.5*(1 - Math.sqrt(Cb**7/(Cb**7 + 25**7)));
  const A1 = (1+G)*a1, A2 = (1+G)*a2;
  const Cp1 = Math.hypot(A1,b1), Cp2 = Math.hypot(A2,b2);
  const deg = r => (r*180/Math.PI + 360) % 360;
  const h1p = Cp1 === 0 ? 0 : deg(Math.atan2(b1,A1));
  const h2p = Cp2 === 0 ? 0 : deg(Math.atan2(b2,A2));
  const dL = L2 - L1, dC = Cp2 - Cp1;
  let dh = 0;
  if (Cp1*Cp2 !== 0) {
    dh = h2p - h1p;
    if (dh > 180) dh -= 360; else if (dh < -180) dh += 360;
  }
  const dH = 2*Math.sqrt(Cp1*Cp2)*Math.sin(dh*Math.PI/360);
  const Lb = (L1+L2)/2, Cbp = (Cp1+Cp2)/2;
  let hb = h1p + h2p;
  if (Cp1*Cp2 !== 0) {
    if (Math.abs(h1p-h2p) > 180) hb += (hb < 360 ? 360 : -360);
    hb /= 2;
  }
  const T = 1 - 0.17*Math.cos((hb-30)*Math.PI/180) + 0.24*Math.cos(2*hb*Math.PI/180)
          + 0.32*Math.cos((3*hb+6)*Math.PI/180) - 0.20*Math.cos((4*hb-63)*Math.PI/180);
  const Sl = 1 + (0.015*(Lb-50)**2)/Math.sqrt(20 + (Lb-50)**2);
  const Sc = 1 + 0.045*Cbp, Sh = 1 + 0.015*Cbp*T;
  const Rt = -2*Math.sqrt(Cbp**7/(Cbp**7 + 25**7))
           * Math.sin((60*Math.exp(-(((hb-275)/25)**2)))*Math.PI/180);
  return Math.sqrt((dL/Sl)**2 + (dC/Sc)**2 + (dH/Sh)**2 + Rt*(dC/Sc)*(dH/Sh));
}

export { de2000 };
export function report(name, hues, grounds) {
  let minCr = 99, minCrWhat = '', minDe = 999, minDeWhat = '';
  const rows = [];
  for (const [g, h] of Object.entries(hues)) {
    const cells = Object.entries(grounds).map(([k, bg]) => {
      const v = cr(h, bg);
      if (v < minCr) { minCr = v; minCrWhat = g + ' on ' + k; }
      return (v.toFixed(2) + (v < 3 ? '!' : ' ')).padStart(9);
    });
    rows.push('  ' + g.padEnd(10) + h + cells.join(''));
  }
  const names = Object.keys(hues);
  for (let i = 0; i < names.length; i++) for (let j = i+1; j < names.length; j++) {
    const v = de2000(hues[names[i]], hues[names[j]]);
    if (v < minDe) { minDe = v; minDeWhat = names[i] + ' vs ' + names[j]; }
  }
  console.log('\n== ' + name);
  console.log('  hue       colour  ' + Object.keys(grounds).map(k => k.padStart(9)).join(''));
  console.log(rows.join('\n'));
  console.log('  worst contrast on a ground: ' + minCr.toFixed(2) + '  (' + minCrWhat + ')');
  console.log('  closest two hues (CIEDE2000): ' + minDe.toFixed(1) + '  (' + minDeWhat + ')');
  return { minCr, minDe };
}
