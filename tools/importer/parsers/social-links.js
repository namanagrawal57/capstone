/* global WebImporter */
/*
 * Social Links block parser.
 *
 * Standard EDS parser contract: `parse(element, { document })` transforms the
 * matched element in place. Collects the anchors within the element and emits
 * a Social Links block (bullet list of links). Self-contained (no imports).
 */

export default function parse(element, { document }) {
  const byKey = new Map();
  element.querySelectorAll('a[href]').forEach((a) => {
    const text = (a.textContent || '').trim();
    const key = (text || a.getAttribute('aria-label') || a.getAttribute('href') || '').toLowerCase();
    if (key && !byKey.has(key)) byKey.set(key, a);
  });
  const links = [...byKey.values()];
  if (!links.length) return;

  const cell = document.createElement('div');
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
  cell.append(ul);
  const table = WebImporter.DOMUtils.createTable([['Social Links'], [cell]], document);
  element.replaceWith(table);
}
