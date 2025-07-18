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