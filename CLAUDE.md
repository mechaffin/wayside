# wayside

Astro static site of short pages read on a phone at a dog show, each behind a
printed QR code. Deployed to GitHub Pages at `mechaffin.github.io/wayside/`.

## Gotchas

**A slug is permanent.** A printed code cannot 404, so never rename a file in
`src/content/waysides/`. Obsolete pages get `supersededBy` and keep serving.

**Every internal link and asset path goes through `link()`** in
[src/lib/resolve.ts](src/lib/resolve.ts). Astro does not prefix `href` for
`base`, so a raw path works in `astro dev` and 404s in production.

**The waysides directory stays flat.** The glob loader derives the entry id from
the path, so a subfolder would put its name in a permanent URL. Membership is
many-to-many and lives on the collection, not the wayside.

**`scripts/` runs outside Astro** and cannot import `astro:content`. Both
scripts read files from disk through
[scripts/lib/content.mjs](scripts/lib/content.mjs), which also parses `site` and
`base` out of [astro.config.mjs](astro.config.mjs).

**Page budget is 50KB including images.** No web fonts, one photo per page,
inline CSS in the layout. Check `dist/` sizes after changing the layout.

## Why it's this way

Content authority: [src/content.config.ts](src/content.config.ts) is the schema.
Anything in prose describing the schema is historical.

Event collections are the print targets. A sheet that needs a subset of a topic
collection gets its own event collection rather than print flags on waysides,
which is why the draft-in-print validation check is scoped to `kind: 'event'`.

Validation lives in a standalone Node script rather than a remark plugin because
half the checks are cross-file relationships (orphans, unused authors, supersede
cycles) that a per-file linter cannot see.

Staleness is a flag, never an action. A page's code is on a sign somewhere, and
whether the content is still correct is a judgment call rather than a date
comparison.
