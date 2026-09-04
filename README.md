# wayside

Phone-readable pages behind printed QR codes, at
[mechaffin.github.io/wayside](https://mechaffin.github.io/wayside/).

A *wayside* is one page behind one code, named after the National Park Service
term for an interpretive panel beside a trail. A *collection* is a named,
ordered group of waysides, and it is both the site's navigation and the print
order for a sheet of codes.

Content is markdown. Codes are generated at build time. No CMS, no server, and
no JavaScript required to read a page.

Pilot target: the Evergreen Basenji Club CAT trial in November 2026, with four
codes on one taped sheet.

## Quick start

```sh
npm install
npm run dev        # http://localhost:4321/wayside
npm run validate   # content checks, writes link-report.json
npm run build      # runs validate and the QR script first
```

Node 22.12 or newer.

## What is where

| Path | What |
|---|---|
| [src/content/waysides/](src/content/waysides/) | One markdown file per page. Flat, on purpose. |
| [src/content/collections/](src/content/collections/) | Ordered membership and print order. |
| [src/content/authors/](src/content/authors/) | Bylines, written once and referenced. |
| [src/content.config.ts](src/content.config.ts) | The schema. Authority over any prose describing it. |
| [src/lib/resolve.ts](src/lib/resolve.ts) | Reverse index, base-URL joining, staleness. |
| [scripts/validate.mjs](scripts/validate.mjs) | Content checks Zod cannot express. |
| [scripts/build-qr.mjs](scripts/build-qr.mjs) | One SVG per live wayside and per collection. |

## Routes

| Route | For |
|---|---|
| `/w/<slug>` | One wayside. This is what a printed code points at. |
| `/c/<slug>` | A collection, in order. The link for an entry confirmation email. |
| `/` | Every collection, topics first. |
| `/print/<collection>` | One US Letter sheet of codes. Print from the browser. |
| `/inventory` | Maintainer view. Open this before writing anything new. |

## The two things that cannot be undone

**A slug is permanent.** Once a code is printed, that URL exists on paper and
can never 404. Retitle, rewrite, replace the photo, but never rename the file.
When a page is obsolete, set its `supersededBy` and leave it serving.

**The repository name is permanent** for the same reason.

Everything else is reversible.

## Before you print a sheet

1. `npm run validate` passes.
2. Every wayside on the sheet is `status: live` and has been read by someone
   other than its author, named in `reviewedBy`.
3. Every external link in [link-report.json](scripts/validate.mjs) still
   resolves. Nothing in the repository checks this for you.
4. Print the sheet, put it in a sheet protector, and scan every code off the
   paper under a lamp. A code tested only against a monitor has not been
   tested.

## Licensing

Two licenses, because the repository holds two kinds of work.

| File | Covers | License |
|---|---|---|
| [LICENSE](LICENSE) | Astro components, build scripts, config | MIT |
| [LICENSE-CONTENT](LICENSE-CONTENT) | Wayside prose, photos, collection data | CC BY 4.0 |

Attribution string for reusing a page:

> "\<page title\>" from wayside by Mary Ellen Chaffin, licensed CC BY 4.0.
> https://mechaffin.github.io/wayside/w/\<slug\>

Where a page's frontmatter names more than one author, credit all of them.

**Trademarks are excluded from both licenses.** A club or registry mark belongs
to its owner. A logo in `public/authors/` is there because its owner permitted
it, and that permission does not transfer to you.

[CONTRIBUTING.md](CONTRIBUTING.md) has the rest, including the one thing a pull
request confirms legally.

## Analytics

GoatCounter, no cookies, roughly 3KB, one line in
[WaysideLayout.astro](src/layouts/WaysideLayout.astro). It does not count on
localhost, so an empty dashboard during development is expected.

The measurement that matters after the trial is views per `/w/` route by hour.
If one route dominates, placement matters more than content. If everything is
near zero, the channel is wrong and the answer is the entry confirmation email
rather than bigger signs.
