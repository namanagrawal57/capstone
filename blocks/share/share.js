/*
 * Share block
 *
 * Renders a "Share this Adventure/Story" heading with social share links,
 * matching the share widget on wknd.site adventure and magazine pages.
 *
 * Content model:
 *   | Share                |
 *   | -------------------- |
 *   | Share this Adventure |
 *
 * The single cell provides the heading text. Share targets are the current
 * page URL; the links open the platform share dialogs in a new tab.
 */

const NETWORKS = [
  ['Facebook', 'https://www.facebook.com/sharer/sharer.php?u='],
  ['Twitter', 'https://twitter.com/intent/tweet?url='],
  ['Pinterest', 'https://www.pinterest.com/pin/create/button/?url='],
];

/**
 * loads and decorates the share block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const heading = (block.textContent || '').trim() || 'Share this Story';
  const pageUrl = encodeURIComponent(window.location.href);

  // Rendered as a <p> (not a heading) to avoid heading-order skips (h1 → h5).
  const title = document.createElement('p');
  title.className = 'share-title';
  title.textContent = heading;

  const list = document.createElement('ul');
  list.className = 'share-links';
  NETWORKS.forEach(([name, base]) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = `${base}${pageUrl}`;
    a.className = `share-link share-${name.toLowerCase()}`;
    a.target = '_blank';
    a.rel = 'noopener';
    a.setAttribute('aria-label', `Share on ${name}`);
    a.textContent = name;
    li.append(a);
    list.append(li);
  });

  block.replaceChildren(title, list);
}
