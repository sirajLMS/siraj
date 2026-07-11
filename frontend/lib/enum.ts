import {
  AccountStatus,
  AppLanguage,
  ClassExecutionState,
  ClassOutcome,
  ClassType,
  CurrencyCode,
  DayOfWeek,
  Gender,
  ParentStatus,
  PaymentDirection,
  PaymentMethodType,
  StudentStatus,
} from "@/frontend/graphql/generated/gql/graphql-types";

type StringEnum = Record<string, string>;

function parseEnumValue<T extends StringEnum>(
  enumObject: T,
  value: string | null | undefined,
  fallback: T[keyof T] | null = null,
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

export const parseCurrencyCode = (value: string | null | undefined): CurrencyCode | null =>
  parseEnumValue(CurrencyCode, value);

export const parseParentStatus = (
  value: string | null | undefined,
  fallback: ParentStatus = ParentStatus.Regular,
): ParentStatus => parseEnumValue(ParentStatus, value, fallback) ?? fallback;

export const parseStudentStatus = (
  value: string | null | undefined,
  fallback: StudentStatus = StudentStatus.Regular,
): StudentStatus => parseEnumValue(StudentStatus, value, fallback) ?? fallback;

export const parseGender = (value: string | null | undefined): Gender | null =>
  parseEnumValue(Gender, value);

export const parseAccountStatus = (
  value: string | null | undefined,
  fallback: AccountStatus = AccountStatus.Activated,
): AccountStatus => parseEnumValue(AccountStatus, value, fallback) ?? fallback;

export const parseAppLanguage = (value: string | null | undefined): AppLanguage | null =>
  parseEnumValue(AppLanguage, value);

export const parseClassType = (
  value: string | null | undefined,
  fallback: ClassType = ClassType.Regular,
): ClassType => parseEnumValue(ClassType, value, fallback) ?? fallback;

export const parseClassOutcome = (value: string | null | undefined): ClassOutcome | null =>
  parseEnumValue(ClassOutcome, value);

export const parseClassExecutionState = (
  value: string | null | undefined,
  fallback: ClassExecutionState = ClassExecutionState.NotActivated,
): ClassExecutionState => parseEnumValue(ClassExecutionState, value, fallback) ?? fallback;

export const parsePaymentMethodType = (value: string | null | undefined): PaymentMethodType | null =>
  parseEnumValue(PaymentMethodType, value);

export const parsePaymentDirection = (
  value: string | null | undefined,
  fallback: PaymentDirection = PaymentDirection.Both,
): PaymentDirection => parseEnumValue(PaymentDirection, value, fallback) ?? fallback;

export const parseDayOfWeek = (value: string | null | undefined): DayOfWeek | null =>
  parseEnumValue(DayOfWeek, value);
