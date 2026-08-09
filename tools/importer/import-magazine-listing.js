/* global WebImporter */
/*
 * Import script for the WKND Magazine section landing page.
 * Produces H1, a featured teaser (Columns), an "All Articles" heading,
 * an index-driven Article List block, and Metadata. Self-contained.
 */

const PROXY = 'https://wknd.site';

function resolveImage(document, el, alt = '') {
  if (!el) return null;
  const imgEl = el.tagName === 'IMG' ? el : el.querySelector('img');
  let src = (imgEl && (imgEl.getAttribute('src') || (imgEl.getAttribute('srcset') || '').split(' ')[0]))
    || el.getAttribute('data-cmp-src')
    || (el.querySelector && el.querySelector('[data-cmp-src]') && el.querySelector('[data-cmp-src]').getAttribute('data-cmp-src'));
  if (!src) return null;
  src = src.replace('{.width}', '');
  if (src.startsWith('/')) src = `${PROXY}${src}`;
  const img = document.createElement('img');
  img.src = src;
  img.alt = alt || (imgEl && imgEl.getAttribute('alt')) || '';
  return img;
}

function cleanHref(href) {
  return (href || '')
    .replace(/^https?:\/\/wknd\.site/, '')
    .replace(/^\/us\/en\/about-us/, '/about')
    .replace(/^\/us\/en/, '')
    .replace(/\.html$/, '') || '/';
}

export default {
  transform: ({ document, params }) => {
    const originalURL = params.originalURL || params.url;
    const main = document.createElement('main');

    const h1 = document.createElement('h1');
    h1.textContent = 'Magazine';
    main.append(h1);

    // Featured teaser → Columns
    const teaser = document.querySelector('.cmp-teaser--featured, .cmp-teaser');
    if (teaser) {
      const title = teaser.querySelector('.cmp-teaser__title, h2, h3');
      // Target the description explicitly. A generic `p` fallback would grab
      // the "Featured Article" pretitle, which precedes the description.
      const descEl = teaser.querySelector('.cmp-teaser__description')
        || [...teaser.querySelectorAll('p')].find((p) => !/featured article/i.test(p.textContent));
      const cta = teaser.querySelector('a[href]');
      const img = resolveImage(document, teaser.querySelector('.cmp-image, [data-cmp-is="image"], img'), title ? title.textContent.trim() : 'Featured');

      const textCell = document.createElement('div');
      const pre = document.createElement('p');
      const strong = document.createElement('strong');
      strong.textContent = 'Featured Article';
      pre.append(strong);
      textCell.append(pre);
      if (title) {
        const h2 = document.createElement('h2');
        h2.textContent = title.textContent.trim();
        textCell.append(h2);
      }
      if (descEl) {
        const p = document.createElement('p');
        p.textContent = descEl.textContent.trim();
        textCell.append(p);
      }
      if (cta) {
        const p = document.createElement('p');
        const a = document.createElement('a');
        a.href = cleanHref(cta.getAttribute('href'));
        a.textContent = 'Read More';
        p.append(a);
        textCell.append(p);
      }
      const imageCell = document.createElement('div');
      if (img) imageCell.append(img);
      main.append(WebImporter.DOMUtils.createTable([['Columns'], [textCell, imageCell]], document));
    }

    const h2all = document.createElement('h2');
    h2all.textContent = 'All Articles';
    main.append(h2all);

    // Article List — index driven
    main.append(WebImporter.DOMUtils.createTable([
      ['Article List'],
      ['Path', '/magazine/'],
    ], document));

    // Metadata
    const meta = {};
    meta.Title = 'Magazine | WKND';
    const desc = document.querySelector('meta[name="description"], meta[property="og:description"]');
    meta.Description = desc ? desc.getAttribute('content') : 'Explore the WKND magazine: stories from surfers, skiers, skaters and adventurers around the world.';
    meta.Template = 'magazine-listing';
    main.append(WebImporter.Blocks.getMetadataBlock(document, meta));

    const path = new URL(originalURL).pathname
      .replace(/^\/us\/en/, '')
      .replace(/\.html$/, '')
      .replace(/\/$/, '');

    return [{
      element: main,
      path: WebImporter.FileUtils.sanitizePath(path || '/magazine'),
      report: { title: meta.Title },
    }];
  },
};
