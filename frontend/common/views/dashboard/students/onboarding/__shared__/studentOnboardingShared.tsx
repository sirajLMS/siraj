"use client";

import type { SxProps, Theme } from "@mui/material";
import { Box } from "@mui/material";
import type { ComponentType } from "react";
import { UserEntityFieldsSection } from "@/frontend/common/components/onboarding/sections";
import { StudentExtensionSection } from "@/frontend/common/views/dashboard/students/onboarding/components/StudentExtensionSection";
import type { StudentOnboardingViewModel } from "@/frontend/common/views/dashboard/students/onboarding/useStudentOnboardingViewModel";
import { Translation, useAppTranslation } from "@/shared/locale";

export interface StudentOnboardingSharedOptions {
  readonly SectionPanel: ComponentType<{ readonly title: string; readonly children: React.ReactNode }>;
  readonly ParentAssignmentSection: ComponentType<StudentParentAssignmentSlotProps>;
  readonly TeacherAssignmentSection: ComponentType<StudentTeacherAssignmentSlotProps>;
  readonly PrimaryPageAction: ComponentType<StudentPrimaryActionSlotProps>;
  readonly buttonSx: SxProps<Theme>;
  readonly buttonFullWidth?: boolean;
  readonly footerPadding: number;
}

export interface StudentParentAssignmentSlotProps {
  readonly control: StudentOnboardingViewModel["control"];
  readonly errors: StudentOnboardingViewModel["errors"];
  readonly parentLocked: boolean;
  readonly sectionTitle: string;
  readonly labels: {
    readonly parent: string;
    readonly parentPlaceholder: string;
    readonly parentRequired: string;
  };
}

export interface StudentTeacherAssignmentSlotProps {
  readonly control: StudentOnboardingViewModel["control"];
  readonly labels: {
    readonly sectionTitle: string;
    readonly primaryTeacher: string;
    readonly primaryTeacherPlaceholder: string;
  };
}

export interface StudentPrimaryActionSlotProps {
  readonly type?: "submit";
  readonly disabled?: boolean;
  readonly fullWidth?: boolean;
  readonly sx?: SxProps<Theme>;
  readonly children: React.ReactNode;
}

export function StudentOnboardingFormBodyShared({
  register,
  control,
  errors,
  handleSubmit,
  isSubmitting,
  parentLocked,
  labels,
  onSubmit,
  onUploadAvatar,
  options,
}: Readonly<
  Pick<
    StudentOnboardingViewModel,
    | "register"
    | "control"
    | "errors"
    | "handleSubmit"
    | "isSubmitting"
    | "parentLocked"
    | "labels"
    | "onSubmit"
    | "onUploadAvatar"
  > & {
    readonly options: StudentOnboardingSharedOptions;
  }
>) {
  const userEntityLabels = useAppTranslation(Translation.Onboarding.UserEntity);

  return (
    <Box
      component="form"
      onSubmit={e => {
        void handleSubmit(onSubmit)(e);
      }}
      sx={{ display: "flex", flexDirection: "column", gap: 3 }}
    >
      <options.SectionPanel title={userEntityLabels.sectionTitle}>
        <UserEntityFieldsSection
          control={control}
          errors={errors}
          labels={userEntityLabels}
          onUploadAvatar={onUploadAvatar}
        />
      </options.SectionPanel>

      <options.ParentAssignmentSection
        control={control}
        errors={errors}
        parentLocked={parentLocked}
        sectionTitle={labels.sections.parentAssignment}
        labels={{
          parent: labels.fields.parent,
          parentPlaceholder: labels.placeholders.parent,
          parentRequired: labels.validation.parentRequired,
        }}
      />

      <options.SectionPanel title={labels.sections.studentInfo}>
        <StudentExtensionSection
          register={register}
          errors={errors}
          control={control}
          labels={{
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
      </options.SectionPanel>

      <options.TeacherAssignmentSection
        control={control}
        labels={{
          sectionTitle: labels.sections.teacherAssignment,
          primaryTeacher: labels.fields.primaryTeacher,
          primaryTeacherPlaceholder: labels.placeholders.primaryTeacher,
        }}
      />

      <Box
        sx={theme => ({
          p: options.footerPadding,
          backgroundColor: theme.palette.surfaceContainerLow,
          borderRadius: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
        })}
      >
        <options.PrimaryPageAction
          type="submit"
          disabled={isSubmitting}
          fullWidth={options.buttonFullWidth}
          sx={options.buttonSx}
        >
          {isSubmitting ? labels.processing : labels.create}
        </options.PrimaryPageAction>
      </Box>
    </Box>
  );
}
