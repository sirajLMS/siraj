import { type ComponentType, useState } from "react";
import { type Control, Controller } from "react-hook-form";
import { SectionPanel } from "@/frontend/common/components/ui/container/SectionPanel";
import {
  type PersonOption,
  resolvePersonOption,
  type TeacherAutocompleteProps,
} from "@/frontend/common/components/ui/input/userSelect";
import type { StudentOnboardingFormData } from "@/frontend/common/views/dashboard/students/onboarding/schemas/studentOnboardingSchema";

export interface TeacherAssignmentSectionSharedOptions {
  readonly TeacherAutocomplete: ComponentType<TeacherAutocompleteProps>;
}

interface TeacherAssignmentSectionSharedProps {
  readonly control: Control<StudentOnboardingFormData>;
  readonly labels: {
    readonly sectionTitle: string;
    readonly primaryTeacher: string;
    readonly primaryTeacherPlaceholder: string;
  };
  readonly options: TeacherAssignmentSectionSharedOptions;
}

export function TeacherAssignmentSectionShared({
  control,
  labels,
  options,
}: Readonly<TeacherAssignmentSectionSharedProps>) {
  const [selectedTeacher, setSelectedTeacher] = useState<PersonOption | null>(null);
  const { TeacherAutocomplete } = options;

  return (
    <SectionPanel title={labels.sectionTitle}>
      <Controller
        control={control}
        name="primaryTeacherId"
        render={({ field }) => {
          const value = selectedTeacher ?? resolvePersonOption(field.value, [], selectedTeacher);

          return (
            <TeacherAutocomplete
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
