# Lightroom HTML Extraction Example

This example demonstrates how our updated schemas extract data from the real Lightroom HTML.

## Input HTML Structure

### Hero Block
```html
<div class="hero">
  <div>
    <div>
      <p>
        <picture>
          <source type="image/webp" srcset="./media_1e6b24c90364d59a5a2962a90ee58dc12214331c8.jpg?width=2000&format=webply&optimize=medium" media="(min-width: 600px)">
          <source type="image/webp" srcset="./media_1e6b24c90364d59a5a2962a90ee58dc12214331c8.jpg?width=750&format=webply&optimize=medium">
          <source type="image/jpeg" srcset="./media_1e6b24c90364d59a5a2962a90ee58dc12214331c8.jpg?width=2000&format=jpg&optimize=medium" media="(min-width: 600px)">
          <img loading="lazy" alt="" src="./media_1e6b24c90364d59a5a2962a90ee58dc12214331c8.jpg?width=750&format=jpg&optimize=medium" width="1328" height="740">
        </picture>
      </p>
      <h1 id="markus-was-here">Markus was here</h1>
    </div>
  </div>
</div>
```

### Cards Block
```html
<h3 id="lightroom-tutorials"><strong>Lightroom tutorials</strong></h3>
<div class="cards">
  <div>
    <div>
      <picture>
        <source type="image/webp" srcset="./media_168b4a317bef2a4398efe316933637783e8aa62ab.jpg?width=2000&format=webply&optimize=medium" media="(min-width: 600px)">
        <source type="image/webp" srcset="./media_168b4a317bef2a4398efe316933637783e8aa62ab.jpg?width=750&format=webply&optimize=medium">
        <source type="image/jpeg" srcset="./media_168b4a317bef2a4398efe316933637783e8aa62ab.jpg?width=2000&format=jpg&optimize=medium" media="(min-width: 600px)">
        <img loading="lazy" alt="" src="./media_168b4a317bef2a4398efe316933637783e8aa62ab.jpg?width=750&format=jpg&optimize=medium" width="960" height="540">
      </picture>
    </div>
    <div><a href="https://lightroom.adobe.com/learn/tutorial/56c08e59-5951-448f-98a2-68e63bffa700?promoid=QGMZPG6T...">Improving a Natural Light Portrait</a></div>
  </div>
  <div>
    <div>
      <picture>
        <source type="image/webp" srcset="./media_11e4165fe20b8d24bc740712adf27de22a1276fee.jpg?width=2000&format=webply&optimize=medium" media="(min-width: 600px)">
        <source type="image/webp" srcset="./media_11e4165fe20b8d24bc740712adf27de22a1276fee.jpg?width=750&format=webply&optimize=medium">
        <source type="image/jpeg" srcset="./media_11e4165fe20b8d24bc740712adf27de22a1276fee.jpg?width=2000&format=jpg&optimize=medium" media="(min-width: 600px)">
        <img loading="lazy" alt="" src="./media_11e4165fe20b8d24bc740712adf27de22a1276fee.jpg?width=750&format=jpg&optimize=medium" width="960" height="540">
      </picture>
    </div>
    <div><a href="https://lightroom.adobe.com/learn/tutorial/8aadaa9c-affb-4b7f-9766-700cafe7bc70?promoid=QGMZPG6T...">Color Grading for Impact</a></div>
  </div>
  <!-- More cards... -->
</div>
```

## Extracted Data (Using Updated Schemas)

### Hero Block Extraction
Using `blocks/hero.schema.json`:

```json
{
  "hero": {
    "title": "Markus was here",
    "picture": {
      "src": "./media_1e6b24c90364d59a5a2962a90ee58dc12214331c8.jpg?width=750&format=jpg&optimize=medium",
      "alt": "",
      "sources": [
        {
          "srcset": "./media_1e6b24c90364d59a5a2962a90ee58dc12214331c8.jpg?width=2000&format=webply&optimize=medium",
          "media": "(min-width: 600px)",
          "type": "image/webp"
        },
        {
          "srcset": "./media_1e6b24c90364d59a5a2962a90ee58dc12214331c8.jpg?width=750&format=webply&optimize=medium",
          "type": "image/webp"
        },
        {
          "srcset": "./media_1e6b24c90364d59a5a2962a90ee58dc12214331c8.jpg?width=2000&format=jpg&optimize=medium",
          "media": "(min-width: 600px)",
          "type": "image/jpeg"
        }
      ]
    }
  }
}
```

### Cards Block Extraction
Using `blocks/cards.schema.json`:

```json
{
  "cards": {
    "title": "Lightroom tutorials",
    "items": [
      {
        "picture": {
          "src": "./media_168b4a317bef2a4398efe316933637783e8aa62ab.jpg?width=750&format=jpg&optimize=medium",
          "alt": "",
          "sources": [
            {
              "srcset": "./media_168b4a317bef2a4398efe316933637783e8aa62ab.jpg?width=2000&format=webply&optimize=medium",
              "media": "(min-width: 600px)",
              "type": "image/webp"
            },
            {
              "srcset": "./media_168b4a317bef2a4398efe316933637783e8aa62ab.jpg?width=750&format=webply&optimize=medium",
              "type": "image/webp"
            },
            {
              "srcset": "./media_168b4a317bef2a4398efe316933637783e8aa62ab.jpg?width=2000&format=jpg&optimize=medium",
              "media": "(min-width: 600px)",
              "type": "image/jpeg"
            }
          ]
        },
        "link": {
          "href": "https://lightroom.adobe.com/learn/tutorial/56c08e59-5951-448f-98a2-68e63bffa700?promoid=QGMZPG6T...",
          "text": "Improving a Natural Light Portrait"
        }
      },
      {
        "picture": {
          "src": "./media_11e4165fe20b8d24bc740712adf27de22a1276fee.jpg?width=750&format=jpg&optimize=medium",
          "alt": "",
          "sources": [
            {
              "srcset": "./media_11e4165fe20b8d24bc740712adf27de22a1276fee.jpg?width=2000&format=webply&optimize=medium",
              "media": "(min-width: 600px)",
              "type": "image/webp"
            },
            {
              "srcset": "./media_11e4165fe20b8d24bc740712adf27de22a1276fee.jpg?width=750&format=webply&optimize=medium",
              "type": "image/webp"
            },
            {
              "srcset": "./media_11e4165fe20b8d24bc740712adf27de22a1276fee.jpg?width=2000&format=jpg&optimize=medium",
              "media": "(min-width: 600px)",
              "type": "image/jpeg"
            }
          ]
        },
        "link": {
          "href": "https://lightroom.adobe.com/learn/tutorial/8aadaa9c-affb-4b7f-9766-700cafe7bc70?promoid=QGMZPG6T...",
          "text": "Color Grading for Impact"
        }
      }
    ]
  }
}
```

## Schema Updates Made

### Changes to Hero Schema
- ✅ **Updated**: `title` now uses `$extends: "h1"` (no selector override needed)
- ✅ **Kept**: `picture` with explicit `picture` selector  
- ❌ **Removed**: `description` (paragraph contained picture, not text)
- ❌ **Removed**: `ctaLink` (no CTA links in actual hero)

### Changes to Cards Schema
- ✅ **Updated**: `title` now uses `$extends: "h2"` (no selector override needed)
- ✅ **Kept**: `items` array with `:scope > div` selector
- ❌ **Removed**: Individual card `title` (was trying to extract from non-existent headings)
- ✅ **Kept**: Individual card `picture` with explicit `picture` selector
- ❌ **Removed**: Individual card `description` (no description text in actual cards)
- ✅ **Kept**: Individual card `link` with `a` selector

## Key Learnings

1. **Real-world HTML is different** from idealized structures
2. **Cards can be minimal** - just picture + link without descriptions
3. **Hero blocks can be simple** - just title + picture without CTAs
4. **Explicit selectors help** - adding `x-eds-selector: "picture"` ensures proper targeting
5. **Optional fields should be truly optional** - better to omit than fail extraction
6. **Specific heading primitives** - `$extends: "h1"` is cleaner than `$extends: "heading"` + override

## Transform Output

Using the `page-basic.transform.json`:

```json
{
  "pageTitle": "Markus was here",
  "heroImage": "./media_1e6b24c90364d59a5a2962a90ee58dc12214331c8.jpg?width=750&format=jpg&optimize=medium",
  "heroImageAlt": "",
  "pageDescription": "No description available",
  "allCards": [
    {
      "picture": {
        "src": "./media_168b4a317bef2a4398efe316933637783e8aa62ab.jpg?width=750&format=jpg&optimize=medium",
        "alt": ""
      },
      "link": {
        "href": "https://lightroom.adobe.com/learn/tutorial/56c08e59-5951-448f-98a2-68e63bffa700?promoid=QGMZPG6T...",
        "text": "Improving a Natural Light Portrait"
      }
    },
    {
      "picture": {
        "src": "./media_11e4165fe20b8d24bc740712adf27de22a1276fee.jpg?width=750&format=jpg&optimize=medium",
        "alt": ""
      },
      "link": {
        "href": "https://lightroom.adobe.com/learn/tutorial/8aadaa9c-affb-4b7f-9766-700cafe7bc70?promoid=QGMZPG6T...",
        "text": "Color Grading for Impact"
      }
    }
  ],
  "cardCount": 4
}
``` 