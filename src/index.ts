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

export default {
	async fetch(request: Request): Promise<Response> {
		try {
			const url = new URL(request.url);
			// Expect path: /org/site/path/to/page
			const [, org, site, ...rest] = url.pathname.split('/');
			if (!org || !site) {
				return new Response('Usage: /org/site/path', { status: 400 });
			}
			const edsPath = rest.join('/') || '';
			const edsUrl = `https://main--${site}--${org}.aem.live/${edsPath}`;
			const edsResp = await fetch(edsUrl);
			if (!edsResp.ok) {
				return new Response(`Failed to fetch EDS page: ${edsUrl}`, { status: edsResp.status });
			}
			const html = await edsResp.text();
			const tree = parseHtml(html);
			const htmlNode = tree.children.find((n: any) => n.type === 'element' && n.tagName === 'html');
			if (!htmlNode) throw new Error('No <html> root found');
			const headNode = select('head', htmlNode);
			const mainNode = select('main', htmlNode);
			const json = {
				head: extractHead(headNode as object),
				main: extractMain(mainNode as object),
			};
			return new Response(JSON.stringify(json, null, 2), {
				headers: { 'content-type': 'application/json' },
			});
		} catch (err: any) {
			return new Response(`Error: ${err.message || err}`, { status: 500 });
		}
	},
};
