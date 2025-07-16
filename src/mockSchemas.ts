/*
* Copyright 2025 Adobe. All rights reserved.
* This file is licensed to you under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License. You may obtain a copy
* of the License at http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software distributed under
* the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
* OF ANY KIND, either express or implied. See the License for the specific language
* governing permissions and limitations under the License.
*/

/**
 * Mock schemas for testing block schema functionality.
 * This file should be removed once real schema fetching is implemented.
 */
export const MOCK_SCHEMAS = {
  hero: {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "Hero Block",
    "description": "Main hero section with image and title",
    "type": "object",
    "properties": {
      "title": {
        "type": "string",
        "description": "Main hero title",
        "x-eds-selector": "h1"
      },
      "image": {
        "type": "object",
        "x-eds-selector": "picture img",
        "properties": {
          "src": {
            "type": "string",
            "format": "uri"
          },
          "alt": {
            "type": "string"
          }
        },
        "required": ["src", "alt"]
      }
    },
    "required": ["image", "title"]
  },
  cards: {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "Cards Block",
    "description": "Collection of cards with images and content",
    "type": "object",
    "properties": {
      "cards": {
        "type": "array",
        "description": "Array of card items",
        "x-eds-selector": ":scope > div",
        "items": {
          "type": "object",
          "properties": {
            "title": {
              "type": "string",
              "description": "Card title from strong text",
              "x-eds-selector": "strong"
            },
            "description": {
              "type": "string",
              "description": "Card description from second paragraph",
              "x-eds-selector": "p:last-child"
            },
            "image": {
              "type": "object",
              "x-eds-selector": "picture img",
              "properties": {
                "src": {
                  "type": "string",
                  "format": "uri"
                },
                "alt": {
                  "type": "string"
                }
              }
            }
          }
        }
      }
    },
    "required": ["cards"]
  },
  fragment: {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "Fragment Block",
    "description": "Fragment inclusion block with reference URLs",
    "type": "object",
    "properties": {
      "url": {
        "type": "string",
        "format": "uri",
        "x-eds-selector": "a",
        "x-eds-attribute": "href"
      },
      "text": {
        "type": "string",
        "x-eds-selector": "a"
      }
    },
    "required": ["links"]
  },
  hero_demo: {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "Hero Block",
    "description": "Main hero section with image and title",
    "type": "object",
    "properties": {
      "image": {
        "type": "object",
        "x-eds-selector": "picture img",
        "properties": {
          "src": {
            "type": "string",
            "format": "uri"
          },
          "alt": {
            "type": "string"
          }
        },
        "required": ["src", "alt"]
      },
      "title": {
        "type": "string",
        "description": "Main hero title",
        "x-eds-selector": "h1"
      },
      "demo_responsiveImage": {
        "type": "string",
        "x-eds-selector": "picture source:first-child",
        "x-eds-attribute": "srcSet"
      },
      "demo_allSources": {
        "type": "array",
        "description": "All source elements with their srcset values",
        "x-eds-selector": "picture source",
        "items": {
          "type": "string",
          "x-eds-attribute": "srcSet"
        }
      },
      "demo_sourceDetails": {
        "type": "array",
        "description": "All source elements with full details",
        "x-eds-selector": "picture source",
        "items": {
          "type": "object",
          "properties": {
            "srcSet": {
              "type": "string"
            },
            "media": {
              "type": "string"
            }
          }
        }
      },
      "demo_mixedExample": {
        "type": "object",
        "description": "Example showing inheritance and override",
        "x-eds-selector": "picture img",
        "properties": {
          "src": {
            "type": "string",
            "x-eds-attribute": "src"
          },
          "alt": {
            "type": "string"
          },
          "firstSourceSrcSet": {
            "type": "string",
            "x-eds-selector": "picture source:first-child",
            "x-eds-attribute": "srcSet"
          }
        }
      },
      "nested_heroStructure": {
        "type": "object",
        "description": "Example of nested object structure",
        "properties": {
          "content": {
            "type": "object",
            "description": "Content section",
            "properties": {
              "heading": {
                "type": "string",
                "x-eds-selector": "h1"
              }
            }
          },
          "media": {
            "type": "object",
            "description": "Media section",
            "properties": {
              "primaryImage": {
                "type": "object",
                "x-eds-selector": "picture img",
                "properties": {
                  "src": {
                    "type": "string"
                  },
                  "alt": {
                    "type": "string"
                  }
                }
              },
              "responsiveSources": {
                "type": "array",
                "x-eds-selector": "picture source",
                "items": {
                  "type": "object",
                  "properties": {
                    "srcSet": {
                      "type": "string"
                    },
                    "media": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "required": ["image", "title"]
  },
};

/**
 * Get mock schema for a block name.
 * @param {string} blockName
 * @returns {any|null}
 */
export function getMockSchema(blockName: string): any | null {
  return MOCK_SCHEMAS[blockName as keyof typeof MOCK_SCHEMAS] || null;
}