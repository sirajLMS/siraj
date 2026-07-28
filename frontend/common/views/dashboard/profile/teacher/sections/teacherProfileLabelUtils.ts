import type { ProfileSharedBaseLabels } from "@/frontend/common/views/dashboard/profile/shared/types/profileSharedSection.types";
import type { TeacherProfileViewLabels } from "@/frontend/common/views/dashboard/profile/teacher/sections/teacherProfileTypes";

export function toProfileSharedBaseLabels(base: TeacherProfileViewLabels["base"]): ProfileSharedBaseLabels {
  return {
    notSet: base.notSet,
    fieldAccess: base.fieldAccess,
  };
}

export function toTeacherSectionLabels(labels: TeacherProfileViewLabels) {
  return {
    teacher: labels.teacher,
    baseLabels: toProfileSharedBaseLabels(labels.base),
  };
}
