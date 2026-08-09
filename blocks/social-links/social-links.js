import { buildSocialList } from './social-icons.js';

/*
 * Social Links block
 *
 * Renders a row of social media links as accessible icon buttons.
 *
 * Content model (one link per row, or a bullet list of anchors in one cell):
 *   | Social Links |                            |
 *   | ------------ | -------------------------- |
 *   | Facebook     | https://facebook.com/wknd  |
 *   | Instagram    | https://instagram.com/wknd |
 *
 * The platform is inferred from the link's hostname or its text/title.
 */

/**
 * loads and decorates the social links block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const anchors = [...block.querySelectorAll('a[href]')];
  const list = buildSocialList(anchors, document);
  block.replaceChildren(list);
}
