import { describe, expect, it } from 'vitest';
import { cleanSchema, normalizeToolSchema } from '../schema-utils.js';

describe('Schema Utils', () => {
  // ===========================================================================
  // cleanSchema
  // ===========================================================================

  describe('cleanSchema', () => {
    it('returns primitive types unchanged', () => {
      expect(cleanSchema(null)).toBeNull();
      expect(cleanSchema(undefined)).toBeUndefined();
      expect(cleanSchema('string')).toBe('string');
      expect(cleanSchema(42)).toBe(42);
    });

    it('strips unsupported keywords', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100, pattern: '^[a-z]+$' },
        },
        additionalProperties: false,
        $schema: 'http://json-schema.org/draft-07/schema#',
        $id: 'test',
      };

      const cleaned = cleanSchema(schema) as Record<string, unknown>;
      expect(cleaned).not.toHaveProperty('$schema');
      expect(cleaned).not.toHaveProperty('$id');
      expect(cleaned).not.toHaveProperty('additionalProperties');
    });

    it('resolves $ref to definitions', () => {
      const schema = {
        type: 'object',
        $defs: {
          Name: { type: 'string', description: 'A name' },
        },
        properties: {
          name: { $ref: '#/$defs/Name' },
        },
      };

      const cleaned = cleanSchema(schema) as Record<string, unknown>;
      const props = cleaned.properties as Record<string, unknown>;
      const name = props.name as Record<string, unknown>;
      expect(name.type).toBe('string');
      expect(name.description).toBe('A name');
    });

    it('handles anyOf with null variant (optional field)', () => {
      const schema = {
        type: 'object',
        properties: {
          value: {
            anyOf: [
              { type: 'string' },
              { type: 'null' },
            ],
          },
        },
      };

      const cleaned = cleanSchema(schema) as Record<string, unknown>;
      const props = cleaned.properties as Record<string, unknown>;
      const value = props.value as Record<string, unknown>;
      // Should strip null variant and return just the string type
      expect(value.type).toBe('string');
    });

    it('flattens literal anyOf to enum', () => {
      const schema = {
        type: 'object',
        properties: {
          status: {
            anyOf: [
              { type: 'string', const: 'active' },
              { type: 'string', const: 'inactive' },
              { type: 'string', const: 'pending' },
            ],
          },
        },
      };

      const cleaned = cleanSchema(schema) as Record<string, unknown>;
      const props = cleaned.properties as Record<string, unknown>;
      const status = props.status as Record<string, unknown>;
      expect(status.type).toBe('string');
      expect(status.enum).toEqual(['active', 'inactive', 'pending']);
    });

    it('handles circular $ref gracefully', () => {
      const schema = {
        type: 'object',
        $defs: {
          Tree: {
            type: 'object',
            properties: {
              children: {
                type: 'array',
                items: { $ref: '#/$defs/Tree' },
              },
            },
          },
        },
        properties: {
          root: { $ref: '#/$defs/Tree' },
        },
      };

      // Should not throw or infinite loop
      const cleaned = cleanSchema(schema);
      expect(cleaned).toBeDefined();
    });

    it('strips default keyword', () => {
      const schema = {
        type: 'string',
        default: 'hello',
      };

      const cleaned = cleanSchema(schema) as Record<string, unknown>;
      expect(cleaned).not.toHaveProperty('default');
    });
  });

  // ===========================================================================
  // normalizeToolSchema
  // ===========================================================================

  describe('normalizeToolSchema', () => {
    it('returns default object schema for null/undefined', () => {
      const result = normalizeToolSchema(null);
      expect(result.type).toBe('object');
      expect(result.properties).toBeDefined();
    });

    it('ensures top-level type: "object"', () => {
      const schema = {
        properties: {
          name: { type: 'string' },
        },
      };

      const result = normalizeToolSchema(schema);
      expect(result.type).toBe('object');
      expect(result.properties).toBeDefined();
    });

    it('preserves properties and required fields', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'The name' },
          age: { type: 'number' },
        },
        required: ['name'],
      };

      const result = normalizeToolSchema(schema);
      expect(result.type).toBe('object');
      expect(result.required).toEqual(['name']);
      const props = result.properties as Record<string, unknown>;
      expect(props.name).toBeDefined();
      expect(props.age).toBeDefined();
    });

    it('cleans nested schemas', () => {
      const schema = {
        type: 'object',
        properties: {
          config: {
            type: 'object',
            properties: {
              value: { type: 'string', minLength: 1 },
            },
            additionalProperties: false,
          },
        },
      };

      const result = normalizeToolSchema(schema);
      const props = result.properties as Record<string, Record<string, unknown>>;
      const config = props.config;
      expect(config).not.toHaveProperty('additionalProperties');
    });

    it('handles empty schema', () => {
      const result = normalizeToolSchema({});
      expect(result.type).toBe('object');
      expect(result.properties).toBeDefined();
    });
  });
});
