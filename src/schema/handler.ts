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

import { select } from 'hast-util-select';
import { Element } from 'hast';
import { extractHead } from '../extractHead';
import { Extractor } from './extractor';
import { SchemaResolver } from './schemaResolver';
import { Ctx } from '../context';
import { addParentPointers } from './add-parent-pointers';

/**
 * Handle schema-based content extraction from HTML
 * Returns structured JSON organized by sections with schema-applied data
 */
export async function handleSchemaExtraction(htmlNode: Element, ctx: Ctx): Promise<Response> {
  // Add parent pointers to the HAST tree for advanced CSS selectors
  addParentPointers(htmlNode);

  // Create schema resolver instance with context
  const schemaResolver = new SchemaResolver(ctx);

  const headNode = select('head', htmlNode) as Element;
  const mainNode = select('main', htmlNode) as Element;

  if (!mainNode) {
    throw new Error('No <main> element found for schema extraction');
  }

  const sections = await Extractor.extract(mainNode, ctx, schemaResolver);

  const json = {
    sections,
  };

  return new Response(JSON.stringify(json, null, 2), {
    headers: { 'content-type': 'application/json' },
  });
} 