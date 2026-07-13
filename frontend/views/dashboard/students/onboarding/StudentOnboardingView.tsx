"use client";

import { InfoOutlined } from "@mui/icons-material";
import { Box, Stack, Typography } from "@mui/material";
import type { Control, FieldErrors, UseFormHandleSubmit, UseFormRegister } from "react-hook-form";
import { PageContainer, PageHeader, PrimaryPageAction } from "@/frontend/common/components/ui";
import {
  ParentAssignmentSection,
  type ParentOption,
} from "@/frontend/views/dashboard/students/onboarding/ParentAssignmentSection";
import { StudentInfoSection } from "@/frontend/views/dashboard/students/onboarding/StudentInfoSection";
import type { StudentOnboardingFormData } from "@/frontend/views/dashboard/students/onboarding/schemas/studentOnboardingSchema";
import {
  TeacherAssignmentSection,
  type TeacherOption,
} from "@/frontend/views/dashboard/students/onboarding/TeacherAssignmentSection";

interface StudentOnboardingViewProps {
  readonly register: UseFormRegister<StudentOnboardingFormData>;
  readonly control: Control<StudentOnboardingFormData>;
  readonly errors: FieldErrors<StudentOnboardingFormData>;
  readonly handleSubmit: UseFormHandleSubmit<StudentOnboardingFormData>;
  readonly isSubmitting: boolean;
  readonly parentOptions: readonly ParentOption[];
  readonly teacherOptions: readonly TeacherOption[];
  readonly parentLocked: boolean;
  readonly labels: {
    readonly pageTitle: string;
    readonly pageSubtitle: string;
    readonly statusBanner: string;
    readonly create: string;
    readonly processing: string;
    readonly sections: {
      readonly parentAssignment: string;
      readonly studentInfo: string;
      readonly teacherAssignment: string;
    };
    readonly fields: {
      readonly parent: string;
      readonly name: string;
      readonly dateOfBirth: string;
      readonly gender: string;
      readonly male: string;
      readonly female: string;
      readonly language: string;
      readonly status: string;
      readonly primaryTeacher: string;
    };
    readonly placeholders: {
      readonly parent: string;
      readonly name: string;
      readonly dateOfBirth: string;
      readonly language: string;
      readonly primaryTeacher: string;
    };
    readonly options: {
      readonly status: {
        readonly onTrial: string;
        readonly regular: string;
      };
    };
    readonly validation: {
      readonly parentRequired: string;
      readonly nameMinLength: string;
    };
  };
  readonly onSubmit: (data: StudentOnboardingFormData) => void | Promise<void>;
}

export function StudentOnboardingView({
  register,
  control,
  errors,
  handleSubmit,
  isSubmitting,
  parentOptions,
  teacherOptions,
  parentLocked,
  labels,
  onSubmit,
}: Readonly<StudentOnboardingViewProps>) {
  return (
    <PageContainer>
      <PageHeader
        title={labels.pageTitle}
        subtitle={labels.pageSubtitle}
        actions={
          <Stack
            direction="row"
            spacing={2}
            sx={theme => ({
              display: { xs: "none", sm: "flex" },
              alignItems: "center",
              backgroundColor: theme.palette.primaryContainer,
              color: theme.palette.onPrimaryContainer,
              px: 2,
              py: 1,
              borderRadius: 2,
            })}
          >
            <InfoOutlined />
            <Typography variant="labelMd">{labels.statusBanner}</Typography>
          </Stack>
        }
      />

      <Box
        component="form"
        onSubmit={e => {
          handleSubmit(onSubmit)(e);
        }}
        sx={{ display: "flex", flexDirection: "column", gap: 3 }}
      >
        <ParentAssignmentSection
          control={control}
          errors={errors}
          parentOptions={parentOptions}
          parentLocked={parentLocked}
          sectionTitle={labels.sections.parentAssignment}
          labels={{
            parent: labels.fields.parent,
            parentPlaceholder: labels.placeholders.parent,
            parentRequired: labels.validation.parentRequired,
          }}
        />

        <StudentInfoSection
          register={register}
          errors={errors}
          control={control}
          labels={{
            sectionTitle: labels.sections.studentInfo,
            name: labels.fields.name,
            namePlaceholder: labels.placeholders.name,
            nameMinLength: labels.validation.nameMinLength,
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
          }}
        />

        <TeacherAssignmentSection
          control={control}
          teacherOptions={teacherOptions}
          labels={{
            sectionTitle: labels.sections.teacherAssignment,
            primaryTeacher: labels.fields.primaryTeacher,
            primaryTeacherPlaceholder: labels.placeholders.primaryTeacher,
          }}
        />

        <Box
          sx={theme => ({
            p: 3,
            backgroundColor: theme.palette.surfaceContainerLow,
            borderRadius: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
          })}
        >
          <PrimaryPageAction type="submit" disabled={isSubmitting} sx={{ px: 6, py: 2, minWidth: 200 }}>
            {isSubmitting ? labels.processing : labels.create}
          </PrimaryPageAction>
        </Box>
      </Box>
    </PageContainer>
  );
}
