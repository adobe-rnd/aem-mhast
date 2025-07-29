# Complete EDS Schema Flow Example

This example demonstrates the complete flow from HTML input through data extraction to final transformed output.

## 1. Input HTML

```html
<!DOCTYPE html>
<html>
<head>
    <title>Welcome to Our Site</title>
</head>
<body>
    <main>
        <h1>Welcome to Our Platform</h1>
        <p>Discover amazing content and tools for your projects.</p>
        
        <div class="hero">
            <h1>Transform Your Ideas</h1>
            <picture>
                <source srcset="hero-desktop.webp" media="(min-width: 768px)" type="image/webp">
                <source srcset="hero-mobile.webp" media="(max-width: 767px)" type="image/webp">
                <img src="hero-fallback.jpg" alt="Creative workspace with design tools">
            </picture>
            <p>Our platform helps you turn creative ideas into reality with powerful tools and seamless workflows.</p>
        </div>
        
        <div class="cards">
            <h2>Features</h2>
            <div>
                <h3>Design Tools</h3>
                <img src="design-icon.jpg" alt="Design tools">
                <p>Professional design tools for creating stunning visuals.</p>
                <a href="/design">Learn More</a>
            </div>
            <div>
                <h3>Collaboration</h3>
                <img src="collab-icon.jpg" alt="Team collaboration">
                <p>Work together seamlessly with your team members.</p>
                <a href="/collaboration">Get Started</a>
            </div>
        </div>
    </main>
</body>
</html>
```

## 2. Data Extraction (Using Data Schemas)

### Extract Hero Block
Using `blocks/hero.schema.json`:

```json
{
  "hero": {
    "title": "Transform Your Ideas",
    "picture": {
      "src": "hero-fallback.jpg",
      "alt": "Creative workspace with design tools",
      "sources": [
        {
          "srcset": "hero-desktop.webp",
          "media": "(min-width: 768px)",
          "type": "image/webp"
        },
        {
          "srcset": "hero-mobile.webp", 
          "media": "(max-width: 767px)",
          "type": "image/webp"
        }
      ]
    },
    "description": "Our platform helps you turn creative ideas into reality with powerful tools and seamless workflows."
  }
}
```

### Extract Cards Block
Using `blocks/cards.schema.json`:

```json
{
  "cards": {
    "title": "Features",
    "items": [
      {
        "title": "Design Tools",
        "image": {
          "src": "design-icon.jpg",
          "alt": "Design tools"
        },
        "description": "Professional design tools for creating stunning visuals.",
        "link": {
          "href": "/design",
          "text": "Learn More"
        }
      },
      {
        "title": "Collaboration", 
        "image": {
          "src": "collab-icon.jpg",
          "alt": "Team collaboration"
        },
        "description": "Work together seamlessly with your team members.",
        "link": {
          "href": "/collaboration",
          "text": "Get Started"
        }
      }
    ]
  }
}
```

### Combined Extracted Data

```json
{
  "mainHeading": "Welcome to Our Platform",
  "introParagraph": "Discover amazing content and tools for your projects.",
  "hero": {
    "title": "Transform Your Ideas",
    "picture": {
      "src": "hero-fallback.jpg",
      "alt": "Creative workspace with design tools",
      "sources": [
        {
          "srcset": "hero-desktop.webp",
          "media": "(min-width: 768px)",
          "type": "image/webp"
        },
        {
          "srcset": "hero-mobile.webp",
          "media": "(max-width: 767px)", 
          "type": "image/webp"
        }
      ]
    },
    "description": "Our platform helps you turn creative ideas into reality with powerful tools and seamless workflows."
  },
  "cards": {
    "title": "Features",
    "items": [
      {
        "title": "Design Tools",
        "image": {
          "src": "design-icon.jpg",
          "alt": "Design tools"
        },
        "description": "Professional design tools for creating stunning visuals.",
        "link": {
          "href": "/design",
          "text": "Learn More"
        }
      },
      {
        "title": "Collaboration",
        "image": {
          "src": "collab-icon.jpg", 
          "alt": "Team collaboration"
        },
        "description": "Work together seamlessly with your team members.",
        "link": {
          "href": "/collaboration",
          "text": "Get Started"
        }
      }
    ]
  }
}
```

## 3. Data Transformation

### Transform A: Basic Page (using `page-basic.transform.json`)

```json
{
  "pageTitle": "Transform Your Ideas",
  "heroImage": "hero-fallback.jpg",
  "heroImageAlt": "Creative workspace with design tools",
  "pageDescription": "Our platform helps you turn creative ideas into reality with powerful tools and seamless workflows.",
  "allCards": [
    {
      "title": "Design Tools",
      "image": {
        "src": "design-icon.jpg",
        "alt": "Design tools"
      },
      "description": "Professional design tools for creating stunning visuals.",
      "link": {
        "href": "/design",
        "text": "Learn More"
      }
    },
    {
      "title": "Collaboration",
      "image": {
        "src": "collab-icon.jpg",
        "alt": "Team collaboration"
      },
      "description": "Work together seamlessly with your team members.",
      "link": {
        "href": "/collaboration", 
        "text": "Get Started"
      }
    }
  ]
}
```

### Transform B: API Response (using `api-response.transform.json`)

```json
{
  "meta": {
    "title": "Transform Your Ideas",
    "description": "Our platform helps you turn creative ideas into reality with powerful tools and seamless workflows."
  },
  "hero": {
    "headline": "Transform Your Ideas",
    "imageUrl": "hero-fallback.jpg",
    "imageAlt": "Creative workspace with design tools",
    "summary": "Our platform helps you turn creative ideas into reality with powerful tools and seamless workflows."
  },
  "content": [
    {
      "id": "Design Tools",
      "headline": "Design Tools", 
      "summary": "Professional design tools for creating stunning visuals.",
      "imageUrl": "design-icon.jpg",
      "link": "/design"
    },
    {
      "id": "Collaboration",
      "headline": "Collaboration",
      "summary": "Work together seamlessly with your team members.",
      "imageUrl": "collab-icon.jpg",
      "link": "/collaboration"
    }
  ],
  "navigation": []
}
```

### Transform C: CMS Export (using `cms-export.transform.json`)

```json
{
  "page": {
    "title": "Transform Your Ideas",
    "slug": "transform-your-ideas",
    "status": "published",
    "featuredImage": {
      "url": "hero-fallback.jpg",
      "alt": "Creative workspace with design tools",
      "sources": [
        {
          "srcset": "hero-desktop.webp",
          "media": "(min-width: 768px)",
          "type": "image/webp"
        },
        {
          "srcset": "hero-mobile.webp",
          "media": "(max-width: 767px)",
          "type": "image/webp"
        }
      ]
    }
  },
  "blocks": [
    {
      "type": "hero",
      "title": "Transform Your Ideas",
      "description": "Our platform helps you turn creative ideas into reality with powerful tools and seamless workflows.",
      "picture": {
        "src": "hero-fallback.jpg",
        "alt": "Creative workspace with design tools"
      }
    },
    {
      "type": "cards",
      "title": "Features",
      "items": [
        {
          "title": "Design Tools",
          "description": "Professional design tools for creating stunning visuals.",
          "picture": {
            "src": "design-icon.jpg",
            "alt": "Design tools"
          },
          "link": {
            "href": "/design",
            "text": "Learn More"
          }
        },
        {
          "title": "Collaboration",
          "description": "Work together seamlessly with your team members.",
          "picture": {
            "src": "collab-icon.jpg",
            "alt": "Team collaboration"
          },
          "link": {
            "href": "/collaboration",
            "text": "Get Started"
          }
        }
      ]
    }
  ]
}
```

## Benefits Demonstrated

1. **Single Source of Truth**: The same HTML generates multiple output formats
2. **Separation of Concerns**: Extraction logic is separate from output formatting
3. **Reusable Primitives**: Heading, image, and paragraph primitives are reused across blocks
4. **Flexible Output**: Different consumers get the data format they need
5. **Maintainable**: Changes to primitives automatically affect all blocks that use them 