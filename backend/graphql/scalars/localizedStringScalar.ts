import { GraphQLError, GraphQLScalarType, Kind, type ValueNode } from "graphql";
import type { AppLocale } from "@/shared/locale";
import type { LocalizedString } from "@/shared/types/localized-string";
import { isAppLocale } from "@/shared/types/localized-string";

const MAX_VALUE_LENGTH = 4096;

function isStringRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateLocalizedMap(value: unknown): LocalizedString {
  if (!isStringRecord(value)) {
    throw new GraphQLError("LocalizedString must be an object keyed by AppLocale");
  }

  const obj: Record<string, unknown> = value;
  const result: Partial<Record<AppLocale, string>> = {};

  for (const [key, val] of Object.entries(obj)) {
    if (!isAppLocale(key)) {
      throw new GraphQLError(`LocalizedString keys must be AppLocale values ("ar" | "en"). Unexpected key "${key}"`);
    }
    if (typeof val !== "string") {
      throw new GraphQLError(`LocalizedString values must be strings. Key "${key}" has value of type ${typeof val}`);
    }
    if (val.length > MAX_VALUE_LENGTH) {
      throw new GraphQLError(
        `LocalizedString values must be at most ${MAX_VALUE_LENGTH} characters. Key "${key}" exceeds limit`
      );
    }
    result[key] = val;
  }

  return result;
}

function parseLiteral(ast: ValueNode): LocalizedString {
  if (ast.kind !== Kind.OBJECT) {
    throw new GraphQLError("LocalizedString must be an object keyed by AppLocale");
  }

  const result: Record<string, string> = {};

  for (const field of ast.fields) {
    const key = field.name.value;
    if (!isAppLocale(key)) {
      throw new GraphQLError(`LocalizedString keys must be AppLocale values ("ar" | "en"). Unexpected key "${key}"`);
    }
    if (field.value.kind !== Kind.STRING) {
      throw new GraphQLError(`LocalizedString values must be strings. Key "${key}" has non-string value`);
    }
    if (field.value.value.length > MAX_VALUE_LENGTH) {
      throw new GraphQLError(
        `LocalizedString values must be at most ${MAX_VALUE_LENGTH} characters. Key "${key}" exceeds limit`
      );
    }
    result[key] = field.value.value;
  }

  return result;
}

/**
 * Pothos/GraphQL scalar for the JSONB `LocalizedString` map (`Partial<Record<AppLocale, string>>`).
 *
 * The canonical type lives in `@/shared/types/localized-string` so frontend and
 * backend share one definition. The scalar validates that every key is an
 * `AppLocale` and every value is a string — preserving the JSONB shape over
 * the wire so clients can call `resolveLocalizedString(map, useLocale())`
 * locally for instant app-locale switching without re-fetching.
 */
export const LocalizedStringScalar = new GraphQLScalarType({
  name: "LocalizedString",
  description:
    'A JSONB map of AppLocale → string (e.g. { ar: "فودافون كاش", en: "Vodafone Cash" }). Keys are restricted to the app locales from @/shared/i18n/routing.',
  serialize: (value: unknown): LocalizedString => validateLocalizedMap(value),
  parseValue: (value: unknown): LocalizedString => validateLocalizedMap(value),
  parseLiteral,
});
