import { getAttrs, getText } from './utils.js';

/**
 * Extract <head> children to JSON.
 * @param {object} headNode
 * @returns {Array}
 */
export function extractHead(headNode) {
  if (!headNode || !headNode.children) return {};
  const result = {};
  
  const keyAttributes = {
    link: 'rel',
    meta: ['name', 'property']
  };
  
  headNode.children
    .filter(child => child.type === 'element')
    .forEach(child => {      
      const attrs = getAttrs(child);
      const keyAttr = keyAttributes[child.tagName];
      let key;
      if (keyAttr && attrs) {
        if (Array.isArray(keyAttr)) {
          key = attrs[keyAttr[0]] || attrs[keyAttr[1]];
        } else {
          key = attrs[keyAttr];
        }
      }

      if (child.tagName === "link" && key) {
        result[key] = { href: attrs.href };
      } else if (child.tagName === "meta" && key) {
        const meta = result["meta"] || [];
        const metaObj = {
          tag: key,
          text: attrs.content || ""
        };
        meta.push(metaObj);
        result["meta"] = meta;
      } else { // TODO: handle script and style tags  
        const obj = {};
        if (attrs) obj.attrs = attrs;
        if (["title", "script", "style"].includes(child.tagName)) {
          obj.text = getText(child);
        }
        result[child.tagName] = obj;
      }
    });
  return result;
} 