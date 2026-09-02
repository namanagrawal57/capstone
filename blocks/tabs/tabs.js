/*
 * Tabs block
 *
 * Renders a set of labelled panels with an accessible tablist, matching the
 * Overview / Itinerary / What to Bring tabs on wknd.site adventure pages.
 *
 * Content model (one tab per row: label | body):
 *   | Tabs         |                          |
 *   | ------------ | ------------------------ |
 *   | Overview     | <rich text…>             |
 *   | Itinerary    | <rich text…>             |
 *   | What to Bring| <rich text…>             |
 */

let tabCount = 0;

/**
 * loads and decorates the tabs block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  tabCount += 1;
  const uid = tabCount;
  const tablist = document.createElement('div');
  tablist.className = 'tabs-list';
  tablist.setAttribute('role', 'tablist');

  const panels = [];

  rows.forEach((row, i) => {
    const [labelCell, bodyCell] = [...row.children];
    if (!labelCell) return;
    const label = labelCell.textContent.trim();
    const id = `tab-${uid}-${i}`;

    // tab button
    const tab = document.createElement('button');
    tab.className = 'tabs-tab';
    tab.type = 'button';
    tab.id = `${id}-tab`;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', `${id}-panel`);
    tab.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    tab.tabIndex = i === 0 ? 0 : -1;
    tab.textContent = label;
    tablist.append(tab);

    // panel
    const panel = document.createElement('div');
    panel.className = 'tabs-panel';
    panel.id = `${id}-panel`;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', `${id}-tab`);
    if (i !== 0) panel.hidden = true;
    if (bodyCell) panel.append(...bodyCell.childNodes);
    panels.push(panel);

    tab.addEventListener('click', () => {
      tablist.querySelectorAll('.tabs-tab').forEach((t) => {
        t.setAttribute('aria-selected', 'false');
        t.tabIndex = -1;
      });
      panels.forEach((p) => { p.hidden = true; });
      tab.setAttribute('aria-selected', 'true');
      tab.tabIndex = 0;
      panel.hidden = false;
    });
  });

  // arrow-key navigation across the tablist
  tablist.addEventListener('keydown', (e) => {
    const tabs = [...tablist.querySelectorAll('.tabs-tab')];
    const current = tabs.indexOf(document.activeElement);
    if (current < 0) return;
    let next = current;
    if (e.key === 'ArrowRight') next = (current + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') next = (current - 1 + tabs.length) % tabs.length;
    else return;
    e.preventDefault();
    tabs[next].focus();
    tabs[next].click();
  });

  block.replaceChildren(tablist, ...panels);
}
