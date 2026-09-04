/**
 * Emit a QR code SVG for every live wayside and every collection.
 *
 * Runs before `astro build`. URLs are built from `site` and `base` in
 * astro.config.mjs, never from a hardcoded path, because a code that scans to
 * a 404 is already on paper by the time anyone notices.
 */
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import QRCode from 'qrcode';
import { site, base, WAYSIDES_DIR, COLLECTIONS_DIR, readFrontmatter } from './lib/content.mjs';

const OUT_DIR = 'public/qr';

// Level M tolerates the scuffing a taped tabletop sheet gets. Higher levels
// shrink payload capacity without helping at these URL lengths.
const QR_OPTIONS = {
  errorCorrectionLevel: 'M',
  type: 'svg',
  margin: 2,
  color: { dark: '#000000', light: '#ffffff' },
};

function urlFor(path) {
  const prefix = base.replace(/\/$/, '');
  return new URL(`${prefix}/${path.replace(/^\//, '')}`, site).href;
}

async function liveWaysideSlugs() {
  const files = (await readdir(WAYSIDES_DIR)).filter((f) => f.endsWith('.md') && !f.startsWith('_'));
  const slugs = [];
  for (const file of files) {
    const { data } = readFrontmatter(await readFile(join(WAYSIDES_DIR, file), 'utf8'));
    if ((data.status ?? 'draft') === 'live') slugs.push(file.replace(/\.md$/, ''));
  }
  return slugs.sort();
}

async function collectionSlugs() {
  const files = (await readdir(COLLECTIONS_DIR)).filter((f) => f.endsWith('.json'));
  return files.map((f) => f.replace(/\.json$/, '')).sort();
}

const targets = [
  ...(await liveWaysideSlugs()).map((slug) => ({ slug, path: `/w/${slug}` })),
  ...(await collectionSlugs()).map((slug) => ({ slug, path: `/c/${slug}` })),
];

// Wiped each run so a wayside flipped back to draft does not leave a stale
// code behind for the print route to pick up.
await rm(OUT_DIR, { recursive: true, force: true });
await mkdir(OUT_DIR, { recursive: true });

for (const { slug, path } of targets) {
  const url = urlFor(path);
  const svg = await QRCode.toString(url, QR_OPTIONS);
  await writeFile(join(OUT_DIR, `${slug}.svg`), svg, 'utf8');
  console.log(`  ${slug}.svg  ${url}`);
}

console.log(`\n${targets.length} codes written to ${OUT_DIR}/`);
