"use client";

import { ExpandMoreOutlined } from "@mui/icons-material";
import { Box, FormControl, FormHelperText, InputLabel, MenuItem, Select } from "@mui/material";
import { Controller } from "react-hook-form";
import { outlinedInputSx } from "@/frontend/common/components/ui/form";
import type { PersonOption } from "@/frontend/common/components/ui/input/userSelect";
import { TimezoneSelect } from "@/frontend/common/components/ui/input/timezoneSelect/TimezoneSelect";
import { fromGraphqlIanaTimezone, toGraphqlIanaTimezone } from "@/frontend/common/lib/timezone";
import { RecurringMeetingConfigSection } from "@/frontend/common/views/dashboard/classes/recurring/RecurringMeetingConfigSection";
import type { RecurringClassFormData } from "@/frontend/common/views/dashboard/classes/recurring/recurringClassSchema";
import {
  CLASS_TYPE_OPTIONS,
  type RecurringClassFormFieldsProps,
} from "@/frontend/common/views/dashboard/classes/recurring/types";
import { DaysScheduleSectionDesktop } from "@/frontend/desktop/views/dashboard/classes/recurring/components/daysScheduleSection.desktop";
import { DurationInputDesktop } from "@/frontend/desktop/views/dashboard/classes/recurring/components/durationInput.desktop";
import { TimeInputDesktop } from "@/frontend/desktop/views/dashboard/classes/recurring/components/timeInput.desktop";
import {
  StudentAutocompleteDesktop,
  TeacherAutocompleteDesktop,
} from "@/frontend/desktop/components/ui/input/userSelect";

function OptionSelectDesktop({
  labelId,
  value,
  label,
  placeholder,
  isSubmitting,
  error,
  onChange,
  options,
}: {
  readonly labelId: string;
  readonly value: string;
  readonly label: string;
  readonly placeholder: string;
  readonly isSubmitting: boolean;
  readonly error?: string;
  readonly onChange: (value: string) => void;
  readonly options: readonly { readonly value: string; readonly label: string }[];
}) {
  return (
    <FormControl fullWidth error={!!error} sx={outlinedInputSx}>
      <InputLabel id={labelId} shrink>
        {label}
      </InputLabel>
      <Select
        labelId={labelId}
        label={label}
        value={value}
        displayEmpty
        disabled={isSubmitting}
        onChange={e => {
          onChange(e.target.value);
        }}
        IconComponent={ExpandMoreOutlined}
        variant="outlined"
      >
        <MenuItem value="" disabled>
          {placeholder}
        </MenuItem>
        {options.map(opt => (
          <MenuItem key={opt.value} value={opt.value}>
            {opt.label}
          </MenuItem>
        ))}
      </Select>
      {error && <FormHelperText>{error}</FormHelperText>}
    </FormControl>
  );
}

export function RecurringClassFormFieldsDesktop({
  register,
  errors,
  watch,
  setValue,
  control,
  isSubmitting,
  labels,
  meetingConfig,
  onMeetingConfigChangeAction,
}: RecurringClassFormFieldsProps) {
  const teacherId = watch("teacherId");
  const classType = watch("classType") || "";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <Box sx={{ display: "flex", gap: 3, flexDirection: "row" }}>
        <Box sx={{ flex: 1 }}>
          <Controller
            name="studentId"
            control={control}
            render={({ field, fieldState }) => (
              <StudentAutocompleteDesktop
                value={field.value ? ({ id: field.value, name: "" } satisfies PersonOption) : null}
                onChange={option => {
                  field.onChange(option?.id ?? "");
                }}
                label={labels.students}
                placeholder={labels.studentsPlaceholder}
                error={Boolean(fieldState.error ?? errors.studentId)}
                helperText={fieldState.error?.message ?? errors.studentId?.message}
                disabled={isSubmitting}
              />
            )}
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Controller
            name="teacherId"
            control={control}
            render={({ field, fieldState }) => (
              <TeacherAutocompleteDesktop
                value={field.value ? ({ id: field.value, name: "" } satisfies PersonOption) : null}
                onChange={option => {
                  field.onChange(option?.id ?? "");
                }}
                label={labels.teacher}
                placeholder={labels.teacherPlaceholder}
                error={Boolean(fieldState.error ?? errors.teacherId)}
                helperText={fieldState.error?.message ?? errors.teacherId?.message}
                disabled={isSubmitting}
              />
            )}
          />
        </Box>
      </Box>

      {teacherId ? (
        <RecurringMeetingConfigSection
          teacherId={teacherId}
          value={meetingConfig}
          onChangeAction={onMeetingConfigChangeAction}
          disabled={isSubmitting}
        />
      ) : null}

      <Box sx={{ display: "flex", gap: 3, flexDirection: "row" }}>
        <Box sx={{ flex: 1 }}>
          <TimeInputDesktop
            label={labels.defaultStartTime}
            control={control}
            isSubmitting={isSubmitting}
            error={errors.defaultStartTime?.message}
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Controller
            name="timezone"
            control={control}
            render={({ field }) => (
              <TimezoneSelect
                value={field.value ? toGraphqlIanaTimezone(field.value) : null}
                onChangeAction={value => {
                  field.onChange(value ? fromGraphqlIanaTimezone(value) : "");
                }}
                onBlurAction={field.onBlur}
                label={labels.timezone}
                required
                error={!!errors.timezone}
                helperText={errors.timezone?.message}
                fullWidth
                disabled={isSubmitting}
              />
            )}
          />
        </Box>
      </Box>

      <Box sx={{ display: "flex", gap: 3, flexDirection: "row", alignItems: "flex-start" }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <DurationInputDesktop
            register={register}
            errors={errors}
            isSubmitting={isSubmitting}
            labels={{
              duration: labels.duration,
              durationHours: labels.durationHours,
              durationMinutes: labels.durationMinutes,
              hours: labels.hours,
              minutes: labels.minutes,
            }}
          />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <OptionSelectDesktop
            labelId="class-type-select-label"
            value={classType}
            label={labels.classType}
            placeholder={labels.classTypePlaceholder}
            isSubmitting={isSubmitting}
            onChange={val => {
              setValue("classType", val as RecurringClassFormData["classType"], { shouldValidate: true });
            }}
            options={CLASS_TYPE_OPTIONS.map(opt => ({ value: opt, label: opt }))}
          />
        </Box>
      </Box>

      <DaysScheduleSectionDesktop
        watch={watch}
        setValue={setValue}
        errors={errors}
        labels={{
          daysSelection: labels.daysSelection,
          classSchedule: labels.classSchedule,
          timeOverride: labels.timeOverride,
          days: labels.days,
        }}
      />
    </Box>
  );
}
