import { GraphQLError, GraphQLScalarType, Kind, type ValueNode } from "graphql";
import { IanaTimezone } from "@/shared/constants/iana-timezone.enum";
import { parseIanaTimezoneOrNull } from "@/shared/lib/enum";
import { resolveExcludedIanaTimezoneId } from "@/shared/lib/timezone/excluded-iana-timezones";

const IANA_TIMEZONE_ENUM_VALUES = new Set<string>(Object.values(IanaTimezone));

/**
 * Machine-stable error codes for IanaTimezone coercion failures.
 * GraphQL scalar parsers receive no request context in graphql-js, so locale
 * cannot be threaded here — clients localize via `extensions.scalarCode`.
 */
const IanaTimezoneScalarError = {
  NotAString: "IANA_TIMEZONE_NOT_STRING",
  InvalidValue: "IANA_TIMEZONE_INVALID_VALUE",
  LiteralNotString: "IANA_TIMEZONE_LITERAL_NOT_STRING",
  CannotSerialize: "IANA_TIMEZONE_CANNOT_SERIALIZE",
} as const;

function normalizeToSlashId(value: string): string {
  const slashNormalized = value.includes("/") ? value : value.replaceAll("_", "/");
  return resolveExcludedIanaTimezoneId(slashNormalized);
}

function parseIanaTimezoneValue(value: unknown): IanaTimezone {
  if (typeof value !== "string") {
    throw new GraphQLError(`IanaTimezone must be a string, got ${typeof value}`, {
      extensions: { code: "BAD_USER_INPUT", scalarCode: IanaTimezoneScalarError.NotAString },
    });
  }

  const normalized = normalizeToSlashId(value);
  const parsed = parseIanaTimezoneOrNull(normalized);
  if (parsed !== null) {
    return parsed;
  }

  throw new GraphQLError(`Invalid IanaTimezone: ${value}`, {
    extensions: { code: "BAD_USER_INPUT", scalarCode: IanaTimezoneScalarError.InvalidValue },
  });
}

function isIanaTimezone(value: string): value is IanaTimezone {
  return IANA_TIMEZONE_ENUM_VALUES.has(value);
}

function serializeIanaTimezone(value: unknown): IanaTimezone {
  if (typeof value === "string" && isIanaTimezone(value)) {
    return value;
  }
  // Accept underscore wire leftovers from pre-scalar clients during transition.
  if (typeof value === "string") {
    return parseIanaTimezoneValue(value);
  }
  throw new GraphQLError(`Cannot serialize value as IanaTimezone: ${String(value)}`, {
    extensions: { code: "INTERNAL_SERVER_ERROR", scalarCode: IanaTimezoneScalarError.CannotSerialize },
  });
}

function parseLiteral(ast: ValueNode): IanaTimezone {
  if (ast.kind !== Kind.STRING) {
    throw new GraphQLError("IanaTimezone literal must be a string", {
      extensions: { code: "BAD_USER_INPUT", scalarCode: IanaTimezoneScalarError.LiteralNotString },
    });
  }
  return parseIanaTimezoneValue(ast.value);
}

/**
 * GraphQL scalar for IANA timezone IDs using slash wire format (`Africa/Cairo`).
 *
 * GraphQL enums cannot contain `/` in member names, so timezone must not be an
 * enum. This scalar keeps DB / Intl / shared `IanaTimezone` values identical
 * end-to-end with no underscore conversion layer.
 */
export const IanaTimezoneScalar = new GraphQLScalarType({
  name: "IanaTimezone",
  description: "IANA timezone identifier (slash form, e.g. Africa/Cairo)",
  serialize: serializeIanaTimezone,
  parseValue: parseIanaTimezoneValue,
  parseLiteral,
});
