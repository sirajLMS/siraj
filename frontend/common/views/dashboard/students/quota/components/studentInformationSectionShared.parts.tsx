"use client";

import { Box, FormHelperText, TextField, Typography } from "@mui/material";
import { format, isValid } from "date-fns";
import { Controller, useFormContext } from "react-hook-form";
import { quotaInputSx } from "@/frontend/common/views/dashboard/students/quota/components/quotaFieldStyles";
import {
  DATE_FORMAT,
  noopGenderSelection,
  parseDateValue,
  toAppLanguage,
  toFormGender,
} from "@/frontend/common/views/dashboard/students/quota/components/studentInformationSectionShared.helpers";
import type { StudentInformationSectionSlotProps } from "@/frontend/common/views/dashboard/students/quota/components/studentInformationSectionShared.types";
import type { StudentQuotaFormData } from "@/frontend/common/views/dashboard/students/quota/schemas/studentQuotaSchema";
import { useQuotaFormAccess } from "@/frontend/common/views/dashboard/students/quota/useQuotaFormAccess";

export function StudentNameField() {
  const { labels: t } = useQuotaFormAccess();
  const {
    control,
    formState: { errors },
  } = useFormContext<StudentQuotaFormData>();
  return (
    <Controller
      name="studentName"
      control={control}
      render={({ field }) => (
        <TextField
          {...field}
          label={t.fields.studentName}
          placeholder={t.fields.studentNamePlaceholder}
          variant="outlined"
          fullWidth
          disabled
          error={Boolean(errors.studentName)}
          helperText={errors.studentName?.message}
          sx={quotaInputSx}
        />
      )}
    />
  );
}

export function DateOfBirthField({
  DatePicker,
}: Readonly<{ DatePicker: StudentInformationSectionSlotProps["DatePicker"] }>) {
  const { labels: t } = useQuotaFormAccess();
  const {
    control,
    formState: { errors },
  } = useFormContext<StudentQuotaFormData>();
  return (
    <Controller
      name="dateOfBirth"
      control={control}
      render={({ field }) => (
        <DatePicker
          value={parseDateValue(field.value)}
          onChange={(date: Date | null) => {
            field.onChange(date && isValid(date) ? format(date, DATE_FORMAT) : "");
          }}
          slotProps={{
            textField: {
              label: t.fields.dateOfBirth,
              variant: "outlined",
              fullWidth: true,
              disabled: true,
              error: Boolean(errors.dateOfBirth),
              helperText: errors.dateOfBirth?.message,
              sx: quotaInputSx,
              slotProps: { htmlInput: { autoComplete: "off" } },
            },
          }}
        />
      )}
    />
  );
}

export function LanguageField({
  LanguageDisplay,
}: Readonly<{ LanguageDisplay: StudentInformationSectionSlotProps["LanguageDisplay"] }>) {
  const { labels: t } = useQuotaFormAccess();
  const {
    control,
    formState: { errors },
  } = useFormContext<StudentQuotaFormData>();
  return (
    <Controller
      name="language"
      control={control}
      render={({ field }) => (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          <Typography variant="labelUppercase" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
            {t.fields.language}
          </Typography>
          <LanguageDisplay code={toAppLanguage(field.value)} fallback={t.common.notSet} />
          {errors.language?.message ? <FormHelperText error>{errors.language.message}</FormHelperText> : null}
        </Box>
      )}
    />
  );
}

export function GenderField({
  GenderSelector,
  genderFieldPx,
}: Readonly<{
  GenderSelector: StudentInformationSectionSlotProps["GenderSelector"];
  genderFieldPx: number;
}>) {
  const { labels: t } = useQuotaFormAccess();
  const {
    control,
    formState: { errors },
  } = useFormContext<StudentQuotaFormData>();
  return (
    <Controller
      name="gender"
      control={control}
      render={({ field }) => {
        const gender = toFormGender(field.value);

        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, px: genderFieldPx }}>
            {gender ? (
              <GenderSelector
                gender={gender}
                setGenderAction={noopGenderSelection}
                error={Boolean(errors.gender)}
                fullWidth
                labels={{ title: t.fields.gender, male: t.fields.male, female: t.fields.female }}
              />
            ) : (
              <Box>
                <Typography variant="labelUppercase" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                  {t.fields.gender}
                </Typography>
                <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant, py: 1.5 })}>
                  {t.common.notSet}
                </Typography>
              </Box>
            )}
            {errors.gender ? <FormHelperText>{errors.gender.message}</FormHelperText> : null}
          </Box>
        );
      }}
    />
  );
}
