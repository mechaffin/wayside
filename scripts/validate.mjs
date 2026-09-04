/**
 * Content checks that Astro's schema cannot express.
 *
 * Zod covers frontmatter shape and `reference()` covers member resolution, so
 * everything here is either about the markdown body or about relationships
 * across files. Exits non-zero on any failure; wired into CI and `prebuild` so
 * a bad merge cannot deploy.
 *
 * Also emits link-report.json: every external URL, the waysides that use it,
 * and the link text. That is a report, not a check, and it is the annual
 * link-rot pass.
 */
import { stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import sharp from 'sharp';
import {
  AVATAR_DIR,
  AUTHORS_DIR,
  COLLECTIONS_DIR,
  loadJsonDir,
  loadWaysides,
} from './lib/content.mjs';

const MAX_BODY_WORDS = 400;
const MAX_OPENING_WORDS = 40;
const MAX_AVATAR_BYTES = 6 * 1024;
const AVATAR_EDGE = 96;
const REPORT_PATH = 'link-report.json';

const failures = [];
const fail = (where, message) => failures.push({ where, message });

const parser = unified().use(remarkParse);

/** Depth-first walk over an mdast tree. */
function* walk(node) {
  yield node;
  for (const child of node.children ?? []) yield* walk(child);
}

/** Visible text of a node, which is what a reader taps on. */
function textOf(node) {
  let out = '';
  for (const n of walk(node)) {
    if (n.type === 'text' || n.type === 'inlineCode') out += n.value;
  }
  return out;
}

function countWords(text) {
  return text.split(/\s+/).filter(Boolean).length;
}

/**
 * Whether a link's visible text is a URL rather than a description.
 *
 * Bare URLs wrap badly and are unreadable on a phone, and they carry none of
 * the context the content rules require next to a link.
 */
function looksLikeUrl(text) {
  const t = text.trim();
  return /^(https?:\/\/|www\.)/i.test(t) || /^[a-z0-9-]+(\.[a-z0-9-]+)+\/\S*$/i.test(t);
}

const waysides = await loadWaysides();
const collections = await loadJsonDir(COLLECTIONS_DIR);
const authors = await loadJsonDir(AUTHORS_DIR);

const waysideSlugs = new Set(waysides.map((w) => w.slug));
const linkReport = new Map();

for (const wayside of waysides) {
  const at = wayside.file;
  const tree = parser.parse(wayside.body);
  const nodes = [...walk(tree)];

  const bodyWords = countWords(nodes.filter((n) => n.type === 'text' || n.type === 'inlineCode').map((n) => n.value).join(' '));
  if (bodyWords > MAX_BODY_WORDS) {
    fail(at, `Body is ${bodyWords} words, over the ${MAX_BODY_WORDS} limit. That is two waysides, or it belongs in a linked document.`);
  }

  for (const heading of nodes.filter((n) => n.type === 'heading')) {
    if (heading.depth === 1) {
      fail(at, 'Body contains a `#` heading. The title comes from frontmatter and the layout renders it.');
    } else if (heading.depth > 3) {
      fail(at, `Body contains an h${heading.depth}. Headings stop at \`###\`.`);
    }
  }

  const images = nodes.filter((n) => n.type === 'image');
  const htmlImages = nodes.filter((n) => n.type === 'html' && /<img\b/i.test(n.value));
  if (images.length + htmlImages.length > 1) {
    fail(at, `${images.length + htmlImages.length} images in the body. One maximum; author avatars do not count.`);
  }
  for (const image of images) {
    if (!image.alt?.trim()) fail(at, `Image \`${image.url}\` has no alt text.`);
  }
  for (const raw of htmlImages) {
    if (!/\balt\s*=\s*["'][^"']+["']/i.test(raw.value)) fail(at, 'Raw `<img>` in the body has no alt text.');
  }

  for (const link of nodes.filter((n) => n.type === 'link')) {
    const text = textOf(link);
    if (looksLikeUrl(text)) {
      fail(at, `Link text is a URL: \`${text}\`. Describe the document instead.`);
    }
    if (/^https?:\/\//i.test(link.url)) {
      const uses = linkReport.get(link.url) ?? [];
      uses.push({ wayside: wayside.slug, text: text.trim() });
      linkReport.set(link.url, uses);
    }
  }

  const opening = tree.children.find((n) => n.type !== 'html');
  if (!opening || opening.type !== 'paragraph') {
    fail(at, 'Body does not open with a paragraph. The first sentence has to orient the reader before anything else.');
  } else {
    const openingWords = countWords(textOf(opening));
    if (openingWords > MAX_OPENING_WORDS) {
      fail(at, `Opening paragraph is ${openingWords} words, over the ${MAX_OPENING_WORDS} limit.`);
    }
  }

  const successor = wayside.data.supersededBy;
  if (successor) {
    if (successor === wayside.slug) {
      fail(at, '`supersededBy` points at this wayside.');
    } else if (!waysideSlugs.has(successor)) {
      fail(at, `\`supersededBy\` names \`${successor}\`, which is not a wayside.`);
    }
  }
}

// Supersede cycles. Two pages pointing at each other means a reader following
// the banner never reaches a current page.
const successorOf = new Map(waysides.filter((w) => w.data.supersededBy).map((w) => [w.slug, w.data.supersededBy]));
for (const start of successorOf.keys()) {
  const seen = new Set([start]);
  let current = successorOf.get(start);
  while (current && successorOf.has(current)) {
    if (seen.has(current)) {
      fail(join('src/content/waysides', `${start}.md`), `\`supersededBy\` forms a cycle: ${[...seen, current].join(' -> ')}`);
      break;
    }
    seen.add(current);
    current = successorOf.get(current);
  }
}

const memberOfSome = new Set();
for (const collection of collections) {
  const members = collection.data.members ?? [];
  const seen = new Set();
  for (const member of members) {
    if (seen.has(member)) {
      fail(collection.file, `\`${member}\` appears twice in members. Print order has to be one deliberate list.`);
    }
    seen.add(member);
    memberOfSome.add(member);
  }

  // Event collections are the print targets: a sheet that needs a subset of a
  // topic collection gets its own event collection rather than print flags on
  // waysides. A draft has no QR code, so a draft on a sheet prints an empty box.
  if (collection.data.kind === 'event') {
    for (const member of members) {
      const wayside = waysides.find((w) => w.slug === member);
      if (wayside && (wayside.data.status ?? 'draft') !== 'live') {
        fail(collection.file, `\`${member}\` is a draft and this collection gets printed. Drafts have no QR code.`);
      }
    }
  }
}

for (const wayside of waysides) {
  if (!memberOfSome.has(wayside.slug)) {
    fail(wayside.file, 'Belongs to no collection, so nothing links to it. Add it to a collection or delete the file.');
  }
}

const referencedAuthors = new Set(
  waysides.flatMap((w) => [...(w.data.authors ?? []), ...(w.data.reviewedBy ?? [])]),
);
for (const author of authors) {
  if (!referencedAuthors.has(author.slug)) {
    fail(author.file, 'Referenced by no wayside. An unused author entry drifts silently.');
  }
  const { avatar } = author.data;
  if (!avatar) continue;
  const path = join(AVATAR_DIR, avatar);
  try {
    const { size } = await stat(path);
    if (size > MAX_AVATAR_BYTES) {
      fail(author.file, `Avatar ${avatar} is ${Math.round(size / 102.4) / 10}KB, over the 6KB limit.`);
    }
    const { width, height } = await sharp(path).metadata();
    if (width !== height) {
      fail(author.file, `Avatar ${avatar} is ${width}x${height}. It renders in a 40px circle, so it has to be square.`);
    } else if (width !== AVATAR_EDGE) {
      fail(author.file, `Avatar ${avatar} is ${width}px. Source them at ${AVATAR_EDGE}px.`);
    }
  } catch {
    fail(author.file, `Avatar ${avatar} is not in ${AVATAR_DIR}/.`);
  }
}

await writeFile(
  REPORT_PATH,
  `${JSON.stringify(
    {
      generated: new Date().toISOString().slice(0, 10),
      links: [...linkReport.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([url, uses]) => ({ url, uses })),
    },
    null,
    2,
  )}\n`,
  'utf8',
);

console.log(`${waysides.length} waysides, ${collections.length} collections, ${authors.length} authors checked.`);
console.log(`${linkReport.size} external URLs written to ${REPORT_PATH}.`);

if (failures.length > 0) {
  console.error(`\n${failures.length} problem${failures.length === 1 ? '' : 's'}:\n`);
  for (const { where, message } of failures) console.error(`  ${where}\n    ${message}\n`);
  process.exit(1);
}
console.log('\nAll checks passed.');
