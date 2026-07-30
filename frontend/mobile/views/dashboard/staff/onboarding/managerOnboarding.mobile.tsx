"use client";

import { Box } from "@mui/material";
import { styled } from "@mui/material/styles";
import { UserEntityFieldsSection } from "@/frontend/common/components/onboarding/sections";
import { SystemAccessSection } from "@/frontend/common/views/dashboard/staff/onboarding/SystemAccessSection";
import type { ManagerOnboardingViewProps } from "@/frontend/common/views/dashboard/staff/onboarding/types";
import { MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";
import { MobilePrimaryPageAction } from "@/frontend/mobile/components/ui/button";
import { MobileSectionPanel } from "@/frontend/mobile/components/ui/container";
import { MobileFormSuccessSnackbar } from "@/frontend/mobile/components/ui/form/snackbar";
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
  paddingTop: theme.spacing(2),
  borderTop: `1px solid ${theme.palette.outlineVariant}`,
}));

export function ManagerOnboardingMobileView({
  labels,
  onUploadAvatar,
  control,
  errors,
  handleSubmit,
  isSubmitting,
  showSuccess,
  onSubmit,
  onCancel,
  onDismissSuccess,
}: Readonly<ManagerOnboardingViewProps>) {
  const t = labels;
  const userEntityLabels = useAppTranslation(Translation.Onboarding.UserEntity);

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

      <MobileFormSuccessSnackbar open={showSuccess} message={t.actions.successMessage} onClose={onDismissSuccess} />
    </MobilePageContainer>
  );
}
