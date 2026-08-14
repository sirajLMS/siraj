"use client";

import { Box } from "@mui/material";
import { styled } from "@mui/material/styles";
import { UserEntityFieldsSection } from "@/frontend/common/components/onboarding/sections";
import { FormSuccessSnackbar } from "@/frontend/common/components/ui/form/snackbar/FormSuccessSnackbar";
import { SystemAccessSection } from "@/frontend/common/views/dashboard/staff/onboarding/SystemAccessSection";
import type { ManagerOnboardingViewProps } from "@/frontend/common/views/dashboard/staff/onboarding/types";
import { MobileFormErrorSnackbar, MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";
import { MobilePrimaryPageAction } from "@/frontend/mobile/components/ui/button";
import { MobileSectionPanel } from "@/frontend/mobile/components/ui/container";
import { Translation, useAppTranslation } from "@/shared/locale";

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
  padding: theme.spacing(2, 0),
  borderTop: `1px solid ${theme.palette.outlineVariant}`,
  position: "sticky",
  bottom: 0,
  backgroundColor: theme.palette.background.default,
  zIndex: 1,
}));

export function ManagerOnboardingMobileView({
  labels,
  onUploadAvatar,
  control,
  errors,
  handleSubmit,
  isSubmitting,
  showSuccess,
  submitError,
  onSubmit,
  onCancel,
  onDismissSuccess,
  onDismissError,
}: Readonly<ManagerOnboardingViewProps>) {
  const t = labels;
  const userEntityLabels = useAppTranslation(Translation.Onboarding.UserEntity);

  return (
    <MobilePageContainer>
      <MobilePageHeader title={t.pageTitle} subtitle={t.pageSubtitle} edgeToEdge={false} />

      <Box
        component="form"
        onSubmit={e => {
          void handleSubmit(onSubmit)(e);
        }}
        sx={{ display: "flex", flexDirection: "column", gap: 2, px: { xs: 2, md: 3 }, pb: 4 }}
      >
        <StyledFormWrapper>
          <MobileSectionPanel title={userEntityLabels.sectionTitle}>
            <UserEntityFieldsSection
              control={control}
              errors={errors}
              labels={userEntityLabels}
              onUploadAvatar={onUploadAvatar}
            />
          </MobileSectionPanel>
          <SystemAccessSection labels={labels} control={control} />

          <StyledFormActions>
            <MobilePrimaryPageAction
              type="submit"
              disabled={isSubmitting}
              fullWidth
              sx={theme => ({
                py: 2,
                borderRadius: Number(theme.shape.borderRadius) * 2,
              })}
            >
              {isSubmitting ? t.actions.processing : t.actions.signup}
            </MobilePrimaryPageAction>
            <MobilePrimaryPageAction
              type="button"
              variant="text"
              onClick={onCancel}
              fullWidth
              sx={theme => ({
                color: theme.palette.text.secondary,
              })}
            >
              {t.actions.cancel}
            </MobilePrimaryPageAction>
          </StyledFormActions>
        </StyledFormWrapper>
      </Box>

      <FormSuccessSnackbar open={showSuccess} message={t.actions.successMessage} onClose={onDismissSuccess} />
      <MobileFormErrorSnackbar open={Boolean(submitError)} message={submitError ?? ""} onClose={onDismissError} />
    </MobilePageContainer>
  );
}
