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

import { select, selectAll } from 'hast-util-select';
import { Element } from 'hast';
import { extractBlock as extractBlockData, extractValue } from './valueExtractor';
import { SchemaResolver } from './schemaResolver';
import { BlockSchema, BaseElementSchema } from './types';
import { Ctx } from '../context';

/**
 * Schema-based content extractor focused on sections and document order
 * Handles extraction of structured data from HTML body using custom schemas
 */
export class Extractor {

  /**
   * Extract structured data from HTML body, organized by sections with preserved order
   * @param mainElement - The main HTML element to extract from
   * @param {Ctx} ctx - Extraction context containing configuration
   * @param {SchemaResolver} schemaResolver - Schema resolver instance for loading schemas
   * @returns {Promise<any[]>} An array of section objects.
   */
  static async extract(mainElement: Element, ctx: Ctx, schemaResolver: SchemaResolver): Promise<any[]> {
    // Find all sections in the main element
    const sectionDivs = selectAll(':scope > div', mainElement) as Element[];

    const extractedSections: any[] = [];

    for (const sectionDiv of sectionDivs) {
      const sectionObject: Record<string, any> = {};
      // Extract all elements in this section (e..g, [{h1: '...'}, {p: '...'}])
      const elements = await this.extractSectionElements(sectionDiv, schemaResolver);

      // Aggregate elements into a single section object
      for (const element of elements) {
        const key = Object.keys(element)[0];
        const value = element[key];

        // If key already exists, find a new key with a suffix (e.g., h3, h3_2, h3_3)
        if (sectionObject.hasOwnProperty(key)) {
          let i = 2;
          let newKey = `${key}_${i}`;
          while (sectionObject.hasOwnProperty(newKey)) {
            i++;
            newKey = `${key}_${i}`;
          }
          sectionObject[newKey] = value;
        } else {
          // Otherwise, just set the key-value pair
          sectionObject[key] = value;
        }
      }
      extractedSections.push(sectionObject);
    }

    return extractedSections;
  }

  /**
   * Extract all elements (blocks and base elements) from a section in document order
   */
  private static async extractSectionElements(sectionDiv: Element, schemaResolver: SchemaResolver): Promise<any[]> {
    const elements: any[] = [];

    // Get all child elements excluding section-metadata
    const children = (sectionDiv.children || [])
      .filter((child: any) => {
        if (child.type !== 'element') return false;
        if (child.tagName === 'div' &&
          child.properties?.className &&
          child.properties.className.includes('section-metadata')) {
          return false;
        }
        return true;
      }) as Element[];

    for (const child of children) {
      // Check if it's a block (div with class)
      if (child.tagName === 'div' && child.properties?.className) {
        const classNames = child.properties.className as string[];
        const blockName = classNames[0];
        const variantName = classNames[1]; // The second class is the variant

        if (schemaResolver.isSupportedBlock(blockName)) {
          const blockData = await this.extractBlock(child, blockName, variantName, schemaResolver);
          if (blockData) {
            const finalBlockObject: { option?: string, data: any } = {
              data: blockData,
            };

            if (variantName) {
              finalBlockObject.option = variantName;
            }

            elements.push({
              [blockName]: finalBlockObject,
            });
          }
        }
      } else {
        // Check if it's a base element
        const baseElementData = await this.extractBaseElement(child, schemaResolver);
        if (baseElementData) {
          // Unwrapped format for base elements
          elements.push(baseElementData);
        }
      }
    }

    return elements;
  }

  /**
   * Extract a specific block using its schema
   */
  private static async extractBlock(blockElement: Element, blockName: string, variantName: string | undefined, schemaResolver: SchemaResolver): Promise<Record<string, unknown> | null> {
    try {
      const schema = await schemaResolver.loadBlockSchema(blockName, variantName);

      if (!schema) {
        return null;
      }

      return await extractValue(blockElement, schema, null, blockName) as Record<string, unknown> | null;
    } catch (error) {
      console.error(`❌ Error extracting block ${blockName}:`, error);
      return null;
    }
  }

  /**
   * Extract data from a base element
   */
  private static async extractBaseElement(element: Element, schemaResolver: SchemaResolver): Promise<Record<string, any> | null> {
    const tagName = element.tagName;

    if (!schemaResolver.isSupportedBaseElement(tagName)) {
      return null;
    }

    const schema = await schemaResolver.loadBaseElementSchema(tagName);
    if (!schema) {
      return null;
    }

    return this.extractBaseElementData(element, schema);
  }

  /**
   * Helper function to extract data based on a base element schema
   */
  private static async extractBaseElementData(element: Element, schema: BaseElementSchema): Promise<any> {
    return extractBlockData(element, schema as BlockSchema, schema.title || 'base-element');
  }
} 