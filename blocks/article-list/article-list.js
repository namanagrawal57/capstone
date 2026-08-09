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
 *   | Article List |                    |
 *   | ------------ | ------------------ |
 *   | Path         | /magazine/         |
 *   | Limit        | 12                 |
 *   | Index        | /query-index.json  |
 *
 * Defaults: lists everything under /magazine/ (excluding the listing page
 * itself), newest first, from /query-index.json.
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
    const picture = createOptimizedPicture(row.image, row.title || '', false, [{ width: '750' }]);
    const imageWrap = document.createElement('div');
    imageWrap.className = 'article-list-image';
    imageWrap.append(picture);
    link.append(imageWrap);
  }

  const bodyWrap = document.createElement('div');
  bodyWrap.className = 'article-list-body';

  const title = document.createElement('h3');
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
 * loads and decorates the article-list block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const config = readBlockConfig(block);
  const path = config.path || DEFAULTS.path;
  const indexUrl = config.index || DEFAULTS.index;
  const limit = parseInt(config.limit, 10) || DEFAULTS.limit;

  block.textContent = '';

  const list = document.createElement('ul');
  list.className = 'article-list-items';

  try {
    const data = await fetchIndex(indexUrl);
    let articles = data
      .filter((row) => row.path && row.path.startsWith(path))
      // exclude the section landing page itself (e.g. /magazine)
      .filter((row) => row.path.replace(/\/$/, '') !== path.replace(/\/$/, ''));

    articles.sort((a, b) => rowDate(b) - rowDate(a));
    if (limit > 0) articles = articles.slice(0, limit);

    if (articles.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'article-list-empty';
      empty.textContent = 'No articles found.';
      block.append(empty);
      return;
    }

    articles.forEach((row) => list.append(buildCard(row)));
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
