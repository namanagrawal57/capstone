/* global WebImporter */
/*
 * Import script for the WKND Adventures section landing page.
 * Matches wknd.site: H1, an "Experience the world with us" intro (Columns:
 * text + image), a "Current Adventures" heading, and an index-driven Article
 * List block with category filter tabs (All / Climbing / Cycling / Skiing /
 * Surfing / Travel) over all /adventures/ trips. Self-contained.
 */

const PROXY = 'https://wknd.site';
const INTRO_IMG = '/us/en/_jcr_content/root/container/carousel/item_1571954853062.coreimg.jpeg/1660323801921/adobestock-216674449.jpeg';

export default {
  transform: ({ document, params }) => {
    const originalURL = params.originalURL || params.url;
    const main = document.createElement('main');

    // Section 1: H1
    const s1 = document.createElement('div');
    const h1 = document.createElement('h1');
    h1.textContent = 'Adventures';
    s1.append(h1);
    main.append(s1);

    // Section 2: "Experience the world with us" intro (Columns: text + image)
    const s2 = document.createElement('div');
    const textCell = document.createElement('div');
    const h2 = document.createElement('h2');
    h2.textContent = 'Experience the world with us';
    textCell.append(h2);
    const p = document.createElement('p');
    p.textContent = "With WKND Adventures, you don't just see the world — you experience its cultures, flavors and wonders.";
    textCell.append(p);
    const imgCell = document.createElement('div');
    const img = document.createElement('img');
    img.src = `${PROXY}${INTRO_IMG}`;
    img.alt = 'A traveler resting on a rock overlooking a river in the Australian bushland';
    imgCell.append(img);
    s2.append(WebImporter.DOMUtils.createTable([['Columns'], [textCell, imgCell]], document));
    main.append(s2);

    // Section 3: Current Adventures + tabbed, index-driven Article List
    const s3 = document.createElement('div');
    const h2b = document.createElement('h2');
    h2b.textContent = 'Current Adventures';
    s3.append(h2b);
    s3.append(WebImporter.DOMUtils.createTable([
      ['Article List'],
      ['Path', '/adventures/'],
      ['Sort', 'title'],
      ['Tabs', 'All, Climbing, Cycling, Skiing, Surfing, Travel'],
    ], document));
    main.append(s3);

    // Metadata
    const s4 = document.createElement('div');
    const meta = {};
    meta.Title = 'Adventures | WKND';
    meta.Description = 'Curated WKND adventures and guided trips around the world — climbing, cycling, skiing, surfing and travel experiences.';
    meta.Template = 'adventures-listing';
    const mimg = document.createElement('img');
    mimg.src = `${PROXY}${INTRO_IMG}`;
    meta.Image = mimg;
    s4.append(WebImporter.Blocks.getMetadataBlock(document, meta));
    main.append(s4);

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
