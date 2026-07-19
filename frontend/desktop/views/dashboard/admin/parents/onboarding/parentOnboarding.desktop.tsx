"use client";

import { InfoOutlined } from "@mui/icons-material";
import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import { FormProvider } from "react-hook-form";
import { FeesContractSection } from "@/frontend/common/views/dashboard/admin/parents/onboarding/FeesContractSection";
import { ParentInfoSection } from "@/frontend/common/views/dashboard/admin/parents/onboarding/ParentInfoSection";
import { ParentMeetingConfigOnboardingSection } from "@/frontend/common/views/dashboard/admin/parents/onboarding/ParentMeetingConfigOnboardingSection";
import { SocialCommsSection } from "@/frontend/common/views/dashboard/admin/parents/onboarding/SocialCommsSection";
import type { ParentOnboardingViewModel } from "@/frontend/common/views/dashboard/admin/parents/onboarding/useParentOnboardingViewModel";
import {
  DesktopFormSuccessSnackbar,
  DesktopPageContainer,
  DesktopPageHeader,
  DesktopPrimaryPageAction,
  DesktopSectionPanel,
} from "@/frontend/desktop/components/ui";
import { useRouter } from "@/shared/i18n/routing";

export function ParentOnboardingDesktopView({
  form,
  register,
  onUploadAvatar,
  control,
  errors,
  handleSubmit,
  isSubmitting,
  onSubmit,
  meetingConfigWarning,
  clearMeetingConfigWarning,
  meetingSetupHref,
  showSuccess,
  onDismissSuccess,
  t,
  tMeeting,
  tJoin,
}: Readonly<ParentOnboardingViewModel>) {
  const router = useRouter();

  return (
    <DesktopPageContainer>
      {meetingConfigWarning ? (
        <Alert
          severity="warning"
          onClose={clearMeetingConfigWarning}
          action={
            meetingSetupHref ? (
              <Button color="inherit" size="small" onClick={() => router.push(meetingSetupHref)}>
                {tJoin.setupLink}
              </Button>
            ) : undefined
          }
          sx={{ mb: 2 }}
        >
          {tMeeting.postCreateFailure}
        </Alert>
      ) : null}

      <DesktopPageHeader
        title={t.pageTitle}
        subtitle={t.pageSubtitle}
        actions={
          <Stack
            sx={theme => ({
              display: "flex",
              flexDirection: "row",
              gap: 2,
              alignItems: "center",
              backgroundColor: theme.palette.primaryContainer,
              color: theme.palette.onPrimaryContainer,
              px: 2,
              py: 1,
              borderRadius: 2,
            })}
          >
            <InfoOutlined />
            <Typography variant="labelMd">{t.statusBanner}</Typography>
          </Stack>
        }
      />

      <FormProvider {...form}>
        <Box
          component="form"
          onSubmit={e => {
            handleSubmit(onSubmit)(e);
          }}
          sx={{ display: "flex", flexDirection: "column", gap: 3 }}
        >
          <ParentInfoSection register={register} control={control} errors={errors} onUploadAvatar={onUploadAvatar} />
          <SocialCommsSection register={register} control={control} />
          <FeesContractSection register={register} control={control} errors={errors} />
          <DesktopSectionPanel title={t.sections.meetingConfig}>
            <ParentMeetingConfigOnboardingSection
              register={register}
              control={control}
              errors={errors}
              labels={{
                sectionTitle: t.sections.meetingConfig,
                optionalHint: t.optionalHint,
                fields: {
                  meetingProvider: t.fields.meetingProvider,
                  meetingUrl: t.fields.meetingUrl,
                  meetingLabel: t.fields.meetingLabel,
                },
                placeholders: {
                  meetingUrl: t.placeholders.meetingUrl,
                  meetingLabel: t.placeholders.meetingLabel,
                },
              }}
            />
          </DesktopSectionPanel>

          <Box
            sx={theme => ({
              p: 3,
              backgroundColor: theme.palette.surfaceContainerLow,
              borderRadius: 3,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexDirection: { xs: "column", sm: "row" },
              gap: 2,
            })}
          >
            <DesktopPrimaryPageAction
              type="submit"
              disabled={isSubmitting}
              sx={{
                px: 6,
                py: 2,
                fontWeight: "bold",
                letterSpacing: "0.1em",
                minWidth: 200,
              }}
            >
              {isSubmitting ? t.actions.processing : t.actions.signup}
            </DesktopPrimaryPageAction>
            <Typography variant="labelMd" sx={theme => ({ fontStyle: "italic", color: theme.palette.text.secondary })}>
              {t.privacyNote}
            </Typography>
          </Box>
        </Box>
      </FormProvider>

      <DesktopFormSuccessSnackbar open={showSuccess} message={t.actions.successMessage} onClose={onDismissSuccess} />
    </DesktopPageContainer>
  );
}
