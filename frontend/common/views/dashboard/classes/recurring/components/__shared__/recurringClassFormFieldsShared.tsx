"use client";

import { Box } from "@mui/material";
import { isClassType } from "@/frontend/common/views/dashboard/classes/recurring/components/__shared__/recurringClassFormFieldsShared.helpers";
import {
  PeopleSectionShared,
  TimeAndTimezoneSectionShared,
} from "@/frontend/common/views/dashboard/classes/recurring/components/__shared__/recurringClassFormFieldsShared.peopleSections";
import {
  DurationAndClassTypeSectionShared,
  RateSectionShared,
} from "@/frontend/common/views/dashboard/classes/recurring/components/__shared__/recurringClassFormFieldsShared.rateSections";
import type { RecurringClassFormFieldsSharedOptions } from "@/frontend/common/views/dashboard/classes/recurring/components/__shared__/recurringClassFormFieldsShared.types";
import { SubjectSelectField } from "@/frontend/common/views/dashboard/classes/recurring/components/SubjectSelectField";
import { RecurringMeetingConfigSection } from "@/frontend/common/views/dashboard/classes/recurring/RecurringMeetingConfigSection";
import type { RecurringClassFormFieldsProps } from "@/frontend/common/views/dashboard/classes/recurring/types";

export type { RecurringClassFormFieldsSharedOptions } from "@/frontend/common/views/dashboard/classes/recurring/components/__shared__/recurringClassFormFieldsShared.types";

export function RecurringClassFormFieldsShared({
  register,
  errors,
  watch,
  setValue,
  control,
  isSubmitting,
  labels,
  subjects,
  subjectsLoading,
  meetingConfig,
  meetingConfigValidation,
  onMeetingConfigChangeAction,
  options,
}: RecurringClassFormFieldsProps & {
  readonly options: RecurringClassFormFieldsSharedOptions;
}) {
  const teacherId = watch("teacherId");
  const classType = watch("classType") ?? "";

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
        subjects={subjects}
        loading={subjectsLoading}
        error={errors.subjectId?.message}
        disabled={isSubmitting}
      />

      {teacherId ? (
        <RecurringMeetingConfigSection
          teacherId={teacherId}
          value={meetingConfig}
          onChangeAction={onMeetingConfigChangeAction}
          validation={meetingConfigValidation}
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
