"use client";

import { Box, TextField, Typography } from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";
import type { PersonOption } from "@/frontend/common/components/ui/input/userSelect";
import type { CourseDetailsSectionSharedProps } from "@/frontend/common/views/dashboard/students/quota/components/courseDetailsSectionShared.types";
import { quotaInputSx } from "@/frontend/common/views/dashboard/students/quota/components/quotaFieldStyles";
import type { StudentQuotaFormData } from "@/frontend/common/views/dashboard/students/quota/schemas/studentQuotaSchema";
import { useQuotaFormAccess } from "@/frontend/common/views/dashboard/students/quota/useQuotaFormAccess";

export function TeacherField({
  TeacherAutocomplete,
}: Readonly<{
  TeacherAutocomplete: CourseDetailsSectionSharedProps["slots"]["TeacherAutocomplete"];
}>) {
  const { labels: t, canViewTeacher } = useQuotaFormAccess();
  const {
    control,
    formState: { errors },
  } = useFormContext<StudentQuotaFormData>();

  if (!canViewTeacher) {
    return null;
  }

  return (
    <Controller
      name="teacher"
      control={control}
      render={({ field }) => {
        const currentValue = field.value ?? "";
        const selectedOption: PersonOption | null =
          currentValue === "" ? null : { id: currentValue, name: currentValue };

        return (
          <TeacherAutocomplete
            value={selectedOption}
            onChange={(next: PersonOption | null) => {
              field.onChange(next?.name ?? "");
            }}
            label={t.fields.teacher}
            error={Boolean(errors.teacher)}
            helperText={errors.teacher?.message}
            disabled
            fullWidth
            sx={quotaInputSx}
          />
        );
      }}
    />
  );
}

export function TotalClassesField() {
  const { labels: t, canViewTeacher } = useQuotaFormAccess();
  const {
    control,
    formState: { errors },
  } = useFormContext<StudentQuotaFormData>();

  if (!canViewTeacher) {
    return null;
  }

  return (
    <Controller
      name="totalClasses"
      control={control}
      render={({ field }) => (
        <TextField
          {...field}
          label={t.fields.totalClasses}
          type="number"
          variant="outlined"
          fullWidth
          disabled
          error={Boolean(errors.totalClasses)}
          helperText={errors.totalClasses?.message}
          sx={quotaInputSx}
        />
      )}
    />
  );
}

export function ClassesLeftField({
  overrideEndAdornment,
  overrideNotice,
  classesLeftInputSx,
}: Readonly<{
  overrideEndAdornment: CourseDetailsSectionSharedProps["slots"]["overrideEndAdornment"];
  overrideNotice: CourseDetailsSectionSharedProps["slots"]["overrideNotice"];
  classesLeftInputSx: CourseDetailsSectionSharedProps["slots"]["classesLeftInputSx"];
}>) {
  const { labels: t, readOnly, canEditQuota, canViewQuota } = useQuotaFormAccess();
  const {
    control,
    formState: { errors },
  } = useFormContext<StudentQuotaFormData>();
  const fieldDisabled = readOnly || !canEditQuota;

  if (!canViewQuota) {
    return null;
  }

  const EndAdornmentIcon = overrideEndAdornment.icon;
  const OverrideNoticeIcon = overrideNotice.icon;

  return (
    <Box>
      <Controller
        name="classesLeft"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label={t.fields.classesLeft}
            type="number"
            variant="outlined"
            fullWidth
            disabled={fieldDisabled}
            error={Boolean(errors.classesLeft)}
            helperText={errors.classesLeft?.message}
            slotProps={{
              input: {
                endAdornment: fieldDisabled ? undefined : (
                  <Box sx={overrideEndAdornment.boxSx}>
                    <EndAdornmentIcon sx={{ fontSize: overrideEndAdornment.iconFontSize }} />
                    <Typography variant="labelSm" sx={overrideEndAdornment.typographySx}>
                      {t.fields.overrideActive}
                    </Typography>
                  </Box>
                ),
              },
            }}
            sx={classesLeftInputSx}
          />
        )}
      />
      {fieldDisabled ? null : (
        <Typography variant="bodyMd" sx={overrideNotice.sx}>
          {OverrideNoticeIcon ? <OverrideNoticeIcon sx={{ fontSize: overrideNotice.iconFontSize, mt: 0.5 }} /> : null}
          {t.fields.overrideNotice}
        </Typography>
      )}
    </Box>
  );
}
