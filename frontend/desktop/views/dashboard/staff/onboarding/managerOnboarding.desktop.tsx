"use client";

import { Box } from "@mui/material";
import { styled } from "@mui/material/styles";
import { UserEntityFieldsSection } from "@/frontend/common/components/onboarding/sections";
import { SystemAccessSection } from "@/frontend/common/views/dashboard/staff/onboarding/SystemAccessSection";
import type { ManagerOnboardingViewProps } from "@/frontend/common/views/dashboard/staff/onboarding/types";
import { DesktopPrimaryPageAction } from "@/frontend/desktop/components/ui/button";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui/container";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";
import { DesktopFormSuccessSnackbar } from "@/frontend/desktop/components/ui/form/snackbar";
import { Translation, useAppTranslation } from "@/shared/locale";

const StyledFormWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(3),
}));

const StyledFormActions = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  flexDirection: "row",
  gap: theme.spacing(2),
  paddingTop: theme.spacing(2),
  borderTop: `1px solid ${theme.palette.outlineVariant}`,
}));

export function ManagerOnboardingDesktopView({
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
    <DesktopPageContainer>
      <DesktopPageHeader title={t.pageTitle} subtitle={t.pageSubtitle} />

      <Box
        component="form"
        onSubmit={e => {
          handleSubmit(onSubmit)(e);
        }}
      >
        <StyledFormWrapper>
          <DesktopSectionPanel title={userEntityLabels.sectionTitle}>
            <UserEntityFieldsSection
              control={control}
              errors={errors}
              labels={userEntityLabels}
              onUploadAvatar={onUploadAvatar}
            />
          </DesktopSectionPanel>
          <SystemAccessSection labels={labels} control={control} />

          <StyledFormActions>
            <DesktopPrimaryPageAction
              type="submit"
              disabled={isSubmitting}
              sx={theme => ({
                maxWidth: 280,
                px: 6,
                py: 2,
                borderRadius: Number(theme.shape.borderRadius) * 2,
              })}
            >
              {isSubmitting ? t.actions.processing : t.actions.signup}
            </DesktopPrimaryPageAction>
            <DesktopPrimaryPageAction
              type="button"
              variant="text"
              onClick={onCancel}
              sx={theme => ({
                maxWidth: 200,
                color: theme.palette.text.secondary,
              })}
            >
              {t.actions.cancel}
            </DesktopPrimaryPageAction>
          </StyledFormActions>
        </StyledFormWrapper>
      </Box>

      <DesktopFormSuccessSnackbar open={showSuccess} message={t.actions.successMessage} onClose={onDismissSuccess} />
    </DesktopPageContainer>
  );
}
