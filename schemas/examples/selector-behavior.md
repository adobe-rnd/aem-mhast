# Selector Override Behavior in Block Schemas

This example demonstrates what happens when you don't override primitive selectors in block compositions.

## Example HTML with Multiple Headings

```html
<div class="hero">
  <div>
    <div>
      <h2>Secondary Title</h2>
      <picture>
        <img src="hero.jpg" alt="Hero image">
      </picture>
      <h1>Main Hero Title</h1>
      <h3>Subtitle</h3>
    </div>
  </div>
</div>
```

## Schema Variations

### Option 1: With Selector Override (Specific)
```json
{
  "$id": "blocks/hero-specific.schema.json",
  "title": "Hero Block - Specific Selector",
  "properties": {
    "title": {
      "$extends": "heading",
      "x-eds-selector": "h1"
    }
  }
}
```
**Result**: Extracts `"Main Hero Title"` (only H1 elements)

### Option 2: Without Override (Inherits from Primitive)
```json
{
  "$id": "blocks/hero-generic.schema.json", 
  "title": "Hero Block - Generic Selector",
  "properties": {
    "title": {
      "$extends": "heading"
    }
  }
}
```
**Result**: Extracts `"Secondary Title"` (first heading found - H2 in document order)

### Option 3: Multiple Heading Fields
```json
{
  "$id": "blocks/hero-multiple.schema.json",
  "title": "Hero Block - Multiple Headings",
  "properties": {
    "mainTitle": {
      "$extends": "heading",
      "x-eds-selector": "h1"
    },
    "secondaryTitle": {
      "$extends": "heading", 
      "x-eds-selector": "h2"
    },
    "subtitle": {
      "$extends": "heading",
      "x-eds-selector": "h3"
    }
  }
}
```
**Result**: 
```json
{
  "mainTitle": "Main Hero Title",
  "secondaryTitle": "Secondary Title", 
  "subtitle": "Subtitle"
}
```

## Extraction Behavior Rules

### Document Order Priority
When using generic selectors like `"h1, h2, h3, h4, h5, h6"`, the extractor will typically:

1. **Find all matching elements** within the block scope
2. **Return the first match** in document order
3. **Follow CSS selector precedence** (if implemented)

### Scoping Within Blocks
The selector operates within the block's scope:

```html
<div class="hero">          <!-- Block scope starts here -->
  <h2>This H2 is IN scope</h2>
  <div>
    <h1>This H1 is IN scope</h1>
  </div>
</div>
<h1>This H1 is OUT of scope</h1>
```

## Real-World Implications

### ✅ **Advantages of Generic Selectors**
```json
{
  "title": {
    "$extends": "heading"  // No override
  }
}
```

- **Flexibility**: Works with any heading level
- **Adaptable**: Handles varying content structures
- **Simpler schemas**: Less configuration needed
- **Future-proof**: Accommodates content changes

### ⚠️ **Disadvantages of Generic Selectors**

- **Unpredictable**: May extract unexpected content
- **Order-dependent**: Relies on document structure
- **Less semantic**: Doesn't encode intended hierarchy
- **Harder to debug**: Unclear which element was selected

### ✅ **Advantages of Specific Selectors**
```json
{
  "title": {
    "$extends": "heading",
    "x-eds-selector": "h1"  // Specific override
  }
}
```

- **Predictable**: Always targets intended elements
- **Semantic**: Encodes content hierarchy intent
- **Debuggable**: Clear which elements are targeted
- **Robust**: Less affected by HTML structure changes

### ⚠️ **Disadvantages of Specific Selectors**

- **Rigid**: Breaks if HTML structure changes
- **More config**: Requires explicit overrides
- **Content-specific**: Tied to particular implementations

## Recommended Approach

### For Production Schemas
```json
{
  "title": {
    "$extends": "heading",
    "x-eds-selector": "h1"  // Be explicit
  },
  "subtitle": {
    "$extends": "heading", 
    "x-eds-selector": "h2"  // Be explicit
  }
}
```

**Why?**
- Predictable extraction results
- Clear intent and semantics
- Easier debugging and maintenance
- Better error messages when elements are missing

### For Prototyping/Generic Schemas
```json
{
  "anyHeading": {
    "$extends": "heading"  // Let primitive decide
  }
}
```

**Why?**
- Quick setup for unknown content structures
- Flexible during content discovery phase
- Good for content analysis tools

## Mixed Approach Example

```json
{
  "$id": "blocks/hero-mixed.schema.json",
  "title": "Hero Block - Mixed Approach",
  "properties": {
    "mainTitle": {
      "$extends": "heading",
      "x-eds-selector": "h1"
    },
    "anyOtherHeading": {
      "$extends": "heading",
      "x-eds-selector": "h2, h3, h4"
    },
    "picture": {
      "$extends": "picture"
    }
  }
}
```

This gives you both precision (main title) and flexibility (other headings). 