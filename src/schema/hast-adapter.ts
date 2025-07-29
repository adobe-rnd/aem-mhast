import { Element } from 'hast';
import { selectAll as cssSelectAll, selectOne as cssSelectOne } from 'css-select';

// Custom adapter for css-select to traverse HAST nodes
export const hastAdapter = {
  isTag: (node: Element): node is Element => node.type === 'element',
  getAttributeValue: (node: Element, name: string): string | undefined => {
    if (name === 'class') {
      const className = node.properties?.className;
      return Array.isArray(className) ? className.join(' ') : String(className || '');
    }
    return node.properties && name in node.properties ? String(node.properties[name]) : undefined;
  },
  getChildren: (node: Element): Element[] => (node.children || []).filter(child => child.type === 'element') as Element[],
  getName: (node: Element): string => node.tagName,
  getParent: (node: any): Element | null => node.parent || null,
  getSiblings: (node: any): Element[] => {
    const parent = hastAdapter.getParent(node);
    return parent ? hastAdapter.getChildren(parent) : [node];
  },
  getText: (node: Element): string => {
    if ('value' in node) {
      return String(node.value);
    }
    return node.children?.map(child => hastAdapter.getText(child as Element)).join('') || '';
  },
  hasAttrib: (node: Element, name: string): boolean => {
    if (name === 'class') {
      return !!node.properties?.className;
    }
    return node.properties ? name in node.properties : false;
  },
  removeSubsets: (nodes: Element[]): Element[] => {
    const filtered = new Set(nodes);
    for (const node of nodes) {
      if (hastAdapter.getChildren(node).some(child => filtered.has(child))) {
        filtered.delete(node);
      }
    }
    return Array.from(filtered);
  },
  findAll: (test: (node: Element) => boolean, nodes: Element[]): Element[] => {
    let result: Element[] = [];
    for (const node of nodes) {
      if (test(node)) {
        result.push(node);
      }
      result = result.concat(hastAdapter.findAll(test, hastAdapter.getChildren(node)));
    }
    return result;
  },
  findOne: (test: (node: Element) => boolean, nodes: Element[]): Element | null => {
    for (const node of nodes) {
      if (test(node)) {
        return node;
      }
      const found = hastAdapter.findOne(test, hastAdapter.getChildren(node));
      if (found) {
        return found;
      }
    }
    return null;
  },
  equals: (a: Element, b: Element): boolean => a === b,
  existsOne: (test: (node: Element) => boolean, nodes: Element[]): boolean => {
    return nodes.some(node => test(node) || hastAdapter.existsOne(test, hastAdapter.getChildren(node)));
  },
};

// Create HAST-aware selector functions using the custom adapter
export const select = (selector: string, tree: Element | undefined): Element | null => {
  if (!tree) return null;
  return cssSelectOne(selector, tree, { adapter: hastAdapter });
};

export const selectAll = (selector: string, tree: Element | undefined): Element[] => {
  if (!tree) return [];
  return cssSelectAll(selector, tree, { adapter: hastAdapter });
}; 