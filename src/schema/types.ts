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
 * Base schema property interface
 */
export interface BaseSchemaProperty {
  type?: string;
  description?: string;
  'x-aem-selector'?: string;
  'x-aem-attribute'?: string;
  'x-aem-base-ref'?: boolean;
  $ref?: string;
}

/**
 * String schema property
 */
export interface StringSchemaProperty extends BaseSchemaProperty {
  type: 'string';
  'x-aem-attribute'?: string;
  format?: string;
}

/**
 * Object schema property
 */
export interface ObjectSchemaProperty extends BaseSchemaProperty {
  type: 'object';
  properties?: Record<string, SchemaProperty>;
  required?: string[];
}

/**
 * Array schema property
 */
export interface ArraySchemaProperty extends BaseSchemaProperty {
  type: 'array';
  items?: SchemaProperty;
}

/**
 * Reference schema property
 */
export interface RefSchemaProperty extends BaseSchemaProperty {
  $ref: string;
}

/**
 * Union type for all schema properties
 */
export type SchemaProperty =
  | StringSchemaProperty
  | ObjectSchemaProperty
  | ArraySchemaProperty
  | RefSchemaProperty;

/**
 * Block schema definition
 */
export interface BlockSchema {
  $id?: string;
  $schema?: string;
  title?: string;
  description?: string;
  type: 'object';
  properties?: Record<string, SchemaProperty>;
  required?: string[];
}

/**
 * Base element schema definition
 */
export interface BaseElementSchema {
  $id?: string;
  $schema?: string;
  title?: string;
  description?: string;
  type?: string;
  'x-aem-selector'?: string;
  'x-aem-attribute'?: string;
  properties?: Record<string, SchemaProperty>;
  required?: string[];
  $ref?: string;
} 