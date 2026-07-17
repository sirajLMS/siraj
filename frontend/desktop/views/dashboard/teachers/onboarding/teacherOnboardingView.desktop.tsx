"use client";

import { Box, Typography } from "@mui/material";
import { FormProvider } from "react-hook-form";
import {
  FormSuccessSnackbar,
  PageContainer,
  PageHeader,
  PrimaryPageAction,
  SectionPanel,
} from "@/frontend/common/components/ui";
import { MeetingConfigOnboardingSection } from "@/frontend/common/views/dashboard/teachers/onboarding/components/MeetingConfigOnboardingSection";
import { OfficialDetailsSection } from "@/frontend/common/views/dashboard/teachers/onboarding/components/OfficialDetailsSection";
import { PaymentMethodSection } from "@/frontend/common/views/dashboard/teachers/onboarding/components/PaymentMethodSection";
import { SalaryDetailsSection } from "@/frontend/common/views/dashboard/teachers/onboarding/components/SalaryDetailsSection";
import { TeacherInfoSection } from "@/frontend/common/views/dashboard/teachers/onboarding/components/TeacherInfoSection";
import type { TeacherOnboardingViewModel } from "@/frontend/common/views/dashboard/teachers/onboarding/useTeacherOnboardingViewModel";
import { useAppTranslation } from "@/shared/locale";

function OnboardingBanner() {
  const t = useAppTranslation().dashboardTranslations.teacherOnboarding;

  return (
    <Box
      sx={{
        width: "100%",
        height: 128,
        borderRadius: 3,
        overflow: "hidden",
        position: "relative",
        mb: 2,
      }}
    >
      <Box component="img" src="/demo/avatars/03.png" sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
      <Box
        sx={theme => ({
          position: "absolute",
          inset: 0,
          background: `linear-gradient(to top, ${theme.palette.scrim} 0%, transparent 100%)`,
        })}
      />
      <Box sx={theme => ({ position: "absolute", bottom: 16, left: 16, color: theme.palette.onSurface })}>
        <Typography variant="labelUppercase" sx={{ opacity: 0.9 }}>
          {t.bannerJoinFaculty}
        </Typography>
        <Typography variant="headlineMd">{t.bannerRegistrationForm}</Typography>
      </Box>
    </Box>
  );
}

function FormActions({
  isSubmitting,
  labels,
}: {
  readonly isSubmitting: boolean;
  readonly labels: TeacherOnboardingViewModel["labels"];
}) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
      <PrimaryPageAction
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
      </PrimaryPageAction>
      <PrimaryPageAction
        type="reset"
        variant="text"
        sx={theme => ({ color: theme.palette.text.secondary, fontWeight: 700, letterSpacing: "0.1em" })}
      >
        {labels.actions.cancel}
      </PrimaryPageAction>
    </Box>
  );
}

export function TeacherOnboardingDesktopView({
  form,
  register,
  control,
  errors,
  handleSubmit,
  isSubmitting,
  showSuccess,
  labels,
  onSubmit,
  onDismissSuccess,
}: Readonly<TeacherOnboardingViewModel>) {
  return (
    <PageContainer>
      <PageHeader
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
          <OnboardingBanner />
          <SectionPanel title={labels.sections.teacherInfo}>
            <TeacherInfoSection register={register} control={control} errors={errors} labels={labels} />
          </SectionPanel>
          <SectionPanel title={labels.sections.officialDetails}>
            <OfficialDetailsSection register={register} control={control} errors={errors} labels={labels} />
          </SectionPanel>
          <SectionPanel title={labels.sections.salaryDetails}>
            <SalaryDetailsSection register={register} control={control} errors={errors} labels={labels} />
          </SectionPanel>
          <SectionPanel title={labels.sections.paymentMethod}>
            <PaymentMethodSection control={control} errors={errors} />
          </SectionPanel>
          <SectionPanel title={labels.sections.meetingConfig}>
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
          </SectionPanel>
          <FormActions isSubmitting={isSubmitting} labels={labels} />
        </Box>
      </FormProvider>
      <FormSuccessSnackbar open={showSuccess} message={labels.actions.successMessage} onClose={onDismissSuccess} />
    </PageContainer>
  );
}
