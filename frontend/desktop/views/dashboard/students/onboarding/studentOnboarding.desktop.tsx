"use client";

import { InfoOutlined } from "@mui/icons-material";
import { Box, Stack, Typography } from "@mui/material";
import type { StudentOnboardingViewModel } from "@/frontend/common/views/dashboard/students/onboarding/useStudentOnboardingViewModel";
import { DesktopFormSuccessSnackbar, DesktopPrimaryPageAction } from "@/frontend/desktop/components/ui";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";
import { ParentAssignmentSection } from "@/frontend/desktop/views/dashboard/students/onboarding/components/parentAssignmentSection.desktop";
import { StudentInfoSection } from "@/frontend/desktop/views/dashboard/students/onboarding/components/studentInfoSection.desktop";
import { TeacherAssignmentSection } from "@/frontend/desktop/views/dashboard/students/onboarding/components/teacherAssignmentSection.desktop";

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
          onUploadAvatar={onUploadAvatar}
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
            avatar: labels.fields.avatar,
          }}
        />

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
