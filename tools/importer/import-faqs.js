/* global WebImporter */
/*
 * Import script for the WKND FAQs page.
 * Produces: H1, hero image, intro, an Accordion block (Q&A), and a
 * "Need more help?" section. Self-contained.
 */

const PROXY = 'https://wknd.site';

const FAQS = [
  ['Who is WKND’s intended audience?', 'We believe the best adventures and activities are those that are accessible to everyone. WKND is designed to be inclusive of all age ranges, abilities, and budget-levels. We strive to cater to the thrill-seeking adrenaline junkie BASE-jumpers as well as novices that have a spare weekend and an interest in trying something new.'],
  ['How does WKND pay for itself?', 'WKND charges a small fee for local promoters that want to sponsor their adventures and events on the WKND site. Sponsored Adventures may get sorted to more prominent positions in our Adventures listing pages.'],
  ['Can I contribute to WKND?', 'Yes! If you have the expertise and experiences to share, we’ll provide the platform to spread it. As a Guest Writer, you will play an integral role in helping people find fun and cool things to do in your community.'],
  ['How often is WKND updated?', 'WKND is updated daily to provide you with the latest in-depth articles on fun activities that we’ve recently explored and new adventures that are available for you to discover. Come back often to see the latest, or subscribe to our social feeds.'],
  ['When was WKND founded?', 'WKND was created in 2015 when our founders, Daniel and Kilian, realized that their friends and family were constantly using them as resources to find fun things to do. They loved sharing ideas about events and activities, and wanted to do it at larger scale across communities.'],
  ['Is a hot dog a sandwich?', 'While it may be described as meat between two pieces of bread, a hot dog is just a sandwich in the same way Michael Jordan was just a basketball player or William Shakespeare was just a playwright. Technically true, but vastly understated.'],
  ['Is WKND a real company?', 'No. WKND is a fictional online magazine and adventure company that focuses on outdoor activities and trips across the globe. The WKND site is designed to demonstrate functionality for Adobe Experience Manager.'],
];

function resolveImage(document, el, alt = '') {
  if (!el) return null;
  const imgEl = el.tagName === 'IMG' ? el : el.querySelector('img');
  let src = (imgEl && (imgEl.getAttribute('src') || (imgEl.getAttribute('srcset') || '').split(' ')[0]))
    || el.getAttribute('data-cmp-src')
    || (el.querySelector && el.querySelector('[data-cmp-src]') && el.querySelector('[data-cmp-src]').getAttribute('data-cmp-src'));
  if (!src) return null;
  src = src.replace('{.width}', '');
  if (src.startsWith('/')) src = `${PROXY}${src}`;
  const img = document.createElement('img');
  img.src = src;
  img.alt = alt || (imgEl && imgEl.getAttribute('alt')) || '';
  return img;
}

export default {
  transform: ({ document, params }) => {
    const originalURL = params.originalURL || params.url;
    const main = document.createElement('main');

    // Section 1: title + hero + intro
    const s1 = document.createElement('div');
    const h1 = document.createElement('h1');
    h1.textContent = 'FAQs';
    s1.append(h1);
    const hero = resolveImage(document, document.querySelector('main .cmp-image, main [data-cmp-is="image"]'), 'Woman standing on a high peak overlooking mountains and a lake');
    if (hero) {
      const p = document.createElement('p');
      p.append(hero);
      s1.append(p);
    }
    const intro = document.createElement('p');
    intro.textContent = 'WKND is a collective of outdoors, music, crafts, adventure sports, and travel enthusiasts that want to share our experiences, connections, and expertise with the world. Our objective is to create a community that helps like-minded adventure seekers find fun, engaging, and responsible ways to enjoy life and create lasting memories.';
    s1.append(intro);
    main.append(s1);

    // Section 2: accordion (block wrapped in a section div)
    const s2 = document.createElement('div');
    const rows = [['Accordion']];
    FAQS.forEach(([q, a]) => {
      const qCell = document.createElement('div');
      qCell.textContent = q;
      const aCell = document.createElement('div');
      const ap = document.createElement('p');
      ap.textContent = a;
      aCell.append(ap);
      rows.push([qCell, aCell]);
    });
    s2.append(WebImporter.DOMUtils.createTable(rows, document));
    main.append(s2);

    // Section 3: need more help (h2 keeps heading order monotonic after the h1)
    const s3 = document.createElement('div');
    const h2 = document.createElement('h2');
    h2.textContent = 'Need more help?';
    s3.append(h2);
    const help = document.createElement('p');
    help.innerHTML = 'Give us a call at <a href="tel:18008000000">1-800-800-0000</a> or e-mail us at <a href="mailto:info@wknd.com">info@wknd.com</a>. We love to talk adventures!';
    s3.append(help);
    // Metadata (inside the last section)
    const meta = {};
    meta.Title = 'FAQs | WKND';
    meta.Description = 'Frequently asked questions about WKND — our audience, how we work, contributing, and how to get in touch.';
    meta.Template = 'faqs';
    if (hero) {
      const mimg = document.createElement('img');
      mimg.src = hero.src;
      meta.Image = mimg;
    }
    s3.append(WebImporter.Blocks.getMetadataBlock(document, meta));
    main.append(s3);

    const path = new URL(originalURL).pathname
      .replace(/^\/us\/en/, '')
      .replace(/\.html$/, '')
      .replace(/\/$/, '');

    return [{
      element: main,
      path: WebImporter.FileUtils.sanitizePath(path || '/faqs'),
      report: { title: meta.Title, faqs: FAQS.length },
    }];
  },
};
