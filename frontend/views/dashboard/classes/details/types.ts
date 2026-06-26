export type ClassDetailsViewMode = "teacher" | "parent";

export interface EntityLinkTargets {
  readonly studentId: string;
  readonly teacherId: string;
}

export function formatClassDetailDate(value: string | null | undefined, locale: string): string {
  if (!value) {
    return "";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  const localeTag = locale === "ar" ? "ar-EG" : "en-US";
  return parsed.toLocaleDateString(localeTag, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
