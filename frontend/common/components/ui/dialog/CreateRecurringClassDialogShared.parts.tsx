"use client";

import { Alert, Button, DialogActions, DialogContent, Stack } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import { DayScheduleList } from "@/frontend/common/components/ui/dialog/CreateRecurringClassDialogShared.days";
import {
  DurationTimeFields,
  StudentSubjectFields,
  TimezoneClassTypeFields,
} from "@/frontend/common/components/ui/dialog/CreateRecurringClassDialogShared.fields";
import { SchedulingFields } from "@/frontend/common/components/ui/dialog/CreateRecurringClassDialogShared.scheduling";
import type {
  CreateRecurringClassDialogLayoutProps,
  CreateRecurringClassStudentSelectSlotProps,
  CreateRecurringClassTimezoneSelectSlot,
  QuotaAutocompleteSlot,
} from "@/frontend/common/components/ui/dialog/types/createRecurringClassDialogShared.types";
import type { DayOfWeek } from "@/frontend/common/graphql/generated/gql/graphql";
import { RecurringMeetingConfigSection } from "@/frontend/common/views/dashboard/classes/recurring/RecurringMeetingConfigSection";
import type {
  ClassSubjectOption,
  DayScheduleConfig,
  RecurringMeetingConfigValidation,
} from "@/frontend/common/views/dashboard/classes/recurring/types";
import type { CreateRecurringClassDialogFormState } from "@/frontend/common/views/dashboard/teachers/schedule/weekly/hooks";
import type {
  MeetingConfigManagerLabels,
  MeetingConfigRecurringScheduleLabels,
  TeacherCreateRecurringClassLabels,
} from "@/shared/locale";

/** Warning banner shown after a post-create meeting-config failure, with a jump-to-class action. */
function MeetingConfigWarningAlert({
  createdClassInstanceId,
  tMeeting,
  tRecurringSchedule,
  onGoToCreatedClass,
  warningSx,
}: {
  readonly createdClassInstanceId: string | null;
  readonly tMeeting: MeetingConfigManagerLabels;
  readonly tRecurringSchedule: MeetingConfigRecurringScheduleLabels;
  readonly onGoToCreatedClass: () => void;
  readonly warningSx?: SxProps<Theme>;
}) {
  return (
    <Alert
      severity="warning"
      sx={warningSx}
      action={
        createdClassInstanceId ? (
          <Button color="inherit" size="small" onClick={onGoToCreatedClass}>
            {tRecurringSchedule.goToClass}
          </Button>
        ) : undefined
      }
    >
      {tMeeting.postCreateFailure}
    </Alert>
  );
}

interface DialogFormContentProps {
  readonly teacherId: string;
  readonly state: CreateRecurringClassDialogFormState;
  readonly days: readonly DayScheduleConfig[];
  readonly toggleDay: (day: DayOfWeek) => void;
  readonly toggleTimeOverride: (day: DayOfWeek) => void;
  readonly setTimeOverride: (day: DayOfWeek, time: string) => void;
  readonly isDialogOpen: boolean;
  readonly mutationLoading: boolean;
  readonly meetingConfigWarning: boolean;
  readonly completedClassInstanceId: string | null;
  readonly subjects: readonly ClassSubjectOption[];
  readonly subjectsLoading: boolean;
  readonly meetingConfigValidation: RecurringMeetingConfigValidation;
  readonly t: TeacherCreateRecurringClassLabels;
  readonly tMeeting: MeetingConfigManagerLabels;
  readonly tRecurringSchedule: MeetingConfigRecurringScheduleLabels;
  readonly onGoToCreatedClass: () => void;
  readonly StudentSelect: React.ComponentType<Readonly<CreateRecurringClassStudentSelectSlotProps>>;
  readonly TimezoneSelect: CreateRecurringClassTimezoneSelectSlot;
  readonly QuotaAutocomplete: QuotaAutocompleteSlot;
  readonly layout: CreateRecurringClassDialogLayoutProps;
  readonly onClassTypeChange: (value: string) => void;
  readonly onSchedulingModeChange: (value: string) => void;
  readonly onOndemandNoCreditsOutcomeChange: (value: string) => void;
}

/** Scrollable dialog body: warning banner plus the ordered form field sections. */
export function DialogFormContent({
  teacherId,
  state,
  days,
  toggleDay,
  toggleTimeOverride,
  setTimeOverride,
  isDialogOpen,
  mutationLoading,
  meetingConfigWarning,
  completedClassInstanceId,
  subjects,
  subjectsLoading,
  meetingConfigValidation,
  t,
  tMeeting,
  tRecurringSchedule,
  onGoToCreatedClass,
  StudentSelect,
  TimezoneSelect,
  QuotaAutocomplete,
  layout,
  onClassTypeChange,
  onSchedulingModeChange,
  onOndemandNoCreditsOutcomeChange,
}: DialogFormContentProps) {
  return (
    <DialogContent>
      <Stack sx={{ gap: 3 }}>
        {meetingConfigWarning ? (
          <MeetingConfigWarningAlert
            createdClassInstanceId={completedClassInstanceId}
            tMeeting={tMeeting}
            tRecurringSchedule={tRecurringSchedule}
            onGoToCreatedClass={onGoToCreatedClass}
            warningSx={layout.warningSx}
          />
        ) : null}
        <StudentSubjectFields
          teacherId={teacherId}
          state={state}
          isDialogOpen={isDialogOpen}
          mutationLoading={mutationLoading}
          t={t}
          StudentSelect={StudentSelect}
          subjects={subjects}
          subjectsLoading={subjectsLoading}
        />
        <DurationTimeFields
          duration={state.duration}
          setDuration={state.setDuration}
          defaultStartTime={state.defaultStartTime}
          setDefaultStartTime={state.setDefaultStartTime}
          mutationLoading={mutationLoading}
          t={t}
          direction={layout.fieldRowDirection}
        />
        <TimezoneClassTypeFields
          timezone={state.timezone}
          setTimezone={state.setTimezone}
          classType={state.classType}
          onClassTypeChange={onClassTypeChange}
          mutationLoading={mutationLoading}
          t={t}
          TimezoneSelect={TimezoneSelect}
          direction={layout.fieldRowDirection}
          timezoneWrapInBox={layout.timezoneWrapInBox}
        />
        <SchedulingFields
          state={state}
          mutationLoading={mutationLoading}
          t={t}
          onSchedulingModeChange={onSchedulingModeChange}
          onOndemandNoCreditsOutcomeChange={onOndemandNoCreditsOutcomeChange}
          QuotaAutocomplete={QuotaAutocomplete}
        />
        <DayScheduleList
          days={days}
          toggleDay={toggleDay}
          toggleTimeOverride={toggleTimeOverride}
          setTimeOverride={setTimeOverride}
          mutationLoading={mutationLoading}
          t={t}
          dayItemDirection={layout.dayItemDirection}
        />
        <RecurringMeetingConfigSection
          teacherId={teacherId}
          value={state.meetingConfig}
          onChangeAction={state.setMeetingConfig}
          validation={meetingConfigValidation}
          disabled={mutationLoading}
        />
      </Stack>
    </DialogContent>
  );
}

/** Cancel and submit buttons for the dialog form footer. */
export function DialogFooterActions({
  closeDialog,
  hasSessionCreateClass,
  mutationLoading,
  t,
}: {
  readonly closeDialog: () => void;
  readonly hasSessionCreateClass: boolean;
  readonly mutationLoading: boolean;
  readonly t: TeacherCreateRecurringClassLabels;
}) {
  return (
    <DialogActions>
      <Button onClick={closeDialog} disabled={mutationLoading}>
        {t.actions.cancel}
      </Button>
      {hasSessionCreateClass ? (
        <Button type="submit" variant="contained" color="primary" disabled={mutationLoading}>
          {mutationLoading ? t.actions.submitting : t.actions.create}
        </Button>
      ) : null}
    </DialogActions>
  );
}
