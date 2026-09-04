/**
 * Shared content loading for the standalone Node scripts.
 *
 * The QR script and the validator both run outside Astro, so neither can use
 * `astro:content`. Both read the same files from disk instead.
 */
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';

export const WAYSIDES_DIR = 'src/content/waysides';
export const AUTHORS_DIR = 'src/content/authors';
export const COLLECTIONS_DIR = 'src/content/collections';
export const AVATAR_DIR = 'public/authors';

// Read from astro.config.mjs so there is one source of truth for printed URLs.
const config = await readFile('astro.config.mjs', 'utf8');
export const site = config.match(/site:\s*'([^']+)'/)?.[1];
export const base = config.match(/base:\s*'([^']+)'/)?.[1] ?? '/';

if (!site) {
  throw new Error('Could not read `site` from astro.config.mjs. QR payloads depend on it.');
}

/** Split a markdown file into its parsed frontmatter and its body. */
export function readFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { data: {}, body: raw };
  return { data: parseYaml(match[1]) ?? {}, body: match[2] };
}

/** Every wayside on disk, `_template.md` excluded the same way the glob loader excludes it. */
export async function loadWaysides() {
  const files = (await readdir(WAYSIDES_DIR))
    .filter((f) => f.endsWith('.md') && !f.startsWith('_'))
    .sort();
  return Promise.all(
    files.map(async (file) => {
      const raw = await readFile(join(WAYSIDES_DIR, file), 'utf8');
      const { data, body } = readFrontmatter(raw);
      return { slug: file.replace(/\.md$/, ''), file: join(WAYSIDES_DIR, file), data, body };
    }),
  );
}

/** Every JSON entry in a directory, keyed by filename without the extension. */
export async function loadJsonDir(dir) {
  const files = (await readdir(dir)).filter((f) => f.endsWith('.json')).sort();
  return Promise.all(
    files.map(async (file) => ({
      slug: file.replace(/\.json$/, ''),
      file: join(dir, file),
      data: JSON.parse(await readFile(join(dir, file), 'utf8')),
    })),
  );
}
