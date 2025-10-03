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
 * Available transformer functions for processing JSON output
 */

export type TransformerFunction = (data: any) => any;

/**
 * Flattens nested section arrays into a single array
 */
export function flattenTransformer(data: any): any {
  if (!data || !data.content || !Array.isArray(data.content)) {
    return data;
  }

  const flattenedContent = data.content.map((section: any) => {
    if (section.section && Array.isArray(section.section)) {
      return {
        ...section,
        section: section.section.flat()
      };
    }
    return section;
  });

  return {
    ...data,
    content: flattenedContent
  };
}

/**
 * Removes metadata from all sections
 */
export function stripMetadataTransformer(data: any): any {
  if (!data || !data.content || !Array.isArray(data.content)) {
    return data;
  }

  const strippedContent = data.content.map((section: any) => ({
    section: section.section
  }));

  return {
    ...data,
    content: strippedContent
  };
}

/**
 * Compacts the output by removing empty sections and null values
 */
export function compactTransformer(data: any): any {
  if (!data) return data;

  const compactObject = (obj: any): any => {
    if (Array.isArray(obj)) {
      return obj
        .map(compactObject)
        .filter(item => item !== null && item !== undefined);
    }
    
    if (obj && typeof obj === 'object') {
      const compacted: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const compactedValue = compactObject(value);
        if (compactedValue !== null && compactedValue !== undefined) {
          if (Array.isArray(compactedValue) && compactedValue.length === 0) {
            continue; // Skip empty arrays
          }
          if (typeof compactedValue === 'object' && Object.keys(compactedValue).length === 0) {
            continue; // Skip empty objects
          }
          compacted[key] = compactedValue;
        }
      }
      return compacted;
    }
    
    return obj;
  };

  return compactObject(data);
}

/**
 * Helper function to find and transform properties with '/content/dam/' values
 */
function findAndTransformDamReferences(obj: any, references: any[] = []): any {
  if (typeof obj === 'string' && obj.includes('/content/dam/')) {
    // Transform the string to the required object format
    const _publishUrl = obj.startsWith('/content/dam/') ? `https://odin.adobe.com${obj}` : obj
    const transformedValue = {
      _publishUrl: _publishUrl.replaceAll('@', '%40'),
    };
    // Add transformed object to references list
    references.push(transformedValue);
    return transformedValue;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => findAndTransformDamReferences(item, references));
  }
  
  if (obj && typeof obj === 'object') {
    const transformed: any = {};
    for (const [key, value] of Object.entries(obj)) {
      transformed[key] = findAndTransformDamReferences(value, references);
    }
    return transformed;
  }
  
  return obj;
}

/**
 * Transforms ffc-photoshop content by moving it to root level data.appPdp.item structure
 * This replaces the entire content structure with the data structure
 * Also finds and transforms any '/content/dam/' references to _publishUrl objects
 */
export function ffcPhotoshopTransformer(data: any): any {
  console.log('🔍 FFC Photoshop Transformer - Starting transformation');
  console.log('📊 Input data structure:', JSON.stringify(data, null, 2));
  
  if (!data || !data.content || !Array.isArray(data.content)) {
    console.log('❌ No valid content array found, returning original data');
    return data;
  }

  console.log(`🔎 Searching through ${data.content.length} content sections`);

  // Search through all content sections for ffc-photoshop content
  let ffcPhotoshopContent = null;
  
  for (let i = 0; i < data.content.length; i++) {
    const section = data.content[i];
    console.log(`📋 Section ${i}:`, JSON.stringify(section, null, 2));
    
    if (section.section) {
      console.log(`🔍 Searching in section ${i} for ffc-photoshop content`);
      ffcPhotoshopContent = findFfcPhotoshopContent(section.section);
      if (ffcPhotoshopContent) {
        console.log('✅ Found ffc-photoshop content:', JSON.stringify(ffcPhotoshopContent, null, 2));
        break;
      } else {
        console.log(`❌ No ffc-photoshop content found in section ${i}`);
      }
    } else {
      console.log(`⚠️ Section ${i} has no section property`);
    }
  }

  // If ffc-photoshop content is found, transform the entire structure
  if (ffcPhotoshopContent) {
    // Track references for '/content/dam/' transformations
    const references: any[] = [];
    
    // Transform the content and collect references
    const transformedContent = findAndTransformDamReferences(ffcPhotoshopContent, references);
    
    // Create the structure with _references as sibling to item
    const appsPdpByPath: any = {
      item: transformedContent
    };
    
    // Add references at the same level as item if any were found
    if (references.length > 0) {
      appsPdpByPath._references = references;
    }
    
    const transformedData = {
      data: {
        appsPdpByPath
      }
    };
    
    console.log(`🔗 Found and transformed ${references.length} DAM references:`, references);
    console.log('🎯 Transformation successful! Output:', JSON.stringify(transformedData, null, 2));
    return transformedData;
  }

  // If no ffc-photoshop content found, return original data
  console.log('❌ No ffc-photoshop content found anywhere, returning original data');
  return data;
}

/**
 * Helper function to find and extract ffc-photoshop content from section data
 */
function findFfcPhotoshopContent(sectionData: any): any {
  console.log('🔎 findFfcPhotoshopContent called with:', JSON.stringify(sectionData, null, 2));
  
  if (!sectionData) {
    console.log('❌ sectionData is null/undefined');
    return null;
  }

  // Handle array of section items
  if (Array.isArray(sectionData)) {
    console.log(`📋 Processing array with ${sectionData.length} items`);
    for (let i = 0; i < sectionData.length; i++) {
      const item = sectionData[i];
      console.log(`🔍 Checking array item ${i}:`, JSON.stringify(item, null, 2));
      const found = findFfcPhotoshopContent(item);
      if (found) {
        console.log(`✅ Found in array item ${i}:`, JSON.stringify(found, null, 2));
        return found;
      }
    }
    console.log('❌ Nothing found in array');
    return null;
  }

  // Handle object with potential ffc-photoshop content
  if (typeof sectionData === 'object') {
    console.log('🔍 Processing object, checking for ffc-photoshop patterns...');
    
    // Direct match for ffc-photoshop key
    if (sectionData['ffc-photoshop']) {
      console.log('✅ Found direct ffc-photoshop key:', JSON.stringify(sectionData['ffc-photoshop'], null, 2));
      return sectionData['ffc-photoshop'];
    }

    // Check if this is a block with name 'ffc-photoshop'
    if (sectionData.type === 'block' && sectionData.name === 'ffc-photoshop') {
      console.log('✅ Found ffc-photoshop block:', JSON.stringify(sectionData.content || sectionData, null, 2));
      return sectionData.content || sectionData;
    }

    // Log all keys for debugging
    console.log('🔑 Object keys:', Object.keys(sectionData));

    // Recursively search in nested objects
    for (const [key, value] of Object.entries(sectionData)) {
      console.log(`🔍 Recursively checking key "${key}"`);
      const found = findFfcPhotoshopContent(value);
      if (found) {
        console.log(`✅ Found in nested key "${key}":`, JSON.stringify(found, null, 2));
        return found;
      }
    }
  }

  console.log('❌ No ffc-photoshop content found in this data');
  return null;
}

/**
 * Registry of available transformers
 */
export const TRANSFORMERS: Record<string, TransformerFunction> = {
  flatten: flattenTransformer,
  'strip-metadata': stripMetadataTransformer,
  compact: compactTransformer,
  'ffc_photoshop': ffcPhotoshopTransformer,
};

/**
 * Apply a transformer to the data
 */
export function applyTransformer(data: any, transformerName: string): any {
  console.log(`🚀 applyTransformer called with transformer: "${transformerName}"`);
  console.log('📋 Available transformers:', Object.keys(TRANSFORMERS));
  
  const transformer = TRANSFORMERS[transformerName];
  if (!transformer) {
    console.warn(`❌ Unknown transformer: ${transformerName}`);
    return data;
  }
  
  console.log(`✅ Found transformer "${transformerName}", applying...`);
  
  try {
    const result = transformer(data);
    console.log(`🎯 Transformer "${transformerName}" completed successfully`);
    return result;
  } catch (error) {
    console.warn(`❌ Error applying transformer ${transformerName}:`, error);
    return data;
  }
}
