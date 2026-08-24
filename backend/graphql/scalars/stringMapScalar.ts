import { GraphQLError, GraphQLScalarType, Kind, type ValueNode } from "graphql";

const MAX_ENTRIES = 100;
const MAX_KEY_LENGTH = 64;
const MAX_VALUE_LENGTH = 1024;

/**
 * Machine-stable error codes for StringMap validation failures.
 * GraphQL scalar parsers receive no request context in graphql-js (the newer
 * `coerceInputValue` pipeline is context-free too), so locale cannot be
 * threaded here. Clients localize via `extensions.scalarCode`.
 */
const StringMapScalarError = {
  NotObject: "STRING_MAP_NOT_OBJECT",
  TooManyEntries: "STRING_MAP_TOO_MANY_ENTRIES",
  KeyTooLong: "STRING_MAP_KEY_TOO_LONG",
  ValueNotString: "STRING_MAP_VALUE_NOT_STRING",
  ValueTooLong: "STRING_MAP_VALUE_TOO_LONG",
} as const;

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
      extensions: { code: "BAD_USER_INPUT", scalarCode: StringMapScalarError.NotObject },
    });
  }

  const entries = Object.entries(value);

  if (entries.length > MAX_ENTRIES) {
    throw new GraphQLError("StringMap exceeds maximum number of entries.", {
      extensions: {
        code: "BAD_USER_INPUT",
        scalarCode: StringMapScalarError.TooManyEntries,
        maxEntries: MAX_ENTRIES,
        received: entries.length,
      },
    });
  }

  const result: Record<string, string> = {};

  // Validate all values are strings with length constraints
  for (const [key, val] of entries) {
    if (key.length > MAX_KEY_LENGTH) {
      throw new GraphQLError("StringMap key exceeds maximum length.", {
        extensions: {
          code: "BAD_USER_INPUT",
          scalarCode: StringMapScalarError.KeyTooLong,
          key: key.slice(0, 20),
          maxLength: MAX_KEY_LENGTH,
        },
      });
    }
    if (typeof val !== "string") {
      throw new GraphQLError("StringMap values must be strings.", {
        extensions: { code: "BAD_USER_INPUT", scalarCode: StringMapScalarError.ValueNotString, key },
      });
    }
    if (val.length > MAX_VALUE_LENGTH) {
      throw new GraphQLError("StringMap value exceeds maximum length.", {
        extensions: {
          code: "BAD_USER_INPUT",
          scalarCode: StringMapScalarError.ValueTooLong,
          key,
          maxLength: MAX_VALUE_LENGTH,
        },
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
        extensions: { code: "BAD_USER_INPUT", scalarCode: StringMapScalarError.NotObject },
      });
    }

    if (ast.fields.length > MAX_ENTRIES) {
      throw new GraphQLError("StringMap exceeds maximum number of entries.", {
        extensions: {
          code: "BAD_USER_INPUT",
          scalarCode: StringMapScalarError.TooManyEntries,
          maxEntries: MAX_ENTRIES,
          received: ast.fields.length,
        },
      });
    }

    const result: Record<string, string> = {};

    for (const field of ast.fields) {
      const key = field.name.value;

      if (key.length > MAX_KEY_LENGTH) {
        throw new GraphQLError("StringMap key exceeds maximum length.", {
          extensions: {
            code: "BAD_USER_INPUT",
            scalarCode: StringMapScalarError.KeyTooLong,
            key: key.slice(0, 20),
            maxLength: MAX_KEY_LENGTH,
          },
        });
      }

      if (field.value.kind !== Kind.STRING) {
        throw new GraphQLError("StringMap values must be strings.", {
          extensions: { code: "BAD_USER_INPUT", scalarCode: StringMapScalarError.ValueNotString, key },
        });
      }

      if (field.value.value.length > MAX_VALUE_LENGTH) {
        throw new GraphQLError("StringMap value exceeds maximum length.", {
          extensions: {
            code: "BAD_USER_INPUT",
            scalarCode: StringMapScalarError.ValueTooLong,
            key,
            maxLength: MAX_VALUE_LENGTH,
          },
        });
      }

      result[key] = field.value.value;
    }

    return result;
  },
});
