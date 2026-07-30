"use client";

import { Box, Stack, Typography } from "@mui/material";
import { UserEntityFieldsSection } from "@/frontend/common/components/onboarding/sections";
import { StudentExtensionSection } from "@/frontend/common/views/dashboard/students/onboarding/components/StudentExtensionSection";
import type { StudentOnboardingViewModel } from "@/frontend/common/views/dashboard/students/onboarding/useStudentOnboardingViewModel";
import { DesktopFormSuccessSnackbar, DesktopPrimaryPageAction } from "@/frontend/desktop/components/ui";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui/container";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";
import { ParentAssignmentSection } from "@/frontend/desktop/views/dashboard/students/onboarding/components/parentAssignmentSection.desktop";
import { TeacherAssignmentSection } from "@/frontend/desktop/views/dashboard/students/onboarding/components/teacherAssignmentSection.desktop";
import { Translation, useAppTranslation } from "@/shared/locale";

export function StudentOnboardingDesktopView({
  register,
  onUploadAvatar,
  control,
  errors,
  handleSubmit,
  isSubmitting,
  parentLocked,
  labels,
  onSubmit,
  successOpen,
  onCloseSuccess,
  successMessage,
}: Readonly<StudentOnboardingViewModel>) {
  const userEntityLabels = useAppTranslation(Translation.Onboarding.UserEntity);

  return (
    <DesktopPageContainer>
      <DesktopPageHeader
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
        <DesktopSectionPanel title={userEntityLabels.sectionTitle}>
          <UserEntityFieldsSection
            control={control}
            errors={errors}
            labels={userEntityLabels}
            onUploadAvatar={onUploadAvatar}
          />
        </DesktopSectionPanel>

        <ParentAssignmentSection
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

        <DesktopSectionPanel title={labels.sections.studentInfo}>
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
        </DesktopSectionPanel>

        <TeacherAssignmentSection
          control={control}
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
          <DesktopPrimaryPageAction type="submit" disabled={isSubmitting} sx={{ px: 6, py: 2, minWidth: 200 }}>
            {isSubmitting ? labels.processing : labels.create}
          </DesktopPrimaryPageAction>
        </Box>
      </Box>

      <DesktopFormSuccessSnackbar open={successOpen} message={successMessage} onClose={onCloseSuccess} />
    </DesktopPageContainer>
  );
}
