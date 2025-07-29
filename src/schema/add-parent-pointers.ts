/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

/**
 * Recursively traverses a HAST tree and adds a `parent` property to each node.
 * This is necessary for CSS selectors that rely on parent/sibling relationships.
 * @param {any} node The current node to process.
 * @param {any|null} parent The parent of the current node.
 */
export function addParentPointers(node: any, parent: any | null = null) {
  // Use a non-enumerable property to avoid interfering with serialization or iteration.
  Object.defineProperty(node, 'parent', { value: parent, writable: true, configurable: true, enumerable: false });

  if (node.children) {
    for (const child of node.children) {
      addParentPointers(child, node);
    }
  }
} 