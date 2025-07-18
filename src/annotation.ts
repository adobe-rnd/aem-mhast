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

import { RootContent } from 'hast';
import { visit } from 'unist-util-visit';

/**
 * Sets the AEM role attribute on a node.
 * @param node - The HAST node to annotate
 * @param role - The role value to assign
 */
function setRole(node: any, role: string) {
	node['aem-role'] = role;
}

/**
 * Extracts block options from className array, excluding the block name itself.
 * @param classNameArr - Array of CSS class names
 * @param blockName - The primary block name to exclude
 * @returns Array of option class names
 */
function extractBlockOptions(classNameArr: string[] | undefined, blockName: string): string[] {
	if (!classNameArr) return [];
	return classNameArr.filter((cls) => cls !== blockName);
}

/**
 * Recursively annotates structural nodes (sections, blocks, rows, cells) based on hierarchy.
 * @param node - The HAST node to process
 * @param depth - Current depth in the tree (unused but kept for compatibility)
 * @param parentRole - The role of the parent node
 */
export function annotateStructureNode(node: any, depth = 0, parentRole?: string) {
	if (!node || typeof node !== 'object' || !('type' in node)) return;

	if (node.type === 'element') {
		if (node.tagName === 'div') {
			if (parentRole === 'main') {
				setRole(node, 'section');
			} else if (parentRole === 'section') {
				setRole(node, 'block');
				node.name = node.properties?.className?.[0];
				const options = extractBlockOptions(node.properties?.className, node.name);
				node.options = options;
			} else if (parentRole === 'block') {
				setRole(node, 'row');
			} else if (parentRole === 'row') {
				setRole(node, 'cell');
			}
		}

		if (node.children) {
			node.children.forEach((child: any) => {
				annotateStructureNode(child, depth + 1, node['aem-role']);
			});
		}
	}
}
/**
 * Annotates HTML nodes with AEM roles for semantic structure and content elements.
 * First pass: annotates basic semantic roles for content elements.
 * Second pass: annotates hierarchical roles for structural elements (sections, blocks, rows, cells).
 * @param htmlNode - The root HTML node to annotate
 */
export function annotateHtml(htmlNode: RootContent) {
	// annotate basic tag roles
	visit(htmlNode, (node: any) => {
		if (node && typeof node === 'object' && 'type' in node && node.type === 'element') {
			const tagName = node.tagName;
			if (tagName === 'html') {
				setRole(node, 'page');
			} else if (tagName === 'head') {
				setRole(node, 'metadata');
			} else if (tagName === 'body') {
				setRole(node, 'content');
			} else if (tagName === 'main') {
				setRole(node, 'main');
			} else if (/^h[1-6]$/.test(tagName)) {
				setRole(node, 'heading');
				node.level = Number(tagName[1]);
			} else if (tagName === 'p') {
				setRole(node, 'paragraph');
			} else if (tagName === 'ul' || tagName === 'ol') {
				setRole(node, 'list');
				node.ordered = tagName === 'ol';
			} else if (tagName === 'li') {
				setRole(node, 'list-item');
			} else if (tagName === 'a') {
				setRole(node, 'link');
			} else if (tagName === 'picture') {
				setRole(node, 'image');
			} else if (tagName === 'table') {
				setRole(node, 'table');
			} else if (tagName === 'tr') {
				setRole(node, 'table-row');
			} else if (tagName === 'td' || tagName === 'th') {
				setRole(node, 'table-cell');
			} else if (tagName === 'strong' || tagName === 'b') {
				setRole(node, 'emphasis');
			} else if (tagName === 'em' || tagName === 'i') {
				setRole(node, 'emphasis');
			} else if (tagName === 'code') {
				setRole(node, 'code');
			} else if (tagName === 'pre') {
				setRole(node, 'code-block');
			} else if (tagName === 'blockquote') {
				setRole(node, 'quote');
			}
		}
	});

	// annotate hierarchical roles for sections, blocks, rows, and cells
	annotateStructureNode(htmlNode);
}
