# Lightroom Example: Selector Override Impact

This demonstrates the real impact of selector overrides using the actual Lightroom HTML.

## Lightroom Hero HTML Structure
```html
<div class="hero">
  <div>
    <div>
      <p>
        <picture>...</picture>
      </p>
      <h1 id="markus-was-here">Markus was here</h1>
    </div>
  </div>
</div>
```

## Surrounding Context (Outside Hero Block)
```html
<main>
  <div>
    <h1 id="lightroom"><strong>Lightroom</strong></h1>  <!-- Page title -->
    <p><picture>...</picture></p>
    <h2 id="desktop">Desktop</h2>                       <!-- Section heading -->
    <p>Lightroom is a photo editing app...</p>
    
    <!-- Hero block starts here -->
    <div class="hero">
      <div>
        <div>
          <p><picture>...</picture></p>
          <h1 id="markus-was-here">Markus was here</h1>  <!-- Hero title -->
        </div>
      </div>
    </div>
    <!-- Hero block ends here -->
    
    <h3 id="main-uses">Main uses</h3>                   <!-- Next section -->
  </div>
</main>
```

## Schema Comparison

### Current Schema (With Override)
```json
{
  "$id": "blocks/hero.schema.json",
  "x-eds-match": { "class": "hero" },
  "properties": {
    "title": {
      "$extends": "heading",
      "x-eds-selector": "h1"
    },
    "picture": {
      "$extends": "picture",
      "x-eds-selector": "picture"
    }
  }
}
```

### Alternative Schema (Without Override)
```json
{
  "$id": "blocks/hero-generic.schema.json", 
  "x-eds-match": { "class": "hero" },
  "properties": {
    "title": {
      "$extends": "heading"
      // Inherits: "x-eds-selector": "h1, h2, h3, h4, h5, h6"
    },
    "picture": {
      "$extends": "picture"
      // Inherits: "x-eds-selector": "picture"
    }
  }
}
```

## Extraction Results

### With Selector Override ✅
```json
{
  "hero": {
    "title": "Markus was here",
    "picture": {
      "src": "./media_1e6b24c90364d59a5a2962a90ee58dc12214331c8.jpg...",
      "alt": "",
      "sources": [...]
    }
  }
}
```

### Without Selector Override ✅ (Same Result)
```json
{
  "hero": {
    "title": "Markus was here",
    "picture": {
      "src": "./media_1e6b24c90364d59a5a2962a90ee58dc12214331c8.jpg...",
      "alt": "",
      "sources": [...]
    }
  }
}
```

## Why Same Result?

In this specific case, both approaches work because:

1. **Block scoping**: The extractor only looks within `<div class="hero">`
2. **Single heading**: There's only one `<h1>` inside the hero block
3. **No ambiguity**: No competing headings within the block scope

## When Results Would Differ

Consider this modified hero HTML:

```html
<div class="hero">
  <div>
    <div>
      <h2>Get Started Today</h2>          <!-- Added secondary heading -->
      <p><picture>...</picture></p>
      <h1 id="markus-was-here">Markus was here</h1>
      <h3>Professional Tools</h3>         <!-- Added subtitle -->
    </div>
  </div>
</div>
```

### With Override (`"h1"`)
```json
{
  "hero": {
    "title": "Markus was here"  // Correct main title
  }
}
```

### Without Override (`"h1, h2, h3, h4, h5, h6"`)
```json
{
  "hero": {
    "title": "Get Started Today"  // Wrong! First heading in document order
  }
}
```

## Key Takeaways

### When Overrides Matter
- ✅ **Multiple headings** in the same block
- ✅ **Semantic precision** required
- ✅ **Future-proofing** against content changes
- ✅ **Debugging** and troubleshooting

### When Overrides Are Optional
- ✅ **Single heading** per block (like current Lightroom)
- ✅ **Prototyping** with unknown structures
- ✅ **Content analysis** across varied formats
- ✅ **Generic extraction** tools

### Best Practice
**Always use specific selectors in production schemas** to avoid surprises when content evolves:

```json
{
  "title": {
    "$extends": "heading",
    "x-eds-selector": "h1"    // Be explicit
  }
}
```

This makes schemas self-documenting and robust against content structure changes. 