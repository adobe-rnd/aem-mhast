// index.js
// Entry point for EDS HTML to JSON transformation using HAST (modular)
import fs from 'fs';
import { parseHtml } from './parseHtml.js';
import { extractHead } from './extractHead.js';
import { extractSections } from './extractMain.js';
import { select } from 'hast-util-select';

/**
 * Main transformation: parse HTML, extract head and main, output JSON.
 * @param {string} html
 * @returns {object}
 */
function transformHASTtoJSON(html) {
  const tree = parseHtml(html);
  const htmlNode = tree.children.find(n => n.type === 'element' && n.tagName === 'html');
  if (!htmlNode) throw new Error('No <html> root found');
  const headNode = htmlNode.children.find(n => n.type === 'element' && n.tagName === 'head');
  const mainNode = select('main', htmlNode);
  return {
    head: extractHead(headNode),
    main: extractSections(mainNode)
  };
}

// CLI: input file as argument, default to samples/1.html
const inputFile = process.argv[2] || './samples/1.html';
const html = fs.readFileSync(inputFile, 'utf-8');
const json = transformHASTtoJSON(html);
console.log(JSON.stringify(json, null, 2)); 