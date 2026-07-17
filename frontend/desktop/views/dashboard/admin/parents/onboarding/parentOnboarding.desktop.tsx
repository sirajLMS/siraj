"use client";

import { InfoOutlined } from "@mui/icons-material";
import { Box, Stack, Typography } from "@mui/material";
import { FeesContractSection } from "@/frontend/common/views/dashboard/admin/parents/onboarding/FeesContractSection";
import { ParentInfoSection } from "@/frontend/common/views/dashboard/admin/parents/onboarding/ParentInfoSection";
import { ParentMeetingConfigOnboardingSection } from "@/frontend/common/views/dashboard/admin/parents/onboarding/ParentMeetingConfigOnboardingSection";
import { SocialCommsSection } from "@/frontend/common/views/dashboard/admin/parents/onboarding/SocialCommsSection";
import type { ParentOnboardingViewProps } from "@/frontend/common/views/dashboard/admin/parents/onboarding/types";
import {
  DesktopPageContainer,
  DesktopPageHeader,
  DesktopPrimaryPageAction,
  DesktopSectionPanel,
} from "@/frontend/desktop/components/ui";
import { useAppTranslation } from "@/shared/locale";

export function ParentOnboardingDesktopView({
  register,
  control,
  errors,
  handleSubmit,
  isSubmitting,
  onSubmit,
}: Readonly<ParentOnboardingViewProps>) {
  const t = useAppTranslation().dashboardTranslations.parentOnboarding;

  return (
    <DesktopPageContainer>
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

      <Box
        component="form"
        onSubmit={e => {
          handleSubmit(onSubmit)(e);
        }}
        sx={{ display: "flex", flexDirection: "column", gap: 3 }}
      >
        <ParentInfoSection register={register} control={control} errors={errors} />
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
    </DesktopPageContainer>
  );
}
