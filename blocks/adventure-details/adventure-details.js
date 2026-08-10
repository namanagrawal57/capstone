/*
 * Adventure Details block
 *
 * Renders a trip's key facts (Activity, Trip Length, Group Size, Difficulty,
 * Price, …) as a definition list.
 *
 * Content model (one label/value per row):
 *   | Adventure Details |               |
 *   | ----------------- | ------------- |
 *   | Activity          | Rock Climbing |
 *   | Trip Length       | 2 Days        |
 *   | Price             | $900          |
 */

/**
 * loads and decorates the adventure-details block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const dl = document.createElement('dl');
  dl.className = 'adventure-details-list';

  [...block.children].forEach((row) => {
    const [labelCell, valueCell] = [...row.children];
    if (!labelCell || !valueCell) return;

    // wrap each label/value in an item so pairs stay together in the grid
    const item = document.createElement('div');
    item.className = 'adventure-details-item';

    const dt = document.createElement('dt');
    dt.textContent = labelCell.textContent.trim();

    const dd = document.createElement('dd');
    dd.textContent = valueCell.textContent.trim();

    item.append(dt, dd);
    dl.append(item);
  });

  block.replaceChildren(dl);
}
