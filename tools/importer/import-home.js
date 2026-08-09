/* global WebImporter */
/*
 * Import script for the WKND home page.
 * Produces a hero, featured teaser (Columns), a "Recent Articles" heading
 * with an index-driven Article List block, and Metadata. Self-contained.
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
  transform: ({ document }) => {
    const main = document.createElement('main');

    // Hero block: first carousel slide image + heading + CTA
    const firstSlide = document.querySelector('.cmp-carousel__item, [class*="carousel"] .cmp-teaser, .cmp-teaser--hero');
    const heroImg = resolveImage(
      document,
      document.querySelector('[class*="carousel"] .cmp-image, [class*="carousel"] [data-cmp-is="image"], [class*="carousel"] img'),
      'WKND Adventures',
    );
    const heroCell = document.createElement('div');
    if (heroImg) heroCell.append(heroImg);
    const h1 = document.createElement('h1');
    h1.textContent = 'WKND Adventures and Travel';
    heroCell.append(h1);
    const heroP = document.createElement('p');
    heroP.textContent = firstSlide && firstSlide.querySelector('.cmp-teaser__description')
      ? firstSlide.querySelector('.cmp-teaser__description').textContent.trim()
      : 'Join us on one of our next adventures. Browse our list of curated experiences and sign up when you’re ready to explore with us.';
    heroCell.append(heroP);
    const ctaP = document.createElement('p');
    const cta = document.createElement('a');
    cta.href = '/adventures';
    const ctaStrong = document.createElement('strong');
    ctaStrong.textContent = 'View Trips';
    cta.append(ctaStrong);
    ctaP.append(cta);
    heroCell.append(ctaP);
    main.append(WebImporter.DOMUtils.createTable([['Hero'], [heroCell]], document));

    // Featured article teaser → Columns
    const featured = document.querySelector('.cmp-teaser--featured');
    if (featured) {
      const title = featured.querySelector('.cmp-teaser__title, h2, h3');
      // Target the description explicitly so the "Featured Article" pretitle
      // paragraph (which precedes it) is not picked up by a generic `p`.
      const descEl = featured.querySelector('.cmp-teaser__description')
        || [...featured.querySelectorAll('p')].find((p) => !/featured article/i.test(p.textContent));
      const link = featured.querySelector('a[href]');
      const img = resolveImage(document, featured.querySelector('.cmp-image, [data-cmp-is="image"], img'), title ? title.textContent.trim() : 'Featured');
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
      const linkP = document.createElement('p');
      const a = document.createElement('a');
      a.href = cleanHref(link && link.getAttribute('href'));
      a.textContent = 'Full Article';
      linkP.append(a);
      textCell.append(linkP);
      const imageCell = document.createElement('div');
      if (img) imageCell.append(img);
      main.append(WebImporter.DOMUtils.createTable([['Columns'], [textCell, imageCell]], document));
    }

    // Recent Articles → Article List (index driven, newest 4)
    const recent = document.createElement('h2');
    recent.textContent = 'Recent Articles';
    main.append(recent);
    main.append(WebImporter.DOMUtils.createTable([
      ['Article List'],
      ['Path', '/magazine/'],
      ['Limit', '4'],
    ], document));
    const allP = document.createElement('p');
    const allA = document.createElement('a');
    allA.href = '/magazine';
    const allEm = document.createElement('em');
    allEm.textContent = 'All Articles';
    allA.append(allEm);
    allP.append(allA);
    main.append(allP);

    // Metadata
    const meta = {};
    meta.Title = 'WKND Adventures and Travel';
    const desc = document.querySelector('meta[name="description"], meta[property="og:description"]');
    meta.Description = desc ? desc.getAttribute('content') : 'WKND is your guide to adventure and travel: curated trips and stories from around the world.';
    if (heroImg) {
      const mimg = document.createElement('img');
      mimg.src = heroImg.src;
      meta.Image = mimg;
    }
    meta.Template = 'home';
    main.append(WebImporter.Blocks.getMetadataBlock(document, meta));

    return [{
      element: main,
      path: '/index',
      report: { title: meta.Title },
    }];
  },
};
