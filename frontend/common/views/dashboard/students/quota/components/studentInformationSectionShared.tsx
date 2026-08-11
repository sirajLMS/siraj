"use client";

import {
  Box,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from "@mui/material";
import { format, isValid, parse } from "date-fns";
import { Controller, useFormContext } from "react-hook-form";
import { LocaleEmoji } from "@/frontend/common/components/ui/display/localeEmoji/LocaleEmoji";
import { getLanguageDisplayName, getLanguageEmoji } from "@/frontend/common/lib/locale";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { ProfileRestrictedSection } from "@/frontend/common/views/dashboard/profile/shared/sections/ProfileRestrictedSection";
import { useStudentFieldAccess } from "@/frontend/common/views/dashboard/students/profile/useStudentFieldAccess";
import { quotaInputSx } from "@/frontend/common/views/dashboard/students/quota/components/quotaFieldStyles";
import type {
  StudentInformationSectionSharedProps,
  StudentInformationSectionSlotProps,
} from "@/frontend/common/views/dashboard/students/quota/components/studentInformationSectionShared.types";
import { useQuotaFormAccess } from "@/frontend/common/views/dashboard/students/quota/quotaFormAccessContext";
import type { StudentQuotaFormData } from "@/frontend/common/views/dashboard/students/quota/schemas/studentQuotaSchema";
import { GENDER_OPTIONS } from "@/frontend/common/views/dashboard/students/quota/types";
import type { StudentQuotaLabels } from "@/shared/locale/types/dashboard/students/quota";

const DATE_FORMAT = "yyyy-MM-dd";

type QuotaFieldKey = keyof StudentQuotaLabels["fields"];

function parseDateValue(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parsed = parse(dateStr, DATE_FORMAT, new Date());
  return isValid(parsed) ? parsed : null;
}

function isQuotaFieldKey(value: string, fields: StudentQuotaLabels["fields"]): value is QuotaFieldKey {
  return value in fields;
}

function StudentNameField() {
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

function DateOfBirthField({ DatePicker }: Readonly<{ DatePicker: StudentInformationSectionSlotProps["DatePicker"] }>) {
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

function LanguageField() {
  const { labels: t } = useQuotaFormAccess();
  const locale = useAppLocale();
  const {
    control,
    formState: { errors },
  } = useFormContext<StudentQuotaFormData>();
  return (
    <Controller
      name="language"
      control={control}
      render={({ field }) => (
        <FormControl fullWidth variant="outlined" error={Boolean(errors.language)} sx={quotaInputSx}>
          <InputLabel shrink>{t.fields.language}</InputLabel>
          <OutlinedInput
            label={t.fields.language}
            readOnly
            value={field.value ? getLanguageDisplayName(field.value, locale) : ""}
            startAdornment={
              field.value ? (
                <InputAdornment position="start">
                  <LocaleEmoji emoji={getLanguageEmoji(field.value)} />
                </InputAdornment>
              ) : undefined
            }
          />
          {errors.language?.message ? <FormHelperText>{errors.language.message}</FormHelperText> : null}
        </FormControl>
      )}
    />
  );
}

function GenderField({ genderFieldPx }: Readonly<{ genderFieldPx: number }>) {
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
        const hasGender = field.value === "MALE" || field.value === "FEMALE";

        return (
          <FormControl error={Boolean(errors.gender)} component="fieldset" sx={{ px: genderFieldPx }}>
            <FormLabel component="legend">{t.fields.gender}</FormLabel>
            {hasGender ? (
              <RadioGroup {...field} row sx={{ height: "48px", justifyContent: "center" }}>
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
                        {isQuotaFieldKey(option.labelKey, t.fields) ? t.fields[option.labelKey] : ""}
                      </Typography>
                    }
                    sx={option.value === GENDER_OPTIONS[0].value ? { mr: 4 } : undefined}
                  />
                ))}
              </RadioGroup>
            ) : (
              <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant, py: 1.5 })}>
                {t.common.notSet}
              </Typography>
            )}
            {errors.gender ? <FormHelperText>{errors.gender.message}</FormHelperText> : null}
          </FormControl>
        );
      }}
    />
  );
}

export function StudentInformationSectionShared({ slots }: Readonly<StudentInformationSectionSharedProps>) {
  const { labels: t } = useQuotaFormAccess();
  const { canView } = useStudentFieldAccess();
  const {
    DatePicker,
    SectionHeader,
    sectionHeaderIcon: SectionHeaderIcon,
    rootGap,
    fieldsGap,
    gridTemplateColumns,
    genderFieldPx,
    rootSx,
  } = slots;

  if (!canView("student_identity")) {
    return <ProfileRestrictedSection title={t.sections.studentInfo} />;
  }

  return (
    <Box
      sx={[{ display: "flex", flexDirection: "column", gap: rootGap }, ...(Array.isArray(rootSx) ? rootSx : [rootSx])]}
    >
      <SectionHeader title={t.sections.studentInfo} icon={SectionHeaderIcon} />
      <Box sx={{ display: "grid", gridTemplateColumns, gap: fieldsGap }}>
        <StudentNameField />
        <DateOfBirthField DatePicker={DatePicker} />
        <LanguageField />
        <GenderField genderFieldPx={genderFieldPx} />
      </Box>
    </Box>
  );
}
