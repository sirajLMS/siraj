import type {
  ClassInstanceQuery_classInstance_student,
  ClassInstanceQuery_classInstance_teacher,
} from "@/frontend/common/graphql/generated/gql/graphql";
import type { AdminViewLabels } from "@/shared/locale";

export type ClassInfoCardLabels = AdminViewLabels["classInfo"];
export type ClassInfoRateLabels = AdminViewLabels["rate"];
export type ClassInfoStudent = NonNullable<ClassInstanceQuery_classInstance_student>;
export type ClassInfoTeacher = NonNullable<ClassInstanceQuery_classInstance_teacher>;

export function getRateSourceLabel(
  isRateOverridden: boolean,
  rateSource: string | null,
  rateLabels: ClassInfoRateLabels
): string {
  if (isRateOverridden) {
    return rateLabels.rateSourceOverride;
  }
  switch (rateSource) {
    case "RECURRING":
      return rateLabels.rateSourceRecurring;
    case "SUBJECT":
      return rateLabels.rateSourceSubject;
    case "TEACHER":
      return rateLabels.rateSourceTeacher;
    default:
      return rateLabels.rateSourceTeacher;
  }
}
