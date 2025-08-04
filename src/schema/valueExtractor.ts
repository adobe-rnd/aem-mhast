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
import { SCHEMA_CONSTANTS } from './elementExtractor';
import { extractStringValue, extractArrayValue, extractObjectValue } from './propertyExtractor';
import { SchemaProperty, StringSchemaProperty, ArraySchemaProperty, ObjectSchemaProperty, BlockSchema } from './types';

/**
 * Extract value using schema selector and property definition.
 * Main recursive coordinator function - testable with dependency injection.
 */
export async function extractValue(
  contextNode: Element,
  property: SchemaProperty,
  sharedElement?: Element | null,
  propertyName?: string,
): Promise<unknown | null> {
  // Input validation
  if (!contextNode || !property) {
    return null;
  }

  // All $ref properties should already be resolved at schema load time
  if (!property.type) {
    return null;
  }

  const { type: propertyType } = property;

  switch (propertyType) {
    case SCHEMA_CONSTANTS.TYPES.STRING:
      return extractStringValue(contextNode, property as StringSchemaProperty, sharedElement, propertyName);

    case SCHEMA_CONSTANTS.TYPES.ARRAY:
      return extractArrayValue(
        contextNode,
        property as ArraySchemaProperty,
        // Inject the recursive function for testability
        (element, schema) => extractValue(element, schema, null)
      );

    case SCHEMA_CONSTANTS.TYPES.OBJECT:
      const objectResult = await extractObjectValue(
        contextNode,
        property as ObjectSchemaProperty,
        // Inject the recursive function for testability
        (contextNode, property, sharedElement, propertyName) =>
          extractValue(contextNode, property, sharedElement, propertyName)
      );
      // Check if the result came from a base element $ref and unwrap it.
      if (property['x-aem-base-ref'] && objectResult && typeof objectResult === 'object' && Object.keys(objectResult).length === 1) {
        const [key, value] = Object.entries(objectResult)[0];
        return value;
      }
      return objectResult;

    default:
      return null;
  }
}

/**
 * High-level function to apply a block schema to a block element.
 * @param {Element} blockNode - The block element to extract data from.
 * @param {BlockSchema} schema - The block schema to apply.
 * @param {string} blockName - The name of the block (for logging).
 * @returns {Promise<Record<string, unknown> | null>} The extracted data object or null.
 */
export async function extractBlock(
  blockNode: Element,
  schema: BlockSchema,
  blockName: string,
): Promise<Record<string, unknown> | null> {
  // Input validation
  if (!blockNode || !schema || !schema.properties) {
    return null;
  }

  const data: Record<string, unknown> = {};

  for (const [propertyName, propertySchema] of Object.entries(schema.properties)) {
    try {
      const value = await extractValue(blockNode, propertySchema, null, propertyName);

      if (value !== null) {
        data[propertyName] = value;
      }
    } catch (error) {
      console.warn(`❌ extractBlock: Error extracting property ${propertyName} for block ${blockName}:`, error);
      // Continue processing other properties
    }
  }

  return Object.keys(data).length > 0 ? data : null;
} 