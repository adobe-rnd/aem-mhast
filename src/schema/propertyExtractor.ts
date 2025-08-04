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
import { selectAll } from './hast-adapter';
import {
  SCHEMA_CONSTANTS,
  extractValueFromElement,
  findElement,
  safeExtractString,
} from './elementExtractor';
import { SchemaProperty, StringSchemaProperty, ArraySchemaProperty, ObjectSchemaProperty } from './types';

/**
 * Extract string value according to schema property definition.
 * Pure function with injected dependencies - easily testable.
 */
export function extractStringValue(
  contextNode: Element,
  property: StringSchemaProperty,
  sharedElement?: Element | null,
  propertyName?: string
): string | null {
  const selector = property[SCHEMA_CONSTANTS.SELECTOR];
  const element = findElement(contextNode, selector, sharedElement);

  if (!element) {
    if (!selector && !sharedElement) {
      const attributeName = property[SCHEMA_CONSTANTS.ATTRIBUTE] || propertyName || SCHEMA_CONSTANTS.TEXT;
      const value = extractValueFromElement(contextNode, attributeName);
      return safeExtractString(value);
    }
    return null;
  }

  const attributeName = property[SCHEMA_CONSTANTS.ATTRIBUTE] || propertyName || SCHEMA_CONSTANTS.TEXT;
  const value = extractValueFromElement(element, attributeName);
  return safeExtractString(value);
}

/**
 * Extract array values according to schema property definition.
 * Testable function with clear dependencies.
 */
export async function extractArrayValue(
  contextNode: Element,
  property: ArraySchemaProperty,
  extractValueFn: (element: Element, schema: SchemaProperty) => Promise<unknown | null>,
): Promise<unknown[] | null> {
  const selector = property[SCHEMA_CONSTANTS.SELECTOR];

  if (!selector || !property.items) {
    return null;
  }

  const elements = selectAll(selector, contextNode) as Element[];

  if (elements.length === 0) {
    return null;
  }

  const results = await Promise.all(
    elements.map(async (element) => {
      return extractValueFn(element, property.items!);
    }),
  );

  const filteredResults = results.filter(Boolean);

  return filteredResults.length > 0 ? filteredResults : null;
}

/**
 * Extract object values according to schema property definition.
 * Testable function with clear dependencies.
 */
export async function extractObjectValue(
  contextNode: Element,
  property: ObjectSchemaProperty,
  extractValueFn: (
    contextNode: Element,
    property: SchemaProperty,
    sharedElement?: Element | null,
    propertyName?: string
  ) => Promise<unknown | null>
): Promise<Record<string, unknown> | null> {
  if (!property.properties) {
    return null;
  }

  const result: Record<string, unknown> = {};
  const objectSelector = property[SCHEMA_CONSTANTS.SELECTOR];
  let sharedElement: Element | null = null;

  // Find shared element once if object has a selector.
  // This scopes the search for all sub-properties.
  if (objectSelector) {
    sharedElement = findElement(contextNode, objectSelector) || null;
    // If a selector is specified for the object but no element is found,
    // the entire object is considered not present.
    if (!sharedElement) {
      return null;
    }
  }

  for (const [propName, propSchema] of Object.entries(property.properties)) {
    const extractionContext = sharedElement || contextNode;
    const value = await extractValueFn(extractionContext, propSchema, sharedElement, propName);

    if (value !== null) {
      result[propName] = value;
    }
  }

  // Validate required fields
  if (property.required && property.required.length > 0) {
    const missingRequired = property.required.filter((reqField: string) => !(reqField in result));
    if (missingRequired.length > 0) {
      // Object is invalid if required fields are missing
      return null;
    }
  }

  return Object.keys(result).length > 0 ? result : null;
} 