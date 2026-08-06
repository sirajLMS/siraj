"use client";

import { ExpandMoreOutlined } from "@mui/icons-material";
import { Box, FormControl, FormHelperText, InputLabel, MenuItem, Select, TextField } from "@mui/material";
import { Controller, type UseFormRegister, useWatch } from "react-hook-form";
import { outlinedInputSx } from "@/frontend/common/components/ui/form";
import { TimezoneSelect } from "@/frontend/common/components/ui/input/timezoneSelect/TimezoneSelect";
import type { PersonOption } from "@/frontend/common/components/ui/input/userSelect";
import { getCurrencySymbol } from "@/frontend/common/lib/currency";
import { fromGraphqlIanaTimezone, toGraphqlIanaTimezone } from "@/frontend/common/lib/timezone";
import { SubjectSelectField } from "@/frontend/common/views/dashboard/classes/recurring/components/SubjectSelectField";
import { RecurringMeetingConfigSection } from "@/frontend/common/views/dashboard/classes/recurring/RecurringMeetingConfigSection";
import type { RecurringClassFormData } from "@/frontend/common/views/dashboard/classes/recurring/recurringClassSchema";
import {
  CLASS_TYPE_OPTIONS,
  type RecurringClassFormFieldsProps,
} from "@/frontend/common/views/dashboard/classes/recurring/types";
import { CurrencyControllerField } from "@/frontend/common/views/dashboard/profile/shared/CurrencyControllerField";
import {
  StudentAutocompleteDesktop,
  TeacherAutocompleteDesktop,
} from "@/frontend/desktop/components/ui/input/userSelect";
import { DaysScheduleSectionDesktop } from "@/frontend/desktop/views/dashboard/classes/recurring/components/daysScheduleSection.desktop";
import { DurationInputDesktop } from "@/frontend/desktop/views/dashboard/classes/recurring/components/durationInput.desktop";
import { TimeInputDesktop } from "@/frontend/desktop/views/dashboard/classes/recurring/components/timeInput.desktop";

interface OptionSelectDesktopProps {
  readonly labelId: string;
  readonly value: string;
  readonly label: string;
  readonly placeholder: string;
  readonly isSubmitting: boolean;
  readonly error?: string;
  readonly onChange: (value: string) => void;
  readonly options: readonly { readonly value: string; readonly label: string }[];
}

function OptionSelectDesktop({
  labelId,
  value,
  label,
  placeholder,
  isSubmitting,
  error,
  onChange,
  options,
}: OptionSelectDesktopProps) {
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

interface PeopleSectionDesktopProps {
  readonly control: RecurringClassFormFieldsProps["control"];
  readonly errors: RecurringClassFormFieldsProps["errors"];
  readonly labels: RecurringClassFormFieldsProps["labels"];
  readonly isSubmitting: boolean;
}

function PeopleSectionDesktop({ control, errors, labels, isSubmitting }: PeopleSectionDesktopProps) {
  return (
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
  );
}

interface MeetingConfigSectionDesktopProps {
  readonly teacherId: string | undefined;
  readonly meetingConfig: RecurringClassFormFieldsProps["meetingConfig"];
  readonly onMeetingConfigChangeAction: RecurringClassFormFieldsProps["onMeetingConfigChangeAction"];
  readonly isSubmitting: boolean;
}

function MeetingConfigSectionDesktop({
  teacherId,
  meetingConfig,
  onMeetingConfigChangeAction,
  isSubmitting,
}: MeetingConfigSectionDesktopProps) {
  if (!teacherId) {
    return null;
  }
  return (
    <RecurringMeetingConfigSection
      teacherId={teacherId}
      value={meetingConfig}
      onChangeAction={onMeetingConfigChangeAction}
      disabled={isSubmitting}
    />
  );
}

interface TimeAndTimezoneSectionDesktopProps {
  readonly control: RecurringClassFormFieldsProps["control"];
  readonly errors: RecurringClassFormFieldsProps["errors"];
  readonly labels: RecurringClassFormFieldsProps["labels"];
  readonly isSubmitting: boolean;
}

function TimeAndTimezoneSectionDesktop({ control, errors, labels, isSubmitting }: TimeAndTimezoneSectionDesktopProps) {
  return (
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
  );
}

interface DurationAndClassTypeSectionDesktopProps {
  readonly register: RecurringClassFormFieldsProps["register"];
  readonly errors: RecurringClassFormFieldsProps["errors"];
  readonly labels: RecurringClassFormFieldsProps["labels"];
  readonly isSubmitting: boolean;
  readonly classType: string;
  readonly onClassTypeChange: (value: string) => void;
}

function DurationAndClassTypeSectionDesktop({
  register,
  errors,
  labels,
  isSubmitting,
  classType,
  onClassTypeChange,
}: DurationAndClassTypeSectionDesktopProps) {
  return (
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
          onChange={onClassTypeChange}
          options={CLASS_TYPE_OPTIONS.map(opt => ({ value: opt, label: opt }))}
        />
      </Box>
    </Box>
  );
}

interface RateSectionDesktopProps {
  readonly register: UseFormRegister<RecurringClassFormData>;
  readonly control: RecurringClassFormFieldsProps["control"];
  readonly labels: RecurringClassFormFieldsProps["labels"];
  readonly isSubmitting: boolean;
}

function RateSectionDesktop({ register, control, labels, isSubmitting }: RateSectionDesktopProps) {
  const rateCurrency = useWatch({ control, name: "rateCurrency" });
  const currencySymbol = rateCurrency ? getCurrencySymbol(rateCurrency) : "";
  return (
    <Box sx={{ display: "flex", gap: 3, flexDirection: "row", alignItems: "flex-start" }}>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <TextField
          label={labels.hourlyRateLabel}
          fullWidth
          size="small"
          disabled={isSubmitting}
          {...register("hourlyRate")}
          slotProps={{
            input: {
              startAdornment: <span aria-hidden>{currencySymbol}</span>,
            },
          }}
        />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <CurrencyControllerField control={control} name="rateCurrency" label={labels.currencyLabel} />
      </Box>
    </Box>
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
      <PeopleSectionDesktop control={control} errors={errors} labels={labels} isSubmitting={isSubmitting} />

      <SubjectSelectField
        name="subjectId"
        control={control}
        label={labels.subject}
        placeholder={labels.subjectPlaceholder}
        error={errors.subjectId?.message}
        disabled={isSubmitting}
      />

      <MeetingConfigSectionDesktop
        teacherId={teacherId}
        meetingConfig={meetingConfig}
        onMeetingConfigChangeAction={onMeetingConfigChangeAction}
        isSubmitting={isSubmitting}
      />

      <TimeAndTimezoneSectionDesktop control={control} errors={errors} labels={labels} isSubmitting={isSubmitting} />

      <DurationAndClassTypeSectionDesktop
        register={register}
        errors={errors}
        labels={labels}
        isSubmitting={isSubmitting}
        classType={classType}
        onClassTypeChange={val => {
          setValue("classType", val as RecurringClassFormData["classType"], { shouldValidate: true });
        }}
      />

      <RateSectionDesktop register={register} control={control} labels={labels} isSubmitting={isSubmitting} />

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
