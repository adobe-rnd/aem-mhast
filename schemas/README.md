# EDS Schema System

This directory contains the schema definitions for the EDS (Edge Delivery Services) content extraction and transformation system.

## Structure

### Primitives (`/primitives/`)
Base semantic units that represent fundamental HTML elements:
- `h1.schema.json` - HTML h1 elements - main titles
- `h2.schema.json` - HTML h2 elements - section headings
- `h3.schema.json` - HTML h3 elements - subsection headings
- `picture.schema.json` - HTML picture elements with responsive sources
- `paragraph.schema.json` - HTML paragraph elements
- `link.schema.json` - HTML anchor elements
- `list.schema.json` - HTML list elements (ul, ol)

### Blocks (`/blocks/`)
Complex content structures composed from primitives:
- `hero.schema.json` - Hero section with title, picture, description and optional CTA link
- `cards.schema.json` - Collection of cards with title, picture, description and links

### Transforms (`/transforms/`)
Transform schemas for reshaping extracted data:
- `page-basic.transform.json` - Basic page output format
- `api-response.transform.json` - API response format
- `cms-export.transform.json` - CMS export format

## Usage

### Data Extraction
Use the data schemas to extract structured content from HTML:

```javascript
// Extract hero block
const heroData = extractWithSchema('blocks/hero.schema.json', htmlElement);
```

### Data Transformation
Transform extracted data using transform schemas:

```javascript
// Transform for API response
const apiData = transformWithSchema('transforms/api-response.transform.json', extractedData);
```

## Schema Composition

Blocks use `$ref` to reference primitives, or `allOf` when overriding selectors:

```json
{
  "title": {
    "$ref": "../primitives/h1.schema.json"
  },
  "specificTitle": {
    "allOf": [
      { "$ref": "../primitives/h1.schema.json" },
      { "x-eds-selector": "> div h1" }
    ]
  }
}
```

This approach provides:
- **Reusability**: Primitives can be reused across multiple blocks
- **Consistency**: Uniform extraction logic for similar elements
- **Maintainability**: Changes to primitives propagate to all blocks
- **Flexibility**: Easy to override selectors or add properties

## Custom Extension Properties

All schemas support EDS-specific properties:
- `x-eds-selector`: CSS selector for element matching
- `x-eds-attribute`: HTML attribute to extract (defaults to "text" when omitted)

## Transform Operators

Transform schemas support these operators:
- `$from`: Map from source path
- `$default`: Fallback value
- `$map`: Transform array elements
- `$filter`: Filter array based on conditions
- `$merge`: Merge multiple arrays
- `$transform`: Apply transformation function

## Available Primitive References

When composing blocks, you can reference these primitives:
- `h1.schema.json`: For main titles and primary headings
- `h2.schema.json`: For section headings and secondary titles  
- `h3.schema.json`: For subsection headings and tertiary titles
- `picture.schema.json`: For responsive images with multiple source options
- `paragraph.schema.json`: For body text, descriptions, and general text content
- `link.schema.json`: For navigation links, CTAs, and any clickable elements
- `list.schema.json`: For ordered or unordered lists of items
- `text.schema.json`: For generic text content without specific semantics 