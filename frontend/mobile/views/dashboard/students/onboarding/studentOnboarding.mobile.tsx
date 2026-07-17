"use client";

import { InfoOutlined } from "@mui/icons-material";
import { Box, Stack, Typography } from "@mui/material";
import { FormSuccessSnackbar, PrimaryPageAction } from "@/frontend/common/components/ui";
import type { StudentOnboardingViewModel } from "@/frontend/common/views/dashboard/students/onboarding/useStudentOnboardingViewModel";
import { MobileContentStack, MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";
import { ParentAssignmentSection } from "@/frontend/mobile/views/dashboard/students/onboarding/components/parentAssignmentSection.mobile";
import { StudentInfoSection } from "@/frontend/mobile/views/dashboard/students/onboarding/components/studentInfoSection.mobile";
import { TeacherAssignmentSection } from "@/frontend/mobile/views/dashboard/students/onboarding/components/teacherAssignmentSection.mobile";

export function StudentOnboardingMobileView({
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
  successOpen,
  onCloseSuccess,
  successMessage,
}: Readonly<StudentOnboardingViewModel>) {
  return (
    <MobilePageContainer>
      <MobilePageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} edgeToEdge={false} />

      <MobileContentStack gap={3} paddingBottom={4}>
        <Stack
          direction="row"
          spacing={1.5}
          sx={theme => ({
            alignItems: "center",
            backgroundColor: theme.palette.primaryContainer,
            color: theme.palette.onPrimaryContainer,
            px: 1.5,
            py: 1,
            borderRadius: 2,
          })}
        >
          <InfoOutlined fontSize="small" />
          <Typography variant="labelMd">{labels.statusBanner}</Typography>
        </Stack>

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

          <PrimaryPageAction
            type="submit"
            fullWidth
            disabled={isSubmitting}
            sx={theme => ({
              py: 1.5,
              backgroundColor: theme.palette.primary.main,
            })}
          >
            {isSubmitting ? labels.processing : labels.create}
          </PrimaryPageAction>
        </Box>
      </MobileContentStack>

      <FormSuccessSnackbar open={successOpen} message={successMessage} onClose={onCloseSuccess} />
    </MobilePageContainer>
  );
}
