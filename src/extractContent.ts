/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { getText, isBlockDiv } from './utils';
import { Element } from 'hast';

/**
 * Extract block options from className.
 * @param {Array<string>} classNameArr
 * @param {string} blockName
 * @returns {Array<string>}
 */
export function extractBlockOptions(classNameArr: string[] | undefined, blockName: string): string[] {
  if (!classNameArr) return [];
  return classNameArr.filter(cls => cls !== blockName);
}

/**
 * Extract list items recursively, preserving structure.
 * @param {object} listNode
 * @returns {Array<any>}
 */
export function extractListItems(listNode: Element): any[] {
  return (listNode.children || [])
    .filter((child: any) => child.type === 'element' && child.tagName === 'li')
    .map((li: any) => {
      // Extract all content from the <li>
      const items = (li.children || [])
        .map(extractContentElement)
        .flatMap((x: any) => Array.isArray(x) ? x : [x])
        .filter(Boolean);
      if (items.length === 1 && typeof items[0] === 'string') {
        return items[0];
      } else if (items.length === 1) {
        return items[0];
      } else if (items.length > 1) {
        return items;
      } else {
        return getText(li).trim();
      }
    });
}

/**
 * Main content extraction dispatcher.
 * @param {object} node
 * @returns {object|Array<any>|null}
 */
export function extractContentElement(node: any): any {
  if (node.type === 'text') return {type: "text", text: getText(node)};
  if (!node || node.type !== 'element') return null;
  
  const { tagName, properties = {} } = node;

  if (/^h[1-6]$/.test(tagName)) {
    return {
      type: 'heading',
      level: Number(tagName[1]),
      text: getText(node).trim()
    };
  }

  // TODO handle p with children like <strong> or <em>
  // TODO hanlde em with children like <a>
  if (tagName === 'p' || tagName === 'strong' || tagName === 'em') {
    // console.log(node);
    const type = tagName === 'p' ? 'paragraph' : tagName;
    
    if (node.children.length === 1 && node.children[0].type === 'text') {
      return {
        type,
        text: getText(node).trim()
      };
    }

    const content = (node.children || [])
      .map((child: any) => {
        // If text node, return its text
        if (child.type === 'text') {
          const text = getText(child);
          return text && text.trim() ? text : null;
        }
        // If element, recursively extract
        const extracted = extractContentElement(child);
        if (Array.isArray(extracted)) {
          return extracted;
        }
        return extracted;
      })
      .flat()
      .filter(Boolean);

    return {
      type,
      content
    };
  }

  if (tagName === 'picture') {
    const imgNode = (node.children || []).find((c: any) => c.type === 'element' && c.tagName === 'img');
    if (imgNode) {
      return {
        type: 'image',
        src: imgNode.properties?.src || '',
        alt: imgNode.properties?.alt || ''
      };
    }
  }
  if (tagName === 'img') {
    return {
      type: 'image',
      src: properties.src || '',
      alt: properties.alt || ''
    };
  }

  if (tagName === 'ul' || tagName === 'ol') {
    return {
      type: 'list',
      ordered: tagName === 'ol',
      items: extractListItems(node)
    };
  }

  if (tagName === 'a') {
    return {
      type: 'link',
      href: properties.href || '',
      text: getText(node).trim()
    };
  }

  if (tagName === 'table') {
    const rows = (node.children || []).find((c: any) => c.type === 'element' && c.tagName === 'tbody')?.children || [];
    if (rows.length > 0 && rows[0].type === 'element' && rows[0].tagName === 'tr') {
      const firstRow = rows[0];
      const ths = (firstRow.children || []).filter((c: any) => c.type === 'element' && c.tagName === 'th');
      if (ths.length > 0) {
        const name = getText(ths[0]).trim().toLowerCase();
        const blockRows = rows.slice(1).map((tr: any) =>
          (tr.children || []).filter((c: any) => c.type === 'element').map(getText)
        );
        return {
          type: 'block',
          name,
          rows: blockRows
        };
      }
    }
  }

  // Blocks: <div> with class (not section-metadata)
  if (isBlockDiv(node)) {
    const name = properties.className[0];
    const options = extractBlockOptions(properties.className, name)
    // Recursively extract all children as content (including nested blocks)
    const blockContent = (node.children || [])
      .map(extractContentElement)
      .filter(Boolean);

    const block: any = {
      type: 'block',
      name,
      content: blockContent
    };
    if (options.length > 0) {
      block.options = options;
    }

    return block;
  }

  // For non-block <div>, recursively extract their children (flatten)
  if (tagName === 'div') {
    return (node.children || []).map(extractContentElement).filter(Boolean);
  }

  // Fallback: unknown element
  return { tag: tagName };
} 