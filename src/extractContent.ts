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

import { toHtml } from 'hast-util-to-html';
import { getText, isBlockDiv } from './utils';
import { Element } from 'hast';
import { fetchBlockSchema, applyBlockSchema } from './blockSchemaResolver';

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
 * @returns {Promise<Array<any>>}
 */
export async function extractListItems(listNode: Element): Promise<any[]> {
  const items = await Promise.all(
    (listNode.children || [])
      .filter((child: any) => child.type === 'element' && child.tagName === 'li')
      .map(async (li: any) => {
        // Extract all content from the <li>
        const items = await Promise.all(
          (li.children || []).map((child: any) => extractContentElement(child, false, null))
        );
        const flatItems = items.flatMap((x: any) => Array.isArray(x) ? x : [x]).filter(Boolean);

        if (flatItems.length === 1 && typeof flatItems[0] === 'string') {
          return flatItems[0];
        } else if (flatItems.length === 1) {
          return flatItems[0];
        } else if (flatItems.length > 1) {
          return flatItems;
        } else {
          return getText(li).trim();
        }
      })
  );
  return items;
}

/**
 * Main content extraction dispatcher.
 * @param {object} node
 * @param {boolean} compact
 * @param {any} context
 * @returns {Promise<object|Array<any>|null>}
 */
export async function extractContentElement(node: any, compact: boolean = false, context: any = null): Promise<any> {
  if (node.type === 'text') return { type: "text", text: getText(node) };
  if (!node || node.type !== 'element') return null;

  const { tagName, properties = {} } = node;
  const type = tagName === 'p' ? 'paragraph' : tagName;

  if (compact && tagName !== 'div') {
    return {
      type,
      content: toHtml(node)
    };
  }

  if (/^h[1-6]$/.test(tagName)) {
    return {
      type: 'heading',
      level: Number(tagName[1]),
      text: getText(node).trim()
    };
  }

  if (tagName === 'p' || tagName === 'strong' || tagName === 'em') {
    if (node.children.length === 1 && node.children[0].type === 'text') {
      return {
        type,
        text: getText(node).trim()
      };
    }

    const content = await Promise.all(
      (node.children || []).map(async (child: any) => {
        // If text node, return its text
        if (child.type === 'text') {
          const text = getText(child);
          return text && text.trim() ? text : null;
        }
        // If element, recursively extract
        const extracted = await extractContentElement(child, compact, context);
        if (Array.isArray(extracted)) {
          return extracted;
        }
        return extracted;
      })
    );

    return {
      type,
      content: content.flat().filter(Boolean)
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
      items: await extractListItems(node)
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
    const options = extractBlockOptions(properties.className, name);
    let blockContent: any = null;

    // Try to fetch schema first
    let schema = null;
    if (context) {
      try {
        schema = await fetchBlockSchema(name, context);
      } catch (error) {
        console.warn(`Error fetching schema for block ${name}:`, error);
      }
    }

    if (schema) {
      // Schema exists - apply it
      try {
        blockContent = applyBlockSchema(node, schema, name);
      } catch (error) {
        console.warn(`Error applying schema for block ${name}:`, error);
        blockContent = {}; // Return empty data if schema application fails
      }
    } else {
      // No schema available - use legacy processing (fallback)
      const contentElement = await Promise.all(
        (node.children || []).map((child: any) => extractContentElement(child, compact, context))
      );
      blockContent = contentElement.filter(Boolean);
    }

    const result: any = {
      type: 'block',
      name,
      content: blockContent
    };
    if (options.length > 0) {
      result.options = options;
    }

    return result;
  }

  // For non-block <div>, recursively extract their children (flatten)
  if (tagName === 'div') {
    const children = await Promise.all(
      (node.children || []).map((child: any) => extractContentElement(child, compact, context))
    );
    return children.filter(Boolean);
  }

  // Fallback: unknown element
  return { tag: tagName };
} 