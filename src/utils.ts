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
import { Element, RootContent, Text } from "hast";
import { toHtml } from "hast-util-to-html";
import { whitespace } from "hast-util-whitespace";
import { remove } from "unist-util-remove";
import { visit } from "unist-util-visit";

/**
 * Recursively extract text content from a node.
 * @param {object} node
 * @returns {string}
 */
export function getText(node: Text | Element): string {
  if (!node) return '';
  if (node.type === 'text') return node.value;
  if (!node.children) return '';
  return node.children
    .filter((child): child is Text | Element => child.type === 'text' || child.type === 'element')
    .map(child => getText(child))
    .join('');
}

/**
 * Extract attributes from a node's properties.
 * @param {object} node
 * @returns {Record<string, string | number> | undefined}
 */
export function getAttrs(node: Element): Record<string, string | number> | undefined {
  if (!node.properties) return undefined;
  const attrs: Record<string, string | number> = {};
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
export function isBlockDiv(node: any): boolean {
  return (
    node.type === 'element' &&
    node.tagName === 'div' &&
    node.properties &&
    node.properties.className &&
    !node.properties.className.includes('section-metadata')
  );
}

export function cleanHtml(htmlNode: RootContent) {
  remove(htmlNode, (node: any) => node.type === 'text' && whitespace(node));

  visit(htmlNode, (node) => {
    if (typeof node === 'object' && node) {
      // Remove position property if present
      delete (node as any).position;

      // Remove empty children array
      if (Array.isArray((node as any).children) && (node as any).children.length === 0) {
        delete (node as any).children;
      }
    }
  });
}

function setRole(node: any, role: string) {
  node['aem-role'] = role;
}

function extractBlockOptions(classNameArr: string[] | undefined, blockName: string): string[] {
	if (!classNameArr) return [];
	return classNameArr.filter((cls) => cls !== blockName);
}


function annotateStructureNode(node: any, depth = 0, parentRole?: string) {
  if (!node || typeof node !== 'object' || !('type' in node)) return;

  if (node.type === 'element') {
    if (node.tagName === 'div') {
      if (parentRole === 'main') {
        setRole(node, 'section');
      } else if (parentRole === 'section') {
        setRole(node, 'block');
        node.name = node.properties?.className?.[0];
        const options = extractBlockOptions(node.properties?.className, node.name);
        node.options = options;
      } else if (parentRole === 'block') {
        setRole(node, 'row');
      } else if (parentRole === 'row') {
        setRole(node, 'cell');
      }
    }

    if (node.children) {
      node.children.forEach((child: any) => {
        annotateStructureNode(child, depth + 1, node['aem-role']);
      });
    }
  }
}

export function annotateHtml(htmlNode: RootContent) {
  // annotate basic tag roles
  visit(htmlNode, (node: any) => {
    if (node && typeof node === 'object' && 'type' in node && node.type === 'element') {
      const tagName = node.tagName;
      if (tagName === 'html') {
        setRole(node, 'page');
      } else if (tagName === 'head') {
        setRole(node, 'metadata');
      } else if (tagName === 'body') {
        setRole(node, 'content');
      } else if (tagName === 'main') {
        setRole(node, 'main');
      } else if (/^h[1-6]$/.test(tagName)) {
        setRole(node, 'heading');
        node.level = Number(tagName[1]);
      } else if (tagName === 'p') {
        setRole(node, 'paragraph');
      } else if (tagName === 'ul' || tagName === 'ol') {
        setRole(node, 'list');
      } else if (tagName === 'li') {
        setRole(node, 'list-item');
      } else if (tagName === 'a') {
        setRole(node, 'link');
      } else if (tagName === 'picture') {
        setRole(node, 'image');
      } else if (tagName === 'table') {
        setRole(node, 'table');
      } else if (tagName === 'tr') {
        setRole(node, 'table-row');
      } else if (tagName === 'td' || tagName === 'th') {
        setRole(node, 'table-cell');
      } else if (tagName === 'strong' || tagName === 'b') {
        setRole(node, 'emphasis');
      } else if (tagName === 'em' || tagName === 'i') {
        setRole(node, 'emphasis');
      } else if (tagName === 'code') {
        setRole(node, 'code');
      } else if (tagName === 'pre') {
        setRole(node, 'code-block');
      } else if (tagName === 'blockquote') {
        setRole(node, 'quote');
      }
    }
  });

  // annotate hierarchical roles for sections, blocks, rows, and cells
  annotateStructureNode(htmlNode);
}

export function cleanHead(headNode: Element) {
  if (!headNode || !headNode.children) return;
  headNode.children = headNode.children.filter((node: any) => {
    if (node.type !== 'element') return true;
    if (node.tagName === 'link') return false;
    if (node.tagName === 'script') {
      const type = node.properties && node.properties.type;
      return type === 'application/ld+json';
    }
    return true;
  });
}

export function addHtmlAttrToMainAndDiv(htmlNode: RootContent) {
  visit(htmlNode, (node: any) => {
    if (node && node.type === 'element' && (node['aem-role'] === 'main' || node['aem-role'] === 'section' || node['aem-role'] === 'block')) {
      node.html = toHtml(node);
    }
  });
}