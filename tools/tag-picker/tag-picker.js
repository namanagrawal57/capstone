/*
 * WKND Tag Picker — a Document Authoring (da.live) Library plugin.
 *
 * Registered in the DA Library (see tools/tag-picker/README.md). When opened in
 * the DA editor sidebar, it lets an author pick from a curated set of WKND tags
 * and insert them into the document as a comma-separated list.
 *
 * Communicates with the DA editor via the DA SDK. We load the SDK dynamically
 * and fall back to postMessage so the plugin also works when previewed
 * standalone (e.g. during local development / review).
 */

// Curated WKND tag vocabulary. In a fuller implementation this could be loaded
// from a published tags sheet (e.g. /tags.json) so editors maintain it.
const TAGS = [
  'Surfing', 'Skiing', 'Ski Touring', 'Skateboarding', 'Climbing',
  'Camping', 'Backpacking', 'Cycling', 'Mountain Biking', 'Travel',
  'Adventure', 'Photography', 'Norway', 'Australia', 'California',
  'New Zealand', 'Winter', 'Summer', 'Beginner', 'Expert',
];

const selected = new Set();

/**
 * Sends the selected tags into the DA document, preferring the DA SDK and
 * falling back to a postMessage protocol.
 * @param {string} text
 */
async function sendToDocument(text) {
  try {
    // eslint-disable-next-line import/no-unresolved
    const { default: DA_SDK } = await import('https://da.live/nx/utils/sdk.js');
    const { actions } = await DA_SDK;
    if (actions && typeof actions.sendHTML === 'function') {
      actions.sendHTML(`<p>${text}</p>`);
      return;
    }
    if (actions && typeof actions.sendText === 'function') {
      actions.sendText(text);
      return;
    }
  } catch (e) {
    // SDK unavailable (e.g. standalone preview) — fall back below.
  }
  // Fallback: postMessage to the parent DA editor frame.
  window.parent.postMessage({ action: 'sendText', detail: { text } }, '*');
}

function updateActions() {
  const count = selected.size;
  document.getElementById('selected-count').textContent = `${count} selected`;
  document.getElementById('insert').disabled = count === 0;
}

function renderList(filter = '') {
  const list = document.getElementById('tag-list');
  const needle = filter.trim().toLowerCase();
  list.textContent = '';
  TAGS.filter((t) => !needle || t.toLowerCase().includes(needle)).forEach((tag) => {
    const li = document.createElement('li');
    const id = `tag-${tag.replace(/\s+/g, '-').toLowerCase()}`;
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.id = id;
    input.value = tag;
    input.checked = selected.has(tag);
    input.addEventListener('change', () => {
      if (input.checked) selected.add(tag);
      else selected.delete(tag);
      updateActions();
    });
    const label = document.createElement('label');
    label.htmlFor = id;
    label.textContent = tag;
    li.append(input, label);
    list.append(li);
  });
}

document.getElementById('tag-filter').addEventListener('input', (e) => renderList(e.target.value));
document.getElementById('insert').addEventListener('click', () => {
  const text = [...selected].join(', ');
  if (text) sendToDocument(text);
});

renderList();
updateActions();
