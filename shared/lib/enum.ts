/**
 * Canonical enum parsing utilities — pure functions shared across frontend and backend.
 *
 * These functions parse string values into backend enum types. Both layers can import
 * from here without violating layer isolation since `shared/` is the canonical
 * location for cross-layer utilities.
 *
 * Frontend-only functions (using GraphQL codegen enums) remain in
 * `frontend/common/lib/enum.ts` and re-export from here.
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
  GroupClassAttendanceStatus,
  IanaTimezone,
  InvoiceStatus,
  InvoiceType,
  OverrideState,
  ParentStatus,
  PaymentDirection,
  PaymentMethodType,
  StudentStatus,
} from "@/shared/constants";
import { type AppLocale, locales } from "@/shared/locale/AppLocale";

/**
 * Local BookingStatus enum with values matching the backend/database (lowercase).
 * The GraphQL codegen enum uses uppercase values ('CONFIRMED', 'RESCHEDULED')
 * but the database stores lowercase ('confirmed', 'rescheduled').
 * This local enum ensures parseBookingStatus works with raw DB values.
 */
export enum BookingStatus {
  CONFIRMED = "confirmed",
  RESCHEDULED = "rescheduled",
}

/**
 * Type for string-based enum objects.
 */
type StringEnum<T extends string> = Record<string, T>;

/**
 * Cache Set instances of enum values to avoid repeated Object.values(enumObject)
 * array allocations and linear O(N) scans during high-frequency enum parsing.
 */
const enumValueSetCache = new WeakMap<StringEnum<string>, Set<string>>();

function getEnumValueSet<T extends string>(enumObject: StringEnum<T>): Set<string> {
  let valueSet = enumValueSetCache.get(enumObject);
  if (!valueSet) {
    valueSet = new Set<string>(Object.values(enumObject));
    enumValueSetCache.set(enumObject, valueSet);
  }
  return valueSet;
}

/**
 * Type guard: checks whether a raw string is a value of the given string enum.
 */
function isEnumValue<T extends string>(enumObject: StringEnum<T>, value: string): value is T {
  return getEnumValueSet(enumObject).has(value);
}

/**
 * Parses a string value against a string enum object.
 */
function parseEnumValue<T extends string>(
  enumObject: StringEnum<T>,
  value: string | null | undefined,
  fallback: T | null = null
): T | null {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (isEnumValue(enumObject, value)) {
    return value;
  }

  return fallback;
}

/**
 * Factory: creates a typed parser returning `T | null` for a string enum.
 */
function orNull<T extends string>(enumObject: StringEnum<T>): (value: string | null | undefined) => T | null {
  return (value: string | null | undefined): T | null => parseEnumValue(enumObject, value);
}

/**
 * Parses a string value into an AccountStatus enum with a fallback.
 * Backend values: ACTIVATED, DEACTIVATED
 */
export const parseAccountStatus: (value: string | null | undefined, fallback?: AccountStatus) => AccountStatus = (
  value,
  fallback = AccountStatus.ACTIVATED
) => parseEnumValue(AccountStatus, value, fallback) ?? fallback;

/**
 * Parses a string value into an AppLanguage enum, returning null if invalid.
 * Backend values: ar, en
 */
export const parseAppLanguage: (value: string | null | undefined) => AppLanguage | null = orNull(AppLanguage);

/**
 * Parses a string value into a ClassExecutionState enum with a fallback.
 * Backend values: NOT_ACTIVATED, ACTIVATED, RUNNING, COMPLETED,
 * ON_DEMAND_PENDING_CREDITS, ON_DEMAND_CONFLICT_HELD,
 * ON_DEMAND_NO_CREDITS_CANCELLED, ON_DEMAND_NO_CREDITS_ABSENT
 */
export const parseClassExecutionState: (
  value: string | null | undefined,
  fallback?: ClassExecutionState
) => ClassExecutionState = (value, fallback = ClassExecutionState.NOT_ACTIVATED) =>
  parseEnumValue(ClassExecutionState, value, fallback) ?? fallback;

/**
 * Parses a string value into a ClassOutcome enum with a fallback.
 * Backend values: PENDING, TAKEN, ABSENT, LEAVE
 */
export const parseClassOutcome: (value: string | null | undefined, fallback?: ClassOutcome) => ClassOutcome = (
  value,
  fallback = ClassOutcome.PENDING
) => parseEnumValue(ClassOutcome, value, fallback) ?? fallback;

/**
 * Parses a string value into a ClassType enum with a fallback.
 * Backend values: REGULAR, TRIAL, ADVANCE
 */
export const parseClassType: (value: string | null | undefined, fallback?: ClassType) => ClassType = (
  value,
  fallback = ClassType.REGULAR
) => parseEnumValue(ClassType, value, fallback) ?? fallback;

/**
 * Parses a string value into a ClassType enum, returning null if invalid.
 */
export const parseClassTypeOrNull: (value: string | null | undefined) => ClassType | null = orNull(ClassType);

/**
 * Parses a string value into a CurrencyCode enum with a fallback.
 * Backend values: EGP, SAR, AED, KWD, QAR, BHD, OMR, JOD, IQD, YER, SYP, LBP, ILS, SDG, LYD, TND, DZD, MAD, MRU, SOS, DJF, KMF, TRY, USD, EUR, GBP, CHF, CNY, JPY, INR, CAD, AUD
 */
export const parseCurrencyCode: (value: string | null | undefined, fallback?: CurrencyCode) => CurrencyCode = (
  value,
  fallback = CurrencyCode.EGP
) => parseEnumValue(CurrencyCode, value, fallback) ?? fallback;

/**
 * Parses a string value into a CurrencyCode enum, returning null if invalid.
 */
export const parseCurrencyCodeOrNull: (value: string | null | undefined) => CurrencyCode | null = orNull(CurrencyCode);

/**
 * Parses a string value into a Gender enum with a fallback.
 * Backend values: MALE, FEMALE
 */
export const parseGender: (value: string | null | undefined, fallback?: Gender) => Gender = (
  value,
  fallback = Gender.MALE
) => parseEnumValue(Gender, value, fallback) ?? fallback;

/**
 * Parses a string value into an InvoiceStatus enum with a fallback.
 * Backend values: UNPAID, PAYMENT_PENDING, PAID, CANCELLED
 */
export const parseInvoiceStatus: (value: string | null | undefined, fallback?: InvoiceStatus) => InvoiceStatus = (
  value,
  fallback = InvoiceStatus.UNPAID
) => parseEnumValue(InvoiceStatus, value, fallback) ?? fallback;

/**
 * Parses a string value into an InvoiceType enum with a fallback.
 * Backend values: PER_CLASSES, MONTHLY, MANUAL
 */
export const parseInvoiceType: (value: string | null | undefined, fallback?: InvoiceType) => InvoiceType = (
  value,
  fallback = InvoiceType.MONTHLY
) => parseEnumValue(InvoiceType, value, fallback) ?? fallback;

/**
 * Parses a string value into a ParentStatus enum, returning null if invalid.
 * Backend values: REGULAR, ON_LEAVE, SUSPENDED, ON_TRIAL
 */
export const parseParentStatus = orNull(ParentStatus);

/**
 * Parses a string value into a PaymentMethodType enum, returning null if invalid.
 * Backend values: MOBILE_WALLET, PAYMENT_LINK, ONLINE_ACCOUNT, BANK_TRANSFER, CASH, PROOF_UPLOAD
 */
export const parsePaymentMethodType = orNull(PaymentMethodType);

/**
 * Parses a string value into a PaymentDirection enum with a fallback.
 * Backend values: PAYIN, PAYOUT, BOTH
 */
export const parsePaymentDirection: (
  value: string | null | undefined,
  fallback?: PaymentDirection
) => PaymentDirection = (value, fallback = PaymentDirection.BOTH) =>
  parseEnumValue(PaymentDirection, value, fallback) ?? fallback;

/**
 * Parses a string value into a StudentStatus enum, returning null if invalid.
 * Backend values: REGULAR, ON_LEAVE, SUSPENDED, ON_TRIAL, DEACTIVATED
 */
export const parseStudentStatus: (value: string | null | undefined) => StudentStatus | null = orNull(StudentStatus);

/**
 * Parses a string value into a DayOfWeek enum, returning null if invalid.
 * Backend values: MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY
 */
export const parseDayOfWeek: (value: string | null | undefined) => DayOfWeek | null = orNull(DayOfWeek);

/**
 * Parses a string value into an IanaTimezone enum with a fallback.
 * Uses the shared IanaTimezone enum (matches backend/db values).
 */
export const parseIanaTimezone: (value: string | null | undefined, fallback?: IanaTimezone) => IanaTimezone = (
  value,
  fallback = IanaTimezone.UTC
) => parseEnumValue(IanaTimezone, value, fallback) ?? fallback;

/**
 * Parses a string value into an IanaTimezone enum, returning null if invalid.
 */
export const parseIanaTimezoneOrNull: (value: string | null | undefined) => IanaTimezone | null = orNull(IanaTimezone);

/**
 * Parses a string value into an OverrideState enum, returning null if invalid.
 */
export const parseOverrideState = (value: string | null | undefined): OverrideState | null => {
  if (value === OverrideState.GRANTED) {
    return OverrideState.GRANTED;
  }
  if (value === OverrideState.DENIED) {
    return OverrideState.DENIED;
  }
  return null;
};

/**
 * Parses a string value into a BookingStatus enum with a fallback.
 * Uses local BookingStatus enum with lowercase values matching backend/database.
 */
export const parseBookingStatus: (value: string | null | undefined, fallback?: BookingStatus) => BookingStatus = (
  value,
  fallback = BookingStatus.CONFIRMED
) => parseEnumValue(BookingStatus, value, fallback) ?? fallback;

/**
 * Parses a string value into a GroupClassAttendanceStatus enum with a fallback.
 * Backend AttendanceStatus values: pending, present, absent, late (lowercase in DB)
 */
export const parseGroupClassAttendanceStatus: (
  value: string | null | undefined,
  fallback?: GroupClassAttendanceStatus
) => GroupClassAttendanceStatus = (value, fallback = GroupClassAttendanceStatus.PENDING) =>
  parseEnumValue(GroupClassAttendanceStatus, value, fallback) ?? fallback;

/**
 * Type guard for AppLocale.
 */
export function isAppLocale(value: string): value is AppLocale {
  return (locales as readonly string[]).includes(value);
}

/**
 * Normalizes a locale string to AppLocale, falling back to default.
 */
export function normalizeContentLocale(locale?: string): AppLocale {
  if (locale && isAppLocale(locale)) {
    return locale;
  }
  return "ar";
}
