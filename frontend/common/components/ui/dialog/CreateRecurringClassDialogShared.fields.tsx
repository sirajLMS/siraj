"use client";

import { Box, FormControl, InputLabel, MenuItem, Select, Stack, TextField } from "@mui/material";
import type {
  CreateRecurringClassStudentSelectSlotProps,
  CreateRecurringClassTimezoneSelectSlot,
} from "@/frontend/common/components/ui/dialog/types/createRecurringClassDialogShared.types";
import { SubjectSelect } from "@/frontend/common/views/dashboard/classes/recurring/components/SubjectSelectField";
import { CLASS_TYPE_OPTIONS, type ClassSubjectOption } from "@/frontend/common/views/dashboard/classes/recurring/types";
import { buildClassTypeLabels } from "@/frontend/common/views/dashboard/teachers/schedule/weekly/constants";
import type { CreateRecurringClassDialogFormState } from "@/frontend/common/views/dashboard/teachers/schedule/weekly/hooks";
import type { IanaTimezone } from "@/shared/constants/iana-timezone.enum";
import type { TeacherCreateRecurringClassLabels } from "@/shared/locale";

/** Duration and default start-time inputs, laid out in a tier-provided direction. */
export function DurationTimeFields({
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

/** Timezone selector paired with the class-type select in a tier-provided direction. */
export function TimezoneClassTypeFields({
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
  readonly timezone: IanaTimezone;
  readonly setTimezone: (value: IanaTimezone) => void;
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
      value={timezone}
      onChangeAction={value => {
        if (value) {
          setTimezone(value);
        }
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

/** Student picker and subject picker, both owned by the dialog form state. */
export function StudentSubjectFields({
  teacherId,
  state,
  isDialogOpen,
  mutationLoading,
  t,
  StudentSelect,
  subjects,
  subjectsLoading,
}: {
  readonly teacherId: string;
  readonly state: CreateRecurringClassDialogFormState;
  readonly isDialogOpen: boolean;
  readonly mutationLoading: boolean;
  readonly t: TeacherCreateRecurringClassLabels;
  readonly StudentSelect: React.ComponentType<Readonly<CreateRecurringClassStudentSelectSlotProps>>;
  readonly subjects: readonly ClassSubjectOption[];
  readonly subjectsLoading: boolean;
}) {
  return (
    <>
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
        subjects={subjects}
        loading={subjectsLoading}
        disabled={mutationLoading}
      />
    </>
  );
}
