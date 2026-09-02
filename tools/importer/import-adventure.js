/* global WebImporter */
/*
 * Import script for WKND adventure detail pages.
 *
 * Matches wknd.site structure:
 *   - Hero image
 *   - H1 title (styled with a yellow accent rule via the adventure template CSS)
 *   - Adventure Details block (Activity, Trip Length, Group Size, Difficulty,
 *     Price, … rendered as an inline fact row)
 *   - Share block ("Share this Adventure")
 *   - Tabs block (Overview / Itinerary / What to Bring)
 *   - Metadata
 *
 * Content is read from each adventure's Content Fragment JSON, which the AEM
 * Core Components embed verbatim in the `data-cmp-data-layer` attribute of the
 * `.cmp-contentfragment` article. That JSON exposes every element (the detail
 * facts plus the Description/Itinerary/What to Bring rich-text bodies) as clean
 * HTML — a far more robust source than scraping the rendered tab panels.
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

// Order + labels of the detail facts as shown on wknd.site.
const DETAIL_ORDER = ['Activity', 'Adventure Type', 'Trip Length', 'Group Size', 'Difficulty', 'Price'];

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
 * Reads the adventure Content Fragment elements ({title -> html/text}) from the
 * embedded data-layer JSON. Returns a Map preserving insertion order.
 */
function readFragmentElements(document) {
  const map = new Map();
  document.querySelectorAll('.cmp-contentfragment[data-cmp-data-layer]').forEach((cf) => {
    let data;
    try {
      data = JSON.parse(cf.getAttribute('data-cmp-data-layer'));
    } catch (e) {
      return;
    }
    Object.values(data).forEach((entry) => {
      (entry.elements || []).forEach((el) => {
        const title = el['xdm:title'];
        const text = el['xdm:text'] || '';
        if (title && !map.has(title)) map.set(title, text);
      });
    });
  });
  return map;
}

/**
 * Parses an HTML string into clean, EDS-friendly nodes (p / ul / ol / headings),
 * dropping the AEM grid wrapper <div>s the Core Components inject.
 * @returns {HTMLElement} a container div holding the cleaned children
 */
function parseRichText(document, htmlString) {
  const container = document.createElement('div');
  if (!htmlString) return container;
  const scratch = document.createElement('div');
  scratch.innerHTML = htmlString;
  scratch.querySelectorAll('div').forEach((d) => d.remove()); // strip aem-Grid noise
  [...scratch.childNodes].forEach((node) => {
    if (node.nodeType === 1) {
      const text = node.textContent.trim();
      if (!text && !node.querySelector('img')) return;
      container.append(node.cloneNode(true));
    }
  });
  return container;
}

export default {
  transform: ({ document, params }) => {
    const originalURL = params.originalURL || params.url;
    const slug = new URL(originalURL).pathname.replace(/\.html$/, '').split('/').pop();
    const main = document.createElement('main');
    const elements = readFragmentElements(document);

    // ---- Section 1: hero + title -------------------------------------------
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

    // ---- Section 2: Adventure Details (inline fact row) --------------------
    const details = DETAIL_ORDER
      .filter((label) => elements.has(label))
      .map((label) => {
        let value = (elements.get(label) || '').replace(/<[^>]+>/g, '').trim();
        if (/price/i.test(label) && value) value = `$${value.replace(/\.0$/, '')}`;
        return [label, value];
      })
      .filter(([, value]) => value);

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

      // Share this Adventure widget (sits alongside the details on wknd.site)
      s2.append(WebImporter.DOMUtils.createTable([
        ['Share'],
        ['Share this Adventure'],
      ], document));
      main.append(s2);
    }

    // ---- Section 3: Tabs (Overview / Itinerary / What to Bring) ------------
    const TAB_SOURCES = [
      ['Overview', elements.get('Description')],
      ['Itinerary', elements.get('Itinerary')],
      ['What to Bring', elements.get('What to Bring')],
    ].filter(([, htmlString]) => htmlString && htmlString.trim());

    if (TAB_SOURCES.length) {
      const s3 = document.createElement('div');
      const rows = [['Tabs']];
      TAB_SOURCES.forEach(([label, htmlString]) => {
        const labelCell = document.createElement('div');
        labelCell.textContent = label;
        const bodyCell = parseRichText(document, htmlString);
        rows.push([labelCell, bodyCell]);
      });
      s3.append(WebImporter.DOMUtils.createTable(rows, document));
      main.append(s3);
    }

    // ---- Metadata ----------------------------------------------------------
    const s4 = document.createElement('div');
    const meta = {};
    meta.Title = h1.textContent.trim();
    const overview = parseRichText(document, elements.get('Description'));
    const firstPara = overview.querySelector('p');
    meta.Description = firstPara ? firstPara.textContent.trim().slice(0, 160) : `Join WKND for ${h1.textContent.trim()}.`;
    if (hero) {
      const mimg = document.createElement('img');
      mimg.src = hero.src;
      meta.Image = mimg;
    }
    meta.Category = CATEGORY_BY_SLUG[slug] || 'Travel';
    meta.Template = 'adventure';
    s4.append(WebImporter.Blocks.getMetadataBlock(document, meta));
    main.append(s4);

    const path = new URL(originalURL).pathname
      .replace(/^\/us\/en/, '')
      .replace(/\.html$/, '')
      .replace(/\/$/, '');

    return [{
      element: main,
      path: WebImporter.FileUtils.sanitizePath(path || '/index'),
      report: { title: meta.Title, details: details.length, tabs: TAB_SOURCES.length },
    }];
  },
};
