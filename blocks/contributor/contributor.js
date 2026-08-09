import { createOptimizedPicture } from '../../scripts/aem.js';
import { buildSocialList } from '../social-links/social-icons.js';

/*
 * Contributor block
 *
 * Presents a writer/photographer/guide: avatar, name, title/role, and
 * (optionally) their social links.
 *
 * Content model:
 *   | Contributor |                                   |
 *   | ----------- | --------------------------------- |
 *   | <avatar>    | ### Stacey Roswells               |
 *   |             | Artist \| Photographer \| Traveler |
 *   |             | (optional list of social links)   |
 *
 * The avatar cell is optional. Any anchors found are rendered as accessible
 * social icon buttons (reusing the social-links icon rendering).
 */

/**
 * Finds the cell that holds the avatar picture/image, if any.
 * @param {Element[]} cells
 * @returns {Element|null}
 */
function findImageCell(cells) {
  return cells.find((cell) => cell.querySelector('picture, img')) || null;
}

/**
 * loads and decorates the contributor block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const rows = [...block.children];
  const cells = rows.flatMap((row) => [...row.children]);

  const imageCell = findImageCell(cells);
  const bodyCells = cells.filter((cell) => cell !== imageCell);

  const wrapper = document.createElement('div');
  wrapper.className = 'contributor-card';

  // Avatar
  if (imageCell) {
    const img = imageCell.querySelector('img');
    const avatar = document.createElement('div');
    avatar.className = 'contributor-avatar';
    if (img) {
      avatar.append(createOptimizedPicture(img.src, img.alt || '', false, [{ width: '400' }]));
    } else {
      avatar.append(...imageCell.childNodes);
    }
    wrapper.append(avatar);
  }

  // Body: name, title/role, and social links
  const body = document.createElement('div');
  body.className = 'contributor-body';
  bodyCells.forEach((cell) => {
    [...cell.childNodes].forEach((node) => body.append(node));
  });

  const name = body.querySelector('h1, h2, h3, h4, h5, h6');
  if (name) name.classList.add('contributor-name');
  const title = name?.nextElementSibling;
  if (title && title.tagName === 'P') title.classList.add('contributor-title');

  // Turn any anchors into an accessible social icon row.
  const anchors = [...body.querySelectorAll('a[href]')];
  if (anchors.length) {
    const socialWrap = document.createElement('div');
    socialWrap.className = 'social-links contributor-social';
    socialWrap.append(buildSocialList(anchors, document));
    // remove any now-empty list/paragraph that held the raw links
    anchors.forEach((a) => {
      const container = a.closest('ul, p');
      if (container && !container.querySelector('a[href]:not([class])')) { /* handled below */ }
    });
    body.querySelectorAll('ul, p').forEach((el) => {
      if (!el.textContent.trim() && !el.querySelector('a, img, picture')) el.remove();
    });
    body.append(socialWrap);
  }

  wrapper.append(body);
  block.replaceChildren(wrapper);
}
