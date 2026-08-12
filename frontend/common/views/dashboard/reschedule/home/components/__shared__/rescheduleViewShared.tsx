"use client";

import { Box, Divider, type SxProps, type Theme } from "@mui/material";
import type { FC, ReactNode } from "react";
import type { MeetingConfigDisplayProps } from "@/frontend/common/components/ui/display/meetingConfig/types";
import { ActionContainer } from "@/frontend/common/views/dashboard/reschedule/home/components/__shared__/actionContainerShared";
import { EffectiveMeetingSectionShared } from "@/frontend/common/views/dashboard/reschedule/home/components/__shared__/effectiveMeetingSectionShared";
import type { RescheduleViewModel } from "@/frontend/common/views/dashboard/reschedule/home/useRescheduleViewModel";

export interface RescheduleViewSharedSlots {
  readonly PageContainer: FC<Readonly<{ children: ReactNode; sx?: SxProps<Theme> }>>;
  readonly PageHeader: FC<Readonly<{ title: string; subtitle: string }>>;
  readonly SectionPanel: FC<Readonly<{ title: string; children: ReactNode }>>;
  readonly PrimaryPageAction: FC<
    Readonly<{
      type?: "button" | "submit";
      variant?: "text" | "contained" | "outlined";
      disabled?: boolean;
      onClick?: () => void;
      sx?: SxProps<Theme>;
      children: ReactNode;
    }>
  >;
  readonly FormSuccessSnackbar: FC<Readonly<{ open: boolean; message: string; onClose: () => void }>>;
  readonly TimezoneWarningBanner: FC<Readonly<{ labels: RescheduleViewModel["labels"]; timezone: string }>>;
  readonly ClassParticipantsSection: FC<
    Readonly<{ labels: RescheduleViewModel["labels"]; session: RescheduleViewModel["session"] }>
  >;
  readonly RescheduleDateTimeSection: FC<
    Readonly<{
      labels: RescheduleViewModel["labels"];
      control: RescheduleViewModel["control"];
      errors: RescheduleViewModel["errors"];
    }>
  >;
  readonly QuickAdjustSection: FC<
    Readonly<{
      labels: RescheduleViewModel["labels"];
      setValue: RescheduleViewModel["setValue"];
      getValues: RescheduleViewModel["getValues"];
    }>
  >;
  readonly MeetingConfigDisplay: FC<Readonly<MeetingConfigDisplayProps>>;
  readonly ExtraContent?: FC<Readonly<{ labels: RescheduleViewModel["labels"] }>>;
  readonly submitLabelKey: "submit" | "submitMobile";
}

export function RescheduleViewShared({
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
  slots,
}: Readonly<RescheduleViewModel> & {
  readonly slots: RescheduleViewSharedSlots;
}) {
  const {
    PageContainer,
    PageHeader,
    SectionPanel,
    PrimaryPageAction,
    FormSuccessSnackbar,
    TimezoneWarningBanner,
    ClassParticipantsSection,
    RescheduleDateTimeSection,
    QuickAdjustSection,
    MeetingConfigDisplay,
    ExtraContent,
    submitLabelKey,
  } = slots;

  const submitLabel = labels.actions[submitLabelKey];

  return (
    <PageContainer sx={{ maxWidth: 900, mx: "auto" }}>
      <PageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} />

      <TimezoneWarningBanner labels={labels} timezone={session.teacherTimezone} />

      <SectionPanel title={labels.sections.classDetails}>
        <Box
          component="form"
          onSubmit={e => {
            void handleSubmit(onSubmit)(e);
          }}
          sx={theme => ({ p: theme.layout.cardPadding, display: "flex", flexDirection: "column", gap: 4 })}
        >
          <ClassParticipantsSection labels={labels} session={session} />

          <EffectiveMeetingSectionShared
            session={session}
            meetingConfigLabels={meetingConfigLabels}
            meetingConfigDisplaySlot={MeetingConfigDisplay}
          />

          <Divider />

          <RescheduleDateTimeSection labels={labels} control={control} errors={errors} />

          <QuickAdjustSection labels={labels} setValue={setValue} getValues={getValues} />

          <ActionContainer>
            <PrimaryPageAction type="submit" disabled={isSubmitting}>
              {isSubmitting ? labels.actions.processing : submitLabel}
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
              {labels.actions.cancel}
            </PrimaryPageAction>
          </ActionContainer>
        </Box>
      </SectionPanel>

      {ExtraContent ? <ExtraContent labels={labels} /> : null}

      <FormSuccessSnackbar open={showSuccess} message={labels.actions.successMessage} onClose={onDismissSuccess} />
    </PageContainer>
  );
}
