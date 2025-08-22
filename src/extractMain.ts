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
import { extractContentElement } from './extractContent';
import { remove } from 'unist-util-remove';
import { whitespace } from 'hast-util-whitespace';
import { select } from 'hast-util-select';
import { Element } from 'hast';
import { Ctx } from './context';
import { isBlockDiv } from './utils';
import { extractBlock } from './extractBlock';
import { hastToJson } from './blocksToJson';

/**
 * Extract section metadata from a <div class="section-metadata">.
 * @param {any} sectionDiv
 * @returns {Record<string, string>|undefined}
 */
export function extractSectionMetadata(sectionDiv: Element): Record<string, string> | undefined {
  const metaDiv = select('div.section-metadata', sectionDiv);
  if (!metaDiv) return undefined;
  // Metadata is usually a set of <div><div>key</div><div>value</div></div>
  const meta: Record<string, string> = {};
  (metaDiv.children || []).forEach((row: any) => {
    if (row.type === 'element' && row.tagName === 'div' && row.children && row.children.length === 2) {
      const keyNode = row.children[0];
      const valueNode = row.children[1];
      const key =
        keyNode && keyNode.type === 'element'
          ? keyNode.children
              .map((n: any) => n.value || '')
              .join('')
              .trim()
              .toLowerCase()
          : '';
      const value =
        valueNode && valueNode.type === 'element'
          ? valueNode.children
              .map((n: any) => n.value || '')
              .join('')
              .trim()
          : '';
      if (key) meta[key] = value;
    }
  });
  return Object.keys(meta).length ? meta : undefined;
}

/**
 * Extracts the content of a section node, dispatching to block or content extraction as appropriate.
 * If the node is a block div, it uses extractBlock; otherwise, it uses extractContentElement.
 * @param {Element} node - The section node to extract.
 * @param {Ctx} ctx - The extraction context.
 * @returns {Promise<any>} The extracted section content.
 */
async function extractSection(node: Element, ctx: Ctx): Promise<any> {
  if (!node || node.type !== 'element') return null;
  if (isBlockDiv(node)) {
    return extractBlock(node, ctx);
  } else {
    return extractContentElement(node, ctx);
  }
}

/**
 * Extract all sections from <main> as an array of { metadata, section } objects.
 * @param {any} mainNode
 * @param {any} context
 * @param {boolean} compact
 * @returns {Promise<Array<{metadata?: Record<string, string>, section: any[]}>>}
 */
export async function extractMain(mainNode: Element, ctx: Ctx): Promise<Array<{ metadata?: Record<string, string>; section: any[] }>> {
  if (!mainNode || !mainNode.children) return [];

  // Remove all whitespace text nodes
  remove(mainNode, (node: any) => node.type === 'text' && whitespace(node));

  // Each direct <div> child of <main> is a section
  const sections = await Promise.all(
    mainNode.children
      .filter((child: any) => child.type === 'element' && child.tagName === 'div')
      .map(async (sectionDiv: any) => {
        let sectionContent: any = {};
        if (ctx.useSchema) {
          const jsonForSection = hastToJson(sectionDiv);
          const form = jsonForSection.metadata;
          const schemaId = form.schemaId;
          sectionContent = { form, [schemaId]: jsonForSection.data };
        } else {
          sectionContent = await Promise.all(
            (sectionDiv.children || [])
              .filter(
                (child: any) =>
                  !(
                    child.type === 'element' &&
                    child.tagName === 'div' &&
                    child.properties &&
                    child.properties.className &&
                    child.properties.className.includes('section-metadata')
                  )
              )
              .map(async (child: any) => {
                const result = await extractSection(child, ctx);
                return Array.isArray(result) ? result : [result];
              })
          );
        }
        return {
          metadata: extractSectionMetadata(sectionDiv),
          section: sectionContent,
        };
      })
  );

  return sections;
}
