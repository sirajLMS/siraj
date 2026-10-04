import type { ClassInstanceDetailsCardProps } from "@/frontend/common/views/dashboard/classes/details/teacher/ClassInstanceDetailsCard.types";

export function resolveRateSourceLabel(
  isRateOverridden: boolean,
  rateSource: string | null,
  labels: ClassInstanceDetailsCardProps["labels"]
): string {
  if (isRateOverridden) {
    return labels.rateSourceOverride;
  }
  if (rateSource === "RECURRING") {
    return labels.rateSourceRecurring;
  }
  if (rateSource === "SUBJECT") {
    return labels.rateSourceSubject;
  }
  return labels.rateSourceTeacher;
}
