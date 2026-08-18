import { GraphQLError, GraphQLScalarType, Kind, type ValueNode } from "graphql";

const MAX_ENTRIES = 100;
const MAX_KEY_LENGTH = 64;
const MAX_VALUE_LENGTH = 1024;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Validates that a value is a Record<string, string>
 * with entry count, key length, and value length limits
 */
function validateStringMap(value: unknown): Record<string, string> {
  if (!isRecord(value)) {
    throw new GraphQLError("StringMap must be an object", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  const entries = Object.entries(value);

  if (entries.length > MAX_ENTRIES) {
    throw new GraphQLError("StringMap exceeds maximum number of entries.", {
      extensions: { code: "BAD_USER_INPUT", maxEntries: MAX_ENTRIES, received: entries.length },
    });
  }

  const result: Record<string, string> = {};

  // Validate all values are strings with length constraints
  for (const [key, val] of entries) {
    if (key.length > MAX_KEY_LENGTH) {
      throw new GraphQLError("StringMap key exceeds maximum length.", {
        extensions: { code: "BAD_USER_INPUT", key: key.slice(0, 20), maxLength: MAX_KEY_LENGTH },
      });
    }
    if (typeof val !== "string") {
      throw new GraphQLError("StringMap values must be strings.", {
        extensions: { code: "BAD_USER_INPUT", key },
      });
    }
    if (val.length > MAX_VALUE_LENGTH) {
      throw new GraphQLError("StringMap value exceeds maximum length.", {
        extensions: { code: "BAD_USER_INPUT", key, maxLength: MAX_VALUE_LENGTH },
      });
    }
    result[key] = val;
  }

  return result;
}

/**
 * StringMap scalar for Record<string, string>
 * Validates that all keys and values are strings
 */
export const StringMapScalar = new GraphQLScalarType({
  name: "StringMap",
  description:
    "A map of string keys to string values (Record<string, string>). Limits: max 100 entries, keys up to 64 chars, values up to 1024 chars.",

  serialize(value: unknown): Record<string, string> {
    return validateStringMap(value);
  },

  parseValue(value: unknown): Record<string, string> {
    return validateStringMap(value);
  },

  parseLiteral(ast: ValueNode): Record<string, string> {
    // Parse inline object literals from queries
    if (ast.kind !== Kind.OBJECT) {
      throw new GraphQLError("StringMap must be an object", {
        extensions: { code: "BAD_USER_INPUT" },
      });
    }

    if (ast.fields.length > MAX_ENTRIES) {
      throw new GraphQLError("StringMap exceeds maximum number of entries.", {
        extensions: { code: "BAD_USER_INPUT", maxEntries: MAX_ENTRIES, received: ast.fields.length },
      });
    }

    const result: Record<string, string> = {};

    for (const field of ast.fields) {
      const key = field.name.value;

      if (key.length > MAX_KEY_LENGTH) {
        throw new GraphQLError("StringMap key exceeds maximum length.", {
          extensions: { code: "BAD_USER_INPUT", key: key.slice(0, 20), maxLength: MAX_KEY_LENGTH },
        });
      }

      if (field.value.kind !== Kind.STRING) {
        throw new GraphQLError("StringMap values must be strings.", {
          extensions: { code: "BAD_USER_INPUT", key },
        });
      }

      if (field.value.value.length > MAX_VALUE_LENGTH) {
        throw new GraphQLError("StringMap value exceeds maximum length.", {
          extensions: { code: "BAD_USER_INPUT", key, maxLength: MAX_VALUE_LENGTH },
        });
      }

      result[key] = field.value.value;
    }

    return result;
  },
});
