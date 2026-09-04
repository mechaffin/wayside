# Contributing

## What you are agreeing to

**Opening a pull request confirms that you wrote the material you are
submitting, or that you have the right to license it under CC BY 4.0.**

That is the one thing in this file with legal weight. The common way it goes
wrong is a photograph: a good ringside shot usually belongs to the person who
took it, not the person submitting it. If you did not take the photo, get the
photographer's permission in writing before you open the pull request, and name
them in the page's `photoCredit` frontmatter.

Club and registry logos are the other case. A mark belongs to its owner and is
not licensed by this repository. Do not add one without that owner's
permission.

## Two things you cannot change

**A slug is permanent.** Once a code is printed, that URL is on paper in the
world and can never 404. Rename the title, rewrite the body, replace the photo,
but never rename the file. When a page becomes obsolete, point its
`supersededBy` at the replacement and leave it serving.

**The repository name is permanent** for the same reason. It appears in every
printed URL.

## Writing a wayside

Start from [_template.md](src/content/waysides/_template.md). It carries the
frontmatter fields and the content rules as comments, and it is the fastest way
to get a page that reads like the others.

Before you write anything, open [/inventory](src/pages/inventory.astro) in
`npm run dev`. The page you have in mind usually already exists, and adding to
it beats adding beside it.

The rules the validator enforces:

- Under 400 words. Longer means it is two waysides, or it belongs in a linked
  document.
- The opening paragraph is under 40 words and names what is physically in front
  of the reader.
- No `#` in the body. Headings run `##` to `###`.
- One photo maximum, alt text required.
- No bare URL as link text.
- Every wayside belongs to at least one collection.

The rules it cannot enforce, which matter more:

- **Never restate a document you do not own.** Schedules, judging programs,
  premium lists, and AKC regulations get linked, never retyped. This is what
  keeps a printed code from going stale.
- **Write for the collection, not the stop.** A page in two collections cannot
  assume the reader arrived from either, so state the sport when it matters.
- **Second person, contractions fine, no exclamation marks.** A first-timer is
  already nervous, and enthusiasm reads as pressure.

## Local checks

```sh
npm install
npm run validate    # content checks, writes link-report.json
npm run dev         # http://localhost:4321/wayside
npm run build       # runs validate and the QR script first
```

`npm run validate` runs in CI on every pull request and again in `prebuild`, so
a bad merge cannot deploy.

Verify a new page at 320px wide with the network throttled. That is the device
and the connection it will actually be read on.

## Flipping a page live

`status: draft` means no QR code and no place on a print sheet. Flip to `live`
only after someone has read the page, and put that person in `reviewedBy`.

Before a sheet goes to a printer: print it, put it in a sheet protector, and
scan every code off the paper under a lamp. A code that only ever scanned off a
monitor has not been tested.

## Review

`main` requires a pull request and passing checks. Content changes get read for
accuracy, not just for mechanics, because a wrong page at a trial is worse than
no page.
