import { GraphQLError, GraphQLScalarType, Kind, type ValueNode } from "graphql";
import { type AppLocale, getServerTranslations } from "@/shared/locale";
import { DEFAULT_CONTENT_LOCALE, isAppLocale, type LocalizedString } from "@/shared/types/localized-string";

const MAX_VALUE_LENGTH = 4096;

// Scalar parsers run outside the request context, so the fallback message uses
// the default content locale; clients localize via `extensions.scalarCode`.
const tErrors = getServerTranslations(DEFAULT_CONTENT_LOCALE).errorsTranslations;

/**
 * Machine-stable error codes for LocalizedString validation failures.
 * GraphQL scalar parsers receive no request context in graphql-js, so locale
 * cannot be threaded here — clients localize via `extensions.scalarCode`.
 */
const LocalizedStringScalarError = {
  NotObject: "LOCALIZED_STRING_NOT_OBJECT",
  InvalidLocaleKey: "LOCALIZED_STRING_INVALID_LOCALE_KEY",
  ValueNotString: "LOCALIZED_STRING_VALUE_NOT_STRING",
  ValueTooLong: "LOCALIZED_STRING_VALUE_TOO_LONG",
} as const;

function isStringRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateLocalizedMap(value: unknown): LocalizedString {
  if (!isStringRecord(value)) {
    throw new GraphQLError(tErrors.invalidInput, {
      extensions: { code: "BAD_USER_INPUT", scalarCode: LocalizedStringScalarError.NotObject },
    });
  }

  const obj: Record<string, unknown> = value;
  const result: Partial<Record<AppLocale, string>> = {};

  for (const [key, val] of Object.entries(obj)) {
    if (!isAppLocale(key)) {
      throw new GraphQLError(tErrors.invalidInput, {
        extensions: { code: "BAD_USER_INPUT", scalarCode: LocalizedStringScalarError.InvalidLocaleKey, key },
      });
    }
    if (typeof val !== "string") {
      throw new GraphQLError(tErrors.invalidInput, {
        extensions: { code: "BAD_USER_INPUT", scalarCode: LocalizedStringScalarError.ValueNotString, key },
      });
    }
    if (val.length > MAX_VALUE_LENGTH) {
      throw new GraphQLError(tErrors.invalidInput, {
        extensions: {
          code: "BAD_USER_INPUT",
          scalarCode: LocalizedStringScalarError.ValueTooLong,
          key,
          maxLength: MAX_VALUE_LENGTH,
        },
      });
    }
    result[key] = val;
  }

  return result;
}

function parseLiteral(ast: ValueNode): LocalizedString {
  if (ast.kind !== Kind.OBJECT) {
    throw new GraphQLError(tErrors.invalidInput, {
      extensions: { code: "BAD_USER_INPUT", scalarCode: LocalizedStringScalarError.NotObject },
    });
  }

  const result: Record<string, string> = {};

  for (const field of ast.fields) {
    const key = field.name.value;
    if (!isAppLocale(key)) {
      throw new GraphQLError(tErrors.invalidInput, {
        extensions: { code: "BAD_USER_INPUT", scalarCode: LocalizedStringScalarError.InvalidLocaleKey, key },
      });
    }
    if (field.value.kind !== Kind.STRING) {
      throw new GraphQLError(tErrors.invalidInput, {
        extensions: { code: "BAD_USER_INPUT", scalarCode: LocalizedStringScalarError.ValueNotString, key },
      });
    }
    if (field.value.value.length > MAX_VALUE_LENGTH) {
      throw new GraphQLError(tErrors.invalidInput, {
        extensions: {
          code: "BAD_USER_INPUT",
          scalarCode: LocalizedStringScalarError.ValueTooLong,
          key,
          maxLength: MAX_VALUE_LENGTH,
        },
      });
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
