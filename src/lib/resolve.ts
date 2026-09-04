import { getCollection, getEntry, type CollectionEntry } from 'astro:content';

export type Wayside = CollectionEntry<'waysides'>;
export type WaysideCollection = CollectionEntry<'collections'>;
export type Author = CollectionEntry<'authors'>;

/** A wayside is marked for review this many days after its `updated` date. */
const STALE_AFTER_DAYS = 548;

/**
 * Join a site-relative path onto the configured base.
 *
 * Astro does not prefix href values, so every internal link and every asset
 * path goes through here. A link that works in `astro dev` and 404s in
 * production is almost always a path that skipped this.
 */
export function link(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}/${path.replace(/^\//, '')}`;
}

/** Absolute URL for a page, built from `site` and `base`. This is what a QR code encodes. */
export function absolute(path: string): string {
  return new URL(link(path), import.meta.env.SITE).href;
}

/** Collections that list this wayside, in the order the collections themselves load. */
export async function collectionsFor(slug: string): Promise<WaysideCollection[]> {
  const all = await getCollection('collections');
  return all.filter((c) => c.data.members.some((m) => m.id === slug));
}

/**
 * Resolve a collection's members to wayside entries, preserving list order.
 *
 * Astro's `reference()` guarantees each id exists, so a missing member is a
 * build error rather than something to handle here.
 */
export async function membersOf(collection: WaysideCollection): Promise<Wayside[]> {
  const entries = await Promise.all(
    collection.data.members.map((ref) => getEntry('waysides', ref.id)),
  );
  return entries.filter((e): e is Wayside => Boolean(e));
}

/** Resolve author references to entries, preserving byline order. */
export async function resolveAuthors(
  refs: { id: string }[],
): Promise<Author[]> {
  const entries = await Promise.all(refs.map((ref) => getEntry('authors', ref.id)));
  return entries.filter((e): e is Author => Boolean(e));
}

/** Every wayside, sorted by id so the inventory table has a stable order. */
export async function allWaysides(): Promise<Wayside[]> {
  const all = await getCollection('waysides');
  return all.sort((a, b) => a.id.localeCompare(b.id));
}

/** Live waysides only. Drafts get no QR code and cannot go on a print sheet. */
export async function liveWaysides(): Promise<Wayside[]> {
  return (await allWaysides()).filter((w) => w.data.status === 'live');
}

/** Topic collections first, then event collections, alphabetical within each. */
export async function allCollections(): Promise<WaysideCollection[]> {
  const all = await getCollection('collections');
  return all.sort((a, b) => {
    if (a.data.kind !== b.data.kind) return a.data.kind === 'topic' ? -1 : 1;
    return a.data.title.localeCompare(b.data.title);
  });
}

/**
 * Whether a wayside is old enough to warrant a look.
 *
 * A flag, never an action. The page keeps serving because its code is on a
 * sign somewhere, and whether the content is still correct is a judgment call
 * rather than a date comparison.
 */
export function isStale(updated: Date, now: Date = new Date()): boolean {
  const days = (now.getTime() - updated.getTime()) / 86_400_000;
  return days > STALE_AFTER_DAYS;
}

/** ISO date, which is what the `datetime` attribute of a `<time>` element wants. */
export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Date as a reader sees it in a footer: "4 September 2026". */
export function readableDate(d: Date): string {
  return d.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
