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

import { Element, Text } from 'hast';

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
    .map((child) => getText(child))
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

/**
 * Sanitizes a string for use as class name.
 * @param {string} name The unsanitized string
 * @returns {string} The class name
 */
export function toClassName(name: string): string {
  return typeof name === 'string'
    ? name
        .toLowerCase()
        .replace(/[^0-9a-z]/gi, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
    : '';
}
