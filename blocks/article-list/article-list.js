import { readBlockConfig, createOptimizedPicture } from '../../scripts/aem.js';

/*
 * Article List block
 *
 * Dynamically lists articles from the site's query index
 * (query-index.json produced by helix-query.yaml). The list is data-driven:
 * publishing a new article that matches the index rule makes it appear here
 * with no code change.
 *
 * Content model (all rows optional):
 *   | Article List |                              |
 *   | ------------ | ---------------------------- |
 *   | Path         | /magazine/                   |
 *   | Limit        | 12                           |
 *   | Index        | /query-index.json            |
 *   | Tabs         | All, Climbing, Cycling, …    |
 *   | Sort         | title                        |
 *
 * Defaults: lists everything under /magazine/ (excluding the listing page
 * itself), newest first, from /query-index.json. When `Tabs` is set, a filter
 * bar is rendered and cards are filtered by their `category` field; the first
 * tab (e.g. "All") shows everything.
 */

const DEFAULTS = {
  path: '/magazine/',
  index: '/query-index.json',
  limit: 0, // 0 = no limit
};

/**
 * Fetches and caches the query index.
 * @param {string} indexUrl
 * @returns {Promise<Array<Object>>}
 */
async function fetchIndex(indexUrl) {
  const resp = await fetch(indexUrl);
  if (!resp.ok) throw new Error(`Failed to load index: ${indexUrl} (${resp.status})`);
  const json = await resp.json();
  return Array.isArray(json.data) ? json.data : [];
}

/**
 * Parses a row's publication date into a sortable timestamp.
 * Supports epoch seconds/millis and ISO/date strings; falls back to 0.
 * @param {Object} row
 * @returns {number}
 */
function rowDate(row) {
  const raw = row.publishDate || row.date || row.lastModified || '';
  if (!raw) return 0;
  const num = Number(raw);
  if (!Number.isNaN(num) && num > 0) {
    // helix stores dates as epoch seconds
    return num < 1e12 ? num * 1000 : num;
  }
  const parsed = Date.parse(raw);
  return Number.isNaN(parsed) ? 0 : parsed;
}

/**
 * Builds a single article card.
 * @param {Object} row
 * @returns {HTMLLIElement}
 */
function buildCard(row) {
  const li = document.createElement('li');
  li.className = 'article-list-card';

  const link = document.createElement('a');
  link.href = row.path;
  link.className = 'article-list-link';

  if (row.image && row.image !== '0') {
    // Decorative alt: the card title next to it already names the article, so
    // an alt duplicating the title triggers axe's image-redundant-alt.
    const picture = createOptimizedPicture(row.image, '', false, [{ width: '750' }]);
    const imageWrap = document.createElement('div');
    imageWrap.className = 'article-list-image';
    imageWrap.append(picture);
    link.append(imageWrap);
  }

  const bodyWrap = document.createElement('div');
  bodyWrap.className = 'article-list-body';

  // h2: listing pages have an h1 then these cards with no intervening heading,
  // so h2 keeps the heading order monotonic (avoids axe heading-order).
  const title = document.createElement('h2');
  title.className = 'article-list-title';
  title.textContent = row.title || row.path;
  bodyWrap.append(title);

  if (row.description) {
    const desc = document.createElement('p');
    desc.className = 'article-list-description';
    desc.textContent = row.description;
    bodyWrap.append(desc);
  }

  link.append(bodyWrap);
  li.append(link);
  return li;
}

/**
 * Renders the tab bar and wires up filtering of the card list by category.
 * @param {Element} block
 * @param {HTMLUListElement} list
 * @param {string[]} tabs first tab (e.g. "All") shows everything
 */
function renderTabs(block, list, tabs) {
  const tablist = document.createElement('div');
  tablist.className = 'article-list-tabs';
  tablist.setAttribute('role', 'tablist');

  const applyFilter = (category) => {
    [...list.children].forEach((li) => {
      const match = !category || (li.dataset.category || '').toLowerCase() === category.toLowerCase();
      li.hidden = !match;
    });
  };

  tabs.forEach((label, i) => {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'article-list-tab';
    tab.textContent = label;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    // first tab ("All") clears the filter
    const category = i === 0 ? '' : label;
    tab.addEventListener('click', () => {
      tablist.querySelectorAll('.article-list-tab').forEach((t) => t.setAttribute('aria-selected', 'false'));
      tab.setAttribute('aria-selected', 'true');
      applyFilter(category);
    });
    tablist.append(tab);
  });

  block.append(tablist);
}

/**
 * loads and decorates the article-list block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const config = readBlockConfig(block);
  const path = config.path || DEFAULTS.path;
  const indexUrl = config.index || DEFAULTS.index;
  const limit = parseInt(config.limit, 10) || DEFAULTS.limit;
  const sort = (config.sort || '').toLowerCase();
  const tabs = config.tabs
    ? config.tabs.split(',').map((t) => t.trim()).filter(Boolean)
    : null;

  block.textContent = '';

  const list = document.createElement('ul');
  list.className = 'article-list-items';

  try {
    const data = await fetchIndex(indexUrl);
    let articles = data
      .filter((row) => row.path && row.path.startsWith(path))
      // exclude the section landing page itself (e.g. /magazine)
      .filter((row) => row.path.replace(/\/$/, '') !== path.replace(/\/$/, ''));

    if (sort === 'title') {
      articles.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else {
      articles.sort((a, b) => rowDate(b) - rowDate(a));
    }
    if (limit > 0) articles = articles.slice(0, limit);

    if (articles.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'article-list-empty';
      empty.textContent = 'No articles found.';
      block.append(empty);
      return;
    }

    if (tabs && tabs.length > 1) renderTabs(block, list, tabs);
    articles.forEach((row) => {
      const card = buildCard(row);
      if (row.category) card.dataset.category = row.category;
      list.append(card);
    });
    block.append(list);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('article-list: unable to build list', error);
    const fallback = document.createElement('p');
    fallback.className = 'article-list-empty';
    fallback.textContent = 'Articles are temporarily unavailable.';
    block.append(fallback);
  }
}
