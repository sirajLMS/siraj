"use client";

import { Box, FormHelperText, TextField, Typography } from "@mui/material";
import { format, isValid, parse } from "date-fns";
import { Controller, useFormContext } from "react-hook-form";
import { AppLanguage, Gender } from "@/frontend/common/graphql/generated/gql/graphql";
import { ProfileRestrictedSection } from "@/frontend/common/views/dashboard/profile/shared/sections/ProfileRestrictedSection";
import { useStudentFieldAccess } from "@/frontend/common/views/dashboard/students/profile/useStudentFieldAccess";
import { quotaInputSx } from "@/frontend/common/views/dashboard/students/quota/components/quotaFieldStyles";
import type {
  StudentInformationSectionSharedProps,
  StudentInformationSectionSlotProps,
} from "@/frontend/common/views/dashboard/students/quota/components/studentInformationSectionShared.types";
import type { StudentQuotaFormData } from "@/frontend/common/views/dashboard/students/quota/schemas/studentQuotaSchema";
import { useQuotaFormAccess } from "@/frontend/common/views/dashboard/students/quota/useQuotaFormAccess";

const DATE_FORMAT = "yyyy-MM-dd";

function parseDateValue(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parsed = parse(dateStr, DATE_FORMAT, new Date());
  return isValid(parsed) ? parsed : null;
}

function toAppLanguage(value: string): AppLanguage | null {
  if (value === "ar") return AppLanguage.Ar;
  if (value === "en") return AppLanguage.En;
  return null;
}

function toFormGender(value: string): Gender | null {
  if (value === "MALE") return Gender.Male;
  if (value === "FEMALE") return Gender.Female;
  return null;
}

// Read-only section: gender selection handlers are inert so the form value stays unchanged.
const noopGenderSelection = () => undefined;

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

function LanguageField({
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

function GenderField({
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

export function StudentInformationSectionShared({ slots }: Readonly<StudentInformationSectionSharedProps>) {
  const { labels: t } = useQuotaFormAccess();
  const { canView } = useStudentFieldAccess();
  const {
    DatePicker,
    LanguageDisplay,
    GenderSelector,
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
        <LanguageField LanguageDisplay={LanguageDisplay} />
        <GenderField GenderSelector={GenderSelector} genderFieldPx={genderFieldPx} />
      </Box>
    </Box>
  );
}
