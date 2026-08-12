"use client";

import { ExpandMoreOutlined } from "@mui/icons-material";
import { Box, FormControl, FormHelperText, InputLabel, MenuItem, Select, TextField } from "@mui/material";
import type { ComponentType } from "react";
import { type Control, Controller, type FieldErrors, type UseFormRegister, useWatch } from "react-hook-form";
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
  type ClassType,
  type DaysScheduleSectionProps,
  type DurationInputProps,
  type RecurringClassFormFieldsProps,
  type TimeInputProps,
} from "@/frontend/common/views/dashboard/classes/recurring/types";
import type { RecurringClassFormLabels } from "@/frontend/common/views/dashboard/classes/recurring/utils/buildRecurringClassFormLabels";
import { CurrencyControllerField } from "@/frontend/common/views/dashboard/profile/shared/CurrencyControllerField";

const VALID_CLASS_TYPES: ReadonlySet<string> = new Set(CLASS_TYPE_OPTIONS);

function isClassType(value: string): value is ClassType {
  return VALID_CLASS_TYPES.has(value);
}

export interface RecurringClassFormFieldsSharedOptions {
  readonly layoutGap: number;
  readonly sectionDirection: "row" | "column";
  readonly sectionGap: number;
  readonly sectionAlignItems?: "flex-start" | "stretch";
  readonly StudentAutocomplete: ComponentType<{
    readonly value: PersonOption | null;
    readonly onChange: (option: PersonOption | null) => void;
    readonly label: string;
    readonly placeholder: string;
    readonly error: boolean;
    readonly helperText?: string;
    readonly disabled: boolean;
  }>;
  readonly TeacherAutocomplete: ComponentType<{
    readonly value: PersonOption | null;
    readonly onChange: (option: PersonOption | null) => void;
    readonly label: string;
    readonly placeholder: string;
    readonly error: boolean;
    readonly helperText?: string;
    readonly disabled: boolean;
  }>;
  readonly TimeInput: ComponentType<TimeInputProps>;
  readonly DurationInput: ComponentType<DurationInputProps>;
  readonly DaysScheduleSection: ComponentType<DaysScheduleSectionProps>;
}

function OptionSelectShared({
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

function makeFieldBoxSx() {
  return { flex: 1, minWidth: 0 };
}

function makeSectionSx(options: RecurringClassFormFieldsSharedOptions) {
  return {
    display: "flex",
    gap: options.sectionGap,
    flexDirection: options.sectionDirection,
  };
}

interface SectionSharedProps {
  readonly control: Control<RecurringClassFormData>;
  readonly errors: FieldErrors<RecurringClassFormData>;
  readonly labels: RecurringClassFormLabels;
  readonly isSubmitting: boolean;
  readonly options: RecurringClassFormFieldsSharedOptions;
}

function PeopleSectionShared({ control, errors, labels, isSubmitting, options }: SectionSharedProps) {
  const fieldBoxSx = makeFieldBoxSx();
  return (
    <Box sx={makeSectionSx(options)}>
      <Box sx={fieldBoxSx}>
        <Controller
          name="studentId"
          control={control}
          render={({ field, fieldState }) => (
            <options.StudentAutocomplete
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
      <Box sx={fieldBoxSx}>
        <Controller
          name="teacherId"
          control={control}
          render={({ field, fieldState }) => (
            <options.TeacherAutocomplete
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

function TimeAndTimezoneSectionShared({ control, errors, labels, isSubmitting, options }: SectionSharedProps) {
  const fieldBoxSx = makeFieldBoxSx();
  return (
    <Box sx={makeSectionSx(options)}>
      <Box sx={fieldBoxSx}>
        <options.TimeInput
          label={labels.defaultStartTime}
          control={control}
          isSubmitting={isSubmitting}
          error={errors.defaultStartTime?.message}
        />
      </Box>
      <Box sx={fieldBoxSx}>
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

function DurationAndClassTypeSectionShared({
  register,
  errors,
  labels,
  isSubmitting,
  classType,
  onClassTypeChange,
  options,
}: {
  readonly register: UseFormRegister<RecurringClassFormData>;
  readonly errors: FieldErrors<RecurringClassFormData>;
  readonly labels: RecurringClassFormLabels;
  readonly isSubmitting: boolean;
  readonly classType: string;
  readonly onClassTypeChange: (value: string) => void;
  readonly options: RecurringClassFormFieldsSharedOptions;
}) {
  const fieldBoxSx = makeFieldBoxSx();
  return (
    <Box
      sx={{
        ...makeSectionSx(options),
        ...(options.sectionAlignItems ? { alignItems: options.sectionAlignItems } : {}),
      }}
    >
      <Box sx={fieldBoxSx}>
        <options.DurationInput
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
      <Box sx={fieldBoxSx}>
        <OptionSelectShared
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

function RateSectionShared({
  register,
  control,
  labels,
  isSubmitting,
  options,
}: {
  readonly register: UseFormRegister<RecurringClassFormData>;
  readonly control: Control<RecurringClassFormData>;
  readonly labels: RecurringClassFormLabels;
  readonly isSubmitting: boolean;
  readonly options: RecurringClassFormFieldsSharedOptions;
}) {
  const rateCurrency = useWatch({ control, name: "rateCurrency" });
  const currencySymbol = rateCurrency ? getCurrencySymbol(rateCurrency) : "";
  const fieldBoxSx = makeFieldBoxSx();
  return (
    <Box
      sx={{
        ...makeSectionSx(options),
        ...(options.sectionAlignItems ? { alignItems: options.sectionAlignItems } : {}),
      }}
    >
      <Box sx={fieldBoxSx}>
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
      <Box sx={fieldBoxSx}>
        <CurrencyControllerField control={control} name="rateCurrency" label={labels.currencyLabel} />
      </Box>
    </Box>
  );
}

export function RecurringClassFormFieldsShared({
  register,
  errors,
  watch,
  setValue,
  control,
  isSubmitting,
  labels,
  meetingConfig,
  onMeetingConfigChangeAction,
  options,
}: RecurringClassFormFieldsProps & {
  readonly options: RecurringClassFormFieldsSharedOptions;
}) {
  const teacherId = watch("teacherId");
  const classType = watch("classType") || "";

  const handleClassTypeChange = (val: string) => {
    if (isClassType(val)) {
      setValue("classType", val, {
        shouldValidate: true,
      });
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: options.layoutGap }}>
      <PeopleSectionShared
        control={control}
        errors={errors}
        labels={labels}
        isSubmitting={isSubmitting}
        options={options}
      />

      <SubjectSelectField
        name="subjectId"
        control={control}
        label={labels.subject}
        placeholder={labels.subjectPlaceholder}
        error={errors.subjectId?.message}
        disabled={isSubmitting}
      />

      {teacherId ? (
        <RecurringMeetingConfigSection
          teacherId={teacherId}
          value={meetingConfig}
          onChangeAction={onMeetingConfigChangeAction}
          disabled={isSubmitting}
        />
      ) : null}

      <TimeAndTimezoneSectionShared
        control={control}
        errors={errors}
        labels={labels}
        isSubmitting={isSubmitting}
        options={options}
      />

      <DurationAndClassTypeSectionShared
        register={register}
        errors={errors}
        labels={labels}
        isSubmitting={isSubmitting}
        classType={classType}
        onClassTypeChange={handleClassTypeChange}
        options={options}
      />

      <RateSectionShared
        register={register}
        control={control}
        labels={labels}
        isSubmitting={isSubmitting}
        options={options}
      />

      <options.DaysScheduleSection
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
