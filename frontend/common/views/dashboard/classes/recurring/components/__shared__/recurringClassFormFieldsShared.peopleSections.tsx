import { Box } from "@mui/material";
import { Controller } from "react-hook-form";
import { TimezoneSelect } from "@/frontend/common/components/ui/input/timezoneSelect/TimezoneSelect";
import type { PersonOption } from "@/frontend/common/components/ui/input/userSelect";
import { toIanaTimezone } from "@/frontend/common/lib/timezone";
import {
  makeFieldBoxSx,
  makeSectionSx,
} from "@/frontend/common/views/dashboard/classes/recurring/components/__shared__/recurringClassFormFieldsShared.helpers";
import type { SectionSharedProps } from "@/frontend/common/views/dashboard/classes/recurring/components/__shared__/recurringClassFormFieldsShared.types";

export function PeopleSectionShared({ control, errors, labels, isSubmitting, options }: SectionSharedProps) {
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

export function TimeAndTimezoneSectionShared({ control, errors, labels, isSubmitting, options }: SectionSharedProps) {
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
              value={field.value ? toIanaTimezone(field.value) : null}
              onChangeAction={value => {
                field.onChange(value ?? "");
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
