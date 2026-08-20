import { AppLanguage, CurrencyCode, Gender } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { parseCurrencyCode } from "@/frontend/common/lib/currency";
import type { StudentPortalProfileEditDraft } from "@/frontend/common/stores/studentPortalProfileStore";
import type { StudentProfileRow } from "@/frontend/common/views/dashboard/student/profile/types/studentProfileTypes";

const VALID_CURRENCY_CODES = new Set(Object.values(CurrencyCode) as readonly string[]);
const VALID_GENDERS = new Set(Object.values(Gender) as readonly string[]);
const VALID_LANGUAGES = new Set(Object.values(AppLanguage) as readonly string[]);

export function toDateInputValue(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function isCurrencyCode(value: string): value is CurrencyCode {
  return VALID_CURRENCY_CODES.has(value);
}

export function isGender(value: string | null | undefined): value is Gender {
  return value !== null && value !== undefined && VALID_GENDERS.has(value);
}

export function isAppLanguage(value: string | null | undefined): value is AppLanguage {
  return value !== null && value !== undefined && VALID_LANGUAGES.has(value);
}

export function toCurrencyCode(value: string | null): CurrencyCode | "" {
  if (value && isCurrencyCode(value)) return value;
  return "";
}

export function toGender(value: string | null): Gender | "" {
  if (value && isGender(value)) return value;
  return "";
}

export function toAppLanguage(value: string | null): AppLanguage | "" {
  if (value && isAppLanguage(value)) return value;
  return "";
}

export function profileToDraft(profile: StudentProfileRow): StudentPortalProfileEditDraft {
  return {
    phone: profile.phone ?? "",
    timezone: profile.timezone ?? "",
    displayCurrency: parseCurrencyCode(profile.displayCurrency) ?? "",
    dateOfBirth: toDateInputValue(profile.dateOfBirth),
    gender: isGender(profile.gender) ? profile.gender : "",
    language: isAppLanguage(profile.language) ? profile.language : "",
    timezoneOverride: profile.timezoneOverride ?? "",
    parentPhone: profile.parentPhone ?? "",
    avatarUrl: profile.avatarUrl ?? null,
  };
}

export function buildStudentProfileEditVariables(
  studentId: string | null | undefined,
  draft: StudentPortalProfileEditDraft
) {
  return {
    input: {
      studentId: studentId ?? null,
      phone: draft.phone.trim() || null,
      timezone: draft.timezone.trim() || null,
      displayCurrency: draft.displayCurrency || null,
      dateOfBirth: draft.dateOfBirth ? new Date(draft.dateOfBirth).toISOString() : null,
      gender: draft.gender || null,
      language: draft.language || null,
      timezoneOverride: draft.timezoneOverride?.trim() ?? null,
      parentPhone: draft.parentPhone.trim() || null,
      avatarUrl: draft.avatarUrl,
    },
  };
}
