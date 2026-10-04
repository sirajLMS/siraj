import { isValid, parse } from "date-fns";
import { AppLanguage, Gender } from "@/frontend/common/graphql/generated/gql/graphql";

export const DATE_FORMAT = "yyyy-MM-dd";

export function parseDateValue(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parsed = parse(dateStr, DATE_FORMAT, new Date());
  return isValid(parsed) ? parsed : null;
}

export function toAppLanguage(value: string): AppLanguage | null {
  if (value === "ar") return AppLanguage.Ar;
  if (value === "en") return AppLanguage.En;
  return null;
}

export function toFormGender(value: string): Gender | null {
  if (value === "MALE") return Gender.Male;
  if (value === "FEMALE") return Gender.Female;
  return null;
}

// Read-only section: gender selection handlers are inert so the form value stays unchanged.
export const noopGenderSelection = () => undefined;
