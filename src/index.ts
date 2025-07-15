/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
import { parseHtml } from './parseHtml.js';
import { extractHead } from './extractHead.js';
import { extractMain } from './extractMain.js';
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
			const headNode = htmlNode.children.find((n: any) => n.type === 'element' && n.tagName === 'head');
			const mainNode = select('main', htmlNode);
			const json = {
				head: extractHead(headNode),
				main: extractMain(mainNode),
			};
			return new Response(JSON.stringify(json, null, 2), {
				headers: { 'content-type': 'application/json' },
			});
		} catch (err: any) {
			return new Response(`Error: ${err.message || err}`, { status: 500 });
		}
	},
};
