"use client";

import { Box, type BoxProps, Divider, Link as MuiLink, Stack, styled } from "@mui/material";
import { MeetingConfigDisplay } from "@/frontend/common/components/ui/display/meetingConfig/MeetingConfigDisplay";
import { effectiveMeetingToDisplayData } from "@/frontend/common/lib/effectiveMeetingToDisplayData";
import type { RescheduleViewModel } from "@/frontend/common/views/dashboard/reschedule/home/useRescheduleViewModel";
import {
  DesktopFormSuccessSnackbar,
  DesktopPrimaryPageAction,
  DesktopSectionPanel,
} from "@/frontend/desktop/components/ui";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";
import { ClassParticipantsSectionDesktop } from "@/frontend/desktop/views/dashboard/reschedule/home/components/classParticipantsSection.desktop";
import { QuickAdjustSectionDesktop } from "@/frontend/desktop/views/dashboard/reschedule/home/components/quickAdjustSection.desktop";
import { RescheduleDateTimeSectionDesktop } from "@/frontend/desktop/views/dashboard/reschedule/home/components/rescheduleDateTimeSection.desktop";
import { TimezoneWarningBannerDesktop } from "@/frontend/desktop/views/dashboard/reschedule/home/components/timezoneWarningBanner.desktop";
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

export function RescheduleViewDesktop({
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
    <DesktopPageContainer sx={{ maxWidth: 900, mx: "auto" }}>
      <DesktopPageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} />

      <TimezoneWarningBannerDesktop labels={labels} timezone={session.teacherTimezone} />

      <DesktopSectionPanel title={labels.sections.classDetails}>
        <Box
          component="form"
          onSubmit={e => {
            handleSubmit(onSubmit)(e);
          }}
          sx={theme => ({ p: theme.layout.cardPadding, display: "flex", flexDirection: "column", gap: 4 })}
        >
          <ClassParticipantsSectionDesktop labels={labels} session={session} />

          {session.effectiveMeeting ? (
            <>
              <Divider />
              <Stack spacing={1}>
                <MeetingConfigDisplay config={effectiveMeetingToDisplayData(session.effectiveMeeting)} showSource />
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

          <RescheduleDateTimeSectionDesktop labels={labels} control={control} errors={errors} />

          <QuickAdjustSectionDesktop labels={labels} setValue={setValue} getValues={getValues} />

          <ActionContainer>
            <DesktopPrimaryPageAction type="submit" disabled={isSubmitting}>
              {isSubmitting ? labels.actions.processing : labels.actions.submit}
            </DesktopPrimaryPageAction>
            <DesktopPrimaryPageAction
              type="button"
              variant="text"
              onClick={onCancel}
              sx={theme => ({
                color: theme.palette.error.main,
                "&:hover": { color: theme.palette.error.dark },
              })}
            >
              {labels.actions.cancel}
            </DesktopPrimaryPageAction>
          </ActionContainer>
        </Box>
      </DesktopSectionPanel>

      <DesktopFormSuccessSnackbar
        open={showSuccess}
        message={labels.actions.successMessage}
        onClose={onDismissSuccess}
      />
    </DesktopPageContainer>
  );
}
