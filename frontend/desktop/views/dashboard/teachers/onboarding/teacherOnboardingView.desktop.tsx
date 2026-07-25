"use client";

import { Box, Typography } from "@mui/material";
import { FormProvider } from "react-hook-form";
import { MeetingConfigOnboardingSection } from "@/frontend/common/views/dashboard/teachers/onboarding/components/MeetingConfigOnboardingSection";
import { OfficialDetailsSection } from "@/frontend/common/views/dashboard/teachers/onboarding/components/OfficialDetailsSection";
import { PaymentMethodSection } from "@/frontend/common/views/dashboard/teachers/onboarding/components/PaymentMethodSection";
import { SalaryDetailsSection } from "@/frontend/common/views/dashboard/teachers/onboarding/components/SalaryDetailsSection";
import { TeacherInfoSection } from "@/frontend/common/views/dashboard/teachers/onboarding/components/TeacherInfoSection";
import type { TeacherOnboardingViewModel } from "@/frontend/common/views/dashboard/teachers/onboarding/useTeacherOnboardingViewModel";
import {
  DesktopFormErrorSnackbar,
  DesktopFormSuccessSnackbar,
  DesktopPrimaryPageAction,
  DesktopSectionPanel,
} from "@/frontend/desktop/components/ui";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";

function FormActions({
  isSubmitting,
  labels,
}: {
  readonly isSubmitting: boolean;
  readonly labels: TeacherOnboardingViewModel["labels"];
}) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
      <DesktopPrimaryPageAction
        type="submit"
        disabled={isSubmitting}
        sx={theme => ({
          backgroundColor: theme.palette.status.active,
          color: theme.palette.status.onActive,
          "&:hover": { backgroundColor: theme.palette.status.active },
          px: 5,
          py: 1.5,
          fontWeight: 700,
          letterSpacing: "0.1em",
        })}
      >
        {isSubmitting ? labels.actions.proceeding : labels.actions.signup}
      </DesktopPrimaryPageAction>
      <DesktopPrimaryPageAction
        type="reset"
        variant="text"
        sx={theme => ({ color: theme.palette.text.secondary, fontWeight: 700, letterSpacing: "0.1em" })}
      >
        {labels.actions.cancel}
      </DesktopPrimaryPageAction>
    </Box>
  );
}

export function TeacherOnboardingDesktopView({
  form,
  register,
  onUploadAvatar,
  control,
  errors,
  handleSubmit,
  isSubmitting,
  showSuccess,
  submitError,
  labels,
  onSubmit,
  onDismissSuccess,
  onDismissError,
}: Readonly<TeacherOnboardingViewModel>) {
  return (
    <DesktopPageContainer>
      <DesktopPageHeader
        title={labels.pageTitle}
        subtitle={labels.pageSubtitle}
        actions={
          <Typography
            variant="labelUppercase"
            sx={theme => ({ color: theme.palette.error.main, display: { xs: "none", md: "block" } })}
          >
            {labels.mandatoryFields}
          </Typography>
        }
      />
      <FormProvider {...form}>
        <Box
          component="form"
          onSubmit={e => {
            handleSubmit(onSubmit)(e);
          }}
          sx={{ display: "flex", flexDirection: "column", gap: 4, pb: 12 }}
        >
          <DesktopSectionPanel title={labels.sections.teacherInfo}>
            <TeacherInfoSection
              register={register}
              control={control}
              errors={errors}
              labels={labels}
              onUploadAvatar={onUploadAvatar}
            />
          </DesktopSectionPanel>
          <DesktopSectionPanel title={labels.sections.officialDetails}>
            <OfficialDetailsSection register={register} control={control} errors={errors} labels={labels} />
          </DesktopSectionPanel>
          <DesktopSectionPanel title={labels.sections.salaryDetails}>
            <SalaryDetailsSection register={register} control={control} errors={errors} labels={labels} />
          </DesktopSectionPanel>
          <DesktopSectionPanel title={labels.sections.paymentMethod}>
            <PaymentMethodSection control={control} errors={errors} />
          </DesktopSectionPanel>
          <DesktopSectionPanel title={labels.sections.meetingConfig}>
            <MeetingConfigOnboardingSection
              register={register}
              control={control}
              errors={errors}
              labels={{
                fields: {
                  meetingProvider: labels.fields.meetingProvider,
                  meetingUrl: labels.fields.meetingUrl,
                  meetingLabel: labels.fields.meetingLabel,
                },
                placeholders: {
                  meetingUrl: labels.placeholders.meetingUrl,
                  meetingLabel: labels.placeholders.meetingLabel,
                },
                optionalHint: labels.optionalHint,
              }}
            />
          </DesktopSectionPanel>
          <FormActions isSubmitting={isSubmitting} labels={labels} />
        </Box>
      </FormProvider>
      <DesktopFormSuccessSnackbar
        open={showSuccess}
        message={labels.actions.successMessage}
        onClose={onDismissSuccess}
      />
      <DesktopFormErrorSnackbar
        open={Boolean(submitError)}
        message={submitError ?? ""}
        onClose={onDismissError}
      />
    </DesktopPageContainer>
  );
}
