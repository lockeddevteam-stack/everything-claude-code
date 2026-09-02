/*
  Image pipeline. Put rights-cleared originals in ./photos (JPEG or PNG, any size).
  Run: node scripts/images.mjs
  Output: public/images/<name>-{400,800,1600}.{avif,webp,jpg}, one grade applied to all.
  Then reference the base name (without size or extension) in content, e.g. image: banner-march
  and write real alt text in imageAlt. Do not ship any image without consent on file
  for every identifiable person, and parental consent for anyone under 18.
*/
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const IN = path.resolve('photos');
const OUT = path.resolve('public/images');
const SIZES = [400, 800, 1600];
if (!fs.existsSync(IN)) { console.log('No ./photos folder. Create it and add originals.'); process.exit(0); }
fs.mkdirSync(OUT, { recursive: true });

// One grading preset so mixed contributors look like one shoot:
// slight warmth, lifted shadows, restrained saturation.
const grade = (img) => img
  .modulate({ saturation: 0.92, brightness: 1.02 })
  .linear(0.96, 6)
  .tint({ r: 255, g: 250, b: 242 })
  .sharpen({ sigma: 0.6 });

for (const file of fs.readdirSync(IN)) {
  if (!/\.(jpe?g|png|tiff?)$/i.test(file)) continue;
  const name = file.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const src = path.join(IN, file);
  for (const w of SIZES) {
    const base = grade(sharp(src).rotate().resize({ width: w, withoutEnlargement: true }));
    await base.clone().avif({ quality: 55 }).toFile(path.join(OUT, `${name}-${w}.avif`));
    await base.clone().webp({ quality: 78 }).toFile(path.join(OUT, `${name}-${w}.webp`));
    await base.clone().jpeg({ quality: 80, mozjpeg: true }).toFile(path.join(OUT, `${name}-${w}.jpg`));
  }
  console.log(`${file} -> ${name}-{400,800,1600}.{avif,webp,jpg}`);
}
console.log('Done. Add alt text where each image is used.');
