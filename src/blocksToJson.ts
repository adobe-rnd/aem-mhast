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

import { Element } from 'hast';
import { selectAll } from 'hast-util-select';
import { toString } from 'hast-util-to-string';
import { toClassName } from './utils';

/**
 * Converts HTML DIV table format back to JSON object using HAST
 * @param {string} htmlString - The HTML string with DIV tables to convert
 * @returns {Object} The reconstructed JSON object
 */
export function hastToJson(hastTree: Element) {
  const blocks: any = {};
  const references: any = {};
  let metadata: any = {};

  // Find all table DIV structures
  const tableDivs = selectAll('div > div', hastTree);

  // Helper function to parse rows into block data
  function parseRowsToBlockData(rows: any) {
    const data: any = {};
    for (let i = 0; i < rows.length; i++) {
      const cells = rows[i].children.filter((child: any) => child.type === 'element');
      if (cells.length >= 2) {
        const key = toString(cells[0]).trim();
        const value = toString(cells[1]).trim();

        if (value.startsWith('#')) {
          data[key] = value;
        } else {
          data[key] = parseValue(value);
        }
      }
    }
    return data;
  }

  // Process each table
  tableDivs.forEach((tableNode) => {
    const rows = tableNode.children.filter((child) => child.type === 'element');
    if (rows.length < 1) return;

    // get block name from class name
    const blockName = (tableNode.properties?.className as string[])?.[0];
    const refId = (tableNode.properties?.className as string[])?.[1];

    if (blockName === 'form') {
      metadata = parseRowsToBlockData(rows);
      return;
    }

    // Parse data rows
    const blockData = parseRowsToBlockData(rows);

    // Store table data
    if (Object.keys(blockData).length > 0) {
      if (refId) {
        blocks[refId] = blockData;
        references[refId] = blockName;
      } else {
        blocks['__root__'] = blockData;
      }
    }
  });

  // Helper function to parse values to appropriate types
  function parseValue(value: string) {
    if (value === '') return '';
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (!isNaN(value) && !isNaN(parseFloat(value)) && value !== '') {
      return parseFloat(value);
    }
    return value;
  }

  // Helper function to resolve references recursively
  function resolveReferences(obj: any) {
    const resolved: any = {};

    for (const [key, value] of Object.entries(obj)) {
      const truelyArray = value.startsWith("__array[");
      const emptyObject = value === "__array[]";

      if (typeof value === "string" && ( truelyArray|| value.startsWith("#"))) {
        const valueSanitized = value.startsWith("#") ? value : value.replace("__array[", "").replace("]", "");
        const refIds = valueSanitized.split(",").map((id) => toClassName(id.substring(1).trim()));        
        const resolvedRefs = refIds.map((refId) => {
          if (blocks[refId]) {
            return resolveReferences(blocks[refId]);
          } else {
            console.warn(`Reference ${refId} not found`);
            return null;
          }
        });
        resolved[key] = resolvedRefs.length === 1 ? resolvedRefs[0] : resolvedRefs;
      } else {
        resolved[key] = emptyObject ? {} : value;
      }
    }

    return resolved;
  }

  // Start with root table and resolve all references
  const rootData = blocks['__root__'] || {};
  return { metadata, data: resolveReferences(rootData) };
}
