/* global WebImporter */
/*
 * Import script for the WKND Adventures section landing page.
 * Produces: H1, intro, and an index-driven Article List block filtered to
 * /adventures/ (reuses the article-list block), plus Metadata. Self-contained.
 */

export default {
  transform: ({ document, params }) => {
    const originalURL = params.originalURL || params.url;
    const main = document.createElement('main');

    const s1 = document.createElement('div');
    const h1 = document.createElement('h1');
    h1.textContent = 'Adventures';
    s1.append(h1);
    const intro = document.createElement('p');
    intro.textContent = 'Browse our list of curated experiences and sign up for one when you’re ready to explore with us.';
    s1.append(intro);
    // Article List block driven by the query index, filtered to /adventures/
    s1.append(WebImporter.DOMUtils.createTable([
      ['Article List'],
      ['Path', '/adventures/'],
    ], document));
    main.append(s1);

    const meta = {};
    meta.Title = 'Adventures | WKND';
    meta.Description = 'Curated WKND adventures and guided trips around the world — surfing, skiing, climbing, cycling and more.';
    meta.Template = 'adventures-listing';
    const s2 = document.createElement('div');
    s2.append(WebImporter.Blocks.getMetadataBlock(document, meta));
    main.append(s2);

    const path = new URL(originalURL).pathname
      .replace(/^\/us\/en/, '')
      .replace(/\.html$/, '')
      .replace(/\/$/, '');

    return [{
      element: main,
      path: WebImporter.FileUtils.sanitizePath(path || '/adventures'),
      report: { title: meta.Title },
    }];
  },
};
