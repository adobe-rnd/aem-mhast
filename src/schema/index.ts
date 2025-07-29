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

/**
 * Schema Module - Barrel Export
 * 
 * Provides a clean public API for schema-based content extraction.
 * All schema-related functionality is encapsulated in this module.
 */

// Main public classes and functions
export { Extractor } from './extractor';
export { SchemaResolver } from './schemaResolver';
export { extractBlock, extractValue } from './valueExtractor';
export { handleSchemaExtraction } from './handler';

// Low-level utilities (for advanced usage and testing)
export {
  extractValueFromElement,
  findElement,
  findElementWithSelector,
  safeExtractString,
  SCHEMA_CONSTANTS
} from './elementExtractor';

export {
  extractStringValue,
  extractArrayValue,
  extractObjectValue
} from './propertyExtractor';

// Type definitions
export type {
  SchemaProperty,
  StringSchemaProperty,
  ObjectSchemaProperty,
  ArraySchemaProperty,
  RefSchemaProperty,
  BlockSchema,
  PrimitiveSchema,
  BaseSchemaProperty
} from './types';

/**
 * Quick Start API
 * 
 * For most use cases, you only need:
 * - handleSchemaExtraction() - Complete HTTP handler (for index.ts)
 * - Extractor.extract() - High-level extraction
 * - SchemaResolver.loadBlockSchema() - Load block schemas
 * - extractBlock() - Apply schema to HTML element
 */ 