export type ClassDetailsViewMode = "teacher" | "parent";

export interface EntityLinkTargets {
  readonly studentId: string;
  readonly teacherId: string;
}

import { getLatnLocaleTag } from "@/shared/lib/locale-tag";

export function formatClassDetailDate(value: string | null | undefined, locale: string): string {
  if (!value) {
    return "";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString(getLatnLocaleTag(locale), {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
