import { createOptimizedPicture } from '../../scripts/aem.js';
import { buildSocialList } from '../social-links/social-icons.js';

/*
 * Contributors block — a responsive grid of contributor/guide cards.
 *
 * Matches the wknd.site About page: circular avatar, centered name (serif),
 * uppercase role, and a row of social icon buttons, laid out 2-up on desktop.
 *
 * Content model (one person per row; two cells each):
 *   | Contributors |                              |
 *   | ------------ | ---------------------------- |
 *   | <avatar img> | ### Name                     |
 *   |              | ##### Role \| Role           |
 *   |              | (bullet list of social links)|
 */

/**
 * Builds one contributor card from a row's two cells.
 * @param {Element} row
 * @returns {HTMLLIElement|null}
 */
function buildCard(row) {
  const cells = [...row.children];
  const imageCell = cells.find((c) => c.querySelector('picture, img')) || null;
  const bodyCell = cells.find((c) => c !== imageCell) || cells[cells.length - 1];
  if (!bodyCell) return null;

  const li = document.createElement('li');
  li.className = 'contributors-card';

  // Avatar (circular)
  const img = imageCell && imageCell.querySelector('img');
  if (img) {
    const avatar = document.createElement('div');
    avatar.className = 'contributors-avatar';
    avatar.append(createOptimizedPicture(img.src, img.alt || '', false, [{ width: '400' }]));
    li.append(avatar);
  }

  const body = document.createElement('div');
  body.className = 'contributors-body';
  [...bodyCell.childNodes].forEach((n) => body.append(n));

  const name = body.querySelector('h1, h2, h3, h4, h5, h6');
  if (name) name.classList.add('contributors-name');
  // The role is authored as a heading (h5) but is really a subtitle; render it
  // as a <p> so heading levels don't skip (avoids axe/Lighthouse heading-order).
  const role = name?.nextElementSibling;
  if (role && /^H[1-6]$/.test(role.tagName)) {
    const p = document.createElement('p');
    p.className = 'contributors-role';
    p.textContent = role.textContent;
    role.replaceWith(p);
  }

  // Social links → accessible icon buttons (reuses social-links rendering)
  const anchors = [...body.querySelectorAll('a[href]')];
  if (anchors.length) {
    const social = document.createElement('div');
    social.className = 'social-links contributors-social';
    social.append(buildSocialList(anchors, document));
    body.querySelectorAll('ul, p').forEach((el) => {
      if (!el.textContent.trim() && !el.querySelector('a, img, picture')) el.remove();
    });
    body.append(social);
  }

  li.append(body);
  return li;
}

/**
 * loads and decorates the contributors grid block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const list = document.createElement('ul');
  list.className = 'contributors-grid';
  [...block.children].forEach((row) => {
    const card = buildCard(row);
    if (card) list.append(card);
  });
  block.replaceChildren(list);
}
