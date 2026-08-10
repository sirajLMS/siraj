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
import { Link } from "@/shared/i18n";

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
  labels,
  meetingConfigLabels,
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
  return (
    <MobilePageContainer sx={{ maxWidth: 900, mx: "auto" }}>
      <MobilePageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} edgeToEdge={false} />

      <TimezoneWarningBannerMobile labels={labels} timezone={session.teacherTimezone} />

      <MobileSectionPanel title={labels.sections.classDetails}>
        <Box
          component="form"
          onSubmit={e => {
            void handleSubmit(onSubmit)(e);
          }}
          sx={theme => ({ p: theme.layout.cardPadding, display: "flex", flexDirection: "column", gap: 4 })}
        >
          <ClassParticipantsSectionMobile labels={labels} session={session} />

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
                  {meetingConfigLabels.summary.manageLink}
                </MuiLink>
              </Stack>
            </>
          ) : null}

          <Divider />

          <RescheduleDateTimeSectionMobile labels={labels} control={control} errors={errors} />

          <QuickAdjustSectionMobile labels={labels} setValue={setValue} getValues={getValues} />

          <ActionContainer>
            <MobilePrimaryPageAction type="submit" disabled={isSubmitting}>
              {isSubmitting ? labels.actions.processing : labels.actions.submitMobile}
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
              {labels.actions.cancel}
            </MobilePrimaryPageAction>
          </ActionContainer>
        </Box>
      </MobileSectionPanel>

      <NotificationPolicyCardMobile labels={labels} />

      <MobileFormSuccessSnackbar
        open={showSuccess}
        message={labels.actions.successMessage}
        onClose={onDismissSuccess}
      />
    </MobilePageContainer>
  );
}
