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
import { extractHead } from './extractHead';
import { extractMain } from './extractMain';
import { select } from 'hast-util-select';
import { Element } from 'hast';
import { getCtx } from './context.js';

export default {
	async fetch(request: Request): Promise<Response> {
		try {
			if (new URL(request.url).pathname === '/favicon.ico') {
				return new Response('', { status: 404 });
			}

			const ctx = getCtx(request.url);
			const edsContentUrl = `${ctx.edsDomainUrl}/${ctx.contentPath}`;
			const edsResp = await fetch(edsContentUrl);
			if (!edsResp.ok) {
				return new Response(`Failed to fetch EDS page: ${edsContentUrl}`, { status: edsResp.status });
			}

			const html = await edsResp.text();
			const tree = parseHtml(html);
			const htmlNode = tree.children.find((n: any) => n.type === 'element' && n.tagName === 'html');
			if (!htmlNode) throw new Error('No <html> root found');

			const headNode = select('head', htmlNode) as Element;
			const mainNode = select('main', htmlNode) as Element;
			const json = {
				metadata: ctx.includeHead ? extractHead(headNode) : undefined,
				content: await extractMain(mainNode, ctx),
			};
			return new Response(JSON.stringify(json, null, 2), {
				headers: { 'content-type': 'application/json' },
			});
		} catch (err: any) {
			return new Response(`Error: ${err.message || err}`, { status: 500 });
		}
	},
};
