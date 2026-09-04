// @ts-check
import { defineConfig } from 'astro/config';

// site and base are the source of truth for every printed URL. The QR script
// reads them from here rather than duplicating a path, because a code that
// scans to a 404 is already on paper by the time anyone notices.
export default defineConfig({
  site: 'https://mechaffin.github.io',
  base: '/wayside',
  trailingSlash: 'ignore',
  build: {
    // Directory format writes /w/paddock/index.html, so the printed URL
    // /w/paddock resolves on GitHub Pages without a redirect.
    format: 'directory',
  },
});
