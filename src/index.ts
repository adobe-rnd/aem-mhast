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
import { applyTransformer } from './transformers.js';
import HTMLConverter from './html2json.js';

export default {
  async fetch(request: Request): Promise<Response> {
    try {
      if (new URL(request.url).pathname === '/favicon.ico') {
        return new Response('', { status: 404 });
      }

      const ctx = getCtx(request.url);
      console.log('🔧 Context parsed:', JSON.stringify(ctx, null, 2));
      const edsContentUrl = `${ctx.edsDomainUrl}/${ctx.contentPath}`;
      const edsResp = await fetch(edsContentUrl, { cf: { scrapeShield: false } });
      if (!edsResp.ok) {
        return new Response(`Failed to fetch EDS page: ${edsContentUrl}`, { status: edsResp.status });
      }

      const html = await edsResp.text();
      const htmlDocument = parseHtml(html);
      const converter = new HTMLConverter(htmlDocument);


      const json = converter.getJson();


      // let json = {}
      // if (ctx.useSchema) {
      //   const htmlToJson = new HTMLConverter(mainNode);
      //   json.content = htmlToJson.getJson();
      // } else {
      //   json = {
      //     metadata: ctx.includeHead ? extractHead(headNode) : undefined,
      //     content: await extractMain(mainNode, ctx),
      //   };
      // }

      // // Apply transformer if specified
      // if (ctx.transformer) {
      //   json = applyTransformer(json, ctx.transformer);
      // }

      return new Response(JSON.stringify(json, null, 2), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err: any) {
      return new Response(`Error: ${err.message || err}`, { status: 500 });
    }
  },
};
