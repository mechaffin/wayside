import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const waysides = defineCollection({
  // The bracket excludes _template.md from the collection.
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/waysides' }),
  schema: z.object({
    // Page heading, and the label beside the code on a printed sheet.
    // Capped so the print label does not wrap.
    title: z.string().max(40),

    // One line under the code on the printed sheet. Not shown on the page.
    printLabel: z.string().max(60),

    // Surfaced to the reader so they can judge freshness.
    updated: z.coerce.date(),

    // Rendered as a byline. References, not strings, so a name and its
    // credential are written once and cannot drift across files. An array
    // because co-written club material is normal.
    authors: z.array(reference('authors')).min(1),

    // The strongest credibility signal on the page. Breed and sport
    // education reviewed by a judge or a longtime breeder is a different
    // document than the same words unattributed.
    reviewedBy: z.array(reference('authors')).default([]),

    // Only live waysides get a QR code or appear on a print sheet.
    status: z.enum(['draft', 'live']).default('draft'),

    // A printed code can never 404, so a wayside is never deleted. When the
    // content is obsolete, point here and the layout shows a banner above
    // the body directing the reader to the current page.
    supersededBy: reference('waysides').optional(),

    // Only when a photo is not the author's.
    photoCredit: z.string().optional(),
  }),
});

// A person, a club, or a committee. A club position statement has no
// individual author, and forcing one would misrepresent it.
const authors = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/authors' }),
  schema: z.object({
    // Written exactly as it should read in a byline, article included:
    // "Mary Ellen Chaffin", "the Evergreen Basenji Club".
    name: z.string(),

    // One line, shown under a byline where it earns trust.
    // "AKC lure coursing judge" or "AKC parent club for the breed".
    credential: z.string().optional(),

    // Something they already publish: a kennel site, a club page.
    // Theirs to offer, and nothing here that is not already public.
    link: z.url().optional(),

    // Filename in public/authors/. Square, 96px source, WebP, under 6KB,
    // rendered at 40px beside the byline and lazy-loaded. Pre-sized by hand;
    // a full-resolution headshot dropped in here blows the page budget on
    // its own. A club logo is fine where the club has the right to publish
    // it, which is not true of every parent or registry mark.
    avatar: z.string().optional(),
  }),
});

const waysideCollections = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/collections' }),
  schema: z.object({
    title: z.string(),

    // Shown at the top of /c/<slug>.
    summary: z.string(),

    // A topic collection is durable and grows. An event collection records
    // the exact set of codes deployed at one event.
    kind: z.enum(['topic', 'event']),

    // Ordered. Index order and print order are the same list.
    members: z.array(reference('waysides')).min(1),

    // Set when the sheet is printed. Not enforced; it is the record of when
    // this set of codes went onto paper.
    printedOn: z.coerce.date().optional(),
  }),
});

export const collections = {
  waysides,
  authors,
  collections: waysideCollections,
};
