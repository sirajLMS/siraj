"use client";

import { Box, type BoxProps, Divider, Link as MuiLink, Stack, styled } from "@mui/material";
import { effectiveMeetingToDisplayData } from "@/frontend/common/lib/effectiveMeetingToDisplayData";
import type { RescheduleViewModel } from "@/frontend/common/views/dashboard/reschedule/home/useRescheduleViewModel";
import {
  MobilePageContainer,
  MobilePageHeader,
  MobilePrimaryPageAction,
  MobileSectionPanel,
} from "@/frontend/mobile/components/ui";
import { MobileMeetingConfigDisplay } from "@/frontend/mobile/components/ui/display/meetingConfig";
import { MobileFormSuccessSnackbar } from "@/frontend/mobile/components/ui/form/snackbar";
import { ClassParticipantsSectionMobile } from "@/frontend/mobile/views/dashboard/reschedule/home/components/classParticipantsSection.mobile";
import { NotificationPolicyCardMobile } from "@/frontend/mobile/views/dashboard/reschedule/home/components/notificationPolicyCard.mobile";
import { QuickAdjustSectionMobile } from "@/frontend/mobile/views/dashboard/reschedule/home/components/quickAdjustSection.mobile";
import { RescheduleDateTimeSectionMobile } from "@/frontend/mobile/views/dashboard/reschedule/home/components/rescheduleDateTimeSection.mobile";
import { TimezoneWarningBannerMobile } from "@/frontend/mobile/views/dashboard/reschedule/home/components/timezoneWarningBanner.mobile";
import { Link } from "@/shared/i18n/routing";
import { useAppTranslation } from "@/shared/locale";

const ActionContainer = styled(Box)<BoxProps>(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: theme.spacing(2),
  [theme.breakpoints.up("sm")]: {
    flexDirection: "row",
  },
}));

export function RescheduleViewMobile({
  session,
  control,
  errors,
  setValue,
  getValues,
  handleSubmit,
  isSubmitting,
  showSuccess,
  onSubmit,
  onCancel,
  onDismissSuccess,
}: Readonly<RescheduleViewModel>) {
  const t = useAppTranslation().dashboardTranslations.rescheduleForm;
  const tMeeting = useAppTranslation().uiTranslations.meetingConfig;

  return (
    <MobilePageContainer sx={{ maxWidth: 900, mx: "auto" }}>
      <MobilePageHeader title={t.pageTitle} subtitle={t.pageSubtitle} edgeToEdge={false} />

      <TimezoneWarningBannerMobile timezone={session.teacherTimezone} />

      <MobileSectionPanel title={t.sections.classDetails}>
        <Box
          component="form"
          onSubmit={e => {
            handleSubmit(onSubmit)(e);
          }}
          sx={theme => ({ p: theme.layout.cardPadding, display: "flex", flexDirection: "column", gap: 4 })}
        >
          <ClassParticipantsSectionMobile session={session} />

          {session.effectiveMeeting ? (
            <>
              <Divider />
              <Stack spacing={1}>
                <MobileMeetingConfigDisplay
                  config={effectiveMeetingToDisplayData(session.effectiveMeeting)}
                  showSource
                />
                <MuiLink
                  component={Link}
                  href={`/classes/${session.sessionId}#meeting-configs`}
                  underline="hover"
                  sx={{ typography: "labelMd" }}
                >
                  {tMeeting.summary.manageLink}
                </MuiLink>
              </Stack>
            </>
          ) : null}

          <Divider />

          <RescheduleDateTimeSectionMobile control={control} errors={errors} />

          <QuickAdjustSectionMobile setValue={setValue} getValues={getValues} />

          <ActionContainer>
            <MobilePrimaryPageAction type="submit" disabled={isSubmitting}>
              {isSubmitting ? t.actions.processing : t.actions.submitMobile}
            </MobilePrimaryPageAction>
            <MobilePrimaryPageAction
              type="button"
              variant="text"
              onClick={onCancel}
              sx={theme => ({
                color: theme.palette.error.main,
                "&:hover": { color: theme.palette.error.dark },
              })}
            >
              {t.actions.cancel}
            </MobilePrimaryPageAction>
          </ActionContainer>
        </Box>
      </MobileSectionPanel>

      <NotificationPolicyCardMobile />

      <MobileFormSuccessSnackbar open={showSuccess} message={t.actions.successMessage} onClose={onDismissSuccess} />
    </MobilePageContainer>
  );
}
