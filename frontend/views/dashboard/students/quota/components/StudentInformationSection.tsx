import { BadgeOutlined, PersonOutlined } from "@mui/icons-material";
import {
  Box,
  FormControl,
  FormControlLabel,
  FormHelperText,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { format, isValid, parse } from "date-fns";
import { useTranslations } from "next-intl";
import { Controller, useFormContext } from "react-hook-form";
import { AppDatePicker } from "@/frontend/components/ui/form";
import type { StudentQuotaFormData } from "../schemas/studentQuotaSchema";
import { GENDER_OPTIONS, LANGUAGE_OPTIONS } from "../types";
import { QuotaFormField } from "./QuotaFormField";
import { quotaInputSx } from "./quotaFieldStyles";
import { SectionHeader } from "./SectionHeader";

const DATE_FORMAT = "yyyy-MM-dd";

function parseDateValue(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parsed = parse(dateStr, DATE_FORMAT, new Date());
  return isValid(parsed) ? parsed : null;
}

function StudentNameField() {
  const t = useTranslations("dashboard.studentQuota");
  const {
    control,
    formState: { errors },
  } = useFormContext<StudentQuotaFormData>();
  return (
    <QuotaFormField label={t("fields.studentName")}>
      <Controller
        name="studentName"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            placeholder={t("fields.studentNamePlaceholder")}
            variant="outlined"
            fullWidth
            error={!!errors.studentName}
            helperText={errors.studentName?.message}
            sx={quotaInputSx}
          />
        )}
      />
    </QuotaFormField>
  );
}

function DateOfBirthField() {
  const t = useTranslations("dashboard.studentQuota");
  const {
    control,
    formState: { errors },
  } = useFormContext<StudentQuotaFormData>();
  return (
    <QuotaFormField label={t("fields.dateOfBirth")}>
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
                error: !!errors.dateOfBirth,
                helperText: errors.dateOfBirth?.message,
                sx: quotaInputSx,
                slotProps: { htmlInput: { autoComplete: "off" } },
              },
            }}
          />
        )}
      />
    </QuotaFormField>
  );
}

function LanguageField() {
  const t = useTranslations("dashboard.studentQuota");
  const {
    control,
    formState: { errors },
  } = useFormContext<StudentQuotaFormData>();
  return (
    <QuotaFormField label={t("fields.language")}>
      <Controller
        name="language"
        control={control}
        render={({ field }) => (
          <FormControl fullWidth error={!!errors.language}>
            <Select {...field} displayEmpty sx={quotaInputSx}>
              {LANGUAGE_OPTIONS.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {t(`fields.${option.labelKey}`)}
                </MenuItem>
              ))}
            </Select>
            {errors.language && <FormHelperText>{errors.language.message}</FormHelperText>}
          </FormControl>
        )}
      />
    </QuotaFormField>
  );
}

function GenderField() {
  const t = useTranslations("dashboard.studentQuota");
  const {
    control,
    formState: { errors },
  } = useFormContext<StudentQuotaFormData>();
  return (
    <QuotaFormField label={t("fields.gender")}>
      <Controller
        name="gender"
        control={control}
        render={({ field }) => (
          <FormControl
            error={!!errors.gender}
            sx={{ height: "48px", justifyContent: "center", px: { xs: 0.5, md: 0 } }}
          >
            <RadioGroup {...field} row>
              {GENDER_OPTIONS.map(option => (
                <FormControlLabel
                  key={option.value}
                  value={option.value}
                  control={
                    <Radio
                      sx={theme => ({
                        color: theme.palette.border.main,
                        "&.Mui-checked": { color: theme.palette.primary.main },
                      })}
                    />
                  }
                  label={<Typography variant="bodyMd">{t(`fields.${option.labelKey}`)}</Typography>}
                  sx={option.value === GENDER_OPTIONS[0].value ? { mr: 4 } : undefined}
                />
              ))}
            </RadioGroup>
            {errors.gender && <FormHelperText>{errors.gender.message}</FormHelperText>}
          </FormControl>
        )}
      />
    </QuotaFormField>
  );
}

export function StudentInformationSection() {
  const t = useTranslations("dashboard.studentQuota");

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 3, md: 4 } }}>
      <SectionHeader title={t("sections.studentInfo")} desktopIcon={BadgeOutlined} mobileIcon={PersonOutlined} />
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: { xs: 2, md: 4 } }}>
        <StudentNameField />
        <DateOfBirthField />
        <LanguageField />
        <GenderField />
      </Box>
    </Box>
  );
}
