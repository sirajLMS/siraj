import {
  AccountStatus,
  AppLanguage,
  ClassExecutionState,
  ClassOutcome,
  ClassType,
  CountryCode,
  CurrencyCode,
  Gender,
  GroupClassAttendanceStatus,
  InvoiceStatus,
  InvoiceType,
  OverrideState,
  ParentStatus,
  StudentStatus,
} from "@/backend/enum";
import { BookingStatus } from "@/backend/enum/parents/parent.enum";
import { IanaTimezone } from "@/backend/enum/shared/timezone.enum";

/**
 * Type for string-based enum objects.
 */
type StringEnum = Record<string, string>;

/**
 * Parses a string value against a string enum object.
 *
 * @typeParam T - The enum object type
 * @param enumObject - The enum object to validate against
 * @param value - The string value to parse (can be null or undefined)
 * @param fallback - Optional fallback value to return if value is invalid
 * @returns The validated enum value or fallback/null if invalid
 */
function parseEnumValue<T extends StringEnum>(
  enumObject: T,
  value: string | null | undefined,
  fallback: T[keyof T] | null = null
): T[keyof T] | null {
  if (value === null || value === undefined) {
    return fallback;
  }

  const enumValues = Object.values(enumObject) as T[keyof T][];
  if (enumValues.includes(value as T[keyof T])) {
    return value as T[keyof T];
  }

  return fallback;
}

/**
 * Parses a string value into a CountryCode enum.
 *
 * @param value - The string value to parse (case-insensitive, can be null/undefined)
 * @returns The parsed CountryCode enum value or null if invalid/missing
 */
export const parseCountryCode = (value: string | null | undefined): CountryCode | null => {
  if (!value) return null;

  const upperValue = value.toUpperCase();
  return parseEnumValue(CountryCode, upperValue);
};

/**
 * Parses a string value into a Gender enum.
 *
 * @param value - The string value to parse (can be null/undefined)
 * @returns The parsed Gender enum value or null if invalid/missing
 */
export const parseGender = (value: string | null | undefined): Gender | null => parseEnumValue(Gender, value);

/**
 * Parses a string value into a CurrencyCode enum.
 *
 * @param value - The string value to parse (can be null/undefined)
 * @returns The parsed CurrencyCode enum value or null if invalid/missing
 */
export const parseCurrencyCode = (value: string | null | undefined): CurrencyCode | null =>
  parseEnumValue(CurrencyCode, value);

/**
 * Parses a string value into an IanaTimezone enum, returning null if invalid.
 *
 * @param value - The string value to parse (can be null/undefined)
 * @returns The parsed IanaTimezone enum value or null if invalid/missing
 */
export const parseIanaTimezoneOrNull = (value: string | null | undefined): IanaTimezone | null =>
  parseEnumValue(IanaTimezone, value);

/**
 * Parses a string value into an IanaTimezone enum with a fallback.
 *
 * @param value - The string value to parse (can be null/undefined)
 * @param fallback - The fallback IanaTimezone to use if value is invalid/missing (defaults to UTC)
 * @returns The parsed IanaTimezone enum value or the fallback
 */
export const parseIanaTimezone = (
  value: string | null | undefined,
  fallback: IanaTimezone = IanaTimezone.UTC
): IanaTimezone => parseEnumValue(IanaTimezone, value, fallback) ?? fallback;

/**
 * Parses a string value into an AccountStatus enum with a fallback.
 *
 * @param value - The string value to parse (can be null/undefined)
 * @param fallback - The fallback AccountStatus to use if value is invalid/missing (defaults to ACTIVATED)
 * @returns The parsed AccountStatus enum value or the fallback
 */
export const parseAccountStatus = (
  value: string | null | undefined,
  fallback: AccountStatus = AccountStatus.ACTIVATED
): AccountStatus => parseEnumValue(AccountStatus, value, fallback) ?? fallback;

/**
 * Parses a string value into a ClassType enum, returning null if invalid.
 *
 * @param value - The string value to parse (can be null/undefined)
 * @returns The parsed ClassType enum value or null if invalid/missing
 */
export const parseClassTypeOrNull = (value: string | null | undefined): ClassType | null =>
  parseEnumValue(ClassType, value);

/**
 * Parses a string value into a ClassType enum with a fallback.
 *
 * @param value - The string value to parse (can be null/undefined)
 * @param fallback - The fallback ClassType to use if value is invalid/missing (defaults to REGULAR)
 * @returns The parsed ClassType enum value or the fallback
 */
export const parseClassType = (value: string | null | undefined, fallback: ClassType = ClassType.REGULAR): ClassType =>
  parseEnumValue(ClassType, value, fallback) ?? fallback;

/**
 * Parses a string value into a ClassOutcome enum, returning null if invalid.
 *
 * @param value - The string value to parse (can be null/undefined)
 * @returns The parsed ClassOutcome enum value or null if invalid/missing
 */
export const parseClassOutcome = (value: string | null | undefined): ClassOutcome | null =>
  parseEnumValue(ClassOutcome, value);

/**
 * Parses a string value into a ClassExecutionState enum with a fallback.
 *
 * @param value - The string value to parse (can be null/undefined)
 * @param fallback - The fallback ClassExecutionState to use if value is invalid/missing (defaults to NOT_ACTIVATED)
 * @returns The parsed ClassExecutionState enum value or the fallback
 */
export const parseClassExecutionState = (
  value: string | null | undefined,
  fallback: ClassExecutionState = ClassExecutionState.NOT_ACTIVATED
): ClassExecutionState => parseEnumValue(ClassExecutionState, value, fallback) ?? fallback;

/**
 * Parses a string value into an InvoiceStatus enum with a fallback.
 *
 * @param value - The string value to parse (can be null/undefined)
 * @param fallback - The fallback InvoiceStatus to use if value is invalid/missing (defaults to UNPAID)
 * @returns The parsed InvoiceStatus enum value or the fallback
 */
export const parseInvoiceStatus = (
  value: string | null | undefined,
  fallback: InvoiceStatus = InvoiceStatus.UNPAID
): InvoiceStatus => parseEnumValue(InvoiceStatus, value, fallback) ?? fallback;

/**
 * Parses a string value into an InvoiceType enum with a fallback.
 *
 * @param value - The string value to parse (can be null/undefined)
 * @param fallback - The fallback InvoiceType to use if value is invalid/missing (defaults to MONTHLY)
 * @returns The parsed InvoiceType enum value or the fallback
 */
export const parseInvoiceType = (
  value: string | null | undefined,
  fallback: InvoiceType = InvoiceType.MONTHLY
): InvoiceType => parseEnumValue(InvoiceType, value, fallback) ?? fallback;

/**
 * Parses a string value into a ParentStatus enum, returning null if invalid.
 *
 * @param value - The string value to parse (can be null/undefined)
 * @returns The parsed ParentStatus enum value or null if invalid/missing
 */
export const parseParentStatus = (value: string | null | undefined): ParentStatus | null =>
  parseEnumValue(ParentStatus, value);

/**
 * Parses a string value into an OverrideState enum, returning null if invalid.
 *
 * @param value - The string value to parse (can be null/undefined)
 * @returns The parsed OverrideState enum value or null if invalid/missing
 */
export const parseOverrideState = (value: string | null | undefined): OverrideState | null =>
  parseEnumValue(OverrideState, value);

/**
 * Parses a string value into an AppLanguage enum, returning null if invalid.
 *
 * @param value - The string value to parse (can be null/undefined)
 * @returns The parsed AppLanguage enum value or null if invalid/missing
 */
export const parseAppLanguage = (value: string | null | undefined): AppLanguage | null =>
  parseEnumValue(AppLanguage, value);

/**
 * Parses a string value into a StudentStatus enum, returning null if invalid.
 *
 * @param value - The string value to parse (can be null/undefined)
 * @returns The parsed StudentStatus enum value or null if invalid/missing
 */
export const parseStudentStatus = (value: string | null | undefined): StudentStatus | null =>
  parseEnumValue(StudentStatus, value);

/**
 * Parses a string value into a BookingStatus enum with a fallback.
 *
 * @param value - The string value to parse (can be null/undefined)
 * @param fallback - The fallback BookingStatus to use if value is invalid/missing (defaults to CONFIRMED)
 * @returns The parsed BookingStatus enum value or the fallback
 */
export const parseBookingStatus = (
  value: string | null | undefined,
  fallback: BookingStatus = BookingStatus.CONFIRMED
): BookingStatus => parseEnumValue(BookingStatus, value, fallback) ?? fallback;

/**
 * Parses a string value into a GroupClassAttendanceStatus enum with a fallback.
 *
 * @param value - The string value to parse (can be null/undefined)
 * @param fallback - The fallback GroupClassAttendanceStatus to use if value is invalid/missing (defaults to PENDING)
 * @returns The parsed GroupClassAttendanceStatus enum value or the fallback
 */
export const parseGroupClassAttendanceStatus = (
  value: string | null | undefined,
  fallback: GroupClassAttendanceStatus = GroupClassAttendanceStatus.PENDING
): GroupClassAttendanceStatus => parseEnumValue(GroupClassAttendanceStatus, value, fallback) ?? fallback;
