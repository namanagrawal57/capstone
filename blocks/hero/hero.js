import { createOptimizedPicture } from '../../scripts/aem.js';

/*
 * Hero block
 *
 * The hero image is the LCP element on the home page. The authored image comes
 * through as a plain <img loading="lazy" format=jpg>, which (a) makes the
 * preload scanner defer the LCP image and (b) serves JPEG instead of WebP.
 *
 * This decorate rebuilds the hero image as an EAGER, high-priority
 * createOptimizedPicture — giving responsive WebP sources and pulling the LCP
 * image forward. It runs in the eager phase (first section), before the lazy
 * blocks load.
 */

/**
 * loads and decorates the hero block
 * @param {Element} block The hero block element
 */
export default function decorate(block) {
  const img = block.querySelector('img');
  if (!img) return;

  const picture = img.closest('picture');
  const optimized = createOptimizedPicture(
    img.src,
    img.alt || '',
    true, // eager — this is the LCP image
    [{ media: '(min-width: 600px)', width: '2000' }, { width: '750' }],
  );

  // prioritise the LCP image in the network queue and preserve dimensions (CLS)
  const optimizedImg = optimized.querySelector('img');
  if (optimizedImg) {
    optimizedImg.setAttribute('fetchpriority', 'high');
    if (img.getAttribute('width')) optimizedImg.setAttribute('width', img.getAttribute('width'));
    if (img.getAttribute('height')) optimizedImg.setAttribute('height', img.getAttribute('height'));
  }

  (picture || img).replaceWith(optimized);
}
