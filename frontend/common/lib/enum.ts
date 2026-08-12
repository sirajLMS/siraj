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
 * Factory: creates a typed parser with a default fallback for a string enum.
 * Using factories here (instead of repeated `parseEnumValue(Enum, value, fallback) ?? fallback`
 * one-liners) avoids producing a token stream identical to `shared/lib/enum.ts`
 * (see D7-1 in deferred-items.md for the architectural rationale).
 */
function withFallback<V extends string>(
  enumObject: Record<string, V>,
  fallback: V
): (value: string | null | undefined) => V {
  return (value: string | null | undefined): V => {
    const parsed = parseEnumValue(enumObject, value, fallback);
    return parsed ?? fallback;
  };
}

/**
 * Factory: creates a typed parser returning `V | null` for a string enum.
 */
function orNull<V extends string>(enumObject: Record<string, V>): (value: string | null | undefined) => V | null {
  return (value: string | null | undefined): V | null => parseEnumValue(enumObject, value);
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
export const parseGender: (value: string | null | undefined, fallback?: Gender) => Gender = (
  value,
  fallback = Gender.Male
) => withFallback(Gender, fallback)(value);

/**
 * Parses a string value into a Gender enum, returning null if invalid.
 */
export const parseGenderOrNull: (value: string | null | undefined) => Gender | null = orNull(Gender);

/**
 * Parses a string value into a CurrencyCode enum with a fallback.
 * GraphQL codegen values match backend values.
 */
export const parseCurrencyCode: (value: string | null | undefined, fallback?: CurrencyCode) => CurrencyCode = (
  value,
  fallback = CurrencyCode.Egp
) => withFallback(CurrencyCode, fallback)(value);

/**
 * Parses a string value into a CurrencyCode enum, returning null if invalid.
 */
export const parseCurrencyCodeOrNull: (value: string | null | undefined) => CurrencyCode | null = orNull(CurrencyCode);

/**
 * Parses a string value into an AccountStatus enum with a fallback.
 * GraphQL codegen values: 'ACTIVATED', 'DEACTIVATED' — match backend values.
 */
export const parseAccountStatus: (value: string | null | undefined, fallback?: AccountStatus) => AccountStatus = (
  value,
  fallback = AccountStatus.Activated
) => withFallback(AccountStatus, fallback)(value);

/**
 * Parses a string value into an AccountStatus enum, returning null if invalid.
 */
export const parseAccountStatusOrNull: (value: string | null | undefined) => AccountStatus | null =
  orNull(AccountStatus);

/**
 * Parses a string value into a ClassExecutionState enum with a fallback.
 * GraphQL codegen values match backend values.
 */
export const parseClassExecutionState: (
  value: string | null | undefined,
  fallback?: ClassExecutionState
) => ClassExecutionState = (value, fallback = ClassExecutionState.NotActivated) =>
  withFallback(ClassExecutionState, fallback)(value);

/**
 * Parses a string value into a ClassOutcome enum with a fallback.
 * GraphQL codegen values match backend values.
 */
export const parseClassOutcome: (value: string | null | undefined, fallback?: ClassOutcome) => ClassOutcome = (
  value,
  fallback = ClassOutcome.Pending
) => withFallback(ClassOutcome, fallback)(value);

/**
 * Parses a string value into a ClassType enum with a fallback.
 * GraphQL codegen values match backend values.
 */
export const parseClassType: (value: string | null | undefined, fallback?: ClassType) => ClassType = (
  value,
  fallback = ClassType.Regular
) => withFallback(ClassType, fallback)(value);

/**
 * Parses a string value into a ClassType enum, returning null if invalid.
 */
export const parseClassTypeOrNull: (value: string | null | undefined) => ClassType | null = orNull(ClassType);

/**
 * Parses a string value into an InvoiceStatus enum with a fallback.
 * GraphQL codegen values match backend values.
 */
export const parseInvoiceStatus: (value: string | null | undefined, fallback?: InvoiceStatus) => InvoiceStatus = (
  value,
  fallback = InvoiceStatus.Unpaid
) => withFallback(InvoiceStatus, fallback)(value);

/**
 * Parses a string value into an InvoiceType enum with a fallback.
 * GraphQL codegen values match backend values.
 */
export const parseInvoiceType: (value: string | null | undefined, fallback?: InvoiceType) => InvoiceType = (
  value,
  fallback = InvoiceType.Monthly
) => withFallback(InvoiceType, fallback)(value);

/**
 * Parses a string value into a ParentStatus enum, returning null if invalid.
 * GraphQL codegen values match backend values.
 */
export const parseParentStatus = orNull(ParentStatus);

/**
 * Parses a string value into a PaymentMethodType enum, returning null if invalid.
 * GraphQL codegen values match backend values.
 */
export const parsePaymentMethodType = orNull(PaymentMethodType);

/**
 * Parses a string value into a PaymentDirection enum with a fallback.
 * GraphQL codegen values match backend values.
 */
export const parsePaymentDirection: (
  value: string | null | undefined,
  fallback?: PaymentDirection
) => PaymentDirection = (value, fallback = PaymentDirection.Both) => withFallback(PaymentDirection, fallback)(value);

/**
 * Parses a string value into a StudentStatus enum, returning null if invalid.
 * GraphQL codegen values match backend values.
 */
export const parseStudentStatus: (value: string | null | undefined) => StudentStatus | null = orNull(StudentStatus);

/**
 * Parses a string value into a DayOfWeek enum, returning null if invalid.
 * GraphQL codegen values match backend values.
 */
export const parseDayOfWeek: (value: string | null | undefined) => DayOfWeek | null = orNull(DayOfWeek);

/**
 * Parses a string value into an AppLanguage enum, returning null if invalid.
 * GraphQL codegen values match backend values.
 */
export const parseAppLanguage: (value: string | null | undefined) => AppLanguage | null = orNull(AppLanguage);

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

const BOOKING_STATUS_VALUES: readonly BookingStatus[] = ["confirmed", "rescheduled"];

function isBookingStatus(value: string): value is BookingStatus {
  return (BOOKING_STATUS_VALUES as readonly string[]).includes(value);
}

/**
 * Parses a string value into a BookingStatus enum with a fallback.
 * Uses local BookingStatus type with lowercase values matching backend/database.
 */
export const parseBookingStatus = (
  value: string | null | undefined,
  fallback: BookingStatus = "confirmed"
): BookingStatus => {
  if (value !== null && value !== undefined && isBookingStatus(value)) {
    return value;
  }
  return fallback;
};

/**
 * Parses a string value into a BookingStatus enum, returning null if invalid.
 */
export const parseBookingStatusOrNull = (value: string | null | undefined): BookingStatus | null => {
  if (value !== null && value !== undefined && isBookingStatus(value)) {
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
