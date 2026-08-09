/**
 * loads and decorates the quote block
 * @param {Element} block The quote block element
 */
export default function decorate(block) {
  const rows = [...block.children];
  const [quoteRow, attributionRow] = rows;

  const blockquote = document.createElement('blockquote');
  const quoteCell = quoteRow?.firstElementChild;
  if (quoteCell) {
    while (quoteCell.firstChild) blockquote.append(quoteCell.firstChild);
  }

  const fragment = document.createDocumentFragment();
  fragment.append(blockquote);

  const attributionCell = attributionRow?.firstElementChild;
  if (attributionCell && attributionCell.textContent.trim()) {
    const cite = document.createElement('cite');
    cite.className = 'quote-attribution';
    while (attributionCell.firstChild) cite.append(attributionCell.firstChild);
    fragment.append(cite);
  }

  block.replaceChildren(fragment);
}
