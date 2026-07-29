"use client";

import { InfoOutlined } from "@mui/icons-material";
import { Box, Stack, Typography } from "@mui/material";
import { UserEntityFieldsSection } from "@/frontend/common/components/onboarding/sections";
import { StudentExtensionSection } from "@/frontend/common/views/dashboard/students/onboarding/components/StudentExtensionSection";
import type { StudentOnboardingViewModel } from "@/frontend/common/views/dashboard/students/onboarding/useStudentOnboardingViewModel";
import {
  MobileContentStack,
  MobileFormSuccessSnackbar,
  MobilePageContainer,
  MobilePageHeader,
  MobilePrimaryPageAction,
  MobileSectionPanel,
} from "@/frontend/mobile/components/ui";
import { ParentAssignmentSection } from "@/frontend/mobile/views/dashboard/students/onboarding/components/parentAssignmentSection.mobile";
import { TeacherAssignmentSection } from "@/frontend/mobile/views/dashboard/students/onboarding/components/teacherAssignmentSection.mobile";
import { Translation, useAppTranslation } from "@/shared/locale";

export function StudentOnboardingMobileView({
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
          <MobileSectionPanel title={userEntityLabels.sectionTitle}>
            <UserEntityFieldsSection
              register={register}
              control={control}
              errors={errors}
              labels={userEntityLabels}
              onUploadAvatar={onUploadAvatar}
            />
          </MobileSectionPanel>

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

          <MobileSectionPanel title={labels.sections.studentInfo}>
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
          </MobileSectionPanel>

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
              p: 2,
              backgroundColor: theme.palette.surfaceContainerLow,
              borderRadius: 3,
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
            })}
          >
            <MobilePrimaryPageAction type="submit" disabled={isSubmitting} fullWidth sx={{ py: 2 }}>
              {isSubmitting ? labels.processing : labels.create}
            </MobilePrimaryPageAction>
          </Box>
        </Box>
      </MobileContentStack>

      <MobileFormSuccessSnackbar open={successOpen} message={successMessage} onClose={onCloseSuccess} />
    </MobilePageContainer>
  );
}
