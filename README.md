# EDS HTML to JSON Transformer

This Node.js project transforms Edge Delivery Services (EDS) server-side HTML into a structured JSON representation using an Abstract Syntax Tree (HAST).

## Features
- Parses EDS HTML using [unified](https://www.npmjs.com/package/unified) and [rehype-parse](https://www.npmjs.com/package/rehype-parse)
- Outputs a JSON structure that includes:
  - The full `<head>` (title, meta, link, script, etc.)
  - All `<main>` sections, blocks, and default content
  - Section metadata and block options
- Modular codebase for maintainability and extensibility

## Project Structure
- `index.js` — Entry point, CLI, and main transformation logic
- `parseHtml.js` — HTML parsing and AST setup
- `extractHead.js` — Extraction of the `<head>` section
- `extractMain.js` — Extraction of `<main>` and sections
- `extractContent.js` — Extraction of all content elements recursively
- `utils.js` — Utility functions (text extraction, attribute extraction, block detection)

## Usage

1. Install dependencies:
   ```sh
   npm install
   ```
2. Place your EDS HTML file in the `samples/` directory (e.g., `samples/1.html`).
3. Run the transformer:
   ```sh
   npm start [path/to/yourfile.html]
   ```
   If no file is provided, it will process `samples/1.html` by default and print the resulting JSON to stdout.

## Customization
- Edit or extend the modules to support additional content types or custom mapping logic.

## License
MIT 