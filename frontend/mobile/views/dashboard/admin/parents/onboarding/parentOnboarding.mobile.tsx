"use client";

import { InfoOutlined } from "@mui/icons-material";
import { Box, Stack, Typography } from "@mui/material";
import { FeesContractSection } from "@/frontend/common/views/dashboard/admin/parents/onboarding/FeesContractSection";
import { ParentInfoSection } from "@/frontend/common/views/dashboard/admin/parents/onboarding/ParentInfoSection";
import { ParentMeetingConfigOnboardingSection } from "@/frontend/common/views/dashboard/admin/parents/onboarding/ParentMeetingConfigOnboardingSection";
import { SocialCommsSection } from "@/frontend/common/views/dashboard/admin/parents/onboarding/SocialCommsSection";
import type { ParentOnboardingViewProps } from "@/frontend/common/views/dashboard/admin/parents/onboarding/types";
import {
  MobilePageContainer,
  MobilePageHeader,
  MobilePrimaryPageAction,
  MobileSectionPanel,
} from "@/frontend/mobile/components/ui";
import { useAppTranslation } from "@/shared/locale";

export function ParentOnboardingMobileView({
  register,
  control,
  errors,
  handleSubmit,
  isSubmitting,
  onSubmit,
}: Readonly<ParentOnboardingViewProps>) {
  const t = useAppTranslation().dashboardTranslations.parentOnboarding;

  return (
    <MobilePageContainer>
      <MobilePageHeader
        title={t.pageTitle}
        subtitle={t.pageSubtitle}
        edgeToEdge={false}
        actions={
          <Stack
            sx={theme => ({
              display: "flex",
              flexDirection: "row",
              gap: 1,
              alignItems: "center",
              backgroundColor: theme.palette.primaryContainer,
              color: theme.palette.onPrimaryContainer,
              px: 1.5,
              py: 0.5,
              borderRadius: 2,
            })}
          >
            <InfoOutlined sx={{ fontSize: 18 }} />
            <Typography variant="labelSm">{t.statusBanner}</Typography>
          </Stack>
        }
      />

      <Box
        component="form"
        onSubmit={e => {
          handleSubmit(onSubmit)(e);
        }}
        sx={{ display: "flex", flexDirection: "column", gap: 2, px: { xs: 2, md: 3 }, pb: 4 }}
      >
        <ParentInfoSection register={register} control={control} errors={errors} />
        <SocialCommsSection register={register} control={control} />
        <FeesContractSection register={register} control={control} errors={errors} />
        <MobileSectionPanel title={t.sections.meetingConfig}>
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
        </MobileSectionPanel>

        <Box
          sx={theme => ({
            p: 2,
            backgroundColor: theme.palette.surfaceContainerLow,
            borderRadius: 3,
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
            gap: 2,
          })}
        >
          <MobilePrimaryPageAction
            type="submit"
            disabled={isSubmitting}
            fullWidth
            sx={{
              py: 2,
              fontWeight: "bold",
              letterSpacing: "0.1em",
            }}
          >
            {isSubmitting ? t.actions.processing : t.actions.signup}
          </MobilePrimaryPageAction>
          <Typography variant="labelMd" sx={theme => ({ fontStyle: "italic", color: theme.palette.text.secondary })}>
            {t.privacyNote}
          </Typography>
        </Box>
      </Box>
    </MobilePageContainer>
  );
}
