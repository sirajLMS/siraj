"use client";

import type { Control } from "react-hook-form";
import type { TeacherAssignmentSectionSharedOptions } from "@/frontend/common/views/dashboard/students/onboarding/components/__shared__/teacherAssignmentSectionShared";
import { TeacherAssignmentSectionShared } from "@/frontend/common/views/dashboard/students/onboarding/components/__shared__/teacherAssignmentSectionShared";
import type { StudentOnboardingFormData } from "@/frontend/common/views/dashboard/students/onboarding/schemas/studentOnboardingSchema";
import { TeacherAutocompleteDesktop } from "@/frontend/desktop/components/ui/input/userSelect";

interface TeacherAssignmentSectionProps {
  readonly control: Control<StudentOnboardingFormData>;
  readonly labels: {
    readonly sectionTitle: string;
    readonly primaryTeacher: string;
    readonly primaryTeacherPlaceholder: string;
  };
}

const DESKTOP_OPTIONS: TeacherAssignmentSectionSharedOptions = {
  TeacherAutocomplete: TeacherAutocompleteDesktop,
};

export function TeacherAssignmentSection({ control, labels }: Readonly<TeacherAssignmentSectionProps>) {
  return <TeacherAssignmentSectionShared control={control} labels={labels} options={DESKTOP_OPTIONS} />;
}
