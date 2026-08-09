/* global WebImporter */
/*
 * Contributor block parser.
 *
 * Standard EDS parser contract: `parse(element, { document })` is called once
 * per matched instance and transforms the element in place (replacing it with
 * the generated block table). Parsers are injected as plain scripts during
 * validation, so this file must be self-contained (no ES imports).
 *
 * Emits a complete person card: avatar, name, role, and the person's social
 * links (as a bullet list of anchors, which the contributor block renders as
 * accessible icon buttons). Handles both About-page contributor cards and
 * article bylines (.cmp-byline).
 */

const PROXY = 'https://wknd.site';

function resolveImage(document, el, alt) {
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

export default function parse(element, { document }) {
  const nameEl = element.querySelector('.cmp-byline__name, h1, h2, h3, h4');
  const roleEl = element.querySelector('.cmp-byline__occupations, h5, h6');
  const name = nameEl ? nameEl.textContent.trim() : '';
  if (!name) return;

  const isByline = element.classList.contains('cmp-byline') || !!element.querySelector('.cmp-byline__name');
  const headingLevel = isByline ? 2 : 3;
  const avatar = resolveImage(
    document,
    element.querySelector('.cmp-byline__image, .cmp-image, [data-cmp-is="image"], img'),
    name,
  );

  const avatarCell = document.createElement('div');
  if (avatar) avatarCell.append(avatar);

  const bodyCell = document.createElement('div');
  const heading = document.createElement(`h${headingLevel}`);
  heading.textContent = name;
  bodyCell.append(heading);
  if (roleEl && roleEl.textContent.trim()) {
    const p = document.createElement('p');
    p.textContent = roleEl.textContent.trim();
    bodyCell.append(p);
  }

  // Social links belonging to this person → bullet list of anchors.
  // Prefer the anchor's visible text (e.g. "Facebook"); fall back to its
  // aria-label only when there is no visible text, so the block text mirrors
  // the source and the platform is still inferable from the href/label.
  const byHref = new Map();
  element.querySelectorAll('a[aria-label], a[href^="#"], a[href^="http"]').forEach((a) => {
    const href = (a.getAttribute('href') || '').trim();
    const text = (a.textContent || '').trim();
    const key = (text || a.getAttribute('aria-label') || href).toLowerCase();
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
      // keep the descriptive aria-label so the platform is unambiguous
      const aria = (a.getAttribute('aria-label') || '').trim();
      if (aria && aria.toLowerCase() !== link.textContent.toLowerCase()) {
        link.setAttribute('aria-label', aria);
      }
      li.append(link);
      ul.append(li);
    });
    bodyCell.append(ul);
  }

  const cells = avatar
    ? [['Contributor'], [avatarCell, bodyCell]]
    : [['Contributor'], [bodyCell]];
  const table = WebImporter.DOMUtils.createTable(cells, document);
  element.replaceWith(table);
}
