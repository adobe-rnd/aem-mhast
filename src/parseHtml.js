// parseHtml.js
import { unified } from 'unified';
import rehypeParse from 'rehype-parse';

export function parseHtml(html) {
  return unified()
    .use(rehypeParse, { fragment: false })
    .parse(html);
} 