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
import { selectAll, select } from './hast-adapter';
import { find as findProperty, html } from 'property-information';
import { getText } from '../utils';

/**
 * Constants for schema extraction
 */
export const SCHEMA_CONSTANTS = {
  SELECTOR: 'x-aem-selector',
  ATTRIBUTE: 'x-aem-attribute',
  TEXT: 'text',
  TYPES: {
    ARRAY: 'array',
    OBJECT: 'object',
    STRING: 'string'
  }
} as const;

/**
 * Extract value from an element using attribute name or text content.
 * Pure function - easily testable.
 */
export function extractValueFromElement(element: Element, attributeName: string): string {
  if (attributeName === SCHEMA_CONSTANTS.TEXT) {
    return getText(element).trim();
  }

  // Find the correct HAST property name (e.g., "srcset" -> "srcSet")
  const propInfo = findProperty(html, attributeName);
  const propertyName = propInfo.property;

  // Check if attribute exists (even if empty string)
  if (element.properties && propertyName in element.properties) {
    return element.properties[propertyName] as string;
  }

  // Fallback to text content if attribute doesn't exist
  return getText(element).trim();
}

/**
 * Find element using CSS selector within context.
 * Pure function - easily testable.
 */
export function findElementWithSelector(
  contextNode: Element,
  selector: string
): Element | null {
  return select(selector, contextNode);
}

/**
 * Find element using selector within context, with fallback to shared element.
 * Pure function - easily testable.
 */
export function findElement(
  contextNode: Element,
  selector?: string,
  sharedElement?: Element | null
): Element | null {
  if (selector) {
    return findElementWithSelector(contextNode, selector);
  }

  return sharedElement || null;
}

/**
 * Safely extract string value, preserving empty strings.
 * Pure function - easily testable.
 */
export function safeExtractString(value: string | undefined): string | null {
  return value !== undefined ? value : null;
} 