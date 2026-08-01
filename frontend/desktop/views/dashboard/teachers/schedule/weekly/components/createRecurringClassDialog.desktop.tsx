"use client";

import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { TimezoneSelect } from "@/frontend/common/components/ui/input/timezoneSelect/TimezoneSelect";
import type { ClassType, DayOfWeek } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { OnDemandNoCreditsOutcome, SchedulingMode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { fromGraphqlIanaTimezone, toGraphqlIanaTimezone } from "@/frontend/common/lib/timezone";
import { SubjectSelect } from "@/frontend/common/views/dashboard/classes/recurring/components/SubjectSelectField";
import { RecurringMeetingConfigSection } from "@/frontend/common/views/dashboard/classes/recurring/RecurringMeetingConfigSection";
import { CLASS_TYPE_OPTIONS, type DayScheduleConfig } from "@/frontend/common/views/dashboard/classes/recurring/types";
import {
  buildClassTypeLabels,
  buildDayLabels,
} from "@/frontend/common/views/dashboard/teachers/schedule/weekly/constants";
import type { CreateRecurringClassDialogFormState } from "@/frontend/common/views/dashboard/teachers/schedule/weekly/hooks";
import type {
  CreateRecurringClassDialogProps,
  CreateRecurringClassDialogViewModel,
} from "@/frontend/common/views/dashboard/teachers/schedule/weekly/types";
import { StudentAutocompleteDesktop } from "@/frontend/desktop/components/ui/input/userSelect";
import type {
  MeetingConfigManagerLabels,
  MeetingConfigRecurringScheduleLabels,
  TeacherCreateRecurringClassLabels,
} from "@/shared/locale";

/* Plan v5 reconciliation (RC-1): every data layer hook (see specs.md §3 N1,
 * N3, N6, N8, N17 + §6.2 — GraphQL reads/writes, routing, toasts, logging
 * and the permission gate) has been lifted out of this tier file into
 * `useTeacherWeeklyScheduleViewModel`. This file is now RENDERING ONLY —
 * it consumes the ViewModel-supplied `viewModel` prop. */

function MeetingConfigWarningAlert({
  createdClassInstanceId,
  tMeeting,
  tRecurringSchedule,
  onGoToCreatedClass,
}: {
  readonly createdClassInstanceId: string | null;
  readonly tMeeting: MeetingConfigManagerLabels;
  readonly tRecurringSchedule: MeetingConfigRecurringScheduleLabels;
  readonly onGoToCreatedClass: () => void;
}) {
  return (
    <Alert
      severity="warning"
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

function StudentSelectField({
  studentId,
  setStudentId,
  teacherId,
  isDialogOpen,
  mutationLoading,
  t,
}: {
  readonly studentId: string;
  readonly setStudentId: (value: string) => void;
  readonly teacherId: string;
  readonly isDialogOpen: boolean;
  readonly mutationLoading: boolean;
  readonly t: TeacherCreateRecurringClassLabels;
}) {
  return (
    <StudentAutocompleteDesktop
      value={studentId ? { id: studentId, name: "" } : null}
      onChange={option => {
        setStudentId(option?.id ?? "");
      }}
      scope={{ primaryTeacherId: teacherId }}
      skip={!isDialogOpen || !teacherId}
      disabled={mutationLoading}
      label={t.fields.student}
    />
  );
}

function DurationTimeFields({
  duration,
  setDuration,
  defaultStartTime,
  setDefaultStartTime,
  mutationLoading,
  t,
}: {
  readonly duration: number;
  readonly setDuration: (value: number) => void;
  readonly defaultStartTime: string;
  readonly setDefaultStartTime: (value: string) => void;
  readonly mutationLoading: boolean;
  readonly t: TeacherCreateRecurringClassLabels;
}) {
  return (
    <Stack direction="row" spacing={2}>
      <TextField
        fullWidth
        label={t.fields.duration}
        type="number"
        value={duration}
        onChange={e => setDuration(Number(e.target.value))}
        disabled={mutationLoading}
      />
      <TextField
        fullWidth
        label={t.fields.time}
        type="time"
        value={defaultStartTime}
        onChange={e => setDefaultStartTime(e.target.value)}
        slotProps={{
          inputLabel: {
            shrink: true,
          },
        }}
        disabled={mutationLoading}
      />
    </Stack>
  );
}

function TimezoneClassTypeFields({
  timezone,
  setTimezone,
  classType,
  setClassType,
  mutationLoading,
  t,
}: {
  readonly timezone: string;
  readonly setTimezone: (value: string) => void;
  readonly classType: ClassType;
  readonly setClassType: (value: string) => void;
  readonly mutationLoading: boolean;
  readonly t: TeacherCreateRecurringClassLabels;
}) {
  const classTypeLabels = buildClassTypeLabels(t);
  return (
    <Stack direction="row" spacing={2}>
      <Box sx={{ flex: 1 }}>
        <TimezoneSelect
          value={toGraphqlIanaTimezone(timezone)}
          onChangeAction={value => {
            setTimezone(value ? fromGraphqlIanaTimezone(value) : "");
          }}
          label={t.fields.timezone}
          fullWidth
          disabled={mutationLoading}
        />
      </Box>
      <FormControl fullWidth>
        <InputLabel id="class-type-select-label" shrink>
          {t.fields.classType}
        </InputLabel>
        <Select
          labelId="class-type-select-label"
          id="class-type-select"
          value={classType}
          label={t.fields.classType}
          onChange={e => setClassType(e.target.value)}
          disabled={mutationLoading}
        >
          {CLASS_TYPE_OPTIONS.map(opt => (
            <MenuItem key={opt} value={opt}>
              {classTypeLabels[opt]}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Stack>
  );
}

function SchedulingFields({
  schedulingMode,
  setSchedulingMode,
  quotaId,
  setQuotaId,
  earmarkedClasses,
  setEarmarkedClasses,
  generationHorizonWeeks,
  setGenerationHorizonWeeks,
  ondemandNoCreditsOutcome,
  setOndemandNoCreditsOutcome,
  mutationLoading,
}: {
  readonly schedulingMode: SchedulingMode | null;
  readonly setSchedulingMode: (value: SchedulingMode | null) => void;
  readonly quotaId: string | null;
  readonly setQuotaId: (value: string | null) => void;
  readonly earmarkedClasses: number | null;
  readonly setEarmarkedClasses: (value: number | null) => void;
  readonly generationHorizonWeeks: number | null;
  readonly setGenerationHorizonWeeks: (value: number | null) => void;
  readonly ondemandNoCreditsOutcome: OnDemandNoCreditsOutcome | null;
  readonly setOndemandNoCreditsOutcome: (value: OnDemandNoCreditsOutcome | null) => void;
  readonly mutationLoading: boolean;
}) {
  return (
    <Stack spacing={2}>
      <FormControl fullWidth>
        <InputLabel id="scheduling-mode-label" shrink>
          Scheduling Mode
        </InputLabel>
        <Select
          labelId="scheduling-mode-label"
          id="scheduling-mode-select"
          value={schedulingMode ?? ""}
          label="Scheduling Mode"
          onChange={e => setSchedulingMode((e.target.value || null) as SchedulingMode | null)}
          disabled={mutationLoading}
          displayEmpty
        >
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          <MenuItem value={SchedulingMode.NumberOfClasses}>Fixed Schedule</MenuItem>
          <MenuItem value={SchedulingMode.OnDemand}>On-Demand</MenuItem>
          <MenuItem value={SchedulingMode.Quota}>Quota</MenuItem>
        </Select>
      </FormControl>
      <TextField
        fullWidth
        label="Quota ID"
        value={quotaId ?? ""}
        onChange={e => setQuotaId(e.target.value || null)}
        disabled={mutationLoading}
      />
      <TextField
        fullWidth
        label="Earmarked Classes"
        type="number"
        value={earmarkedClasses ?? ""}
        onChange={e => {
          const val = e.target.value;
          setEarmarkedClasses(val === "" ? null : Number(val));
        }}
        disabled={mutationLoading}
      />
      <TextField
        fullWidth
        label="Generation Horizon (weeks)"
        type="number"
        slotProps={{ htmlInput: { min: 1, max: 52 } }}
        value={generationHorizonWeeks ?? ""}
        onChange={e => {
          const val = e.target.value;
          setGenerationHorizonWeeks(val === "" ? null : Number(val));
        }}
        disabled={mutationLoading}
      />
      <FormControl fullWidth>
        <InputLabel id="ondemand-no-credits-outcome-label" shrink>
          On-Demand No Credits Outcome
        </InputLabel>
        <Select
          labelId="ondemand-no-credits-outcome-label"
          id="ondemand-no-credits-outcome-select"
          value={ondemandNoCreditsOutcome ?? ""}
          label="On-Demand No Credits Outcome"
          onChange={e => setOndemandNoCreditsOutcome((e.target.value || null) as OnDemandNoCreditsOutcome | null)}
          disabled={mutationLoading}
          displayEmpty
        >
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          <MenuItem value={OnDemandNoCreditsOutcome.AutoCancel}>Skip</MenuItem>
          <MenuItem value={OnDemandNoCreditsOutcome.AutoAbsentNoCredits}>Generate Anyway</MenuItem>
          <MenuItem value={OnDemandNoCreditsOutcome.RemindOnly}>Remind Only</MenuItem>
        </Select>
      </FormControl>
    </Stack>
  );
}

function DayScheduleItem({
  dayConfig,
  toggleDay,
  toggleTimeOverride,
  setTimeOverride,
  mutationLoading,
  t,
}: {
  readonly dayConfig: DayScheduleConfig;
  readonly toggleDay: (day: DayOfWeek) => void;
  readonly toggleTimeOverride: (day: DayOfWeek) => void;
  readonly setTimeOverride: (day: DayOfWeek, time: string) => void;
  readonly mutationLoading: boolean;
  readonly t: TeacherCreateRecurringClassLabels;
}) {
  const d = dayConfig;
  const dayLabels = buildDayLabels(t);
  return (
    <Box
      key={d.day}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        p: 1,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
      }}
    >
      <FormControlLabel
        control={<Checkbox checked={d.enabled} onChange={() => toggleDay(d.day)} disabled={mutationLoading} />}
        label={dayLabels[d.day.toLowerCase()]}
      />
      {d.enabled && (
        <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={d.showOverride}
                onChange={() => toggleTimeOverride(d.day)}
                disabled={mutationLoading}
              />
            }
            label={t.timeOverride.addOverride}
          />
          {d.showOverride && (
            <TextField
              size="small"
              type="time"
              value={d.timeOverride}
              onChange={e => setTimeOverride(d.day, e.target.value)}
              disabled={mutationLoading}
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
            />
          )}
        </Stack>
      )}
    </Box>
  );
}

function DayScheduleList({
  days,
  toggleDay,
  toggleTimeOverride,
  setTimeOverride,
  mutationLoading,
  t,
}: {
  readonly days: readonly DayScheduleConfig[];
  readonly toggleDay: (day: DayOfWeek) => void;
  readonly toggleTimeOverride: (day: DayOfWeek) => void;
  readonly setTimeOverride: (day: DayOfWeek, time: string) => void;
  readonly mutationLoading: boolean;
  readonly t: TeacherCreateRecurringClassLabels;
}) {
  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>
        {t.fields.days}
      </Typography>
      <Stack spacing={1}>
        {days.map(d => (
          <DayScheduleItem
            key={d.day}
            dayConfig={d}
            toggleDay={toggleDay}
            toggleTimeOverride={toggleTimeOverride}
            setTimeOverride={setTimeOverride}
            mutationLoading={mutationLoading}
            t={t}
          />
        ))}
      </Stack>
    </Box>
  );
}

function DialogFormContent({
  teacherId,
  state,
  days,
  toggleDay,
  toggleTimeOverride,
  setTimeOverride,
  isDialogOpen,
  mutationLoading,
  meetingConfigWarning,
  createdClassInstanceId,
  t,
  tMeeting,
  tRecurringSchedule,
  onGoToCreatedClass,
}: {
  readonly teacherId: string;
  readonly state: CreateRecurringClassDialogFormState;
  readonly days: readonly DayScheduleConfig[];
  readonly toggleDay: (day: DayOfWeek) => void;
  readonly toggleTimeOverride: (day: DayOfWeek) => void;
  readonly setTimeOverride: (day: DayOfWeek, time: string) => void;
  readonly isDialogOpen: boolean;
  readonly mutationLoading: boolean;
  readonly meetingConfigWarning: boolean;
  readonly createdClassInstanceId: string | null;
  readonly t: TeacherCreateRecurringClassLabels;
  readonly tMeeting: MeetingConfigManagerLabels;
  readonly tRecurringSchedule: MeetingConfigRecurringScheduleLabels;
  readonly onGoToCreatedClass: () => void;
}) {
  return (
    <DialogContent>
      <Stack spacing={3}>
        {meetingConfigWarning ? (
          <MeetingConfigWarningAlert
            createdClassInstanceId={createdClassInstanceId}
            tMeeting={tMeeting}
            tRecurringSchedule={tRecurringSchedule}
            onGoToCreatedClass={onGoToCreatedClass}
          />
        ) : null}
        <StudentSelectField
          studentId={state.studentId}
          setStudentId={state.setStudentId}
          teacherId={teacherId}
          isDialogOpen={isDialogOpen}
          mutationLoading={mutationLoading}
          t={t}
        />
        <SubjectSelect
          value={state.subjectId}
          onChange={state.setSubjectId}
          label={t.fields.subject}
          placeholder={t.fields.subjectPlaceholder}
          disabled={mutationLoading}
        />
        <DurationTimeFields
          duration={state.duration}
          setDuration={state.setDuration}
          defaultStartTime={state.defaultStartTime}
          setDefaultStartTime={state.setDefaultStartTime}
          mutationLoading={mutationLoading}
          t={t}
        />
        <TimezoneClassTypeFields
          timezone={state.timezone}
          setTimezone={state.setTimezone}
          classType={state.classType}
          setClassType={value => state.setClassType(value as ClassType)}
          mutationLoading={mutationLoading}
          t={t}
        />
        <SchedulingFields
          schedulingMode={state.schedulingMode}
          setSchedulingMode={state.setSchedulingMode}
          quotaId={state.quotaId}
          setQuotaId={state.setQuotaId}
          earmarkedClasses={state.earmarkedClasses}
          setEarmarkedClasses={state.setEarmarkedClasses}
          generationHorizonWeeks={state.generationHorizonWeeks}
          setGenerationHorizonWeeks={state.setGenerationHorizonWeeks}
          ondemandNoCreditsOutcome={state.ondemandNoCreditsOutcome}
          setOndemandNoCreditsOutcome={state.setOndemandNoCreditsOutcome}
          mutationLoading={mutationLoading}
        />
        <DayScheduleList
          days={days}
          toggleDay={toggleDay}
          toggleTimeOverride={toggleTimeOverride}
          setTimeOverride={setTimeOverride}
          mutationLoading={mutationLoading}
          t={t}
        />
        <RecurringMeetingConfigSection
          teacherId={teacherId}
          value={state.meetingConfig}
          onChangeAction={state.setMeetingConfig}
          disabled={mutationLoading}
        />
      </Stack>
    </DialogContent>
  );
}

function CreateRecurringClassDialogDesktopBody({
  teacherId,
  viewModel,
}: {
  readonly teacherId: string;
  readonly viewModel: CreateRecurringClassDialogViewModel;
}) {
  const {
    formState: state,
    days,
    toggleDay,
    toggleTimeOverride,
    setTimeOverride,
    isDialogOpen,
    mutationLoading,
    meetingConfigWarning,
    completedClassInstanceId,
    closeDialog,
    handleSubmit,
    hasSessionCreateClass,
    labels: t,
    meetingLabels: tMeeting,
    recurringScheduleLabels: tRecurringSchedule,
    onGoToCreatedClass,
  } = viewModel;

  return (
    <Dialog open={isDialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
      <DialogTitle>{t.dialogTitle}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogFormContent
          teacherId={teacherId}
          state={state}
          days={days}
          toggleDay={toggleDay}
          toggleTimeOverride={toggleTimeOverride}
          setTimeOverride={setTimeOverride}
          isDialogOpen={isDialogOpen}
          mutationLoading={mutationLoading}
          meetingConfigWarning={meetingConfigWarning}
          createdClassInstanceId={completedClassInstanceId}
          t={t}
          tMeeting={tMeeting}
          tRecurringSchedule={tRecurringSchedule}
          onGoToCreatedClass={onGoToCreatedClass}
        />
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
      </form>
    </Dialog>
  );
}

export function CreateRecurringClassDialogDesktop({ teacherId, viewModel }: Readonly<CreateRecurringClassDialogProps>) {
  if (!viewModel) {
    return null;
  }
  return <CreateRecurringClassDialogDesktopBody teacherId={teacherId} viewModel={viewModel} />;
}
