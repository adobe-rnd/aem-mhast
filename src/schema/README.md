# Schema Extraction Modules

This directory contains the refactored schema extraction code, broken down into testable modules with clear separation of concerns.

## Module Structure

### 📁 `types.ts`
- **Purpose**: Shared TypeScript interfaces and type definitions
- **Testable**: Type-only module (compile-time validation)
- **Dependencies**: None

### 📁 `elementExtractor.ts`
- **Purpose**: Low-level HTML element value extraction utilities
- **Testable**: ✅ Pure functions, no external dependencies
- **Key Functions**:
  - `extractValueFromElement()` - Extract attribute or text content
  - `findElement()` - CSS selector-based element finding  
  - `safeExtractString()` - Handle empty string preservation
- **Test Focus**: Edge cases with empty attributes, missing elements, fallbacks

### 📁 `propertyExtractor.ts`
- **Purpose**: Mid-level property extraction for different schema types
- **Testable**: ✅ Functions with dependency injection
- **Key Functions**:
  - `extractStringValue()` - String property extraction
  - `extractArrayValue()` - Array property extraction with injected recursion
  - `extractObjectValue()` - Object property extraction with injected recursion
- **Test Focus**: Different property types, dependency injection, error handling

### 📁 `schemaValueExtractor.ts`
- **Purpose**: High-level coordination and main extraction logic
- **Testable**: ✅ Clear dependencies, mockable components
- **Key Functions**:
  - `extractSchemaValue()` - Main recursive coordinator
  - `extractBlockWithSchema()` - Block-level extraction entry point
- **Test Focus**: Type routing, recursion, error handling, integration

### 📁 `handler.ts`
- **Purpose**: HTTP response handler for schema-based extraction
- **Testable**: ✅ Clear separation from index.ts, mockable dependencies
- **Key Functions**:
  - `handleSchemaExtraction()` - Complete HTTP request handler
- **Test Focus**: Response formatting, error handling, integration with extractor

## Testing Strategy

### Unit Testing Approach

Each module can be tested independently:

```typescript
// Example: Testing elementExtractor
import { extractValueFromElement } from './elementExtractor';

describe('extractValueFromElement', () => {
  it('should handle empty alt attributes', () => {
    const element = createMockElement({ alt: '' });
    const result = extractValueFromElement(element, 'alt');
    expect(result).toBe(''); // Preserves empty string
  });
});

// Example: Testing propertyExtractor with injection
import { extractObjectValue } from './propertyExtractor';

describe('extractObjectValue', () => {
  it('should handle nested extraction', async () => {
    const mockExtractFn = jest.fn().mockResolvedValue('test');
    const result = await extractObjectValue(element, schema, mockExtractFn);
    expect(mockExtractFn).toHaveBeenCalledWith(...);
  });
});
```

### Integration Testing

The main coordinator can be tested with mocked dependencies:

```typescript
import { extractBlockWithSchema } from './schemaValueExtractor';

describe('extractBlockWithSchema', () => {
  it('should extract cards with picture and link', async () => {
    const mockSchema = { /* cards schema */ };
    const mockElement = { /* cards HTML */ };
    
    const result = await extractBlockWithSchema(mockElement, mockSchema, 'cards');
    expect(result.items[0]).toHaveProperty('picture');
    expect(result.items[0]).toHaveProperty('link');
  });
});
```

## Benefits of This Structure

1. **🔬 Testability**: Each function has clear inputs/outputs and dependencies
2. **🧩 Modularity**: Logic is separated by concern (element → property → schema)
3. **🔄 Reusability**: Pure functions can be reused across different contexts
4. **🐛 Debuggability**: Issues can be isolated to specific modules
5. **📝 Maintainability**: Changes to extraction logic are localized

## Migration Notes

- ✅ **`blockSchemaResolver.ts`**: **REMOVED** - redundant, all functionality moved to schema module
- ✅ **`schemaExtractor.ts`**: **MOVED** to `src/schema/extractor.ts`
- ✅ **`schemaResolver.ts`**: **MOVED** to `src/schema/resolver.ts`
- ✅ **Type definitions**: Consolidated in `src/schema/types.ts`
- ✅ **Clean imports**: All schema functionality available via `import { ... } from './schema'`
- ✅ **Manual extraction logic**: Replaced with modular, testable functions
- ✅ **Dependency injection**: Enables easy mocking for tests

## File Structure

```
src/
├── schema/                 # 📁 Complete schema module
│   ├── index.ts           # 🚪 Barrel exports (public API)
│   ├── types.ts           # 📝 Type definitions
│   ├── elementExtractor.ts # 🔧 Low-level HTML utilities  
│   ├── propertyExtractor.ts # ⚙️ Property-type extraction
│   ├── schemaValueExtractor.ts # 🎯 Main coordinator
│   ├── extractor.ts       # 📊 High-level document extraction
│   ├── resolver.ts        # 🌐 Schema loading & resolution
│   ├── handler.ts         # 🌐 HTTP response handler
│   └── README.md          # 📖 This documentation
├── extractBlock.ts        # ✅ Updated to use schema module
├── index.ts               # ✅ Updated to use schema module (minimal)
└── ...                    # Other core files
``` 