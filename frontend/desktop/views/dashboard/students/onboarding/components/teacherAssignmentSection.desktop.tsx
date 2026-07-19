"use client";

import { useState } from "react";
import type { Control } from "react-hook-form";
import { Controller } from "react-hook-form";
import { SectionPanel } from "@/frontend/common/components/ui/container/SectionPanel";
import type { PersonOption } from "@/frontend/common/components/ui/input/userSelect/types";
import { resolvePersonOption } from "@/frontend/common/components/ui/input/userSelect/userSelect.utils";
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

export function TeacherAssignmentSection({ control, labels }: Readonly<TeacherAssignmentSectionProps>) {
  const [selectedTeacher, setSelectedTeacher] = useState<PersonOption | null>(null);

  return (
    <SectionPanel title={labels.sectionTitle}>
      <Controller
        control={control}
        name="primaryTeacherId"
        render={({ field }) => {
          const value = selectedTeacher ?? resolvePersonOption(field.value, [], selectedTeacher);

          return (
            <TeacherAutocompleteDesktop
              value={value}
              onChange={(next: PersonOption | null) => {
                setSelectedTeacher(next);
                field.onChange(next?.id ?? "");
              }}
              label={labels.primaryTeacher}
              placeholder={labels.primaryTeacherPlaceholder}
            />
          );
        }}
      />
    </SectionPanel>
  );
}
