# Schema-Based JSON Hydration System

This module implements a sophisticated JSON hydration system that transforms HTML content into structured JSON data using JSON schemas. The system extracts content from HTML elements and applies schema-defined rules to produce typed, validated JSON output.

## Overview

The JSON hydration process takes HTML content and transforms it into structured JSON by:

1. **Schema Resolution** - Loading JSON schemas from EDS domain URLs
2. **HTML Parsing** - Converting HTML into a HAST (HTML Abstract Syntax Tree)
3. **Section Processing** - Extracting content from document sections in order
4. **Schema Application** - Applying schemas to extract typed data from HTML elements
5. **JSON Assembly** - Building the final JSON structure with validated data

## Architecture

```
HTML Input               → HAST Tree → Schema Resolution → Value Extraction → JSON Output
     ↓                         ↓             ↓                   ↓                ↓
handleSchemaExtraction() → Extractor → SchemaResolver    → ValueExtractor   → Response
```

### Core Components

- **`handler.ts`** - HTTP entry point that coordinates the entire process
- **`extractor.ts`** - Main orchestrator that processes sections and elements  
- **`schemaResolver.ts`** - Loads and caches schemas from remote URLs
- **`valueExtractor.ts`** - Recursively extracts values based on schema types
- **`propertyExtractor.ts`** - Handles specific property type extraction (string, array, object)
- **`elementExtractor.ts`** - Low-level DOM element value extraction utilities

## Step-by-Step Process Flow

### 1. Entry Point (`handleSchemaExtraction`)

```typescript
export async function handleSchemaExtraction(htmlNode: Element, ctx: Ctx): Promise<Response>
```

- Adds parent pointers to HAST tree for advanced CSS selectors
- Creates `SchemaResolver` instance with context (EDS domain URL)
- Finds the `<main>` element for content extraction
- Delegates to `Extractor.extract()` for processing
- Returns JSON response with structured data

### 2. Section Processing (`Extractor.extract`)

The extractor processes HTML content by sections:

```html
<main>
  <div><!-- Section 1 -->
    <h1>Heading</h1>
    <p>Paragraph</p>
    <div class="hero default">Block content</div>
  </div>
  <div><!-- Section 2 -->
    <h2>Another heading</h2>
    <div class="cards">Block content</div>
  </div>
</main>
```

Each `<div>` child of `<main>` is treated as a section. The extractor:

- Iterates through sections in document order
- Extracts all elements within each section
- Aggregates elements into section objects
- Handles duplicate keys with suffixes (`h3`, `h3_2`, `h3_3`)

### 3. Element Classification

Within each section, elements are classified as:

#### **Blocks** (Custom Components)
- `<div>` elements with CSS classes
- First class = block name (e.g., `hero`, `cards`)
- Second class = variant name (e.g., `default`, `icons`)
- Schema URL: `${baseUrl}/blocks/${blockName}/${blockName}.schema.json`
- Variant schema: `${baseUrl}/blocks/${blockName}/${blockName}.${variantName}.schema.json`

#### **Base Elements** (Standard HTML Elements)  
- Standard HTML elements (`h1`, `h2`, `p`, `picture`, etc.)
- Schema URL: `${baseUrl}/schema/base/${tagName}.schema.json`

### 4. Schema Resolution (`SchemaResolver`)

The `SchemaResolver` handles loading and caching schemas:

```typescript
class SchemaResolver {
  constructor(ctx: Ctx) {
    this.baseUrl = ctx.edsDomainUrl; // e.g., "https://main--mysite--owner.aem.live"
  }
}
```

#### Schema Loading Process:

1. **Cache Check** - Check if schema is already cached
2. **HTTP Fetch** - Load schema from remote URL
3. **Reference Resolution** - Recursively resolve `$ref` properties
4. **Schema Merging** - Merge resolved references with base schema
5. **Caching** - Store resolved schema for future use

#### Reference Resolution (`$ref`):

Schemas can reference base element schemas using `$ref`:

```json
{
  "type": "object",
  "properties": {
    "title": {
      "$ref": "#/base/h1"
    }
  }
}
```

The resolver:
- Fetches referenced base element schema
- Merges properties while preserving schema context
- Removes `$ref` and adds `x-aem-base-ref` flag
- Handles nested references recursively

### 5. Value Extraction (`extractValue`)

The value extraction process is recursive and type-driven:

```typescript
async function extractValue(
  contextNode: Element,
  property: SchemaProperty,
  sharedElement?: Element | null,
  propertyName?: string
): Promise<unknown | null>
```

#### Extraction by Type:

**String Properties:**
```json
{
  "type": "string",
  "x-aem-selector": "h1",
  "x-aem-attribute": "text"
}
```
- Finds element using CSS selector
- Extracts value from specified attribute or text content
- Returns string value or null

**Object Properties:**
```json
{
  "type": "object",
  "x-aem-selector": ".hero-content",
  "properties": {
    "title": { "$ref": "#/base/h1" },
    "description": { "$ref": "#/base/p" }
  },
  "required": ["title"]
}
```
- Finds container element (shared element)
- Recursively extracts each property within context
- Validates required fields
- Returns object or null if validation fails

**Array Properties:**
```json
{
  "type": "array",
  "x-aem-selector": "li",
  "items": {
          "$ref": "#/base/link"
  }
}
```
- Finds all matching elements using selector
- Recursively extracts value for each element
- Returns array of extracted values

### 6. CSS Selector Processing

The system uses CSS selectors for element targeting:

- **`:scope > div`** - Direct child sections
- **`h1`** - First h1 element
- **`.hero-content h1`** - h1 within hero-content class
- **`li a`** - Links within list items

Parent pointers enable advanced selectors that traverse up the DOM tree.

### 7. JSON Output Structure

The final JSON follows this structure:

```json
{
  "sections": [
    {
      "h1": "Page Title",
      "p": "Introduction paragraph",
      "hero": {
        "option": "default",
        "data": {
          "title": "Hero Title",
          "description": "Hero description",
          "image": {
            "src": "/image.jpg",
            "alt": "Image description"
          }
        }
      }
    },
    {
      "h2": "Section Title",
      "cards": {
        "data": {
          "items": [
            { "title": "Card 1", "link": "/page1" },
            { "title": "Card 2", "link": "/page2" }
          ]
        }
      }
    }
  ]
}
```

#### Output Format Rules:

- **Sections Array** - Top-level contains ordered sections
- **Block Format** - Blocks include `data` and optional `option` (variant)
- **Base Element Format** - Structure defined by schema (default: key-value pairs)
- **Duplicate Handling** - Duplicate keys get numeric suffixes
- **Null Filtering** - Null values are excluded from output

## Error Handling

The system includes comprehensive error handling:

- **Schema Loading Failures** - Warns and continues with remaining content
- **Missing Elements** - Returns null for missing required elements
- **Validation Failures** - Objects with missing required fields return null
- **Network Errors** - Graceful degradation when schemas can't be loaded

## Caching Strategy

The `SchemaResolver` implements intelligent caching:

- **In-Memory Cache** - Schemas cached for request lifetime
- **Cache Keys** - Format: `block:blockName` or `block:blockName.variant`
- **Resolved Schemas** - Stores fully resolved schemas (no `$ref`)
- **Performance** - Avoids repeated HTTP requests and reference resolution

## Usage Examples

### Basic Block Extraction
```typescript
const schemaResolver = new SchemaResolver(ctx);
const schema = await schemaResolver.loadBlockSchema('hero', 'default');
const blockData = await extractValue(blockElement, schema);
```

### Base Element Extraction
```typescript
const schema = await schemaResolver.loadBaseElementSchema('h1');
const headingData = await extractValue(headingElement, schema);
```

### Complete Document Processing
```typescript
const response = await handleSchemaExtraction(htmlElement, ctx);
const json = await response.json();
```

## Extension Points

The system is designed for extensibility:

- **Custom Schema Properties** - Add `x-aem-*` properties for domain-specific needs
- **New Base Element Types** - Add schemas for custom HTML elements
- **Advanced Selectors** - Leverage full CSS selector capabilities
- **Custom Transforms** - Post-process extracted data before JSON serialization

This modular, schema-driven approach enables flexible content extraction while maintaining type safety and validation throughout the hydration process.
