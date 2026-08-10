/*
 * Accordion block
 *
 * Renders a list of expandable question/answer items using native
 * <details>/<summary> for built-in keyboard accessibility.
 *
 * Content model (one Q&A per row, two cells each):
 *   | Accordion |                          |
 *   | --------- | ------------------------ |
 *   | Question? | The answer paragraph(s). |
 *   | Another?  | Its answer.              |
 */

/**
 * loads and decorates the accordion block
 * @param {Element} block The accordion block element
 */
export default function decorate(block) {
  [...block.children].forEach((row) => {
    const [summaryCell, bodyCell] = [...row.children];
    if (!summaryCell) return;

    const details = document.createElement('details');
    details.className = 'accordion-item';

    const summary = document.createElement('summary');
    summary.className = 'accordion-item-label';
    // move the question content into the summary
    while (summaryCell.firstChild) summary.append(summaryCell.firstChild);
    details.append(summary);

    if (bodyCell) {
      const body = document.createElement('div');
      body.className = 'accordion-item-body';
      while (bodyCell.firstChild) body.append(bodyCell.firstChild);
      details.append(body);
    }

    row.replaceWith(details);
  });
}
