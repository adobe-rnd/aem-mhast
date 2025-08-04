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
import { parseHtml } from './parseHtml.js';
import { extractMain } from './extractMain';
import { select } from 'hast-util-select';
import { Element } from 'hast';
import { getCtx } from './context.js';
import { addHtmlAttrToMainAndDiv, cleanHead, cleanHtml } from './utils';
import { annotateHtml } from "./annotation";
import { handleSchemaExtraction } from './schema';



export default {
	async fetch(request: Request, env: any): Promise<Response> {
		try {
			if (new URL(request.url).pathname === '/favicon.ico') {
				return new Response('', { status: 404 });
			}

			const ctx = getCtx(request.url, env);
			const edsContentUrl = `${ctx.edsDomainUrl}/${ctx.contentPath}`;
			const edsResp = await fetch(edsContentUrl);
			if (!edsResp.ok) {
				return new Response(`Failed to fetch EDS page: ${edsContentUrl}`, { status: edsResp.status });
			}

			const html = await edsResp.text();
			const tree = parseHtml(html);
			const htmlNode = tree.children.find((n: any) => n.type === 'element' && n.tagName === 'html');
			if (!htmlNode) throw new Error('No <html> root found');

			cleanHtml(htmlNode);
			cleanHead(select('head', htmlNode) as Element);
			annotateHtml(htmlNode);

			if (ctx.html) {
				addHtmlAttrToMainAndDiv(htmlNode);
			}

			// Check if schema-based extraction is requested
			if (ctx.useSchema) {
				return await handleSchemaExtraction(htmlNode as Element, ctx);
			}

			// Default behavior: return raw HTML tree (original behavior preserved)
			return new Response(JSON.stringify(htmlNode, null, 2), {
				headers: { 'content-type': 'application/json' },
			});

		} catch (err: any) {
			return new Response(`Error: ${err.message || err}`, { status: 500 });
		}
	},
};



