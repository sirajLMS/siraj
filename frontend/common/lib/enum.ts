/**
 * Frontend canonical enum parsing utilities.
 *
 * This is the single source of truth for enum parsing across the codebase.
 * Uses GraphQL codegen enums where values match backend, and defines local
 * types for enums where GraphQL codegen values differ from backend/database.
 *
 * Backend/database values (source of truth):
 * - IanaTimezone: "Africa/Abidjan" (slash format)
 * - BookingStatus: "confirmed", "rescheduled" (lowercase)
 * - AccountStatus: "ACTIVATED", "DEACTIVATED" (uppercase) — matches GraphQL codegen values
 * - Gender: "MALE", "FEMALE" (uppercase) — matches GraphQL codegen values
 *
 * GraphQL codegen values:
 * - IanaTimezone: "Africa_Abidjan" (underscore format) — DIFFERS
 * - BookingStatus: "CONFIRMED", "RESCHEDULED" (uppercase) — DIFFERS
 * - AccountStatus: "ACTIVATED", "DEACTIVATED" (uppercase) — MATCHES
 * - Gender: "MALE", "FEMALE" (uppercase) — MATCHES
 */

import {
  AccountStatus,
  AppLanguage,
  ClassExecutionState,
  ClassOutcome,
  ClassType,
  CurrencyCode,
  DayOfWeek,
  Gender,
  InvoiceStatus,
  InvoiceType,
  ParentStatus,
  PaymentDirection,
  PaymentMethodType,
  StudentStatus,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import { IANA_TIMEZONE_IDS, type IanaTimezoneId } from "@/shared/constants/iana-timezones";

/**
 * Local BookingStatus type with backend/database values (lowercase).
 * GraphQL codegen uses uppercase values ('CONFIRMED', 'RESCHEDULED')
 * but the database stores lowercase ('confirmed', 'rescheduled').
 */
export type BookingStatus = "confirmed" | "rescheduled";

/**
 * Local IanaTimezone type with backend/database values (slash format).
 * GraphQL codegen uses underscore format ('Africa_Abidjan')
 * but the database stores slash format ('Africa/Abidjan').
 */
export type IanaTimezone = IanaTimezoneId;

/**
 * Type for string-based enum objects.
 */
export type StringEnum = Record<string, string>;

/**
 * Type for array-based enum values (like IANA_TIMEZONE_IDS).
 */
export type StringArrayEnum = readonly string[];

/**
 * Parses a string value against a string enum object.
 * @internal
 */
function parseEnumValue<V extends string>(
  enumObject: Record<string, V>,
  value: string | null | undefined,
  fallback: V | null = null
): V | null {
  if (value === null || value === undefined) {
    return fallback;
  }

  for (const enumVal of Object.values(enumObject)) {
    if (enumVal === value) {
      return enumVal;
    }
  }

  return fallback;
}

/**
 * Parses a string value against a readonly string array enum.
 * @internal
 */
function parseArrayEnumValue<T extends string>(
  enumArray: readonly T[],
  value: string | null | undefined,
  fallback: T | null = null
): T | null {
  if (value === null || value === undefined) {
    return fallback;
  }

  for (const item of enumArray) {
    if (item === value) {
      return item;
    }
  }

  return fallback;
}

/**
 * Parses a string value into a CountryCode.
 * Note: CountryCode is not currently exposed in GraphQL codegen.
 * Using string validation against ISO 3166-1 alpha-2 format.
 */
export const parseCountryCode = (value: string | null | undefined): string | null => {
  if (!value) return null;

  const upperValue = value.toUpperCase();
  // Validate ISO 3166-1 alpha-2 format (2 letters)
  if (/^[A-Z]{2}$/.test(upperValue)) {
    return upperValue;
  }

  return null;
};

/**
 * Parses a string value into a Gender enum with a fallback.
 * GraphQL codegen values: 'MALE', 'FEMALE' — match backend values.
 */
export const parseGender = (value: string | null | undefined, fallback: Gender = Gender.Male): Gender =>
  parseEnumValue(Gender, value, fallback) ?? fallback;

/**
 * Parses a string value into a Gender enum, returning null if invalid.
 */
export const parseGenderOrNull = (value: string | null | undefined): Gender | null => parseEnumValue(Gender, value);

/**
 * Parses a string value into a CurrencyCode enum with a fallback.
 * GraphQL codegen values match backend values.
 */
export const parseCurrencyCode = (
  value: string | null | undefined,
  fallback: CurrencyCode = CurrencyCode.Egp
): CurrencyCode => parseEnumValue(CurrencyCode, value, fallback) ?? fallback;

/**
 * Parses a string value into a CurrencyCode enum, returning null if invalid.
 */
export const parseCurrencyCodeOrNull = (value: string | null | undefined): CurrencyCode | null =>
  parseEnumValue(CurrencyCode, value);

/**
 * Parses a string value into an AccountStatus enum with a fallback.
 * GraphQL codegen values: 'ACTIVATED', 'DEACTIVATED' — match backend values.
 */
export const parseAccountStatus = (
  value: string | null | undefined,
  fallback: AccountStatus = AccountStatus.Activated
): AccountStatus => parseEnumValue(AccountStatus, value, fallback) ?? fallback;

/**
 * Parses a string value into an AccountStatus enum, returning null if invalid.
 */
export const parseAccountStatusOrNull = (value: string | null | undefined): AccountStatus | null =>
  parseEnumValue(AccountStatus, value);

/**
 * Parses a string value into a ClassExecutionState enum with a fallback.
 * GraphQL codegen values match backend values.
 */
export const parseClassExecutionState = (
  value: string | null | undefined,
  fallback: ClassExecutionState = ClassExecutionState.NotActivated
): ClassExecutionState => parseEnumValue(ClassExecutionState, value, fallback) ?? fallback;

/**
 * Parses a string value into a ClassOutcome enum with a fallback.
 * GraphQL codegen values match backend values.
 */
export const parseClassOutcome = (
  value: string | null | undefined,
  fallback: ClassOutcome = ClassOutcome.Pending
): ClassOutcome => parseEnumValue(ClassOutcome, value, fallback) ?? fallback;

/**
 * Parses a string value into a ClassType enum with a fallback.
 * GraphQL codegen values match backend values.
 */
export const parseClassType = (value: string | null | undefined, fallback: ClassType = ClassType.Regular): ClassType =>
  parseEnumValue(ClassType, value, fallback) ?? fallback;

/**
 * Parses a string value into a ClassType enum, returning null if invalid.
 */
export const parseClassTypeOrNull = (value: string | null | undefined): ClassType | null =>
  parseEnumValue(ClassType, value);

/**
 * Parses a string value into an InvoiceStatus enum with a fallback.
 * GraphQL codegen values match backend values.
 */
export const parseInvoiceStatus = (
  value: string | null | undefined,
  fallback: InvoiceStatus = InvoiceStatus.Unpaid
): InvoiceStatus => parseEnumValue(InvoiceStatus, value, fallback) ?? fallback;

/**
 * Parses a string value into an InvoiceType enum with a fallback.
 * GraphQL codegen values match backend values.
 */
export const parseInvoiceType = (
  value: string | null | undefined,
  fallback: InvoiceType = InvoiceType.Monthly
): InvoiceType => parseEnumValue(InvoiceType, value, fallback) ?? fallback;

/**
 * Parses a string value into a ParentStatus enum, returning null if invalid.
 * GraphQL codegen values match backend values.
 */
export const parseParentStatus = (value: string | null | undefined): ParentStatus | null =>
  parseEnumValue(ParentStatus, value);

/**
 * Parses a string value into a PaymentMethodType enum, returning null if invalid.
 * GraphQL codegen values match backend values.
 */
export const parsePaymentMethodType = (value: string | null | undefined): PaymentMethodType | null =>
  parseEnumValue(PaymentMethodType, value);

/**
 * Parses a string value into a PaymentDirection enum with a fallback.
 * GraphQL codegen values match backend values.
 */
export const parsePaymentDirection = (
  value: string | null | undefined,
  fallback: PaymentDirection = PaymentDirection.Both
): PaymentDirection => parseEnumValue(PaymentDirection, value, fallback) ?? fallback;

/**
 * Parses a string value into a StudentStatus enum, returning null if invalid.
 * GraphQL codegen values match backend values.
 */
export const parseStudentStatus = (value: string | null | undefined): StudentStatus | null =>
  parseEnumValue(StudentStatus, value);

/**
 * Parses a string value into a DayOfWeek enum, returning null if invalid.
 * GraphQL codegen values match backend values.
 */
export const parseDayOfWeek = (value: string | null | undefined): DayOfWeek | null => parseEnumValue(DayOfWeek, value);

/**
 * Parses a string value into an AppLanguage enum, returning null if invalid.
 * GraphQL codegen values match backend values.
 */
export const parseAppLanguage = (value: string | null | undefined): AppLanguage | null =>
  parseEnumValue(AppLanguage, value);

/**
 * Parses a string value into an IanaTimezone enum with a fallback.
 * Uses the shared IANA timezone IDs array (matches backend/db values with slashes).
 * Returns local IanaTimezone type (IanaTimezoneId from shared).
 */
export const parseIanaTimezone = (value: string | null | undefined, fallback: IanaTimezone = "UTC"): IanaTimezone =>
  parseArrayEnumValue(IANA_TIMEZONE_IDS, value, fallback) ?? fallback;

/**
 * Parses a string value into an IanaTimezone enum, returning null if invalid.
 * Uses the shared IANA timezone IDs array (matches backend/db values with slashes).
 */
export const parseIanaTimezoneOrNull = (value: string | null | undefined): IanaTimezone | null =>
  parseArrayEnumValue(IANA_TIMEZONE_IDS, value);

/**
 * Parses a string value into an IanaTimezone enum with a fallback, using GraphQL codegen type.
 * This is a frontend-specific version that uses the GraphQL codegen enum type (underscore format).
 */
export const parseIanaTimezoneGQL = (value: string | null | undefined, fallback: string = "UTC"): string => {
  // Convert backend format (slash) to GraphQL format (underscore) for validation
  const gqlValue = value?.replace(/\//g, "_");
  const gqlFallback = fallback.replace(/\//g, "_");
  if (!gqlValue) return gqlFallback;
  const slashValue = gqlValue.replace(/_/g, "/");
  const valid = (IANA_TIMEZONE_IDS as readonly string[]).includes(slashValue);
  return valid ? gqlValue : gqlFallback;
};

/**
 * Parses a string value into an IanaTimezone enum, returning null if invalid, using GraphQL codegen type.
 */
export const parseIanaTimezoneOrNullGQL = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const gqlValue = value.replace(/\//g, "_");
  const slashValue = gqlValue.replace(/_/g, "/");
  const valid = (IANA_TIMEZONE_IDS as readonly string[]).includes(slashValue);
  return valid ? gqlValue : null;
};

/**
 * Parses a string value into a BookingStatus enum with a fallback.
 * Uses local BookingStatus type with lowercase values matching backend/database.
 */
export const parseBookingStatus = (
  value: string | null | undefined,
  fallback: BookingStatus = "confirmed"
): BookingStatus => {
  if (value === null || value === undefined) {
    return fallback;
  }
  if (value === "confirmed" || value === "rescheduled") {
    return value;
  }
  return fallback;
};

/**
 * Parses a string value into a BookingStatus enum, returning null if invalid.
 */
export const parseBookingStatusOrNull = (value: string | null | undefined): BookingStatus | null => {
  if (value === null || value === undefined) return null;
  if (value === "confirmed" || value === "rescheduled") {
    return value;
  }
  return null;
};

/**
 * Parses a string value into an OverrideState enum, returning null if invalid.
 */
export const parseOverrideState = (value: string | null | undefined): "GRANTED" | "DENIED" | null => {
  if (value === "GRANTED" || value === "DENIED") {
    return value;
  }
  return null;
};

/**
 * Parses a string value into a GroupClassAttendanceStatus enum with a fallback.
 * Backend AttendanceStatus values: PRESENT, ABSENT, LATE (uppercase in DB)
 */
export const parseGroupClassAttendanceStatus = (
  value: string | null | undefined,
  fallback: "PENDING" | "PRESENT" | "ABSENT" | "LATE" = "PENDING"
): "PENDING" | "PRESENT" | "ABSENT" | "LATE" => {
  if (value === "PENDING" || value === "PRESENT" || value === "ABSENT" || value === "LATE") {
    return value;
  }
  return fallback;
};
