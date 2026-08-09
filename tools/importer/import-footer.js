/* global WebImporter */
/*
 * Import script for the WKND site footer (/footer fragment).
 * Emits: nav links, "Follow Us" + Social Links block, and copyright.
 * Self-contained.
 */

export default {
  transformDOM: ({ document }) => {
    const main = document.createElement('main');

    // Nav links
    const nav = document.createElement('p');
    [
      ['Magazine', '/magazine'],
      ['Adventures', '/adventures'],
      ['FAQs', '/faqs'],
      ['About Us', '/about'],
    ].forEach(([label, href], i) => {
      if (i) nav.append(document.createTextNode(' '));
      const a = document.createElement('a');
      a.href = href;
      a.textContent = label;
      nav.append(a);
    });
    main.append(nav);

    // Follow Us + Social Links block.
    // Use h2 so footer headings don't skip levels after the page's h1
    // (avoids a Lighthouse/axe "heading-order" accessibility violation).
    const follow = document.createElement('h2');
    follow.textContent = 'Follow Us';
    main.append(follow);
    const listCell = document.createElement('div');
    const ul = document.createElement('ul');
    ['Facebook', 'Twitter', 'Instagram'].forEach((label) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = `https://www.${label.toLowerCase()}.com/`;
      a.textContent = label;
      li.append(a);
      ul.append(li);
    });
    listCell.append(ul);
    main.append(WebImporter.DOMUtils.createTable([['Social Links'], [listCell]], document));

    // Copyright
    const copy = document.createElement('p');
    copy.textContent = '© 2026 WKND Site. WKND is a fictitious brand used for demonstration.';
    main.append(copy);

    // Footer is not indexed
    main.append(WebImporter.Blocks.getMetadataBlock(document, { Robots: 'noindex, nofollow' }));

    return main;
  },
  generateDocumentPath: () => '/footer',
};
