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
import { fromGraphqlIanaTimezone, toGraphqlIanaTimezone } from "@/frontend/common/lib/timezone";
import { RecurringMeetingConfigSection } from "@/frontend/common/views/dashboard/classes/recurring/RecurringMeetingConfigSection";
import { CLASS_TYPE_OPTIONS, type DayScheduleConfig } from "@/frontend/common/views/dashboard/classes/recurring/types";
import {
  buildClassTypeLabels,
  buildDayLabels,
} from "@/frontend/common/views/dashboard/teachers/schedule/weekly/constants";
import type { CreateRecurringClassDialogFormState } from "@/frontend/common/views/dashboard/teachers/schedule/weekly/hooks";
import type {
  ClassTypeEnum,
  CreateRecurringClassDialogProps,
  CreateRecurringClassDialogStudent,
  CreateRecurringClassDialogViewModel,
  DayOfWeek,
} from "@/frontend/common/views/dashboard/teachers/schedule/weekly/types";
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
  students,
  loadingStudents,
  mutationLoading,
  t,
}: {
  readonly studentId: string;
  readonly setStudentId: (value: string) => void;
  readonly students: readonly CreateRecurringClassDialogStudent[];
  readonly loadingStudents: boolean;
  readonly mutationLoading: boolean;
  readonly t: TeacherCreateRecurringClassLabels;
}) {
  return (
    <FormControl fullWidth>
      <InputLabel id="student-select-label" shrink>
        {t.fields.student}
      </InputLabel>
      <Select
        labelId="student-select-label"
        id="student-select"
        value={studentId}
        label={t.fields.student}
        onChange={e => setStudentId(e.target.value)}
        disabled={loadingStudents || mutationLoading}
      >
        {students.map(s => (
          <MenuItem key={s.id} value={s.id || ""}>
            {s.name || "Unknown student"}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
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
  readonly classType: ClassTypeEnum;
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
  students,
  loadingStudents,
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
  readonly students: readonly CreateRecurringClassDialogStudent[];
  readonly loadingStudents: boolean;
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
          students={students}
          loadingStudents={loadingStudents}
          mutationLoading={mutationLoading}
          t={t}
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
          setClassType={value => state.setClassType(value as ClassTypeEnum)}
          mutationLoading={mutationLoading}
          t={t}
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
    students,
    loadingStudents,
    mutationLoading,
    meetingConfigWarning,
    completedClassInstanceId,
    isDialogOpen,
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
          students={students}
          loadingStudents={loadingStudents}
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
