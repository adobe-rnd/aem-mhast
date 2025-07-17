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

import { fetchBlockSchema, extractBlockWithSchema } from './blockSchemaResolver';
import { Ctx } from './context';
import { extractContentElement } from './extractContent';

/**
 * Extract block options from className.
 * @param {Array<string>} classNameArr
 * @param {string} blockName
 * @returns {Array<string>}
 */
function extractBlockOptions(classNameArr: string[] | undefined, blockName: string): string[] {
	if (!classNameArr) return [];
	return classNameArr.filter((cls) => cls !== blockName);
}

export async function extractBlock(node: any, ctx: Ctx): Promise<{ options?: Record<string, string>; content: any[] }> {
	const { properties = {} } = node;
	const name = properties.className[0];
	const options = extractBlockOptions(properties.className, name);
	let blockContent: any = null;

	// Try to fetch schema first
	let schema = null;
	if (ctx && ctx.useSchema) {
		try {
			schema = await fetchBlockSchema(name, ctx);
		} catch (error) {
			console.warn(`Error fetching schema for block ${name}:`, error);
		}
	}

	if (schema) {
		// Schema exists - apply it
		try {
			blockContent = extractBlockWithSchema(node, schema, name);
		} catch (error) {
			console.warn(`Error applying schema for block ${name}:`, error);
			blockContent = {}; // Return empty data if schema application fails
		}
	} else {
		// No schema available use generic content extraction
		const contentElement = (node.children || []).map((child: any) => extractContentElement(child, ctx));
		blockContent = contentElement.filter(Boolean);
	}

	const result: any = {
		type: 'block',
		name,
		content: blockContent,
	};
	if (options.length > 0) {
		result.options = options;
	}

	return result;
}
