import { getAttrs, getText } from './utils';

/**
 * Extract <head> children to JSON.
 * @param {object} headNode
 * @returns {Record<string, any>}
 */
export function extractHead(headNode: any): Record<string, any> {
  if (!headNode || !headNode.children) return {};
  const result: Record<string, any> = {};
  
  const keyAttributes: Record<string, string | string[]> = {
    link: 'rel',
    meta: ['name', 'property']
  };
  
  headNode.children
    .filter((child: any) => child.type === 'element')
    .forEach((child: any) => {      
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

      if (child.tagName === "link" && key && attrs && typeof attrs.href === 'string') {
        result[key] = { href: attrs.href };
      } else if (child.tagName === "meta" && key && attrs && typeof attrs.content === 'string') {
        const meta = result["meta"] || [];
        const metaObj = {
          tag: key,
          text: attrs.content || ""
        };
        meta.push(metaObj);
        result["meta"] = meta;
      } else { // TODO: handle script and style tags  
        const obj: Record<string, any> = {};
        if (attrs) obj.attrs = attrs;
        if (["title", "script", "style"].includes(child.tagName)) {
          obj.text = getText(child);
        }
        result[child.tagName] = obj;
      }
    });
  return result;
} 