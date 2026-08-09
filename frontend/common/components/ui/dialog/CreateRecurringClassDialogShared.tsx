"use client";

import {
  Alert,
  Box,
  Button,
  Checkbox,
  DialogActions,
  DialogContent,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import type {
  CreateRecurringClassDialogLayoutProps,
  CreateRecurringClassDialogSharedComponentProps,
  CreateRecurringClassStudentSelectSlotProps,
  CreateRecurringClassTimezoneSelectSlot,
} from "@/frontend/common/components/ui/dialog/types/createRecurringClassDialogShared.types";
import type { DayOfWeek } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { OnDemandNoCreditsOutcome, SchedulingMode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { fromGraphqlIanaTimezone, toGraphqlIanaTimezone } from "@/frontend/common/lib/timezone";
import { SubjectSelect } from "@/frontend/common/views/dashboard/classes/recurring/components/SubjectSelectField";
import { RecurringMeetingConfigSection } from "@/frontend/common/views/dashboard/classes/recurring/RecurringMeetingConfigSection";
import type { DayScheduleConfig } from "@/frontend/common/views/dashboard/classes/recurring/types";
import { CLASS_TYPE_OPTIONS } from "@/frontend/common/views/dashboard/classes/recurring/types";
import {
  buildClassTypeLabels,
  buildDayLabels,
} from "@/frontend/common/views/dashboard/teachers/schedule/weekly/constants";
import type { CreateRecurringClassDialogFormState } from "@/frontend/common/views/dashboard/teachers/schedule/weekly/hooks";
import type {
  MeetingConfigManagerLabels,
  MeetingConfigRecurringScheduleLabels,
  TeacherCreateRecurringClassLabels,
} from "@/shared/locale";

/* Plan v5 scaffold (task 2.14/2.15): extracts the byte-identical rendering
 * logic from the desktop and mobile tier files into a single viewport-agnostic
 * scaffold. Tier variants inject their own `DialogShell`, `StudentSelect`,
 * `TimezoneSelect`, and `layout` via slot props. */

function isValidOnDemandNoCreditsOutcome(v: string): v is OnDemandNoCreditsOutcome {
  return (
    v === OnDemandNoCreditsOutcome.AutoAbsentNoCredits.toString() ||
    v === OnDemandNoCreditsOutcome.AutoCancel.toString() ||
    v === OnDemandNoCreditsOutcome.RemindOnly.toString()
  );
}

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

function DurationTimeFields({
  duration,
  setDuration,
  defaultStartTime,
  setDefaultStartTime,
  mutationLoading,
  t,
  direction,
}: {
  readonly duration: number;
  readonly setDuration: (value: number) => void;
  readonly defaultStartTime: string;
  readonly setDefaultStartTime: (value: string) => void;
  readonly mutationLoading: boolean;
  readonly t: TeacherCreateRecurringClassLabels;
  readonly direction: "row" | "column";
}) {
  return (
    <Stack sx={{ flexDirection: direction, gap: 2 }}>
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
  onClassTypeChange,
  mutationLoading,
  t,
  TimezoneSelect,
  direction,
  timezoneWrapInBox,
}: {
  readonly timezone: string;
  readonly setTimezone: (value: string) => void;
  readonly classType: string;
  readonly onClassTypeChange: (value: string) => void;
  readonly mutationLoading: boolean;
  readonly t: TeacherCreateRecurringClassLabels;
  readonly TimezoneSelect: CreateRecurringClassTimezoneSelectSlot;
  readonly direction: "row" | "column";
  readonly timezoneWrapInBox: boolean;
}) {
  const classTypeLabels = buildClassTypeLabels(t);
  const timezoneSelect = (
    <TimezoneSelect
      value={toGraphqlIanaTimezone(timezone)}
      onChangeAction={(value: string) => {
        setTimezone(value ? fromGraphqlIanaTimezone(value) : "");
      }}
      label={t.fields.timezone}
      fullWidth
      disabled={mutationLoading}
    />
  );
  return (
    <Stack sx={{ flexDirection: direction, gap: 2 }}>
      {timezoneWrapInBox ? <Box sx={{ flex: 1 }}>{timezoneSelect}</Box> : timezoneSelect}
      <FormControl fullWidth>
        <InputLabel id="class-type-select-label" shrink>
          {t.fields.classType}
        </InputLabel>
        <Select
          labelId="class-type-select-label"
          id="class-type-select"
          value={classType}
          label={t.fields.classType}
          onChange={e => onClassTypeChange(e.target.value)}
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
  state,
  mutationLoading,
  t,
  onSchedulingModeChange,
  onOndemandNoCreditsOutcomeChange,
}: {
  readonly state: CreateRecurringClassDialogFormState;
  readonly mutationLoading: boolean;
  readonly t: TeacherCreateRecurringClassLabels;
  readonly onSchedulingModeChange: (value: string) => void;
  readonly onOndemandNoCreditsOutcomeChange: (value: string) => void;
}) {
  return (
    <Stack sx={{ gap: 2 }}>
      <FormControl fullWidth>
        <InputLabel id="scheduling-mode-label" shrink>
          {t.scheduling.mode}
        </InputLabel>
        <Select
          labelId="scheduling-mode-label"
          id="scheduling-mode-select"
          value={state.schedulingMode ?? ""}
          label={t.scheduling.mode}
          onChange={e => onSchedulingModeChange(e.target.value)}
          disabled={mutationLoading}
          displayEmpty
        >
          <MenuItem value="">
            <em>{t.scheduling.noMode}</em>
          </MenuItem>
          <MenuItem value={SchedulingMode.NumberOfClasses}>{t.scheduling.modes.NumberOfClasses}</MenuItem>
          <MenuItem value={SchedulingMode.OnDemand}>{t.scheduling.modes.OnDemand}</MenuItem>
          <MenuItem value={SchedulingMode.Quota}>{t.scheduling.modes.Quota}</MenuItem>
        </Select>
      </FormControl>
      <TextField
        fullWidth
        label={t.scheduling.quotaId}
        value={state.quotaId ?? ""}
        onChange={e => state.setQuotaId(e.target.value || null)}
        disabled={mutationLoading}
      />
      <TextField
        fullWidth
        label={t.scheduling.earmarkedClasses}
        type="number"
        value={state.earmarkedClasses ?? ""}
        onChange={e => {
          const val = e.target.value;
          state.setEarmarkedClasses(val === "" ? null : Number(val));
        }}
        disabled={mutationLoading}
      />
      <TextField
        fullWidth
        label={t.scheduling.generationHorizon}
        type="number"
        slotProps={{ htmlInput: { min: 1, max: 52 } }}
        value={state.generationHorizonWeeks ?? ""}
        onChange={e => {
          const val = e.target.value;
          state.setGenerationHorizonWeeks(val === "" ? null : Number(val));
        }}
        disabled={mutationLoading}
      />
      <FormControl fullWidth>
        <InputLabel id="ondemand-no-credits-outcome-label" shrink>
          {t.scheduling.ondemandNoCreditsOutcome}
        </InputLabel>
        <Select
          labelId="ondemand-no-credits-outcome-label"
          id="ondemand-no-credits-outcome-select"
          value={state.ondemandNoCreditsOutcome ?? ""}
          label={t.scheduling.ondemandNoCreditsOutcome}
          onChange={e => onOndemandNoCreditsOutcomeChange(e.target.value)}
          disabled={mutationLoading}
          displayEmpty
        >
          <MenuItem value="">
            <em>{t.scheduling.noMode}</em>
          </MenuItem>
          <MenuItem value={OnDemandNoCreditsOutcome.AutoCancel}>{t.scheduling.ondemandNoCredits.AutoCancel}</MenuItem>
          <MenuItem value={OnDemandNoCreditsOutcome.AutoAbsentNoCredits}>
            {t.scheduling.ondemandNoCredits.AutoAbsentNoCredits}
          </MenuItem>
          <MenuItem value={OnDemandNoCreditsOutcome.RemindOnly}>{t.scheduling.ondemandNoCredits.RemindOnly}</MenuItem>
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
  direction,
}: {
  readonly dayConfig: DayScheduleConfig;
  readonly toggleDay: (day: DayOfWeek) => void;
  readonly toggleTimeOverride: (day: DayOfWeek) => void;
  readonly setTimeOverride: (day: DayOfWeek, time: string) => void;
  readonly mutationLoading: boolean;
  readonly t: TeacherCreateRecurringClassLabels;
  readonly direction: "row" | "column";
}) {
  const d = dayConfig;
  const dayLabels = buildDayLabels(t);
  return (
    <Box
      key={d.day}
      sx={{
        display: "flex",
        flexDirection: direction,
        alignItems: direction === "row" ? "center" : undefined,
        justifyContent: direction === "row" ? "space-between" : undefined,
        gap: direction === "column" ? 1 : undefined,
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
        <Stack sx={{ flexDirection: "row", gap: 2, alignItems: "center" }}>
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
  dayItemDirection,
}: {
  readonly days: readonly DayScheduleConfig[];
  readonly toggleDay: (day: DayOfWeek) => void;
  readonly toggleTimeOverride: (day: DayOfWeek) => void;
  readonly setTimeOverride: (day: DayOfWeek, time: string) => void;
  readonly mutationLoading: boolean;
  readonly t: TeacherCreateRecurringClassLabels;
  readonly dayItemDirection: "row" | "column";
}) {
  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>
        {t.fields.days}
      </Typography>
      <Stack sx={{ gap: 1 }}>
        {days.map(d => (
          <DayScheduleItem
            key={d.day}
            dayConfig={d}
            toggleDay={toggleDay}
            toggleTimeOverride={toggleTimeOverride}
            setTimeOverride={setTimeOverride}
            mutationLoading={mutationLoading}
            t={t}
            direction={dayItemDirection}
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
  completedClassInstanceId,
  t,
  tMeeting,
  tRecurringSchedule,
  onGoToCreatedClass,
  StudentSelect,
  TimezoneSelect,
  layout,
  onClassTypeChange,
  onSchedulingModeChange,
  onOndemandNoCreditsOutcomeChange,
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
  readonly completedClassInstanceId: string | null;
  readonly t: TeacherCreateRecurringClassLabels;
  readonly tMeeting: MeetingConfigManagerLabels;
  readonly tRecurringSchedule: MeetingConfigRecurringScheduleLabels;
  readonly onGoToCreatedClass: () => void;
  readonly StudentSelect: React.ComponentType<Readonly<CreateRecurringClassStudentSelectSlotProps>>;
  readonly TimezoneSelect: CreateRecurringClassTimezoneSelectSlot;
  readonly layout: CreateRecurringClassDialogLayoutProps;
  readonly onClassTypeChange: (value: string) => void;
  readonly onSchedulingModeChange: (value: string) => void;
  readonly onOndemandNoCreditsOutcomeChange: (value: string) => void;
}) {
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
        <StudentSelect
          studentId={state.studentId}
          setStudentId={state.setStudentId}
          teacherId={teacherId}
          isDialogOpen={isDialogOpen}
          mutationLoading={mutationLoading}
          label={t.fields.student}
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
          disabled={mutationLoading}
        />
      </Stack>
    </DialogContent>
  );
}

export function CreateRecurringClassDialogShared({
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
  closeDialog,
  handleSubmit,
  hasSessionCreateClass,
  labels: t,
  meetingLabels: tMeeting,
  recurringScheduleLabels: tRecurringSchedule,
  onGoToCreatedClass,
  onClassTypeChange,
  onSchedulingModeChange,
  onOndemandNoCreditsOutcomeChange,
  slots,
}: Readonly<CreateRecurringClassDialogSharedComponentProps>) {
  const { DialogShell, StudentSelect, TimezoneSelect, layout } = slots;

  const handleClassTypeChange = (value: string) => {
    onClassTypeChange(value, state.setClassType);
  };
  const handleSchedulingModeChange = (value: string) => {
    onSchedulingModeChange(value, state.setSchedulingMode);
  };
  const handleOndemandNoCreditsOutcomeChange = (value: string) => {
    if (onOndemandNoCreditsOutcomeChange) {
      onOndemandNoCreditsOutcomeChange(value, state.setOndemandNoCreditsOutcome);
    } else {
      state.setOndemandNoCreditsOutcome(isValidOnDemandNoCreditsOutcome(value) ? value : null);
    }
  };

  return (
    <DialogShell open={isDialogOpen} onClose={closeDialog} title={t.dialogTitle}>
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
          completedClassInstanceId={completedClassInstanceId}
          t={t}
          tMeeting={tMeeting}
          tRecurringSchedule={tRecurringSchedule}
          onGoToCreatedClass={onGoToCreatedClass}
          StudentSelect={StudentSelect}
          TimezoneSelect={TimezoneSelect}
          layout={layout}
          onClassTypeChange={handleClassTypeChange}
          onSchedulingModeChange={handleSchedulingModeChange}
          onOndemandNoCreditsOutcomeChange={handleOndemandNoCreditsOutcomeChange}
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
    </DialogShell>
  );
}
