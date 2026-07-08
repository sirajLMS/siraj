"use client";

import { SchoolOutlined } from "@mui/icons-material";
import { Autocomplete, InputAdornment, TextField } from "@mui/material";
import type { Control } from "react-hook-form";
import { Controller } from "react-hook-form";
import { SectionPanel } from "@/frontend/components/ui/container/SectionPanel";
import type { StudentOnboardingFormData } from "./schemas/studentOnboardingSchema";

export interface TeacherOption {
  readonly id: string;
  readonly name: string;
}

interface TeacherAssignmentSectionProps {
  readonly control: Control<StudentOnboardingFormData>;
  readonly teacherOptions: readonly TeacherOption[];
  readonly labels: {
    readonly sectionTitle: string;
    readonly primaryTeacher: string;
    readonly primaryTeacherPlaceholder: string;
  };
}

export function TeacherAssignmentSection({ control, teacherOptions, labels }: Readonly<TeacherAssignmentSectionProps>) {
  return (
    <SectionPanel title={labels.sectionTitle}>
      <Controller
        control={control}
        name="primaryTeacherId"
        render={({ field }) => {
          const selectedTeacher = teacherOptions.find(option => option.id === field.value) ?? null;

          return (
            <Autocomplete
              options={teacherOptions}
              value={selectedTeacher}
              getOptionLabel={option => option.name}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              onChange={(_event, value) => {
                field.onChange(value?.id ?? "");
              }}
              renderInput={params => (
                <TextField
                  {...params}
                  label={labels.primaryTeacher}
                  placeholder={labels.primaryTeacherPlaceholder}
                  slotProps={{
                    input: {
                      ...params.slotProps.input,
                      startAdornment: (
                        <>
                          <InputAdornment position="start">
                            <SchoolOutlined />
                          </InputAdornment>
                          {params.slotProps.input?.startAdornment}
                        </>
                      ),
                    },
                    inputLabel: params.slotProps.inputLabel,
                    htmlInput: {
                      ...params.slotProps.htmlInput,
                      autoComplete: "off",
                    },
                  }}
                />
              )}
            />
          );
        }}
      />
    </SectionPanel>
  );
}
