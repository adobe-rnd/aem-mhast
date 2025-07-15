// utils.js
/**
 * Recursively extract text content from a node.
 * @param {object} node
 * @returns {string}
 */
export function getText(node) {
  if (!node) return '';
  if (node.type === 'text') return node.value;
  if (!node.children) return '';
  return node.children.map(getText).join('');
}

/**
 * Extract attributes from a node's properties.
 * @param {object} node
 * @returns {object|undefined}
 */
export function getAttrs(node) {
  if (!node.properties) return undefined;
  const attrs = {};
  for (const [key, value] of Object.entries(node.properties)) {
    if (typeof value === 'string' || typeof value === 'number') {
      attrs[key] = value;
    } else if (Array.isArray(value)) {
      attrs[key] = value.join(' ');
    }
  }
  return Object.keys(attrs).length ? attrs : undefined;
}

/**
 * Determine if a <div> node is a block (has a className and is not section-metadata).
 * @param {object} node
 * @returns {boolean}
 */
export function isBlockDiv(node) {
  return (
    node.type === 'element' &&
    node.tagName === 'div' &&
    node.properties &&
    node.properties.className &&
    !node.properties.className.includes('section-metadata')
  );
} 