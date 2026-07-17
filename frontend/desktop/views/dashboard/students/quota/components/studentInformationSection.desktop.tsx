"use client";

import { BadgeOutlined } from "@mui/icons-material";
import {
  Box,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from "@mui/material";
import { format, isValid, parse } from "date-fns";
import { Controller, useFormContext } from "react-hook-form";
import { LanguageDisplay } from "@/frontend/common/components/ui/display";
import { AppDatePicker } from "@/frontend/common/components/ui/form";
import { ProfileRestrictedSection } from "@/frontend/common/views/dashboard/profile/shared/sections/ProfileRestrictedSection";
import { useStudentFieldAccess } from "@/frontend/common/views/dashboard/students/profile/useStudentFieldAccess";
import { quotaInputSx } from "@/frontend/common/views/dashboard/students/quota/components/quotaFieldStyles";
import type { StudentQuotaFormData } from "@/frontend/common/views/dashboard/students/quota/schemas/studentQuotaSchema";
import { GENDER_OPTIONS } from "@/frontend/common/views/dashboard/students/quota/types";
import { QuotaFormFieldDesktop } from "@/frontend/desktop/views/dashboard/students/quota/components/quotaFormField.desktop";
import { SectionHeaderDesktop } from "@/frontend/desktop/views/dashboard/students/quota/components/sectionHeader.desktop";
import { type StudentQuotaLabels, useAppTranslation } from "@/shared/locale";

const DATE_FORMAT = "yyyy-MM-dd";

function parseDateValue(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parsed = parse(dateStr, DATE_FORMAT, new Date());
  return isValid(parsed) ? parsed : null;
}

function StudentNameField() {
  const t = useAppTranslation().dashboardTranslations.studentQuota;
  const {
    control,
    formState: { errors },
  } = useFormContext<StudentQuotaFormData>();
  return (
    <QuotaFormFieldDesktop label={t.fields.studentName}>
      <Controller
        name="studentName"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
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
    </QuotaFormFieldDesktop>
  );
}

function DateOfBirthField() {
  const t = useAppTranslation().dashboardTranslations.studentQuota;
  const {
    control,
    formState: { errors },
  } = useFormContext<StudentQuotaFormData>();
  return (
    <QuotaFormFieldDesktop label={t.fields.dateOfBirth}>
      <Controller
        name="dateOfBirth"
        control={control}
        render={({ field }) => (
          <AppDatePicker
            value={parseDateValue(field.value)}
            onChange={(date: Date | null) => {
              field.onChange(date && isValid(date) ? format(date, DATE_FORMAT) : "");
            }}
            slotProps={{
              textField: {
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
    </QuotaFormFieldDesktop>
  );
}

function LanguageField() {
  const t = useAppTranslation().dashboardTranslations.studentQuota;
  const {
    control,
    formState: { errors },
  } = useFormContext<StudentQuotaFormData>();
  return (
    <QuotaFormFieldDesktop label={t.fields.language} helperText={errors.language?.message}>
      <Controller
        name="language"
        control={control}
        render={({ field }) => (
          <Box sx={quotaInputSx}>
            <LanguageDisplay code={field.value} />
          </Box>
        )}
      />
    </QuotaFormFieldDesktop>
  );
}

function GenderField() {
  const t = useAppTranslation().dashboardTranslations.studentQuota;
  const {
    control,
    formState: { errors },
  } = useFormContext<StudentQuotaFormData>();
  return (
    <Controller
      name="gender"
      control={control}
      render={({ field }) => {
        const hasGender = field.value === "MALE" || field.value === "FEMALE";

        return (
          <QuotaFormFieldDesktop label={t.fields.gender}>
            {hasGender ? (
              <FormControl error={Boolean(errors.gender)} sx={{ height: "48px", justifyContent: "center", px: 0 }}>
                <RadioGroup {...field} row>
                  {GENDER_OPTIONS.map(option => (
                    <FormControlLabel
                      key={option.value}
                      value={option.value}
                      disabled
                      control={
                        <Radio
                          sx={theme => ({
                            color: theme.palette.border.main,
                            "&.Mui-checked": { color: theme.palette.primary.main },
                          })}
                        />
                      }
                      label={
                        <Typography variant="bodyMd">
                          {t.fields[option.labelKey as keyof StudentQuotaLabels["fields"]]}
                        </Typography>
                      }
                      sx={option.value === GENDER_OPTIONS[0].value ? { mr: 4 } : undefined}
                    />
                  ))}
                </RadioGroup>
                {errors.gender ? <FormHelperText>{errors.gender.message}</FormHelperText> : null}
              </FormControl>
            ) : (
              <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant, py: 1.5 })}>
                {t.common.notSet}
              </Typography>
            )}
          </QuotaFormFieldDesktop>
        );
      }}
    />
  );
}

export function StudentInformationSectionDesktop() {
  const t = useAppTranslation().dashboardTranslations.studentQuota;
  const { canView } = useStudentFieldAccess();

  if (!canView("student_identity")) {
    return <ProfileRestrictedSection title={t.sections.studentInfo} />;
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <SectionHeaderDesktop title={t.sections.studentInfo} desktopIcon={BadgeOutlined} />
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
        <StudentNameField />
        <DateOfBirthField />
        <LanguageField />
        <GenderField />
      </Box>
    </Box>
  );
}
