import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'fs';
const src = readFileSync('/home/user/everything-claude-code/redesign/08-build/vendor/body-art.js','utf8');
const br = await chromium.launch();
const p = await br.newPage();
await p.setContent('<svg id="s" xmlns="http://www.w3.org/2000/svg"></svg>');
await p.addScriptTag({ content: src });
const boxes = await p.evaluate(() => {
  const svg = document.getElementById('s');
  const out = {};
  for (const view of ['front','back']) {
    svg.setAttribute('viewBox', LKBodyArt[view].viewBox);
    out[view] = {};
    for (const [gid, paths] of Object.entries(LKBodyArt[view].groups)) {
      const g = document.createElementNS('http://www.w3.org/2000/svg','g');
      for (const d of paths) {
        const pa = document.createElementNS('http://www.w3.org/2000/svg','path');
        pa.setAttribute('d', d); g.appendChild(pa);
      }
      svg.appendChild(g);
      const b = g.getBBox();
      out[view][gid] = [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)];
      svg.removeChild(g);
    }
    // the thinnest single belly in each group: what a finger is aiming at
    out[view].__thin = {};
    for (const [gid, paths] of Object.entries(LKBodyArt[view].groups)) {
      let thin = Infinity;
      for (const d of paths) {
        const pa = document.createElementNS('http://www.w3.org/2000/svg','path');
        pa.setAttribute('d', d); svg.appendChild(pa);
        const pb = pa.getBBox();
        thin = Math.min(thin, Math.max(1, Math.min(pb.width, pb.height)));
        svg.removeChild(pa);
      }
      out[view].__thin[gid] = Math.round(thin);
    }
    // sub-region boxes, where the art divides the group into real muscles
    const parts = LKBodyArt[view].parts || {};
    out[view].__parts = {};
    for (const [gid, named] of Object.entries(parts)) {
      out[view].__parts[gid] = {};
      for (const [name, paths] of Object.entries(named)) {
        const pg = document.createElementNS('http://www.w3.org/2000/svg','g');
        for (const d of paths) {
          const pa = document.createElementNS('http://www.w3.org/2000/svg','path');
          pa.setAttribute('d', d); pg.appendChild(pa);
        }
        svg.appendChild(pg);
        const pb = pg.getBBox();
        out[view].__parts[gid][name] = [Math.round(pb.x), Math.round(pb.y), Math.round(pb.width), Math.round(pb.height)];
        svg.removeChild(pg);
      }
    }
    // whole-figure box
    const g = document.createElementNS('http://www.w3.org/2000/svg','g');
    for (const d of [...LKBodyArt[view].inert, ...Object.values(LKBodyArt[view].groups).flat()]) {
      const pa = document.createElementNS('http://www.w3.org/2000/svg','path');
      pa.setAttribute('d', d); g.appendChild(pa);
    }
    svg.appendChild(g);
    const b = g.getBBox();
    out[view].__figure = [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)];
    svg.removeChild(g);
  }
  return out;
});
await br.close();
console.log(JSON.stringify(boxes, null, 1));
writeFileSync('/tmp/anat/boxes.json', JSON.stringify(boxes));
