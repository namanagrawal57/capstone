/* global WebImporter */
/*
 * Import script for the WKND About Us page.
 * Matches wknd.site: two sections — "Our Contributors" (4) and "WKND Guides"
 * (3) — each an intro + a Contributors grid block (avatar, name, role, social).
 * Self-contained; contributor roster is curated from the source page.
 */

const PROXY = 'https://wknd.site';
const AV = '/master/_jcr_content/root/container/image.coreimg.jpeg';

// name, role, avatar path, and social handle hrefs (from wknd.site)
const CONTRIBUTORS = [
  {
    name: 'Stacey Roswells',
    role: 'Artist | Photographer | Traveler',
    img: `/content/experience-fragments/wknd/language-masters/en/contributors/stacey-roswells${AV}/1660323785093/stacey-roswells.jpeg`,
    social: [['Facebook', '#facebook-staceyroswell'], ['Twitter', '#twitter-staceyroswells'], ['Instagram', '#insta-staceyroswells']],
  },
  {
    name: 'Jake Hammer',
    role: 'Influencer | Writer',
    img: `/content/experience-fragments/wknd/language-masters/en/contributors/jake-hammer${AV}/1660323785595/alex-iby-343837.jpeg`,
    social: [['Facebook', '#facebook-jakehammer'], ['Twitter', '#twitter-jakehammer'], ['Instagram', '#instagram-jakehammer']],
  },
  {
    name: 'Ian Provo',
    role: 'Photographer',
    img: `/content/experience-fragments/wknd/language-masters/en/contributors/ian-provo${AV}/1660323783653/ian-provo.jpeg`,
    social: [['Facebook', '#facebook-ianprovo'], ['Twitter', '#twitter-ianprovo'], ['Instagram', '#instagram-ianprovo']],
  },
  {
    name: 'Jacob Wester',
    role: 'Skater | Writer',
    img: `/content/experience-fragments/wknd/language-masters/en/contributors/jacob-wester${AV}/1660323792237/jacob-wester.jpeg`,
    social: [['Facebook', '#jacob-wester'], ['Twitter', '#jacob-wester'], ['Instagram', '#jacob-wester']],
  },
];

const GUIDES = [
  {
    name: 'Sofia Sjöberg',
    role: 'Photographer | Youtuber',
    img: `/content/experience-fragments/wknd/language-masters/en/contributors/sofia-sjoeberg${AV}/1660323785351/ayo-ogunseinde-237739.jpeg`,
    social: [['Facebook', 'https://www.facebook.com/'], ['Twitter', 'https://twitter.com/'], ['Instagram', 'https://www.instagram.com/']],
  },
  {
    name: 'Justin Barr',
    role: 'Artist | Rock Climber',
    img: `/content/experience-fragments/wknd/language-masters/en/contributors/justin-barr${AV}/1660323786548/justin-barr.jpeg`,
    social: [['Facebook', 'https://www.facebook.com/'], ['Twitter', 'https://twitter.com/'], ['Instagram', 'https://www.instagram.com/']],
  },
  {
    name: 'Kumar Selveraj',
    role: 'Photographer | Surfer',
    img: `/content/experience-fragments/wknd/language-masters/en/contributors/kumar-selveraj${AV}/1660323783843/kumar-selvaraj.jpeg`,
    social: [['Facebook', '#selveraj'], ['Instagram', '#selveraj'], ['Twitter', '#selveraj']],
  },
];

/** Builds a Contributors grid block table for a list of people. */
function contributorsBlock(document, people) {
  const rows = [['Contributors']];
  people.forEach((person) => {
    const imgCell = document.createElement('div');
    const img = document.createElement('img');
    img.src = `${PROXY}${person.img}`;
    img.alt = person.name;
    imgCell.append(img);

    const bodyCell = document.createElement('div');
    const h3 = document.createElement('h3');
    h3.textContent = person.name;
    bodyCell.append(h3);
    const h5 = document.createElement('h5');
    h5.textContent = person.role;
    bodyCell.append(h5);
    const ul = document.createElement('ul');
    person.social.forEach(([label, href]) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = href;
      a.textContent = label;
      li.append(a);
      ul.append(li);
    });
    bodyCell.append(ul);

    rows.push([imgCell, bodyCell]);
  });
  return WebImporter.DOMUtils.createTable(rows, document);
}

export default {
  transform: ({ document, params }) => {
    const originalURL = params.originalURL || params.url;
    const main = document.createElement('main');

    // Section 1: title + Our Contributors
    const s1 = document.createElement('div');
    const h1 = document.createElement('h1');
    h1.textContent = 'About Us';
    s1.append(h1);
    const h2a = document.createElement('h2');
    h2a.textContent = 'Our Contributors';
    s1.append(h2a);
    const introA = document.createElement('p');
    introA.textContent = 'Meet the outstanding individuals responsible for bringing you the most compelling stories across the globe.';
    s1.append(introA);
    s1.append(contributorsBlock(document, CONTRIBUTORS));
    main.append(s1);

    // Section 2: WKND Guides
    const s2 = document.createElement('div');
    const h2b = document.createElement('h2');
    h2b.textContent = 'WKND Guides';
    s2.append(h2b);
    const introB = document.createElement('p');
    introB.textContent = 'Meet our extraordinary travel guides. When you travel with a certified WKND guide you gain access to attractions and perspectives not found on the pages of a guide book.';
    s2.append(introB);
    s2.append(contributorsBlock(document, GUIDES));
    main.append(s2);

    // Metadata
    const s3 = document.createElement('div');
    const meta = {};
    meta.Title = 'About Us | WKND';
    meta.Description = 'Meet the WKND contributors and guides who bring you compelling stories and unforgettable adventures from across the globe.';
    meta.Template = 'about';
    s3.append(WebImporter.Blocks.getMetadataBlock(document, meta));
    main.append(s3);

    const path = new URL(originalURL).pathname
      .replace(/^\/us\/en/, '')
      .replace(/about-us/, 'about')
      .replace(/\.html$/, '')
      .replace(/\/$/, '');

    return [{
      element: main,
      path: WebImporter.FileUtils.sanitizePath(path || '/about'),
      report: { title: meta.Title, contributors: CONTRIBUTORS.length, guides: GUIDES.length },
    }];
  },
};
