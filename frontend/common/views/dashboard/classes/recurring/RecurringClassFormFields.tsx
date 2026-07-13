"use client";

import { useQuery } from "@apollo/client/react";
import { Box, FormControl, FormHelperText, InputLabel, MenuItem, Select } from "@mui/material";
import { useMemo } from "react";
import type { Control, FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from "react-hook-form";
import { Controller } from "react-hook-form";
import { labelSx, standardInputSx } from "@/frontend/common/components/ui/form";
import { TimezoneSelect } from "@/frontend/common/components/ui/input/timezoneSelect/TimezoneSelect";
import { studentsQueryDocument } from "@/frontend/common/graphql/sharedDocuments/students/student.documents";
import { teachersQueryDocument } from "@/frontend/common/graphql/sharedDocuments/teachers/teacher.documents";
import { fromGraphqlIanaTimezone, toGraphqlIanaTimezone } from "@/frontend/common/lib/timezone";
import { DaysScheduleSection } from "@/frontend/common/views/dashboard/classes/recurring/DaysScheduleSection";
import { DurationInput } from "@/frontend/common/views/dashboard/classes/recurring/DurationInput";
import { EntitySelect } from "@/frontend/common/views/dashboard/classes/recurring/EntitySelect";
import { RecurringMeetingConfigSection } from "@/frontend/common/views/dashboard/classes/recurring/RecurringMeetingConfigSection";
import type { RecurringClassFormData } from "@/frontend/common/views/dashboard/classes/recurring/recurringClassSchema";
import { TimeInput } from "@/frontend/common/views/dashboard/classes/recurring/TimeInput";
import type { SimpleEntity } from "@/frontend/common/views/dashboard/classes/recurring/types";
import { CLASS_TYPE_OPTIONS } from "@/frontend/common/views/dashboard/classes/recurring/types";
import type { RecurringMeetingConfigFormState } from "@/frontend/common/views/dashboard/classes/recurring/utils/postCreateRecurringMeetingConfig";
import type { CreateRecurringClassLabels } from "@/shared/messages/types/message";

interface RecurringClassFormFieldsProps {
  readonly register: UseFormRegister<RecurringClassFormData>;
  readonly errors: FieldErrors<RecurringClassFormData>;
  readonly watch: UseFormWatch<RecurringClassFormData>;
  readonly setValue: UseFormSetValue<RecurringClassFormData>;
  readonly control: Control<RecurringClassFormData>;
  readonly isSubmitting: boolean;
  readonly isMobile: boolean;
  readonly labels: {
    readonly students: string;
    readonly studentsPlaceholder: string;
    readonly teacher: string;
    readonly teacherPlaceholder: string;
    readonly defaultStartTime: string;
    readonly duration: string;
    readonly durationHours: string;
    readonly durationMinutes: string;
    readonly hours: string;
    readonly minutes: string;
    readonly daysSelection: string;
    readonly classSchedule: string;
    readonly weekendOff: string;
    readonly timeOverride: string;
    readonly timezone: string;
    readonly timezonePlaceholder: string;
    readonly classType: string;
    readonly classTypePlaceholder: string;
    readonly days: CreateRecurringClassLabels["days"];
  };
  readonly meetingConfig: RecurringMeetingConfigFormState;
  readonly onMeetingConfigChangeAction: (next: RecurringMeetingConfigFormState) => void;
}

function FormRow({ isMobile, children }: { readonly isMobile: boolean; readonly children: React.ReactNode }) {
  return (
    <Box sx={{ display: "flex", gap: isMobile ? 2 : 3, flexDirection: isMobile ? "column" : "row" }}>{children}</Box>
  );
}

function OptionSelect({
  labelId,
  value,
  label,
  placeholder,
  isSubmitting,
  isMobile,
  error,
  onChange,
  options,
}: {
  readonly labelId: string;
  readonly value: string;
  readonly label: string;
  readonly placeholder: string;
  readonly isSubmitting: boolean;
  readonly isMobile: boolean;
  readonly error?: string;
  readonly onChange: (value: string) => void;
  readonly options: readonly { readonly value: string; readonly label: string }[];
}) {
  return (
    <>
      <Box component="label" sx={labelSx}>
        {label}
      </Box>
      <FormControl fullWidth error={!!error} variant={isMobile ? "outlined" : "standard"}>
        {isMobile && <InputLabel id={labelId}>{placeholder}</InputLabel>}
        <Select
          labelId={labelId}
          value={value}
          label={isMobile ? placeholder : undefined}
          displayEmpty
          disabled={isSubmitting}
          onChange={e => {
            onChange(e.target.value);
          }}
          variant={isMobile ? "outlined" : "standard"}
          sx={isMobile ? { borderRadius: 3 } : standardInputSx}
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

function StudentTeacherRow({
  studentId,
  teacherId,
  students,
  teachers,
  isSubmitting,
  studentsLoading,
  teachersLoading,
  isMobile,
  labels,
  setValue,
  errors,
}: {
  readonly studentId: string;
  readonly teacherId: string;
  readonly students: readonly SimpleEntity[];
  readonly teachers: readonly SimpleEntity[];
  readonly isSubmitting: boolean;
  readonly studentsLoading: boolean;
  readonly teachersLoading: boolean;
  readonly isMobile: boolean;
  readonly labels: RecurringClassFormFieldsProps["labels"];
  readonly setValue: UseFormSetValue<RecurringClassFormData>;
  readonly errors: FieldErrors<RecurringClassFormData>;
}) {
  return (
    <FormRow isMobile={isMobile}>
      <Box sx={{ flex: 1 }}>
        <EntitySelect
          value={studentId}
          entities={students}
          isSubmitting={isSubmitting || studentsLoading}
          isMobile={isMobile}
          label={labels.students}
          placeholder={labels.studentsPlaceholder}
          error={errors.studentId?.message}
          onChange={val => {
            setValue("studentId", val, { shouldValidate: true });
          }}
        />
      </Box>
      <Box sx={{ flex: 1 }}>
        <EntitySelect
          value={teacherId}
          entities={teachers}
          isSubmitting={isSubmitting || teachersLoading}
          isMobile={isMobile}
          label={labels.teacher}
          placeholder={labels.teacherPlaceholder}
          error={errors.teacherId?.message}
          onChange={val => {
            setValue("teacherId", val, { shouldValidate: true });
          }}
        />
      </Box>
    </FormRow>
  );
}

function TimeTimezoneRow({
  control,
  isSubmitting,
  isMobile,
  labels,
  errors,
}: {
  readonly control: Control<RecurringClassFormData>;
  readonly isSubmitting: boolean;
  readonly isMobile: boolean;
  readonly labels: RecurringClassFormFieldsProps["labels"];
  readonly errors: FieldErrors<RecurringClassFormData>;
}) {
  return (
    <FormRow isMobile={isMobile}>
      <Box sx={{ flex: 1 }}>
        <TimeInput
          label={labels.defaultStartTime}
          control={control}
          isSubmitting={isSubmitting}
          isMobile={isMobile}
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
    </FormRow>
  );
}

function DurationClassTypeRow({
  classType,
  register,
  errors,
  isSubmitting,
  isMobile,
  labels,
  setValue,
}: {
  readonly classType: string;
  readonly register: UseFormRegister<RecurringClassFormData>;
  readonly errors: FieldErrors<RecurringClassFormData>;
  readonly isSubmitting: boolean;
  readonly isMobile: boolean;
  readonly labels: RecurringClassFormFieldsProps["labels"];
  readonly setValue: UseFormSetValue<RecurringClassFormData>;
}) {
  return (
    <FormRow isMobile={isMobile}>
      <Box sx={{ flex: 1 }}>
        <DurationInput
          register={register}
          errors={errors}
          isSubmitting={isSubmitting}
          isMobile={isMobile}
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
        <OptionSelect
          labelId="class-type-select-label"
          value={classType}
          label={labels.classType}
          placeholder={labels.classTypePlaceholder}
          isSubmitting={isSubmitting}
          isMobile={isMobile}
          onChange={val => {
            setValue("classType", val as RecurringClassFormData["classType"], { shouldValidate: true });
          }}
          options={CLASS_TYPE_OPTIONS.map(opt => ({ value: opt, label: opt }))}
        />
      </Box>
    </FormRow>
  );
}

export function RecurringClassFormFields({
  register,
  errors,
  watch,
  setValue,
  control,
  isSubmitting,
  isMobile,
  labels,
  meetingConfig,
  onMeetingConfigChangeAction,
}: RecurringClassFormFieldsProps) {
  const studentId = watch("studentId");
  const teacherId = watch("teacherId");
  const classType = watch("classType") || "";

  const { data: studentsData, loading: studentsLoading } = useQuery(studentsQueryDocument, {
    variables: {
      filterArgs: null,
      paginationArgs: { first: 100, skip: 0, after: null, before: null, last: null, maxCount: null, page: null },
      orderBy: null,
    },
  });

  const { data: teachersData, loading: teachersLoading } = useQuery(teachersQueryDocument, {
    variables: { search: "", limit: 50 },
  });

  const students: readonly SimpleEntity[] = useMemo(
    () => studentsData?.students?.data?.map(s => ({ id: s.id ?? "", name: s.name ?? "" })) ?? [],
    [studentsData?.students?.data]
  );

  const teachers: readonly SimpleEntity[] = useMemo(
    () => teachersData?.teachers?.map(t => ({ id: t.id ?? "", name: t.name ?? "" })) ?? [],
    [teachersData?.teachers]
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: isMobile ? 3 : 4 }}>
      <StudentTeacherRow
        studentId={studentId}
        teacherId={teacherId}
        students={students}
        teachers={teachers}
        isSubmitting={isSubmitting}
        studentsLoading={studentsLoading}
        teachersLoading={teachersLoading}
        isMobile={isMobile}
        labels={labels}
        setValue={setValue}
        errors={errors}
      />

      {teacherId ? (
        <RecurringMeetingConfigSection
          teacherId={teacherId}
          value={meetingConfig}
          onChangeAction={onMeetingConfigChangeAction}
          disabled={isSubmitting}
        />
      ) : null}

      <TimeTimezoneRow
        control={control}
        isSubmitting={isSubmitting}
        isMobile={isMobile}
        labels={labels}
        errors={errors}
      />

      <DurationClassTypeRow
        classType={classType}
        register={register}
        errors={errors}
        isSubmitting={isSubmitting}
        isMobile={isMobile}
        labels={labels}
        setValue={setValue}
      />

      <DaysScheduleSection
        watch={watch}
        setValue={setValue}
        errors={errors}
        isMobile={isMobile}
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
