import type { StudentOnboardingViewModel } from "@/frontend/common/views/dashboard/students/onboarding/useStudentOnboardingViewModel";

type StudentOnboardingLabels = StudentOnboardingViewModel["labels"];

export function buildParentAssignmentSlotLabels(labels: StudentOnboardingLabels) {
  return {
    parent: labels.fields.parent,
    parentPlaceholder: labels.placeholders.parent,
    parentRequired: labels.validation.parentRequired,
  };
}

export function buildStudentExtensionSectionLabels(labels: StudentOnboardingLabels) {
  return {
    dateOfBirth: labels.fields.dateOfBirth,
    dateOfBirthPlaceholder: labels.placeholders.dateOfBirth,
    gender: labels.fields.gender,
    male: labels.fields.male,
    female: labels.fields.female,
    language: labels.fields.language,
    languagePlaceholder: labels.placeholders.language,
    status: labels.fields.status,
    statusOnTrial: labels.options.status.onTrial,
    statusRegular: labels.options.status.regular,
  };
}

export function buildTeacherAssignmentSlotLabels(labels: StudentOnboardingLabels) {
  return {
    sectionTitle: labels.sections.teacherAssignment,
    primaryTeacher: labels.fields.primaryTeacher,
    primaryTeacherPlaceholder: labels.placeholders.primaryTeacher,
  };
}
