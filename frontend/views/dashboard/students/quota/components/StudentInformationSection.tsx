import { BadgeOutlined, PersonOutlined } from "@mui/icons-material";
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
import { useTranslations } from "next-intl";
import { Controller, useFormContext } from "react-hook-form";
import { LanguageDisplay } from "@/frontend/components/ui/display";
import { AppDatePicker } from "@/frontend/components/ui/form";
import { ProfileRestrictedSection } from "@/frontend/views/dashboard/profile/shared/sections/ProfileRestrictedSection";
import { useStudentFieldAccess } from "@/frontend/views/dashboard/students/profile/useStudentFieldAccess";
import { QuotaFormField } from "@/frontend/views/dashboard/students/quota/components/QuotaFormField";
import { quotaInputSx } from "@/frontend/views/dashboard/students/quota/components/quotaFieldStyles";
import { SectionHeader } from "@/frontend/views/dashboard/students/quota/components/SectionHeader";
import type { StudentQuotaFormData } from "@/frontend/views/dashboard/students/quota/schemas/studentQuotaSchema";
import { GENDER_OPTIONS } from "@/frontend/views/dashboard/students/quota/types";

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
            disabled
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
                disabled: true,
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
    <QuotaFormField label={t("fields.language")} helperText={errors.language?.message}>
      <Controller
        name="language"
        control={control}
        render={({ field }) => (
          <Box sx={quotaInputSx}>
            <LanguageDisplay code={field.value} />
          </Box>
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
    <Controller
      name="gender"
      control={control}
      render={({ field }) => {
        const hasGender = field.value === "MALE" || field.value === "FEMALE";

        return (
          <QuotaFormField label={t("fields.gender")}>
            {hasGender ? (
              <FormControl
                error={!!errors.gender}
                sx={{ height: "48px", justifyContent: "center", px: { xs: 0.5, md: 0 } }}
              >
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
                      label={<Typography variant="bodyMd">{t(`fields.${option.labelKey}`)}</Typography>}
                      sx={option.value === GENDER_OPTIONS[0].value ? { mr: 4 } : undefined}
                    />
                  ))}
                </RadioGroup>
                {errors.gender ? <FormHelperText>{errors.gender.message}</FormHelperText> : null}
              </FormControl>
            ) : (
              <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant, py: 1.5 })}>
                {t("common.notSet")}
              </Typography>
            )}
          </QuotaFormField>
        );
      }}
    />
  );
}

export function StudentInformationSection() {
  const t = useTranslations("dashboard.studentQuota");
  const { canView } = useStudentFieldAccess();

  if (!canView("student_identity")) {
    return <ProfileRestrictedSection title={t("sections.studentInfo")} />;
  }

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
