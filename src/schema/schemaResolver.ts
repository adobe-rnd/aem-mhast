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

// Schema resolver that loads schemas via HTTP (local dev server or remote)

import { BlockSchema, PrimitiveSchema, SchemaProperty } from './types';

/**
 * Recursively resolve $ref properties until we get a schema with actual type
 */
async function resolveSchemaRecursively(schema: any, resolver: typeof SchemaResolver): Promise<any> {
  // If schema has a direct type, we're done
  if (schema.type) {
    return schema;
  }

  // If schema has $ref, resolve it recursively
  if (schema.$ref) {
    try {
      const resolvedSchema = await resolver.resolvePrimitiveRef(schema.$ref);
      if (resolvedSchema) {
        // Recursively resolve the referenced schema
        const fullyResolvedSchema = await resolveSchemaRecursively(resolvedSchema, resolver);

        // Properties to keep during schema resolution (whitelist approach)
        const allowedProperties = [
          'type',              // Essential: defines property type (string, object, array)
          'properties',        // Essential: for object types, contains child properties
          'items',             // Essential: for array types, defines item schema
          'required',          // Useful: for validation during extraction
          'x-eds-selector',    // EDS-specific: element selector
          'x-eds-attribute',   // EDS-specific: attribute to extract
          'description',       // Debug: helpful for understanding property purpose
          'format'             // Optional: for string types (uri, etc.)
        ];

        // Clean resolved schema by keeping only extraction-relevant properties
        const cleanResolvedSchema: any = {};
        for (const prop of allowedProperties) {
          if (fullyResolvedSchema[prop] !== undefined) {
            cleanResolvedSchema[prop] = fullyResolvedSchema[prop];
          }
        }

        // Merge the cleaned resolved schema with current schema (excluding $ref)
        const mergedSchema = {
          ...cleanResolvedSchema,
          ...schema,
        };
        mergedSchema['x-eds-primitive-ref'] = true; // Add the flag here
        delete mergedSchema.$ref; // Clean up the now-resolved $ref
        return mergedSchema;
      }
    } catch (error) {
      console.warn(`Error resolving nested $ref ${schema.$ref}:`, error);
    }
  }

  // Return as-is if no $ref or resolution failed
  return schema;
}

/**
 * Deeply resolve all $ref properties in a schema, avoiding infinite recursion
 */
async function deepResolveSchema(schema: any, resolver: typeof SchemaResolver, visited = new Set()): Promise<any> {
  if (!schema || typeof schema !== 'object') {
    return schema;
  }

  // Prevent infinite recursion by tracking visited schemas
  const schemaId = schema.$id || JSON.stringify(schema);
  if (visited.has(schemaId)) {
    return schema;
  }
  visited.add(schemaId);

  // Handle $ref at the root level
  if (schema.$ref) {
    const resolved = await resolveSchemaRecursively(schema, resolver);
    return await deepResolveSchema(resolved, resolver, visited);
  }

  // Handle $ref in properties
  if (schema.properties) {
    const resolvedProperties: any = {};
    for (const [key, property] of Object.entries(schema.properties)) {
      resolvedProperties[key] = await deepResolveSchema(property, resolver, visited);
    }
    schema = { ...schema, properties: resolvedProperties };
  }

  // Handle $ref in array items
  if (schema.items) {
    const resolvedItems = await deepResolveSchema(schema.items, resolver, visited);
    schema = { ...schema, items: resolvedItems };
  }

  return schema;
}

/**
 * Local schema resolver for loading schemas from filesystem
 */
export class SchemaResolver {
  private static schemaCache = new Map<string, BlockSchema | PrimitiveSchema>();
  private static baseUrl: string = 'http://localhost:3001';

  /**
   * Initialize the schema resolver with the base URL for schema server
   */
  static initialize(baseUrl?: string) {
    // Auto-detect environment if no baseUrl provided
    if (!baseUrl) {
      // In worker development, use the Express.js proxy server
      baseUrl = 'http://127.0.0.1:3001';
    }
    this.baseUrl = baseUrl;
  }

  /**
   * Load a block schema from the local filesystem
   */
  static async loadBlockSchema(blockName: string, variantName?: string): Promise<SchemaProperty | null> {
    // Attempt to load the variant schema first
    if (variantName) {
      const variantCacheKey = `block:${blockName}.${variantName}`;
      if (this.schemaCache.has(variantCacheKey)) {
        return this.schemaCache.get(variantCacheKey) as SchemaProperty;
      }

      try {
        const variantSchema = await this.loadSchemaFromHttp(`blocks/${blockName}.${variantName}.schema.json`);
        if (variantSchema) {
          const resolvedSchema = await this.resolveAllRefsInSchema(variantSchema);
          this.schemaCache.set(variantCacheKey, resolvedSchema as SchemaProperty);
          return resolvedSchema;
        }
      } catch (error) {
        // Variant not found, which is okay. We'll fall back to the default.
      }
    }

    // Fallback to the default schema
    const cacheKey = `block:${blockName}`;

    if (this.schemaCache.has(cacheKey)) {
      return this.schemaCache.get(cacheKey) as SchemaProperty;
    }

    try {
      const schema = await this.loadSchemaFromHttp(`blocks/${blockName}.schema.json`);
      if (schema) {
        // Recursively resolve all $ref properties in the schema
        const resolvedSchema = await this.resolveAllRefsInSchema(schema);

        this.schemaCache.set(cacheKey, resolvedSchema as SchemaProperty);
        return resolvedSchema as SchemaProperty;
      }
      return null;
    } catch (error) {
      console.warn(`Failed to load block schema for ${blockName}:`, error);
      return null;
    }
  }

  /**
   * Load a primitive schema from the local filesystem
   */
  static async loadPrimitiveSchema(primitiveName: string): Promise<PrimitiveSchema | null> {
    const cacheKey = `primitive:${primitiveName}`;

    if (this.schemaCache.has(cacheKey)) {
      return this.schemaCache.get(cacheKey) as PrimitiveSchema;
    }

    try {
      const schema = await this.loadSchemaFromHttp(`primitives/${primitiveName}.schema.json`);
      if (schema) {
        // Recursively resolve all $ref properties in the schema
        const resolvedSchema = await this.resolveAllRefsInSchema(schema);

        this.schemaCache.set(cacheKey, resolvedSchema as PrimitiveSchema);
        return resolvedSchema as PrimitiveSchema;
      }
      return null;
    } catch (error) {
      console.warn(`Failed to load primitive schema for ${primitiveName}:`, error);
      return null;
    }
  }



  /**
   * Load schema from HTTP endpoint (Express.js proxy or remote)
   */
  private static async loadSchemaFromHttp(relativePath: string): Promise<any> {
    const url = `${this.baseUrl}/schemas/${relativePath}`;

    try {
      const response = await fetch(url);

      if (response.ok) {
        const json = await response.json();
        return json;
      } else {
        console.warn(`Schema not found: ${url} (${response.status})`);
      }
    } catch (error) {
      console.error(`Could not load schema from ${url}:`, error);
      console.error(`Make sure the schema server is running: npm run schema-server`);
      throw new Error(`Schema loading failed: ${relativePath}`);
    }

    return null;
  }

  /**
   * Resolve a $ref to a primitive schema
   */
  static async resolvePrimitiveRef(ref: string): Promise<PrimitiveSchema | null> {
    // Handle relative refs like "../primitives/text.schema.json" or "text.schema.json"
    const primitiveMatch = ref.match(/([^/]+)\.schema\.json$/);
    if (primitiveMatch) {
      const primitiveName = primitiveMatch[1];
      return this.loadPrimitiveSchema(primitiveName);
    }

    console.warn(`Cannot resolve primitive reference: ${ref}`);
    return null;
  }

  /**
   * Get list of supported block types
   */
  static getSupportedBlocks(): string[] {
    return ['hero', 'cards', 'tabs'];
  }

  /**
   * Get list of supported primitive types
   */
  static getSupportedPrimitives(): string[] {
    return ['text', 'h1', 'h2', 'h3', 'paragraph', 'link', 'picture', 'list'];
  }

  /**
   * Check if a block type is supported
   */
  static isSupportedBlock(blockName: string): boolean {
    return this.getSupportedBlocks().includes(blockName);
  }

  /**
   * Check if a primitive type is supported
   */
  static isSupportedPrimitive(primitiveName: string): boolean {
    return this.getSupportedPrimitives().includes(primitiveName);
  }

  /**
   * Recursively resolve all $ref properties in a schema
   */
  private static async resolveAllRefsInSchema(schema: any): Promise<any> {
    return await deepResolveSchema(schema, this);
  }

  /**
   * Clear the schema cache
   */
  static clearCache(): void {
    this.schemaCache.clear();
  }
} 