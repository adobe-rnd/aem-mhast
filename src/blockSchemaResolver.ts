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
import { select, selectAll } from 'hast-util-select';
import { getText } from './utils';
import { getMockSchema } from './mockSchemas';

/**
 * Fetch block schema from EDS domain or return mock schema for testing.
 * @param {string} blockName
 * @param {any} context
 * @returns {Promise<any|null>}
 */
export async function fetchBlockSchema(blockName: string, context: any): Promise<any | null> {
  try {
    // For now, return mock schema for testing
    const mockSchema = getMockSchema(blockName);
    if (mockSchema) {
      return mockSchema;
    }

    // In production, this would be:
    // const schemaUrl = `${context.edsDomainUrl}/blocks/${blockName}/${blockName}.schema.json`;
    // const response = await fetch(schemaUrl);
    // if (response.ok) {
    //   return await response.json();
    // }

    return null;
  } catch (error) {
    console.warn(`Failed to fetch schema for block ${blockName}:`, error);
    return null;
  }
}



/**
 * Extract value using schema selector and property definition.
 * @param {Element} blockNode
 * @param {any} propertySchema
 * @returns {any}
 */
function extractSchemaValue(blockNode: Element, propertySchema: any): any {
  if (propertySchema.type === 'array') {
    // Handle array types - extract from multiple elements
    const selector = propertySchema['x-eds-selector'];
    if (!selector) return null;

    const elements = selectAll(selector, blockNode) as Element[];
    if (elements.length === 0) return null;

    const itemSchema = propertySchema.items;
    if (!itemSchema) return null;

    const results = elements.map(element => {
      if (itemSchema.type === 'object') {
        // Extract object from each element
        const result: any = {};
        for (const [propName, propDef] of Object.entries(itemSchema.properties || {})) {
          const propDefinition = propDef as any;
          const attributeName = propDefinition['x-eds-attribute'] || propName;
          let value: string = '';

          if (attributeName === 'text') {
            value = getText(element).trim();
          } else if (element.properties?.[attributeName]) {
            value = element.properties[attributeName] as string;
          } else {
            value = getText(element).trim();
          }

          if (value) {
            result[propName] = value;
          }
        }
        return Object.keys(result).length ? result : null;
      } else if (itemSchema.type === 'string') {
        // Extract string from each element
        const attributeName = itemSchema['x-eds-attribute'] || 'text';

        if (attributeName === 'text') {
          return getText(element).trim() || null;
        } else if (element.properties?.[attributeName]) {
          return element.properties[attributeName] as string || null;
        }
        return null;
      }
      return null;
    }).filter(Boolean);

    return results.length > 0 ? results : null;
  } else if (propertySchema.type === 'object') {
    // Handle object types (like image, cta)
    const result: any = {};
    const objectSelector = propertySchema['x-eds-selector'];
    let sharedElement: Element | null = null;

    // If object has a selector, find the shared element once
    if (objectSelector) {
      sharedElement = select(objectSelector, blockNode) as Element;
    }

    for (const [propName, propDef] of Object.entries(propertySchema.properties || {})) {
      const propDefinition = propDef as any;

      // Check if this property is itself an object or array that needs recursive processing
      if (propDefinition.type === 'object' || propDefinition.type === 'array') {
        // Recursively process nested objects/arrays
        const nestedValue = extractSchemaValue(blockNode, propDefinition);
        if (nestedValue !== null) {
          result[propName] = nestedValue;
        }
      } else {
        // Handle simple string/attribute extraction
        let value: string = '';

        // Check if property has its own selector
        const propSelector = propDefinition['x-eds-selector'];
        const attributeName = propDefinition['x-eds-attribute'] || propName;
        let element: Element | null = null;

        if (propSelector) {
          // Property has its own selector
          element = select(propSelector, blockNode) as Element;
        } else if (sharedElement) {
          // Inherit parent object's element
          element = sharedElement;
        }

        if (element) {
          // Try to extract as attribute first, fallback to text content
          if (attributeName === 'text') {
            value = getText(element).trim();
          } else if (element.properties?.[attributeName]) {
            value = element.properties[attributeName] as string;
          } else {
            // Fallback to text content if attribute doesn't exist
            value = getText(element).trim();
          }

          if (value) {
            result[propName] = value;
          }
        }
      }
    }
    return Object.keys(result).length ? result : null;
  } else if (propertySchema.type === 'string') {
    // Handle string types
    const selector = propertySchema['x-eds-selector'];
    if (!selector) return null;

    const attributeName = propertySchema['x-eds-attribute'] || 'text';

    const element = select(selector, blockNode) as Element;
    if (!element) return null;

    if (attributeName === 'text') {
      return getText(element).trim() || null;
    } else if (element.properties?.[attributeName]) {
      return element.properties[attributeName] as string || null;
    }

    return null;
  }

  return null;
}

/**
 * Apply schema to extract structured data from block.
 * @param {Element} blockNode
 * @param {any} schema
 * @param {string} blockName
 * @returns {any}
 */
export function applyBlockSchema(blockNode: Element, schema: any, blockName: string): any {
  if (!schema || !schema.properties) return null;

  const data: any = {};

  for (const [propertyName, propertySchema] of Object.entries(schema.properties)) {
    const value = extractSchemaValue(blockNode, propertySchema);
    if (value !== null) {
      data[propertyName] = value;
    }
  }

  return data;
} 