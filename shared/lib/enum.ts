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
  type OverrideState,
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

  const enumValues = Object.values(enumObject) as readonly T[];
  if (enumValues.includes(value as T)) {
    return value as T;
  }

  return fallback;
}

/**
 * Parses a string value into an AccountStatus enum with a fallback.
 * Backend values: ACTIVATED, DEACTIVATED
 */
export const parseAccountStatus = (
  value: string | null | undefined,
  fallback: AccountStatus = AccountStatus.ACTIVATED
): AccountStatus => parseEnumValue(AccountStatus, value, fallback) ?? fallback;

/**
 * Parses a string value into an AppLanguage enum, returning null if invalid.
 * Backend values: ar, en
 */
export const parseAppLanguage = (value: string | null | undefined): AppLanguage | null =>
  parseEnumValue(AppLanguage, value);

/**
 * Parses a string value into a ClassExecutionState enum with a fallback.
 * Backend values: NOT_ACTIVATED, ACTIVATED, RUNNING, COMPLETED,
 * ON_DEMAND_PENDING_CREDITS, ON_DEMAND_CONFLICT_HELD,
 * ON_DEMAND_NO_CREDITS_CANCELLED, ON_DEMAND_NO_CREDITS_ABSENT
 */
export const parseClassExecutionState = (
  value: string | null | undefined,
  fallback: ClassExecutionState = ClassExecutionState.NOT_ACTIVATED
): ClassExecutionState => parseEnumValue(ClassExecutionState, value, fallback) ?? fallback;

/**
 * Parses a string value into a ClassOutcome enum with a fallback.
 * Backend values: PENDING, TAKEN, ABSENT, LEAVE
 */
export const parseClassOutcome = (
  value: string | null | undefined,
  fallback: ClassOutcome = ClassOutcome.PENDING
): ClassOutcome => parseEnumValue(ClassOutcome, value, fallback) ?? fallback;

/**
 * Parses a string value into a ClassType enum with a fallback.
 * Backend values: REGULAR, TRIAL, ADVANCE
 */
export const parseClassType = (value: string | null | undefined, fallback: ClassType = ClassType.REGULAR): ClassType =>
  parseEnumValue(ClassType, value, fallback) ?? fallback;

/**
 * Parses a string value into a ClassType enum, returning null if invalid.
 */
export const parseClassTypeOrNull = (value: string | null | undefined): ClassType | null =>
  parseEnumValue(ClassType, value);

/**
 * Parses a string value into a CurrencyCode enum with a fallback.
 * Backend values: EGP, SAR, AED, KWD, QAR, BHD, OMR, JOD, IQD, YER, SYP, LBP, ILS, SDG, LYD, TND, DZD, MAD, MRU, SOS, DJF, KMF, TRY, USD, EUR, GBP, CHF, CNY, JPY, INR, CAD, AUD
 */
export const parseCurrencyCode = (
  value: string | null | undefined,
  fallback: CurrencyCode = CurrencyCode.EGP
): CurrencyCode => parseEnumValue(CurrencyCode, value, fallback) ?? fallback;

/**
 * Parses a string value into a CurrencyCode enum, returning null if invalid.
 */
export const parseCurrencyCodeOrNull = (value: string | null | undefined): CurrencyCode | null =>
  parseEnumValue(CurrencyCode, value);

/**
 * Parses a string value into a Gender enum with a fallback.
 * Backend values: MALE, FEMALE
 */
export const parseGender = (value: string | null | undefined, fallback: Gender = Gender.MALE): Gender =>
  parseEnumValue(Gender, value, fallback) ?? fallback;

/**
 * Parses a string value into an InvoiceStatus enum with a fallback.
 * Backend values: UNPAID, PAYMENT_PENDING, PAID, CANCELLED
 */
export const parseInvoiceStatus = (
  value: string | null | undefined,
  fallback: InvoiceStatus = InvoiceStatus.UNPAID
): InvoiceStatus => parseEnumValue(InvoiceStatus, value, fallback) ?? fallback;

/**
 * Parses a string value into an InvoiceType enum with a fallback.
 * Backend values: PER_CLASSES, MONTHLY, MANUAL
 */
export const parseInvoiceType = (
  value: string | null | undefined,
  fallback: InvoiceType = InvoiceType.MONTHLY
): InvoiceType => parseEnumValue(InvoiceType, value, fallback) ?? fallback;

/**
 * Parses a string value into a ParentStatus enum, returning null if invalid.
 * Backend values: REGULAR, ON_LEAVE, SUSPENDED, ON_TRIAL
 */
export const parseParentStatus = (value: string | null | undefined): ParentStatus | null =>
  parseEnumValue(ParentStatus, value);

/**
 * Parses a string value into a PaymentMethodType enum, returning null if invalid.
 * Backend values: MOBILE_WALLET, PAYMENT_LINK, ONLINE_ACCOUNT, BANK_TRANSFER, CASH, PROOF_UPLOAD
 */
export const parsePaymentMethodType = (value: string | null | undefined): PaymentMethodType | null =>
  parseEnumValue(PaymentMethodType, value);

/**
 * Parses a string value into a PaymentDirection enum with a fallback.
 * Backend values: PAYIN, PAYOUT, BOTH
 */
export const parsePaymentDirection = (
  value: string | null | undefined,
  fallback: PaymentDirection = PaymentDirection.BOTH
): PaymentDirection => parseEnumValue(PaymentDirection, value, fallback) ?? fallback;

/**
 * Parses a string value into a StudentStatus enum, returning null if invalid.
 * Backend values: REGULAR, ON_LEAVE, SUSPENDED, ON_TRIAL, DEACTIVATED
 */
export const parseStudentStatus = (value: string | null | undefined): StudentStatus | null =>
  parseEnumValue(StudentStatus, value);

/**
 * Parses a string value into a DayOfWeek enum, returning null if invalid.
 * Backend values: MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY
 */
export const parseDayOfWeek = (value: string | null | undefined): DayOfWeek | null => parseEnumValue(DayOfWeek, value);

/**
 * Parses a string value into an IanaTimezone enum with a fallback.
 * Uses the shared IanaTimezone enum (matches backend/db values).
 */
export const parseIanaTimezone = (
  value: string | null | undefined,
  fallback: IanaTimezone = IanaTimezone.UTC
): IanaTimezone => parseEnumValue(IanaTimezone, value, fallback) ?? fallback;

/**
 * Parses a string value into an IanaTimezone enum, returning null if invalid.
 */
export const parseIanaTimezoneOrNull = (value: string | null | undefined): IanaTimezone | null =>
  parseEnumValue(IanaTimezone, value);

/**
 * Parses a string value into an OverrideState enum, returning null if invalid.
 */
export const parseOverrideState = (value: string | null | undefined): OverrideState | null => {
  if (value === "GRANTED" || value === "DENIED") {
    return value as OverrideState;
  }
  return null;
};

/**
 * Parses a string value into a BookingStatus enum with a fallback.
 * Uses local BookingStatus enum with lowercase values matching backend/database.
 */
export const parseBookingStatus = (
  value: string | null | undefined,
  fallback: BookingStatus = BookingStatus.CONFIRMED
): BookingStatus => parseEnumValue(BookingStatus, value, fallback) ?? fallback;

/**
 * Parses a string value into a GroupClassAttendanceStatus enum with a fallback.
 * Backend AttendanceStatus values: pending, present, absent, late (lowercase in DB)
 */
export const parseGroupClassAttendanceStatus = (
  value: string | null | undefined,
  fallback: GroupClassAttendanceStatus = GroupClassAttendanceStatus.PENDING
): GroupClassAttendanceStatus => {
  const validValues = Object.values(GroupClassAttendanceStatus) as GroupClassAttendanceStatus[];
  if (value === null || value === undefined) {
    return fallback;
  }
  if (validValues.includes(value as GroupClassAttendanceStatus)) {
    return value as GroupClassAttendanceStatus;
  }
  return fallback;
};

/**
 * Type guard for AppLocale.
 */
export function isAppLocale(value: string): value is AppLocale {
  return locales.includes(value as AppLocale);
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
