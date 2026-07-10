import {
  AccountStatus,
  AppLanguage,
  ClassExecutionState,
  ClassOutcome,
  ClassType,
  CountryCode,
  CurrencyCode,
  Gender,
  InvoiceStatus,
  InvoiceType,
  OverrideState,
  ParentStatus,
  StudentStatus,
} from "@/backend/enum";
import { BookingStatus } from "@/backend/enum/parents/parent.enum";
import { IanaTimezone } from "@/backend/enum/shared/timezone.enum";

type StringEnum = Record<string, string>;

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

export const parseCountryCode = (value: string | null | undefined): CountryCode | null => {
  if (!value) return null;

  const upperValue = value.toUpperCase();
  return parseEnumValue(CountryCode, upperValue);
};

export const parseGender = (value: string | null | undefined): Gender | null =>
  parseEnumValue(Gender, value);

export const parseCurrencyCode = (value: string | null | undefined): CurrencyCode | null =>
  parseEnumValue(CurrencyCode, value);

export const parseIanaTimezoneOrNull = (value: string | null | undefined): IanaTimezone | null =>
  parseEnumValue(IanaTimezone, value);

export const parseIanaTimezone = (
  value: string | null | undefined,
  fallback: IanaTimezone = IanaTimezone.UTC
): IanaTimezone => parseEnumValue(IanaTimezone, value, fallback) ?? fallback;

export const parseAccountStatus = (
  value: string | null | undefined,
  fallback: AccountStatus = AccountStatus.ACTIVATED
): AccountStatus => parseEnumValue(AccountStatus, value, fallback) ?? fallback;

export const parseClassTypeOrNull = (value: string | null | undefined): ClassType | null =>
  parseEnumValue(ClassType, value);

export const parseClassType = (
  value: string | null | undefined,
  fallback: ClassType = ClassType.REGULAR
): ClassType => parseEnumValue(ClassType, value, fallback) ?? fallback;

export const parseClassOutcome = (value: string | null | undefined): ClassOutcome | null =>
  parseEnumValue(ClassOutcome, value);

export const parseClassExecutionState = (
  value: string | null | undefined,
  fallback: ClassExecutionState = ClassExecutionState.NOT_ACTIVATED
): ClassExecutionState => parseEnumValue(ClassExecutionState, value, fallback) ?? fallback;

export const parseInvoiceStatus = (
  value: string | null | undefined,
  fallback: InvoiceStatus = InvoiceStatus.UNPAID
): InvoiceStatus => parseEnumValue(InvoiceStatus, value, fallback) ?? fallback;

export const parseInvoiceType = (
  value: string | null | undefined,
  fallback: InvoiceType = InvoiceType.MONTHLY
): InvoiceType => parseEnumValue(InvoiceType, value, fallback) ?? fallback;

export const parseParentStatus = (value: string | null | undefined): ParentStatus | null =>
  parseEnumValue(ParentStatus, value);

export const parseOverrideState = (value: string | null | undefined): OverrideState | null =>
  parseEnumValue(OverrideState, value);

export const parseAppLanguage = (value: string | null | undefined): AppLanguage | null =>
  parseEnumValue(AppLanguage, value);

export const parseStudentStatus = (value: string | null | undefined): StudentStatus | null =>
  parseEnumValue(StudentStatus, value);

export const parseBookingStatus = (
  value: string | null | undefined,
  fallback: BookingStatus = BookingStatus.CONFIRMED
): BookingStatus => parseEnumValue(BookingStatus, value, fallback) ?? fallback;
