"use client";

import { ExpandMoreOutlined } from "@mui/icons-material";
import { Box, FormControl, FormHelperText, InputLabel, MenuItem, Select } from "@mui/material";
import { Controller } from "react-hook-form";
import { labelSx } from "@/frontend/common/components/ui/form";
import { TimezoneSelect } from "@/frontend/common/components/ui/input/timezoneSelect/TimezoneSelect";
import { fromGraphqlIanaTimezone, toGraphqlIanaTimezone } from "@/frontend/common/lib/timezone";
import { RecurringMeetingConfigSection } from "@/frontend/common/views/dashboard/classes/recurring/RecurringMeetingConfigSection";
import type { RecurringClassFormData } from "@/frontend/common/views/dashboard/classes/recurring/recurringClassSchema";
import {
  CLASS_TYPE_OPTIONS,
  type RecurringClassFormFieldsProps,
} from "@/frontend/common/views/dashboard/classes/recurring/types";
import { DaysScheduleSectionMobile } from "@/frontend/mobile/views/dashboard/classes/recurring/components/daysScheduleSection.mobile";
import { DurationInputMobile } from "@/frontend/mobile/views/dashboard/classes/recurring/components/durationInput.mobile";
import { EntitySelectMobile } from "@/frontend/mobile/views/dashboard/classes/recurring/components/entitySelect.mobile";
import { TimeInputMobile } from "@/frontend/mobile/views/dashboard/classes/recurring/components/timeInput.mobile";

function OptionSelectMobile({
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
    <>
      <Box component="label" sx={labelSx}>
        {label}
      </Box>
      <FormControl fullWidth error={!!error} variant="outlined">
        <InputLabel id={labelId}>{placeholder}</InputLabel>
        <Select
          labelId={labelId}
          value={value}
          label={placeholder}
          displayEmpty
          disabled={isSubmitting}
          onChange={e => {
            onChange(e.target.value);
          }}
          IconComponent={ExpandMoreOutlined}
          variant="outlined"
          sx={{ borderRadius: 3 }}
        >
          <MenuItem value="">
            <em>{placeholder}</em>
          </MenuItem>
          {options.map(opt => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </Select>
        {error && <FormHelperText>{error}</FormHelperText>}
      </FormControl>
    </>
  );
}

export function RecurringClassFormFieldsMobile({
  register,
  errors,
  watch,
  setValue,
  control,
  isSubmitting,
  labels,
  meetingConfig,
  onMeetingConfigChangeAction,
  students,
  teachers,
  studentsLoading,
  teachersLoading,
}: RecurringClassFormFieldsProps) {
  const studentId = watch("studentId");
  const teacherId = watch("teacherId");
  const classType = watch("classType") || "";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box sx={{ display: "flex", gap: 2, flexDirection: "column" }}>
        <Box sx={{ flex: 1 }}>
          <EntitySelectMobile
            value={studentId}
            entities={students}
            isSubmitting={isSubmitting || studentsLoading}
            label={labels.students}
            placeholder={labels.studentsPlaceholder}
            error={errors.studentId?.message}
            onChange={val => {
              setValue("studentId", val, { shouldValidate: true });
            }}
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <EntitySelectMobile
            value={teacherId}
            entities={teachers}
            isSubmitting={isSubmitting || teachersLoading}
            label={labels.teacher}
            placeholder={labels.teacherPlaceholder}
            error={errors.teacherId?.message}
            onChange={val => {
              setValue("teacherId", val, { shouldValidate: true });
            }}
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

      <Box sx={{ display: "flex", gap: 2, flexDirection: "column" }}>
        <Box sx={{ flex: 1 }}>
          <TimeInputMobile
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

      <Box sx={{ display: "flex", gap: 2, flexDirection: "column" }}>
        <Box sx={{ flex: 1 }}>
          <DurationInputMobile
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
        <Box sx={{ flex: 1 }}>
          <OptionSelectMobile
            labelId="class-type-select-label"
            value={classType}
            label={labels.classType}
            placeholder={labels.classTypePlaceholder}
            isSubmitting={isSubmitting}
            onChange={val => {
              setValue("classType", val as RecurringClassFormData["classType"], {
                shouldValidate: true,
              });
            }}
            options={CLASS_TYPE_OPTIONS.map(opt => ({ value: opt, label: opt }))}
          />
        </Box>
      </Box>

      <DaysScheduleSectionMobile
        watch={watch}
        setValue={setValue}
        errors={errors}
        labels={{
          daysSelection: labels.daysSelection,
          classSchedule: labels.classSchedule,
          weekendOff: labels.weekendOff,
          timeOverride: labels.timeOverride,
          days: labels.days,
        }}
      />
    </Box>
  );
}
