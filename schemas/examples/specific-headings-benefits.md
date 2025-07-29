# Benefits of Specific Heading Primitives

This example demonstrates the advantages of using separate h1, h2, h3 primitives instead of a generic heading primitive.

## Old vs New Approach

### Old Approach (Generic Heading)
```json
// primitives/heading.schema.json
{
  "x-eds-selector": "h1, h2, h3, h4, h5, h6"  // Too broad!
}

// blocks/hero.schema.json 
{
  "title": {
    "$extends": "heading",
    "x-eds-selector": "h1"  // Always need to override
  }
}
```

### New Approach (Specific Headings)
```json
// primitives/h1.schema.json
{
  "x-eds-selector": "h1"  // Precise and clear
}

// blocks/hero.schema.json
{
  "title": {
    "$ref": "../primitives/h1.schema.json"  // No override needed!
  }
}
```

## Example HTML
```html
<div class="hero">
  <div>
    <div>
      <h2>Get Started Today</h2>
      <picture>
        <img src="hero.jpg" alt="Hero image">
      </picture>
      <h1>Markus was here</h1>
      <h3>Professional Tools</h3>
    </div>
  </div>
</div>

<div class="cards">
  <h2>Featured Tutorials</h2>
  <div>
    <picture><img src="card1.jpg" alt="Tutorial 1"></picture>
    <a href="/tutorial1">Learn Photo Editing</a>
  </div>
  <div>
    <picture><img src="card2.jpg" alt="Tutorial 2"></picture>
    <a href="/tutorial2">Master Color Grading</a>
  </div>
</div>
```

## Schema Comparison

### Hero Block Schema
```json
{
  "$id": "blocks/hero.schema.json",
  "x-eds-match": { "class": "hero" },
  "properties": {
    "title": {
      "$ref": "../primitives/h1.schema.json"  // ✅ Extracts: "Markus was here"
    },
    "picture": {
      "$ref": "../primitives/picture.schema.json"
    }
  }
}
```

### Cards Block Schema  
```json
{
  "$id": "blocks/cards.schema.json",
  "x-eds-match": { "class": "cards" },
  "properties": {
    "title": {
      "$ref": "../primitives/h2.schema.json"  // ✅ Extracts: "Featured Tutorials"  
    },
    "items": {
      "type": "array",
      "x-eds-selector": ":scope > div",
      "items": {
        "type": "object",
        "properties": {
          "picture": {
            "$extends": "picture"
          },
          "link": {
            "$extends": "link"
          }
        }
      }
    }
  }
}
```

## Extraction Results

### ✅ With Specific Heading Primitives
```json
{
  "hero": {
    "title": "Markus was here",  // Correct H1
    "picture": {
      "src": "hero.jpg",
      "alt": "Hero image"
    }
  },
  "cards": {
    "title": "Featured Tutorials",  // Correct H2
    "items": [
      {
        "picture": { "src": "card1.jpg", "alt": "Tutorial 1" },
        "link": { "href": "/tutorial1", "text": "Learn Photo Editing" }
      },
      {
        "picture": { "src": "card2.jpg", "alt": "Tutorial 2" },
        "link": { "href": "/tutorial2", "text": "Master Color Grading" }
      }
    ]
  }
}
```

### ❌ With Old Generic Heading (Without Overrides)
```json
{
  "hero": {
    "title": "Get Started Today",  // Wrong! Picked H2 (first in document order)
    "picture": {
      "src": "hero.jpg", 
      "alt": "Hero image"
    }
  },
  "cards": {
    "title": "Featured Tutorials",  // Correct by chance
    "items": [...]
  }
}
```

## Key Benefits

### 1. **No More Selector Overrides**
```json
// Old: Always needed overrides
{
  "title": {
    "allOf": [
      { "$ref": "../primitives/heading.schema.json" },
      { "x-eds-selector": "h1" }  // Required override
    ]
  }
}

// New: Clean and simple
{
  "title": {
    "$ref": "../primitives/h1.schema.json"  // Done!
  }
}
```

### 2. **Semantic Clarity**
- `$ref: "h1.schema.json"` → Main title (clear intent)
- `$ref: "h2.schema.json"` → Section heading (clear intent)
- `$ref: "h3.schema.json"` → Subsection heading (clear intent)

### 3. **Predictable Extraction**
- Each primitive targets exactly one heading level
- No ambiguity about which element gets selected
- Same input always produces same output

### 4. **Self-Documenting Schemas**
```json
{
  "mainTitle": { "$ref": "../primitives/h1.schema.json" },      // Obviously the main title
  "sectionTitle": { "$ref": "../primitives/h2.schema.json" },   // Obviously a section header
  "subsectionTitle": { "$ref": "../primitives/h3.schema.json" } // Obviously a subsection header
}
```

### 5. **Better Error Messages**
- "h1 not found in hero block" (specific and actionable)
- vs "heading not found" (which heading?)

### 6. **Easier Block Composition**
```json
// Complex page with multiple heading levels
{
  "pageTitle": { "$ref": "../primitives/h1.schema.json" },
  "sections": {
    "type": "array",
    "items": {
      "sectionTitle": { "$ref": "../primitives/h2.schema.json" },
      "subsections": {
        "type": "array", 
        "items": {
          "subsectionTitle": { "$ref": "../primitives/h3.schema.json" }
        }
      }
    }
  }
}
```

## When to Use Each Primitive

| Primitive | Use Case | Example |
|-----------|----------|---------|
| `h1` | Main titles, hero headlines, page titles | "Welcome to Our Site" |
| `h2` | Section headings, card group titles | "Featured Products", "About Us" |
| `h3` | Subsection headings, card titles | "Product Details", "Contact Info" |

## Migration Benefits

### Before (Generic + Overrides)
- 😕 Every block needed selector overrides
- 😕 Unpredictable behavior without overrides
- 😕 Hard to understand schema intent

### After (Specific Primitives)
- 😍 Clean, simple block schemas
- 😍 Predictable extraction always
- 😍 Self-documenting semantic intent
- 😍 No configuration overhead 