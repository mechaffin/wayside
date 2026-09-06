/**
 * Convert author source images into the avatars the pages actually ship.
 *
 * Drop a square JPG or PNG next to the author's JSON in src/content/authors/
 * and run this. Sources stay out of the build because the collection loader
 * only globs *.json; only the 96px WebP lands in public/authors/.
 *
 * Quality steps down until the file clears the 6KB budget the validator
 * enforces, because a headshot and a flat club logo compress nothing alike
 * and a single fixed quality misses one of them every time.
 */
import { readdir, writeFile, stat } from 'node:fs/promises';
import { join, parse } from 'node:path';
import sharp from 'sharp';
import { AUTHORS_DIR, AVATAR_DIR } from './lib/content.mjs';

const EDGE = 96;
const MAX_BYTES = 6 * 1024;
const QUALITY_STEPS = [82, 74, 66, 58, 50, 42];

const sources = (await readdir(AUTHORS_DIR)).filter((f) => /\.(jpe?g|png)$/i.test(f)).sort();

if (sources.length === 0) {
  console.log(`No source images in ${AUTHORS_DIR}/. Nothing to convert.`);
}

for (const file of sources) {
  const slug = parse(file).name;
  const out = join(AVATAR_DIR, `${slug}.webp`);

  const { width, height } = await sharp(join(AUTHORS_DIR, file)).metadata();
  if (width !== height) {
    // Cropping for them would pick the wrong half of a logo often enough that
    // it is worth making the choice explicit.
    console.error(`  ${file}  SKIPPED, ${width}x${height}. Crop it square first.`);
    continue;
  }

  let written;
  for (const quality of QUALITY_STEPS) {
    const buf = await sharp(join(AUTHORS_DIR, file))
      .resize(EDGE, EDGE, { fit: 'cover' })
      .webp({ quality, effort: 6 })
      .toBuffer();
    written = { buf, quality };
    if (buf.length <= MAX_BYTES) break;
  }

  await writeFile(out, written.buf);
  const over = written.buf.length > MAX_BYTES ? '  STILL OVER 6KB' : '';
  console.log(
    `  ${slug}.webp  ${Math.round(written.buf.length / 102.4) / 10}KB at q${written.quality}${over}`,
  );
}
