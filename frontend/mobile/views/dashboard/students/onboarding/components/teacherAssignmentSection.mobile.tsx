"use client";

import type { Control } from "react-hook-form";
import { Controller } from "react-hook-form";
import { useState } from "react";
import type { PersonOption } from "@/frontend/common/components/ui/input/userSelect/types";
import { resolvePersonOption } from "@/frontend/common/components/ui/input/userSelect/userSelect.utils";
import { SectionPanel } from "@/frontend/common/components/ui/container/SectionPanel";
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
            <TeacherAutocompleteMobile
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
