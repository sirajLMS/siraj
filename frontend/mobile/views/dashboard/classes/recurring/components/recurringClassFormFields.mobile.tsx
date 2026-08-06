"use client";

import { ExpandMoreOutlined } from "@mui/icons-material";
import { Box, FormControl, FormHelperText, InputLabel, MenuItem, Select, TextField } from "@mui/material";
import {
  type Control,
  Controller,
  type FieldErrors,
  type UseFormRegister,
  type UseFormSetValue,
  type UseFormWatch,
  useWatch,
} from "react-hook-form";
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
import type { RecurringClassFormLabels } from "@/frontend/common/views/dashboard/classes/recurring/utils/buildRecurringClassFormLabels";
import { CurrencyControllerField } from "@/frontend/common/views/dashboard/profile/shared/CurrencyControllerField";
import { StudentAutocompleteMobile, TeacherAutocompleteMobile } from "@/frontend/mobile/components/ui/input/userSelect";
import { DaysScheduleSectionMobile } from "@/frontend/mobile/views/dashboard/classes/recurring/components/daysScheduleSection.mobile";
import { DurationInputMobile } from "@/frontend/mobile/views/dashboard/classes/recurring/components/durationInput.mobile";
import { TimeInputMobile } from "@/frontend/mobile/views/dashboard/classes/recurring/components/timeInput.mobile";

interface PeopleSectionProps {
  readonly control: Control<RecurringClassFormData>;
  readonly errors: FieldErrors<RecurringClassFormData>;
  readonly isSubmitting: boolean;
  readonly labels: RecurringClassFormLabels;
}

function PeopleSectionMobile({ control, errors, isSubmitting, labels }: PeopleSectionProps) {
  return (
    <Box sx={{ display: "flex", gap: 2, flexDirection: "column" }}>
      <Box sx={{ flex: 1 }}>
        <Controller
          name="studentId"
          control={control}
          render={({ field, fieldState }) => (
            <StudentAutocompleteMobile
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
            <TeacherAutocompleteMobile
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

interface TimeAndTimezoneSectionProps {
  readonly control: Control<RecurringClassFormData>;
  readonly errors: FieldErrors<RecurringClassFormData>;
  readonly isSubmitting: boolean;
  readonly labels: RecurringClassFormLabels;
}

function TimeAndTimezoneSectionMobile({ control, errors, isSubmitting, labels }: TimeAndTimezoneSectionProps) {
  return (
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
  );
}

interface DurationAndClassTypeSectionProps {
  readonly register: import("react-hook-form").UseFormRegister<RecurringClassFormData>;
  readonly errors: FieldErrors<RecurringClassFormData>;
  readonly isSubmitting: boolean;
  readonly classType: string;
  readonly labels: RecurringClassFormLabels;
  readonly onClassTypeChange: (value: string) => void;
}

function DurationAndClassTypeSectionMobile({
  register,
  errors,
  isSubmitting,
  classType,
  labels,
  onClassTypeChange,
}: DurationAndClassTypeSectionProps) {
  return (
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
          onChange={onClassTypeChange}
          options={CLASS_TYPE_OPTIONS.map(opt => ({ value: opt, label: opt }))}
        />
      </Box>
    </Box>
  );
}

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

interface DaysScheduleSectionMobileProps {
  readonly watch: UseFormWatch<RecurringClassFormData>;
  readonly setValue: UseFormSetValue<RecurringClassFormData>;
  readonly errors: FieldErrors<RecurringClassFormData>;
  readonly labels: RecurringClassFormLabels;
}

function DaysScheduleSectionMobileWrapper({ watch, setValue, errors, labels }: DaysScheduleSectionMobileProps) {
  return (
    <DaysScheduleSectionMobile
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
}: RecurringClassFormFieldsProps) {
  const teacherId = watch("teacherId");
  const classType = watch("classType") || "";

  const handleClassTypeChange = (val: string) => {
    setValue("classType", val as RecurringClassFormData["classType"], {
      shouldValidate: true,
    });
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <PeopleSectionMobile control={control} errors={errors} isSubmitting={isSubmitting} labels={labels} />

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

      <TimeAndTimezoneSectionMobile control={control} errors={errors} isSubmitting={isSubmitting} labels={labels} />

      <DurationAndClassTypeSectionMobile
        register={register}
        errors={errors}
        isSubmitting={isSubmitting}
        classType={classType}
        labels={labels}
        onClassTypeChange={handleClassTypeChange}
      />

      <RateSectionMobile register={register} control={control} labels={labels} isSubmitting={isSubmitting} />

      <DaysScheduleSectionMobileWrapper watch={watch} setValue={setValue} errors={errors} labels={labels} />
    </Box>
  );
}

interface RateSectionMobileProps {
  readonly register: UseFormRegister<RecurringClassFormData>;
  readonly control: Control<RecurringClassFormData>;
  readonly labels: RecurringClassFormLabels;
  readonly isSubmitting: boolean;
}

function RateSectionMobile({ register, control, labels, isSubmitting }: RateSectionMobileProps) {
  const rateCurrency = useWatch({ control, name: "rateCurrency" });
  const currencySymbol = rateCurrency ? getCurrencySymbol(rateCurrency) : "";
  return (
    <Box sx={{ display: "flex", gap: 2, flexDirection: "column" }}>
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
      <CurrencyControllerField control={control} name="rateCurrency" label={labels.currencyLabel} />
    </Box>
  );
}
