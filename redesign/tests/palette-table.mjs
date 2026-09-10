import { de2000 } from './palette.mjs';
const hex = h => [1,3,5].map(i => parseInt(h.slice(i,i+2),16)/255);
const lum = h => { const [r,g,b] = hex(h).map(v => v <= 0.03928 ? v/12.92 : ((v+0.055)/1.055)**2.4);
  return 0.2126*r + 0.7152*g + 0.0722*b; };
const cr = (a,b) => { const x = lum(a), y = lum(b); return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05); };
const mix = (a, b, p) => { const A = hex(a), B = hex(b);
  const c = v => Math.round(v*255).toString(16).padStart(2,'0').toUpperCase();
  return '#' + A.map((v,i) => c(v*p + B[i]*(1-p))).join(''); };
const lab = h => { const [r,g,b] = hex(h).map(v => v <= 0.04045 ? v/12.92 : ((v+0.055)/1.055)**2.4);
  let X=(0.4124*r+0.3576*g+0.1805*b)/0.95047, Y=(0.2126*r+0.7152*g+0.0722*b), Z=(0.0193*r+0.1192*g+0.9505*b)/1.08883;
  const f=t=>t>0.008856?Math.cbrt(t):(7.787*t+16/116); [X,Y,Z]=[f(X),f(Y),f(Z)];
  return [116*Y-16, 500*(X-Y), 200*(Y-Z)]; };
const hue = h => { const [,a,b] = lab(h); return Math.round((Math.atan2(b,a)*180/Math.PI+360)%360); };

const SETS = {
  dark: { pal: {"chest":"#FF3146","back":"#0C95FF","shoulders":"#946AFF","calves":"#FF3DD1","abs":"#EF9805","forearms":"#0ABEBE","biceps":"#12BBD6","triceps":"#18B7F7","hams":"#ACB201","quads":"#4DC314","adduc":"#0AC0A7","glutes":"#0CC37F"},
    grounds: { bg:'#0A0A0B', surf:'#18181B', raised:'#1F1F23' }, seamInto: '#000000' },
  light: { pal: {"chest":"#F9043B","back":"#0186E8","shoulders":"#6945DE","calves":"#E101B5","abs":"#B97400","forearms":"#019191","biceps":"#0292A8","triceps":"#048EC2","hams":"#878C01","quads":"#369A01","adduc":"#01937F","glutes":"#039862"},
    grounds: { bg:'#EFEFF2', surf:'#F5F5F7', raised:'#FAFAFB' }, seamInto: '#000000' }
};
for (const [name, S] of Object.entries(SETS)) {
  console.log('\n--- ' + name);
  console.log('       group      hex      hue' +
    Object.keys(S.grounds).map(k => k.padStart(7)).join('') + '   seam vs hue');
  for (const [g, h] of Object.entries(S.pal)) {
    const seam = mix(h, S.seamInto, 0.22);
    console.log('       ' + g.padEnd(10) + h + '   ' + String(hue(h)).padStart(3) +
      Object.values(S.grounds).map(bg => cr(h,bg).toFixed(2).padStart(7)).join('') +
      '       ' + cr(seam, h).toFixed(2));
  }
  const ks = Object.keys(S.pal);
  let mn = 999, who = '';
  for (let i=0;i<ks.length;i++) for (let j=i+1;j<ks.length;j++) {
    const d = de2000(S.pal[ks[i]], S.pal[ks[j]]);
    if (d < mn) { mn = d; who = ks[i]+'/'+ks[j]; }
  }
  console.log('       closest pair ' + who + ' at CIEDE2000 ' + mn.toFixed(1) +
    '; nearest to the accent: ' +
    ks.map(k => [k, de2000(S.pal[k], '#F97316')]).sort((a,b)=>a[1]-b[1])[0].join(' at ').slice(0,30));
}
