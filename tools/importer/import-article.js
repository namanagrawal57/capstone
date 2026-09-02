/* global WebImporter */
/*
 * Import script for WKND magazine article pages.
 *
 * Produces clean EDS markup: hero image, H1 title + byline, article body,
 * a section break, a Contributor block (avatar, name, role, author social
 * links), and Metadata.
 *
 * Self-contained: block markup is built inline here. The standard-contract
 * parsers in ./parsers are the reusable, validated building blocks; this
 * script mirrors their output so a single bundled file drives the import.
 */

const PROXY = 'https://wknd.site';

// Publish dates from the original WKND article pages (YYYY-MM-DD),
// used to order the query index deterministically.
const PUBLISH_DATES = {
  'arctic-surfing': '2020-07-09',
  'western-australia': '2020-09-30',
  'san-diego-surf': '2020-07-09',
  'ski-touring': '2020-09-30',
  'guide-la-skateparks': '2020-09-30',
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
 * Reads an image's *rendered* caption. On wknd.site only images with an authored
 * caption render a `.cmp-image__title` element (the asset `dc:title` alone is not
 * shown), so that element is the reliable source. Returns '' when there's none.
 */
function imageCaption(node) {
  const holder = node.tagName === 'IMG'
    ? (node.closest('[data-cmp-is="image"]') || node.closest('.cmp-image') || node.parentElement)
    : node;
  if (!holder) return '';
  const titleEl = holder.querySelector('.cmp-image__title');
  return titleEl ? titleEl.textContent.trim() : '';
}

/**
 * Extracts article body nodes from the content-fragment region, in order.
 * Images keep any authored caption (rendered as an italic line beneath them).
 */
function extractBody(document, titleText) {
  const cf = document.querySelector('.cmp-contentfragment, article.contentfragment');
  const container = document.createElement('div');
  if (!cf) return container;
  const nodes = cf.querySelectorAll('h2, h3, h4, h5, h6, p, blockquote, img, [data-cmp-is="image"]');
  const seen = new Set();
  const norm = (s) => s.replace(/\s+/g, ' ').trim().toLowerCase();
  nodes.forEach((node) => {
    if (/^h[1-6]$/i.test(node.tagName) && norm(node.textContent) === norm(titleText)) return;
    if (node.tagName === 'IMG' || node.getAttribute('data-cmp-is') === 'image') {
      const img = resolveImage(document, node);
      if (img && !seen.has(img.src)) {
        seen.add(img.src);
        const p = document.createElement('p');
        p.append(img);
        const caption = imageCaption(node);
        if (caption) {
          const em = document.createElement('em');
          em.textContent = caption;
          p.append(document.createElement('br'), em);
        }
        container.append(p);
      }
      return;
    }
    if (!node.textContent.trim()) return;
    const tag = node.tagName.toLowerCase();
    const clean = document.createElement(tag);
    clean.innerHTML = node.innerHTML;
    container.append(clean);
  });
  return container;
}

export default {
  transform: ({ document, params }) => {
    const originalURL = params.originalURL || params.url;
    const main = document.createElement('main');

    // Hero image
    const hero = resolveImage(document, document.querySelector('main .cmp-image, main [data-cmp-is="image"]'));
    if (hero) {
      const p = document.createElement('p');
      p.append(hero);
      main.append(p);
    }

    // Title
    const h1src = document.querySelector('main h1, h1.cmp-title__text');
    const h1 = document.createElement('h1');
    h1.textContent = (h1src ? h1src.textContent : document.title).trim();
    main.append(h1);

    // Byline
    const name = document.querySelector('.cmp-byline__name');
    const bylineH4 = [...document.querySelectorAll('main h4, .cmp-title__text')]
      .find((el) => /^by\s+/i.test(el.textContent.trim()));
    let byline = '';
    if (bylineH4) byline = bylineH4.textContent.trim();
    else if (name) byline = `By ${name.textContent.trim()}`;
    if (byline) {
      const p = document.createElement('p');
      const em = document.createElement('em');
      em.textContent = byline;
      p.append(em);
      main.append(p);
    }

    // Body
    main.append(extractBody(document, h1.textContent));

    // Section break before the contributor card
    main.append(document.createElement('hr'));

    // Contributor block (avatar, name, role, and the author's social links)
    const role = document.querySelector('.cmp-byline__occupations');
    const avatar = resolveImage(document, document.querySelector('.cmp-byline__image'), name ? name.textContent.trim() : 'Author');
    if (name) {
      const avatarCell = document.createElement('div');
      if (avatar) avatarCell.append(avatar);
      const bodyCell = document.createElement('div');
      const h2 = document.createElement('h2');
      h2.textContent = name.textContent.trim();
      bodyCell.append(h2);
      if (role && role.textContent.trim()) {
        const rp = document.createElement('p');
        rp.textContent = role.textContent.trim();
        bodyCell.append(rp);
      }
      // Author social links (exclude the footer "Follow Us" btn-list)
      const social = [...document.querySelectorAll('.cmp-buildingblock--btn-list a[aria-label]')]
        .filter((a) => !a.closest('footer, [role="contentinfo"], .cmp-experiencefragment--footer'));
      const byLabel = new Map();
      social.forEach((a) => {
        const key = (a.getAttribute('aria-label') || a.textContent || a.getAttribute('href') || '').trim().toLowerCase();
        if (key && !byLabel.has(key)) byLabel.set(key, a);
      });
      const links = [...byLabel.values()];
      if (links.length) {
        const ul = document.createElement('ul');
        links.forEach((a) => {
          const li = document.createElement('li');
          const link = document.createElement('a');
          link.href = a.getAttribute('href') || '#';
          const visible = (a.textContent || '').trim();
          link.textContent = visible || (a.getAttribute('aria-label') || 'Social').trim();
          li.append(link);
          ul.append(li);
        });
        bodyCell.append(ul);
      }
      const cells = avatar
        ? [['Contributor (byline)'], [avatarCell, bodyCell]]
        : [['Contributor (byline)'], [bodyCell]];
      main.append(WebImporter.DOMUtils.createTable(cells, document));
    }

    // Share this Story widget
    main.append(WebImporter.DOMUtils.createTable([
      ['Share'],
      ['Share this Story'],
    ], document));

    // Metadata
    const slug = new URL(originalURL).pathname.replace(/\.html$/, '').split('/').pop();
    const meta = {};
    meta.Title = h1.textContent.trim();
    const desc = document.querySelector('meta[name="description"], meta[property="og:description"]');
    if (desc) meta.Description = desc.getAttribute('content');
    if (hero) {
      const mimg = document.createElement('img');
      mimg.src = hero.src;
      meta.Image = mimg;
    }
    if (name) meta.Author = name.textContent.trim();
    meta.Category = 'Magazine';
    meta.Template = 'article';
    meta.PublishDate = PUBLISH_DATES[slug] || '';
    main.append(WebImporter.Blocks.getMetadataBlock(document, meta));

    const path = new URL(originalURL).pathname
      .replace(/^\/us\/en/, '')
      .replace(/\.html$/, '')
      .replace(/\/$/, '');

    return [{
      element: main,
      path: WebImporter.FileUtils.sanitizePath(path || '/index'),
      report: { title: meta.Title, author: meta.Author || '' },
    }];
  },
};
