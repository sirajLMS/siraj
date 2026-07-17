"use client";

import { Box } from "@mui/material";
import { styled } from "@mui/material/styles";
import { FormSuccessSnackbar, PrimaryPageAction } from "@/frontend/common/components/ui";
import { StaffInfoSection } from "@/frontend/common/views/dashboard/managers/onboarding/StaffInfoSection";
import { SystemAccessSection } from "@/frontend/common/views/dashboard/managers/onboarding/SystemAccessSection";
import type { ManagerOnboardingViewProps } from "@/frontend/common/views/dashboard/managers/onboarding/types";
import { useOnboardingMetrics } from "@/frontend/common/views/dashboard/managers/onboarding/useOnboardingMetrics";
import { MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";
import { OnboardingMetricsOverviewMobile } from "@/frontend/mobile/views/dashboard/managers/onboarding/components/onboardingMetricsOverview.mobile";
import { useAppTranslation } from "@/shared/locale";

const StyledFormWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
}));

const StyledFormActions = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "stretch",
  justifyContent: "center",
  flexDirection: "column",
  gap: theme.spacing(1.5),
  paddingTop: theme.spacing(2),
  borderTop: `1px solid ${theme.palette.outlineVariant}`,
}));

export function ManagerOnboardingMobileView({
  register,
  control,
  errors,
  handleSubmit,
  isSubmitting,
  showSuccess,
  onSubmit,
  onCancel,
  onDismissSuccess,
}: Readonly<ManagerOnboardingViewProps>) {
  const t = useAppTranslation().dashboardTranslations.managerOnboarding;
  const metricsModel = useOnboardingMetrics();

  return (
    <MobilePageContainer>
      <MobilePageHeader title={t.pageTitle} subtitle={t.pageSubtitle} edgeToEdge={false} />

      <Box
        component="form"
        onSubmit={e => {
          handleSubmit(onSubmit)(e);
        }}
        sx={{ display: "flex", flexDirection: "column", gap: 2, px: { xs: 2, md: 3 }, pb: 4 }}
      >
        <StyledFormWrapper>
          <StaffInfoSection register={register} control={control} errors={errors} />
          <SystemAccessSection register={register} control={control} errors={errors} />

          <StyledFormActions>
            <PrimaryPageAction
              type="submit"
              disabled={isSubmitting}
              fullWidth
              sx={theme => ({
                py: 2,
                borderRadius: Number(theme.shape.borderRadius) * 2,
              })}
            >
              {isSubmitting ? t.actions.processing : t.actions.signup}
            </PrimaryPageAction>
            <PrimaryPageAction
              type="button"
              variant="text"
              onClick={onCancel}
              fullWidth
              sx={theme => ({
                color: theme.palette.text.secondary,
              })}
            >
              {t.actions.cancel}
            </PrimaryPageAction>
          </StyledFormActions>
        </StyledFormWrapper>
      </Box>

      <Box sx={{ px: { xs: 2, md: 3 }, pb: 4 }}>
        <OnboardingMetricsOverviewMobile model={metricsModel} />
      </Box>

      <FormSuccessSnackbar open={showSuccess} message={t.actions.successMessage} onClose={onDismissSuccess} />
    </MobilePageContainer>
  );
}
