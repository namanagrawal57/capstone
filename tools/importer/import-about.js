/* global WebImporter */
/*
 * Import script for the WKND About Us page.
 * Produces H1, section headings/intros, and one Contributor block per person
 * (avatar, name, role, and their social links), then Metadata.
 * Self-contained (mirrors the standard-contract parsers in ./parsers).
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

function appendContributor(main, document, wrapper) {
  const nameEl = wrapper.querySelector('h1, h2, h3, h4');
  const name = nameEl ? nameEl.textContent.trim() : '';
  if (!name) return false;
  const roleEl = wrapper.querySelector('h5, h6');
  const avatar = resolveImage(document, wrapper.querySelector('.cmp-image, [data-cmp-is="image"], img'), name);

  const avatarCell = document.createElement('div');
  if (avatar) avatarCell.append(avatar);
  const bodyCell = document.createElement('div');
  const h3 = document.createElement('h3');
  h3.textContent = name;
  bodyCell.append(h3);
  if (roleEl && roleEl.textContent.trim()) {
    const rp = document.createElement('p');
    rp.textContent = roleEl.textContent.trim();
    bodyCell.append(rp);
  }

  const byHref = new Map();
  wrapper.querySelectorAll('a[aria-label], a[href^="#"], a[href^="http"]').forEach((a) => {
    const text = (a.textContent || '').trim();
    const key = (text || a.getAttribute('aria-label') || a.getAttribute('href') || '').toLowerCase();
    if (key && !byHref.has(key)) byHref.set(key, a);
  });
  const links = [...byHref.values()];
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

  const cells = avatar ? [['Contributor'], [avatarCell, bodyCell]] : [['Contributor'], [bodyCell]];
  main.append(WebImporter.DOMUtils.createTable(cells, document));
  return true;
}

export default {
  transform: ({ document, params }) => {
    const originalURL = params.originalURL || params.url;
    const main = document.createElement('main');

    const h1 = document.createElement('h1');
    h1.textContent = 'About Us';
    main.append(h1);

    const source = document.querySelector('main') || document.body;

    const h2s = [...source.querySelectorAll('h2')].filter((h) => /contributor|guide/i.test(h.textContent));
    if (h2s[0]) {
      const h2 = document.createElement('h2');
      h2.textContent = h2s[0].textContent.trim();
      main.append(h2);
    }
    const intro = [...source.querySelectorAll('p')].find((p) => /compelling stories/i.test(p.textContent));
    if (intro) {
      const p = document.createElement('p');
      p.textContent = intro.textContent.trim();
      main.append(p);
    }

    const wrappers = [...source.querySelectorAll('.cmp-experience-fragment--contributor, [class*="contributor"]')]
      .filter((el) => el.querySelector('h1, h2, h3, h4') && el.querySelector('a'));
    const seen = new Set();
    let count = 0;
    wrappers.forEach((wrapper) => {
      const nameEl = wrapper.querySelector('h1, h2, h3, h4');
      const key = nameEl ? nameEl.textContent.trim() : '';
      if (!key || seen.has(key)) return;
      seen.add(key);
      if (appendContributor(main, document, wrapper)) count += 1;
    });

    const meta = {};
    meta.Title = 'About Us | WKND';
    const desc = document.querySelector('meta[name="description"], meta[property="og:description"]');
    meta.Description = desc ? desc.getAttribute('content') : 'Meet the WKND contributors and guides who bring you compelling stories from across the globe.';
    meta.Template = 'about';
    main.append(WebImporter.Blocks.getMetadataBlock(document, meta));

    const path = new URL(originalURL).pathname
      .replace(/^\/us\/en/, '')
      .replace(/about-us/, 'about')
      .replace(/\.html$/, '')
      .replace(/\/$/, '');

    return [{
      element: main,
      path: WebImporter.FileUtils.sanitizePath(path || '/about'),
      report: { title: meta.Title, contributors: count },
    }];
  },
};
