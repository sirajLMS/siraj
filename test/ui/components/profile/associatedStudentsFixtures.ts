import type {
  AssociatedStudentRow,
  AssociatedStudentsSectionLabels,
} from "@/frontend/common/views/dashboard/profile/parent/sections/parentProfileTypes";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";

export const associatedStudentsLocale: AppLocale = "ar";

export const associatedStudentsLabels: AssociatedStudentsSectionLabels = {
  parent: readTranslation(Translation.Profile.Parent, associatedStudentsLocale),
  base: readTranslation(Translation.Profile.Base, associatedStudentsLocale),
};

export function makeAssociatedStudentRow(overrides: Partial<AssociatedStudentRow> = {}): AssociatedStudentRow {
  return {
    id: "student-1",
    name: "Fatima Ahmad",
    studentAvatarUrl: null,
    status: "REGULAR",
    primaryTeacherId: "teacher-1",
    teacherUserId: "teacher-user-1",
    teacherName: "Layla Hassan",
    teacherAvatarUrl: null,
    hoursPerWeek: "3",
    classesRemaining: 4,
    classesTotal: 10,
    ...overrides,
  };
}
