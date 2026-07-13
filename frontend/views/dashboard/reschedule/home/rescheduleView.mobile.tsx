"use client";

import { Box, type BoxProps, Divider, Link as MuiLink, Stack, styled } from "@mui/material";
import { useTranslations } from "next-intl";
import {
  FormSuccessSnackbar,
  PageContainer,
  PageHeader,
  PrimaryPageAction,
  SectionPanel,
} from "@/frontend/common/components/ui";
import {
  effectiveMeetingToDisplayData,
  MeetingConfigDisplay,
} from "@/frontend/common/components/ui/display/meetingConfig/MeetingConfigDisplay";
import { ClassParticipantsSection } from "@/frontend/views/dashboard/reschedule/home/ClassParticipantsSection";
import { NotificationPolicyCard } from "@/frontend/views/dashboard/reschedule/home/NotificationPolicyCard";
import { QuickAdjustSection } from "@/frontend/views/dashboard/reschedule/home/QuickAdjustSection";
import { RescheduleDateTimeSection } from "@/frontend/views/dashboard/reschedule/home/RescheduleDateTimeSection";
import { TimezoneWarningBanner } from "@/frontend/views/dashboard/reschedule/home/TimezoneWarningBanner";
import type { RescheduleViewModel } from "@/frontend/views/dashboard/reschedule/home/useRescheduleViewModel";
import { Link } from "@/shared/i18n/routing";

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
  const t = useTranslations("dashboard.rescheduleForm");
  const tMeeting = useTranslations("ui.meetingConfig");

  return (
    <PageContainer sx={{ maxWidth: 900, mx: "auto" }}>
      <PageHeader title={t("pageTitle")} subtitle={t("pageSubtitle")} />

      <TimezoneWarningBanner timezone={session.teacherTimezone} />

      <SectionPanel title={t("sections.classDetails")}>
        <Box
          component="form"
          onSubmit={e => {
            handleSubmit(onSubmit)(e);
          }}
          sx={theme => ({ p: theme.layout.cardPadding, display: "flex", flexDirection: "column", gap: 4 })}
        >
          <ClassParticipantsSection session={session} />

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
                  {tMeeting("summary.manageLink")}
                </MuiLink>
              </Stack>
            </>
          ) : null}

          <Divider />

          <RescheduleDateTimeSection control={control} errors={errors} />

          <QuickAdjustSection setValue={setValue} getValues={getValues} />

          <ActionContainer>
            <PrimaryPageAction type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("actions.processing") : t("actions.submitMobile")}
            </PrimaryPageAction>
            <PrimaryPageAction
              type="button"
              variant="text"
              onClick={onCancel}
              sx={theme => ({
                color: theme.palette.error.main,
                "&:hover": { color: theme.palette.error.dark },
              })}
            >
              {t("actions.cancel")}
            </PrimaryPageAction>
          </ActionContainer>
        </Box>
      </SectionPanel>

      <NotificationPolicyCard />

      <FormSuccessSnackbar open={showSuccess} message={t("actions.successMessage")} onClose={onDismissSuccess} />
    </PageContainer>
  );
}
