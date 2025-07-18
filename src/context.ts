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

export type Ctx = {
	org: string;
	site: string;
	edsDomainUrl: string;
	contentPath: string;
	useSchema: boolean;
    html: boolean;
};

export function getCtx(url: string): Ctx {
	const urlObj = new URL(url);
	const [, org, site, ...rest] = urlObj.pathname.split('/');
	if (!org || !site) {
		throw new Error('Usage: /org/site/path');
	}
	const preview = urlObj.searchParams.get('preview') === 'true';
	const useSchema = urlObj.searchParams.get('schema') === 'true';
	const html = urlObj.searchParams.get('html') === 'true';
	return {
		org,
		site,
		edsDomainUrl: `https://main--${site}--${org}.aem.${preview ? 'page' : 'live'}`,
		contentPath: rest.join('/') || '',
		useSchema,
		html
	}
}