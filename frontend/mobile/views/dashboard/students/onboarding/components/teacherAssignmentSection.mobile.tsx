"use client";

import type { Control } from "react-hook-form";
import {
  TeacherAssignmentSectionShared,
  type TeacherAssignmentSectionSharedOptions,
} from "@/frontend/common/views/dashboard/students/onboarding/components/__shared__/teacherAssignmentSectionShared";
import type { StudentOnboardingFormData } from "@/frontend/common/views/dashboard/students/onboarding/schemas/studentOnboardingSchema";
import { TeacherAutocompleteMobile } from "@/frontend/mobile/components/ui/input/userSelect";

interface TeacherAssignmentSectionProps {
  readonly control: Control<StudentOnboardingFormData>;
  readonly labels: {
    readonly sectionTitle: string;
    readonly primaryTeacher: string;
    readonly primaryTeacherPlaceholder: string;
  };
}

const MOBILE_OPTIONS: TeacherAssignmentSectionSharedOptions = {
  TeacherAutocomplete: TeacherAutocompleteMobile,
};

export function TeacherAssignmentSection({ control, labels }: Readonly<TeacherAssignmentSectionProps>) {
  return <TeacherAssignmentSectionShared control={control} labels={labels} options={MOBILE_OPTIONS} />;
}
