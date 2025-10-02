import { env, createExecutionContext, waitOnExecutionContext, SELF } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import worker from '../src';
import { ffcPhotoshopTransformer } from '../src/transformers';

describe('Hello World user worker', () => {
	describe('request for /message', () => {
		it('/ responds with "Hello, World!" (unit style)', async () => {
			const request = new Request<unknown, IncomingRequestCfProperties>('http://example.com/message');
			// Create an empty context to pass to `worker.fetch()`.
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			// Wait for all `Promise`s passed to `ctx.waitUntil()` to settle before running test assertions
			await waitOnExecutionContext(ctx);
			expect(await response.text()).toMatchInlineSnapshot(`"Hello, World!"`);
		});

		it('responds with "Hello, World!" (integration style)', async () => {
			const request = new Request('http://example.com/message');
			const response = await SELF.fetch(request);
			expect(await response.text()).toMatchInlineSnapshot(`"Hello, World!"`);
		});
	});

	describe('request for /random', () => {
		it('/ responds with a random UUID (unit style)', async () => {
			const request = new Request<unknown, IncomingRequestCfProperties>('http://example.com/random');
			// Create an empty context to pass to `worker.fetch()`.
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			// Wait for all `Promise`s passed to `ctx.waitUntil()` to settle before running test assertions
			await waitOnExecutionContext(ctx);
			expect(await response.text()).toMatch(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/);
		});

		it('responds with a random UUID (integration style)', async () => {
			const request = new Request('http://example.com/random');
			const response = await SELF.fetch(request);
			expect(await response.text()).toMatch(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/);
		});
	});
});

describe('ffcPhotoshopTransformer', () => {
	it('should transform /content/dam/ references to _publishUrl objects', () => {
		const testData = {
			content: [{
				section: [{
					type: 'block',
					name: 'ffc-photoshop',
					content: {
						title: 'Test Content',
						image: '/content/dam/test-image.jpg',
						nested: {
							background: '/content/dam/background.png',
							description: 'Regular text'
						},
						items: [
							{
								src: '/content/dam/item1.jpg',
								alt: 'Item 1'
							},
							{
								src: '/content/dam/item2.png',
								alt: 'Item 2'
							}
						]
					}
				}]
			}]
		};

		const result = ffcPhotoshopTransformer(testData);

		// Check the structure
		expect(result.data.appsPdpByPath.item).toBeDefined();
		
		// Check that /content/dam/ references were transformed
		expect(result.data.appsPdpByPath.item.image._publishUrl).toBe('https://odin.adobe.com/content/dam/test-image.jpg');
		expect(result.data.appsPdpByPath.item.nested.background._publishUrl).toBe('https://odin.adobe.com/content/dam/background.png');
		expect(result.data.appsPdpByPath.item.items[0].src._publishUrl).toBe('https://odin.adobe.com/content/dam/item1.jpg');
		expect(result.data.appsPdpByPath.item.items[1].src._publishUrl).toBe('https://odin.adobe.com/content/dam/item2.png');
		
		// Check that non-dam references are unchanged
		expect(result.data.appsPdpByPath.item.title).toBe('Test Content');
		expect(result.data.appsPdpByPath.item.nested.description).toBe('Regular text');
		expect(result.data.appsPdpByPath.item.items[0].alt).toBe('Item 1');
		expect(result.data.appsPdpByPath.item.items[1].alt).toBe('Item 2');
		
		// Check that _references array contains all transformed objects at the correct level
		expect(result.data.appsPdpByPath._references).toEqual([
			{ _publishUrl: 'https://odin.adobe.com/content/dam/test-image.jpg' },
			{ _publishUrl: 'https://odin.adobe.com/content/dam/background.png' },
			{ _publishUrl: 'https://odin.adobe.com/content/dam/item1.jpg' },
			{ _publishUrl: 'https://odin.adobe.com/content/dam/item2.png' }
		]);
	});

	it('should return original data when no ffc-photoshop content is found', () => {
		const testData = {
			content: [{
				section: [{
					type: 'block',
					name: 'other-block',
					content: {
						title: 'Other Content'
					}
				}]
			}]
		};

		const result = ffcPhotoshopTransformer(testData);
		expect(result).toEqual(testData);
	});

	it('should handle data without /content/dam/ references', () => {
		const testData = {
			content: [{
				section: [{
					type: 'block',
					name: 'ffc-photoshop',
					content: {
						title: 'Test Content',
						description: 'No DAM references here'
					}
				}]
			}]
		};

		const result = ffcPhotoshopTransformer(testData);
		
		// Should still transform structure but no _references
		expect(result.data.appsPdpByPath.item.title).toBe('Test Content');
		expect(result.data.appsPdpByPath.item.description).toBe('No DAM references here');
		expect(result.data.appsPdpByPath._references).toBeUndefined();
	});
});
