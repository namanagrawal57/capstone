import { createOptimizedPicture } from '../../scripts/aem.js';
import { buildSocialList } from '../social-links/social-icons.js';

/*
 * Contributor block
 *
 * Presents a writer / photographer / guide: avatar, name, title/role, and
 * (optionally) their social links.
 *
 * Two modes, one block:
 *  - default: a single card (article byline, a lone contributor).
 *      | Contributor |                                    |
 *      | ----------- | ---------------------------------- |
 *      | <avatar>    | ### Name                           |
 *      |             | Role                               |
 *      |             | (optional list of social links)    |
 *  - `contributor (grid)` variant: a responsive grid, one card per row.
 *      | Contributor (grid) |                     |
 *      | <avatar> | ### Name / ##### Role / social |
 *      | <avatar> | ### Name / ##### Role / social |
 *
 * The avatar cell is optional. Any anchors are rendered as accessible social
 * icon buttons (reusing the social-links icon rendering).
 */

/**
 * Builds a single contributor card from a set of cells.
 * @param {Element[]} cells the cells belonging to one person
 * @returns {HTMLElement|null}
 */
function buildCard(cells) {
  const imageCell = cells.find((cell) => cell.querySelector('picture, img')) || null;
  const bodyCells = cells.filter((cell) => cell !== imageCell);
  if (!bodyCells.length && !imageCell) return null;

  const card = document.createElement('div');
  card.className = 'contributor-card';

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
    card.append(avatar);
  }

  // Body: name, role, social links
  const body = document.createElement('div');
  body.className = 'contributor-body';
  bodyCells.forEach((cell) => {
    [...cell.childNodes].forEach((node) => body.append(node));
  });

  const name = body.querySelector('h1, h2, h3, h4, h5, h6');
  if (name) name.classList.add('contributor-name');
  // The role may be authored as a heading (h5) but is really a subtitle; render
  // it as a <p> so heading levels don't skip (avoids axe/Lighthouse
  // heading-order). A role already authored as <p> is just tagged.
  const role = name?.nextElementSibling;
  if (role && /^H[1-6]$/.test(role.tagName)) {
    const p = document.createElement('p');
    p.className = 'contributor-title';
    p.textContent = role.textContent;
    role.replaceWith(p);
  } else if (role && role.tagName === 'P') {
    role.classList.add('contributor-title');
  }

  // Turn any anchors into an accessible social icon row.
  const anchors = [...body.querySelectorAll('a[href]')];
  if (anchors.length) {
    const social = document.createElement('div');
    social.className = 'social-links contributor-social';
    social.append(buildSocialList(anchors, document));
    // remove any now-empty list/paragraph that held the raw links
    body.querySelectorAll('ul, p').forEach((el) => {
      if (!el.textContent.trim() && !el.querySelector('a, img, picture')) el.remove();
    });
    body.append(social);
  }

  card.append(body);
  return card;
}

/**
 * loads and decorates the contributor block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const rows = [...block.children];

  if (block.classList.contains('grid')) {
    // grid variant: one card per row
    const list = document.createElement('ul');
    list.className = 'contributor-grid';
    rows.forEach((row) => {
      const card = buildCard([...row.children]);
      if (!card) return;
      const li = document.createElement('li');
      li.append(card);
      list.append(li);
    });
    block.replaceChildren(list);
    return;
  }

  // default: a single card from all cells across rows
  const cells = rows.flatMap((row) => [...row.children]);
  const card = buildCard(cells);
  block.replaceChildren(card || document.createElement('div'));
}
