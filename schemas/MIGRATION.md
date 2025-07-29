# Migration: Generic to Specific Heading Primitives

## Summary

Successfully migrated from a generic `heading.schema.json` primitive to specific heading primitives (`h1`, `h2`, `h3`) to eliminate ambiguity and improve semantic clarity.

## Changes Made

### ❌ Removed
- `schemas/primitives/heading.schema.json` - Generic heading with `"h1, h2, h3, h4, h5, h6"` selector

### ✅ Added  
- `schemas/primitives/h1.schema.json` - Specific h1 primitive
- `schemas/primitives/h2.schema.json` - Specific h2 primitive  
- `schemas/primitives/h3.schema.json` - Specific h3 primitive

### 🔄 Updated

#### Block Schemas
- `schemas/blocks/hero.schema.json`: 
  - `"$extends": "heading", "x-eds-selector": "h1"` → `"allOf": [{"$ref": "h1.schema.json"}, {"x-eds-selector": "..."}]`
- `schemas/blocks/cards.schema.json`:
  - `"$extends": "heading", "x-eds-selector": "h2"` → `"allOf": [{"$ref": "h2.schema.json"}, {"x-eds-selector": "..."}]`

#### Documentation
- `schemas/index.json`: Updated primitives list
- `schemas/README.md`: Updated primitive descriptions and examples
- Added `schemas/examples/specific-headings-benefits.md`

## Benefits Achieved

### 1. **Eliminated Selector Overrides**
```json
// Before: Always needed overrides
{
  "title": {
    "allOf": [
      { "$ref": "../primitives/heading.schema.json" },
      { "x-eds-selector": "h1" }  // Required
    ]
  }
}

// After: Clean and semantic (when no override needed)
{
  "title": {
    "$ref": "../primitives/h1.schema.json"  // Done!
  }
}

// Or with row/column selector override
{
  "title": {
    "allOf": [
      { "$ref": "../primitives/h1.schema.json" },
      { "x-eds-selector": "> div > div h1" }
    ]
  }
}
```

### 2. **Predictable Extraction**
- No more document-order dependencies
- Each primitive targets exactly one heading level
- Same input always produces same output

### 3. **Self-Documenting Schemas**
- `$extends: "h1"` = main title (obvious)
- `$extends: "h2"` = section heading (obvious)  
- `$extends: "h3"` = subsection heading (obvious)

### 4. **Better Developer Experience**
- Cleaner block schema syntax
- More specific error messages
- Easier to understand schema intent

## Current Primitive Structure

```
schemas/primitives/
├── h1.schema.json          // Main titles, hero headlines
├── h2.schema.json          // Section headings, group titles
├── h3.schema.json          // Subsection headings
├── picture.schema.json     // Responsive images
├── paragraph.schema.json   // Body text
├── link.schema.json        // Links and CTAs
└── list.schema.json        // Ordered/unordered lists
```

## Usage Guidelines

### When to Use Each Heading Primitive

| Primitive | Use Case | Example |
|-----------|----------|---------|
| `h1` | Main titles, hero headlines, page titles | "Welcome to Our Site" |
| `h2` | Section headings, card group titles | "Featured Products" |
| `h3` | Subsection headings, card titles | "Product Details" |

### Example Block Composition
```json
{
  "heroTitle": { "$ref": "../primitives/h1.schema.json" },       // Main page title
  "sectionTitle": { "$ref": "../primitives/h2.schema.json" },    // Section heading
  "cardTitle": { "$ref": "../primitives/h3.schema.json" }        // Individual card title
}
```

## Validation

### ✅ Lightroom HTML Testing
- Hero block correctly extracts: `"Markus was here"` (h1)
- Cards block correctly extracts: `"Lightroom tutorials"` (h2 from preceding heading)
- No selector conflicts or ambiguous extractions

### ✅ Schema Integrity
- All existing transform schemas work unchanged
- Block schemas are simpler and more maintainable
- Extraction behavior is now predictable and deterministic

## Future Additions

When needed, we can easily add:
- `h4.schema.json` - Sub-subsection headings
- `h5.schema.json` - Minor headings  
- `h6.schema.json` - Smallest headings

Each will follow the same pattern:
```json
{
  "$id": "primitives/h4.schema.json",
  "title": "H4 Heading", 
  "x-eds-selector": "h4",
  "x-eds-attribute": "text"
}
```

## Migration Complete ✅

The schema system now provides:
- 🎯 **Predictable extraction** - no ambiguity
- 📝 **Self-documenting schemas** - clear semantic intent
- 🛠️ **Better developer experience** - simpler block composition
- 🔒 **Production reliability** - deterministic behavior 