"use client";

import { Box, Grid } from "@mui/material";
import type { Control, FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from "react-hook-form";
import type { StudentGroup } from "@/frontend/stores/createRecurringClassStore";
import type { CreateRecurringClassLabels } from "@/shared/messages/types/message";
import { DaysScheduleSection } from "./DaysScheduleSection";
import { DurationInput } from "./DurationInput";
import type { RecurringClassFormData } from "./recurringClassSchema";
import { StudentGroupSelect } from "./StudentGroupSelect";
import { TimeInput } from "./TimeInput";

interface RecurringClassFormFieldsProps {
  readonly register: UseFormRegister<RecurringClassFormData>;
  readonly errors: FieldErrors<RecurringClassFormData>;
  readonly watch: UseFormWatch<RecurringClassFormData>;
  readonly setValue: UseFormSetValue<RecurringClassFormData>;
  readonly control: Control<RecurringClassFormData>;
  readonly studentGroups: readonly StudentGroup[];
  readonly isSubmitting: boolean;
  readonly isMobile: boolean;
  readonly labels: Pick<
    CreateRecurringClassLabels,
    | "students"
    | "studentsPlaceholder"
    | "defaultStartTime"
    | "duration"
    | "durationHours"
    | "durationMinutes"
    | "hours"
    | "minutes"
    | "daysSelection"
    | "classSchedule"
    | "timeOverride"
    | "weekendOff"
    | "days"
  >;
}

export function RecurringClassFormFields({
  register,
  errors,
  watch,
  setValue,
  control,
  studentGroups,
  isSubmitting,
  isMobile,
  labels,
}: RecurringClassFormFieldsProps) {
  const studentGroupId = watch("studentGroupId");

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: isMobile ? 3 : 4 }}>
      <Grid container spacing={isMobile ? 2 : 3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <StudentGroupSelect
            value={studentGroupId}
            studentGroups={studentGroups}
            isSubmitting={isSubmitting}
            isMobile={isMobile}
            label={labels.students}
            placeholder={labels.studentsPlaceholder}
            error={errors.studentGroupId?.message}
            setValue={setValue}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TimeInput
            label={labels.defaultStartTime}
            control={control}
            isSubmitting={isSubmitting}
            isMobile={isMobile}
            error={errors.defaultStartTime?.message}
          />
        </Grid>
      </Grid>

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
