/*
 * Import script for the WKND site navigation (/nav fragment).
 * Emits: brand + nav-sections (ul) + tools, matching the header block contract.
 */

export default {
  transformDOM: ({ document }) => {
    const main = document.createElement('main');

    // 1) Brand
    const brand = document.createElement('div');
    const brandP = document.createElement('p');
    const brandLink = document.createElement('a');
    brandLink.href = '/';
    brandLink.textContent = 'WKND';
    brandP.append(brandLink);
    brand.append(brandP);
    main.append(brand);
    main.append(document.createElement('hr'));

    // 2) Nav sections
    const sections = document.createElement('div');
    const ul = document.createElement('ul');
    [
      ['Magazine', '/magazine'],
      ['Adventures', '/adventures'],
      ['FAQs', '/faqs'],
      ['About Us', '/about'],
    ].forEach(([label, href]) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = href;
      a.textContent = label;
      li.append(a);
      ul.append(li);
    });
    sections.append(ul);
    main.append(sections);
    main.append(document.createElement('hr'));

    // 3) Tools
    const tools = document.createElement('div');
    const toolsP = document.createElement('p');
    toolsP.textContent = 'Search';
    tools.append(toolsP);
    main.append(tools);

    return main;
  },
  generateDocumentPath: () => '/nav',
};
