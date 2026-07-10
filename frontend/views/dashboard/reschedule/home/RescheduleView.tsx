"use client";

import { Box, type BoxProps, Divider, Link as MuiLink, Stack, styled, useMediaQuery, useTheme } from "@mui/material";
import { useTranslations } from "next-intl";
import type { Control, FieldErrors, UseFormGetValues, UseFormHandleSubmit, UseFormSetValue } from "react-hook-form";
import {
  FormSuccessSnackbar,
  PageContainer,
  PageHeader,
  PrimaryPageAction,
  SectionPanel,
} from "@/frontend/components/ui";
import {
  effectiveMeetingToDisplayData,
  MeetingConfigDisplay,
} from "@/frontend/components/ui/display/meetingConfig/MeetingConfigDisplay";
import { ClassParticipantsSection } from "@/frontend/views/dashboard/reschedule/home/ClassParticipantsSection";
import { NotificationPolicyCard } from "@/frontend/views/dashboard/reschedule/home/NotificationPolicyCard";
import { QuickAdjustSection } from "@/frontend/views/dashboard/reschedule/home/QuickAdjustSection";
import { RescheduleDateTimeSection } from "@/frontend/views/dashboard/reschedule/home/RescheduleDateTimeSection";
import type { RescheduleFormData } from "@/frontend/views/dashboard/reschedule/home/schemas/rescheduleSchema";
import { TimezoneWarningBanner } from "@/frontend/views/dashboard/reschedule/home/TimezoneWarningBanner";
import type { RescheduleSession } from "@/frontend/views/dashboard/reschedule/home/types";
import { Link } from "@/shared/i18n/routing";

interface Props {
  readonly session: RescheduleSession;
  readonly control: Control<RescheduleFormData>;
  readonly errors: FieldErrors<RescheduleFormData>;
  readonly setValue: UseFormSetValue<RescheduleFormData>;
  readonly getValues: UseFormGetValues<RescheduleFormData>;
  readonly handleSubmit: UseFormHandleSubmit<RescheduleFormData>;
  readonly isSubmitting: boolean;
  readonly showSuccess: boolean;
  readonly onSubmit: (data: RescheduleFormData) => void | Promise<void>;
  readonly onCancel: () => void;
  readonly onDismissSuccess: () => void;
}

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

export function RescheduleView({
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
}: Readonly<Props>) {
  const t = useTranslations("dashboard.rescheduleForm");
  const tMeeting = useTranslations("ui.meetingConfig");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const submitLabel = isMobile ? t("actions.submitMobile") : t("actions.submit");

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
                <MeetingConfigDisplay
                  config={effectiveMeetingToDisplayData(session.effectiveMeeting)}
                  showSource
                />
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
              {isSubmitting ? t("actions.processing") : submitLabel}
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

      {isMobile && <NotificationPolicyCard />}

      <FormSuccessSnackbar open={showSuccess} message={t("actions.successMessage")} onClose={onDismissSuccess} />
    </PageContainer>
  );
}
