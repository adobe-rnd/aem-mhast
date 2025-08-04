# Schema-Based Content Extraction Specification v2

This document specifies the **implemented** schema-based content extraction system for converting semantic HTML into structured JSON. This specification reflects the actual working implementation, not the original design.

## Motivation

### The Goal: Enabling Headless Delivery for EDS

We are building a headless delivery system for Adobe Edge Delivery Services (EDS) projects that allows consuming EDS pages in structured JSON format. This enables:

- **API-First Content** - Serve content to mobile apps, third-party systems, and headless frontends
- **Multi-Channel Publishing** - Use the same content across web, mobile, and other digital touchpoints  
- **Developer Experience** - Provide structured data that's easy to consume programmatically

### Current EDS Authoring Model

EDS pages are authored using **document-based authoring** where authors create content using:

- **Basic HTML Elements** - Headings (`h1`, `h2`), paragraphs (`p`), images (`picture`), links (`a`)
- **Dynamic Blocks** - Custom components built as tables with flexible rows and columns

Blocks are essentially **tables** where authors can arrange any combination of basic HTML elements in rows and columns. This provides tremendous flexibility but creates challenges for structured data extraction.

### Block Structure Variability

Consider a **card block** that consists of a picture and title. Authors might structure this in multiple ways:

**Single Row, Two Columns:**
```html
<div class="cards">
  <div>
    <div>
      <picture>
        <img src="card1.jpg" alt="Card 1">
      </picture>
    </div>
    <div>
      <h3>Card Title</h3>
    </div>
  </div>
</div>
```

**Two Rows, Single Column:**
```html
<div class="cards">
  <div>
    <div>
      <picture>
        <img src="card1.jpg" alt="Card 1">
      </picture>
    </div>
  </div>
  <div>
    <div>
      <h3>Card Title</h3>
    </div>
  </div>
</div>
```

**Complex Layout with Multiple Cards:**
```html
<div class="cards">
  <div>
    <div>
      <picture><img src="card1.jpg" alt="Card 1"></picture>
    </div>
    <div>
      <h3>Card 1 Title</h3>
      <p>Card 1 description</p>
    </div>
  </div>
  <div>
    <div>
      <picture><img src="card2.jpg" alt="Card 2"></picture>
    </div>
    <div>
      <h3>Card 2 Title</h3>
      <p>Card 2 description</p>
    </div>
  </div>
</div>
```

### The Challenge

Without a contract defining how content is structured, JSON extraction would result in:

**Naive Approach - Raw HAST Structure:**
```json
{
  "cards": {
    "type": "element",
    "tagName": "div",
    "properties": {
      "className": ["cards"]                    // Block container
    },
    "children": [
      {
        "type": "element",
        "tagName": "div",                       // TABLE ROW 1
        "children": [
          {
            "type": "element",
            "tagName": "div",                   // TABLE COLUMN 1: Picture
            "children": [
              {
                "type": "element",
                "tagName": "picture",
                "children": [
                  {
                    "type": "element",
                    "tagName": "img",
                    "properties": {
                      "src": "card1.jpg",
                      "alt": "Card 1"
                    }
                  }
                ]
              }
            ]
          },
          {
            "type": "element",
            "tagName": "div",                   // TABLE COLUMN 2: Title
            "children": [
              {
                "type": "element",
                "tagName": "h3",
                "children": [
                  {
                    "type": "text",
                    "value": "Card Title"
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
}
```

**The resulting JSON doesn't provide structured and logical data structures that clients can reference and consume.**

### Our Solution: Schema-Driven Hydration

We introduce a **schema-based mapping system** that:

1. **Preserves EDS Flexibility** - No changes to existing workflows or HTML structure
2. **Provides Data Structure Contracts** - Schemas define what content represents and how it's structured
3. **Enables Structured Output** - Convert semantic HTML to meaningful JSON with clear data contracts

**Desired Output:**
```json
{
  "cards": {
    "data": [
      {
        "picture": {
          "src": "card1.jpg",
          "alt": "Card 1"
        },
        "title": "Card Title"
      }
    ]
  }
}
```

### Schema-Based Approach

We define **JSON Schemas** for:

- **Base Elements** - `h1.schema.json`, `picture.schema.json`, `paragraph.schema.json`
- **Block Components** - `cards.schema.json`, `hero.schema.json`, `tabs.schema.json`

These schemas provide:

- **Extraction Rules** - CSS selectors and attribute mappings
- **Data Contracts** - Clear structure for API consumers
- **Validation** - Ensure content meets expected format
- **Tooling Foundation** - Enable form-based authoring and content validation
- **Hydration Logic** - Transform HTML to structured JSON automatically

This creates the missing link between **human-friendly authoring** (semantic HTML) and **machine-friendly consumption** (structured JSON) without disrupting existing workflows.

## Overview

The system transforms semantic HTML content into structured JSON using two types of schemas:

- **Base Element Schemas** - Define extraction rules for standard HTML elements (`h1`, `p`, `picture`, etc.)
- **Block Schemas** - Define extraction rules for custom content blocks (`hero`, `cards`, etc.)

## Architecture

### Schema Resolution
Schemas are loaded dynamically from EDS domain URLs using the `SchemaResolver` class, which provides:
- HTTP-based schema loading with caching
- Recursive `$ref` resolution  
- Property merging and unwrapping
- Variant schema support

### Content Processing
The `Extractor` processes HTML content in this order:
1. Extract content from `<main>` element
2. Process each `<div>` child as a section
3. Within sections, classify elements as blocks or base elements
4. Apply appropriate schemas to extract structured data
5. Assemble final JSON with sections array

## Roles and Responsibilities

### The Author

Authors continue creating content **exactly the same way** as they do today - no changes to the authoring experience or workflows.

**Important Context:** In current EDS implementation, there's already a hidden contract between the Authoring team and Technical team. The Technical team defines `block.js` files that process and enrich HTML in the browser, creating an implicit understanding of how content should be structured. Authors who don't follow the expected block structure can break the rendering.

**What's New:** With headless delivery, this implicit contract becomes explicit through schemas, but the authoring process remains unchanged.

### The Technical Person

**Existing Responsibilities (Unchanged):**
- Create `block.js` and `block.css` files the same way as always
- Define block behavior and styling for web rendering
- Maintain the implicit contract with authors about content structure

**New Responsibility for Headless Delivery:**
- Create **JSON schemas** that describe the data structure for each block and base element
- These schemas serve as the **single source of truth** describing the expected data structure
- Enable headless delivery and better integration with systems like Universal Editor

**Schema Creation:**
```
my-site-repo/
├── blocks/
│   ├── hero/
│   │   ├── hero.js          ← Existing: browser rendering logic
│   │   ├── hero.css         ← Existing: styling
│   │   └── hero.schema.json ← New: data structure definition
│   └── cards/
│       ├── cards.js
│       ├── cards.css
│       └── cards.schema.json
└── schema/
    └── base/                ← New: base element schemas
        ├── h1.schema.json
        ├── picture.schema.json
        └── text.schema.json
```

### Reducing Implementation Overhead

**Boilerplate Schemas Provided:** To minimize customer effort, the system provides complete boilerplate schemas for:
- All common base elements (`h1`, `h2`, `p`, `picture`, `link`, etc.)
- Example block schemas (`hero`, `cards`, `tabs`)

**Customer Options:**
- **Use as-is:** Deploy boilerplate schemas without modification
- **Customize:** Adjust schemas to match specific content structures
- **Extend:** Add new schemas for custom blocks or base elements

This approach ensures customers can enable headless delivery with minimal effort while maintaining full flexibility to customize when needed.

## Schema URL Conventions

Schemas are loaded from standardized URL patterns based on the EDS domain:

### Block Schemas
```
${edsDomainUrl}/blocks/${blockName}/${blockName}.schema.json
```
**Example:** `https://main--site--owner.aem.live/blocks/hero/hero.schema.json`

### Block Variant Schemas  
```
${edsDomainUrl}/blocks/${blockName}/${blockName}.${variantName}.schema.json
```
**Example:** `https://main--site--owner.aem.live/blocks/cards/cards.icons.schema.json`

### Base Element Schemas
```
${edsDomainUrl}/schema/base/${elementName}.schema.json  
```
**Example:** `https://main--site--owner.aem.live/schema/base/h1.schema.json`

## Base Element Schema Format

Base element schemas define extraction rules for standard HTML elements.

### Simple String Base Element

```json
{
  "$id": "base/text.schema.json",
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Text",
  "description": "Base element schema for generic text content",
  "type": "string"
}
```

### Structured Object Base Element

```json
{
  "$id": "base/h1.schema.json", 
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "H1 Heading",
  "description": "Base element schema for HTML h1 elements",
  "type": "object",
  "x-aem-selector": "h1",
  "properties": {
    "h1": {
      "$ref": "base/text.schema.json"
    }
  }
}
```

### Complex Base Element with Multiple Properties

```json
{
  "$id": "base/picture.schema.json",
  "$schema": "http://json-schema.org/draft-07/schema#", 
  "title": "Picture",
  "description": "Base element schema for HTML picture elements",
  "type": "object",
  "x-aem-selector": "picture",
  "properties": {
    "picture": {
      "type": "object",
      "properties": {
        "src": {
          "type": "string",
          "format": "uri",
          "x-aem-selector": "img",
          "x-aem-attribute": "src"
        },
        "alt": {
          "type": "string", 
          "x-aem-selector": "img",
          "x-aem-attribute": "alt"
        },
        "sources": {
          "type": "array",
          "x-aem-selector": "source",
          "items": {
            "type": "object",
            "properties": {
              "srcset": {
                "type": "string",
                "x-aem-attribute": "srcset"
              },
              "media": {
                "type": "string", 
                "x-aem-attribute": "media"
              }
            }
          }
        }
      },
      "required": ["src"]
    }
  },
  "required": ["picture"]
}
```

## Block Schema Format

Block schemas define extraction rules for custom content components.

### Simple Block Schema

```json
{
  "$id": "blocks/hero.schema.json",
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Hero Block", 
  "description": "Main hero section with title and image",
  "type": "object",
  "properties": {
    "title": {
      "$ref": "base/h1.schema.json",
      "x-aem-selector": "div > div h1"
    },
    "picture": {
      "$ref": "base/picture.schema.json", 
      "x-aem-selector": "div > div picture"
    }
  },
  "required": ["title", "picture"]
}
```

### Array Block Schema

```json
{
  "$id": "blocks/cards.schema.json",
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Cards Block",
  "description": "Collection of multiple cards", 
  "type": "array",
  "x-aem-selector": "div",
  "items": {
    "type": "object",
    "properties": {
      "picture": {
        "$ref": "base/picture.schema.json",
        "x-aem-selector": "div:first-child > picture"
      },
      "link": {
        "$ref": "base/link.schema.json",
        "x-aem-selector": "div:last-child > a"  
      }
    },
    "required": ["picture", "link"]
  }
}
```

## Schema Property Reference System

The system uses JSON Schema `$ref` properties to compose schemas from base elements.

### Reference Resolution Process

1. **Load Referenced Schema** - Fetch base element schema from URL
2. **Recursive Resolution** - Resolve any nested `$ref` properties

### Property Override Example

```json
{
  "title": {
    "$ref": "base/h1.schema.json",
    "x-aem-selector": "div > div h1"
  }
}
```

After resolution, this becomes:
```json
{
  "title": {
    "type": "object",
    "x-aem-selector": "div > div h1",  // Override selector
    "properties": {
      "h1": {
        "type": "string"
      }
    }
  }
}
```

## HTML Structure and Element Classification

### Section Processing

HTML content is processed section by section:

```html
<main>
  <div><!-- Section 1 -->
    <h1>Page Title</h1>
    <p>Introduction</p>
    <div class="hero default"><!-- Block --></div>
  </div>
  <div><!-- Section 2 -->
    <h2>Section Title</h2>  
    <div class="cards"><!-- Block --></div>
  </div>
</main>
```

### Element Classification Rules

**Blocks:**
- `<div>` elements with CSS classes
- First class = block name (e.g., `hero`, `cards`)
- Second class = variant name (e.g., `default`, `icons`) 
- Must have corresponding schema file

**Base Elements:**
- Standard HTML elements (`h1`, `h2`, `p`, `picture`, `a`, etc.)
- Must have corresponding base element schema
- Processed in document order within sections

## JSON Output Format

The extraction process produces a structured JSON response:

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
          "picture": {
            "src": "/hero.jpg",
            "alt": "Hero image"
          }
        }
      }
    },
    {
      "h2": "Section Title",
      "cards": {
        "data": [
          {
            "picture": {
              "src": "/card1.jpg", 
              "alt": "Card 1"
            },
            "link": {
              "href": "/page1",
              "title": "Read More"
            }
          }
        ]
      }
    }
  ]
}
```

### Output Format Rules

All output formats are determined by the schema definitions. Customers have complete freedom to customize schemas since they live in their own site repository. The examples shown use the default boilerplate schemas.

## Extraction Process Details

### CSS Selector Processing

The system supports full CSS selector syntax:

- **Element selectors:** `h1`, `p`, `picture`
- **Descendant selectors:** `div > div h1`, `picture img`
- **Class selectors:** `.hero-content h1`
- **Pseudo-selectors:** `div:first-child`, `div:last-child`

### Attribute Extraction

Values can be extracted from:

- **Element text content:** `x-aem-attribute: "text"` (default)
- **HTML attributes:** `x-aem-attribute: "src"`, `x-aem-attribute: "href"`

## Open Questions

### Duplicate Key Handling

**Current Approach:** Duplicate keys get numeric suffixes (`h3`, `h3_2`, `h3_3`) when the same type of element appears multiple times as siblings within a section.

**Issue:** This approach works but isn't ideal from an API consumption perspective. Same-type elements can legitimately appear multiple times in authored content.

**Potential Solutions to Discuss:**
- **Array Approach**: Group same-type elements into arrays (e.g., `"h3": ["First heading", "Second heading"]`)
- **Schema-defined**: Allow schemas to specify how duplicates should be handled

## Summary

This schema-based content extraction system provides a flexible, extensible approach to converting semantic HTML into structured JSON.

**Key Principles:**
- **Schema-Driven** - All extraction rules and output formats defined by JSON schemas
- **Composable** - Base element schemas can be referenced and combined to build complex blocks  
- **Flexible** - Customer-customizable schemas in their own repositories
- **Section-Oriented** - Content processed in document order by sections
- **Type-Safe** - Validates required fields with predictable null-handling

Enables headless delivery of EDS content while maintaining the flexibility and simplicity of document-based authoring.