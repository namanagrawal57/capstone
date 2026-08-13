/* global WebImporter */
/*
 * Import script for WKND adventure detail pages.
 * Produces: hero image, H1 title, an Adventure Details block (Activity, Trip
 * Length, Group Size, Difficulty, Price, …), the Overview body (headings,
 * paragraphs, images), and Metadata. Self-contained.
 */

const PROXY = 'https://wknd.site';

// Maps each adventure slug to its Adventures-page filter category
// (matches the tabs on wknd.site: Climbing / Cycling / Skiing / Surfing / Travel).
const CATEGORY_BY_SLUG = {
  'bali-surf-camp': 'Surfing',
  'beervana-portland': 'Travel',
  'climbing-new-zealand': 'Climbing',
  'colorado-rock-climbing': 'Climbing',
  'cycling-southern-utah': 'Cycling',
  'cycling-tuscany': 'Cycling',
  'downhill-skiing-wyoming': 'Skiing',
  'gastronomic-marais-tour': 'Travel',
  'napa-wine-tasting': 'Travel',
  'riverside-camping-australia': 'Travel',
  'ski-touring-mont-blanc': 'Skiing',
  'surf-camp-costa-rica': 'Surfing',
  'tahoe-skiing': 'Skiing',
  'west-coast-cycling': 'Cycling',
  'whistler-mountain-biking': 'Cycling',
  'yosemite-backpacking': 'Travel',
};

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

/**
 * Extracts the adventure fact list (dt/dd pairs) into [label, value] tuples.
 */
function extractDetails(document) {
  const out = [];
  document.querySelectorAll('dl').forEach((dl) => {
    const dts = [...dl.querySelectorAll('dt')];
    const dds = [...dl.querySelectorAll('dd')];
    dts.forEach((dt, i) => {
      const label = dt.textContent.trim();
      let value = dds[i] ? dds[i].textContent.trim() : '';
      if (/price/i.test(label) && value) value = `$${value.replace(/\.0$/, '')}`;
      if (label && value) out.push([label, value]);
    });
  });
  return out;
}

/**
 * Extracts the Overview body: headings/paragraphs/images from the Overview
 * content fragment, skipping the "Related trips" list. Avoids the hero
 * carousel (which is also role="tabpanel") by preferring the content fragment.
 */
function extractBody(document, titleText) {
  const panel = document.querySelector('.cmp-tabs__tabpanel--active .cmp-contentfragment')
    || document.querySelector('.cmp-tabs__tabpanel--active')
    || document.querySelector('.cmp-contentfragment, article.contentfragment')
    || document.querySelector('.cmp-tabs__tabpanel');
  const container = document.createElement('div');
  if (!panel) return container;
  const norm = (s) => s.replace(/\s+/g, ' ').trim().toLowerCase();
  const seen = new Set();
  panel.querySelectorAll('h2, h3, p, img, [data-cmp-is="image"]').forEach((node) => {
    if (node.tagName === 'IMG' || node.getAttribute('data-cmp-is') === 'image') {
      const img = resolveImage(document, node);
      if (img && !seen.has(img.src)) {
        seen.add(img.src);
        const p = document.createElement('p');
        p.append(img);
        container.append(p);
      }
      return;
    }
    const text = node.textContent.trim();
    if (!text) return;
    if (norm(text) === norm(titleText)) return; // skip duplicate title
    if (/^related trips:?$/i.test(text)) return;
    const tag = node.tagName.toLowerCase();
    const clean = document.createElement(tag);
    clean.textContent = text;
    container.append(clean);
  });
  return container;
}

export default {
  transform: ({ document, params }) => {
    const originalURL = params.originalURL || params.url;
    const main = document.createElement('main');

    // Hero
    const hero = resolveImage(document, document.querySelector('main .cmp-image, main [data-cmp-is="image"]'));
    const s1 = document.createElement('div');
    if (hero) {
      const p = document.createElement('p');
      p.append(hero);
      s1.append(p);
    }
    const h1src = document.querySelector('main h1, h1.cmp-title__text');
    const h1 = document.createElement('h1');
    h1.textContent = (h1src ? h1src.textContent : document.title).trim();
    s1.append(h1);
    main.append(s1);

    // Adventure Details block (own section)
    const details = extractDetails(document);
    if (details.length) {
      const s2 = document.createElement('div');
      const rows = [['Adventure Details']];
      details.forEach(([label, value]) => {
        const l = document.createElement('div');
        l.textContent = label;
        const v = document.createElement('div');
        v.textContent = value;
        rows.push([l, v]);
      });
      s2.append(WebImporter.DOMUtils.createTable(rows, document));
      main.append(s2);
    }

    // Overview body (own section)
    const body = extractBody(document, h1.textContent);
    const s3 = document.createElement('div');
    s3.append(body);

    // Metadata
    const meta = {};
    meta.Title = `${h1.textContent.trim()} | WKND`;
    const firstPara = body.querySelector('p');
    meta.Description = firstPara ? firstPara.textContent.trim().slice(0, 160) : `Join WKND for ${h1.textContent.trim()}.`;
    if (hero) {
      const mimg = document.createElement('img');
      mimg.src = hero.src;
      meta.Image = mimg;
    }
    const slug = new URL(originalURL).pathname.replace(/\.html$/, '').split('/').pop();
    meta.Category = CATEGORY_BY_SLUG[slug] || 'Travel';
    meta.Template = 'adventure';
    s3.append(WebImporter.Blocks.getMetadataBlock(document, meta));
    main.append(s3);

    const path = new URL(originalURL).pathname
      .replace(/^\/us\/en/, '')
      .replace(/\.html$/, '')
      .replace(/\/$/, '');

    return [{
      element: main,
      path: WebImporter.FileUtils.sanitizePath(path || '/index'),
      report: { title: meta.Title, details: details.length },
    }];
  },
};
