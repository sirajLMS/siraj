import { FormControl, Grid, InputLabel, MenuItem, Select, TextField } from "@mui/material";
import { type Control, Controller, type FieldErrors, type UseFormRegister } from "react-hook-form";
import { outlinedInputSx } from "@/frontend/common/components/ui/form/field";
import { GenderSelector } from "@/frontend/common/components/ui/input/genderSelector/GenderSelector";
import { LanguageSelector } from "@/frontend/common/components/ui/input/languageSelector/LanguageSelector";
import { StudentStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import { getLanguageByCode } from "@/frontend/common/lib/locale";
import type { StudentOnboardingFormData } from "@/frontend/common/views/dashboard/students/onboarding/schemas/studentOnboardingSchema";

export interface StudentExtensionFieldLabels {
  readonly dateOfBirth: string;
  readonly dateOfBirthPlaceholder: string;
  readonly gender: string;
  readonly male: string;
  readonly female: string;
  readonly language: string;
  readonly languagePlaceholder: string;
  readonly status: string;
  readonly statusOnTrial: string;
  readonly statusRegular: string;
}

interface StudentExtensionFieldsProps {
  readonly register: UseFormRegister<StudentOnboardingFormData>;
  readonly errors: FieldErrors<StudentOnboardingFormData>;
  readonly control: Control<StudentOnboardingFormData>;
  readonly labels: StudentExtensionFieldLabels;
}

const statusLabelId = "student-onboarding-status-label";

export function StudentExtensionFields({ register, errors, control, labels }: Readonly<StudentExtensionFieldsProps>) {
  return (
    <>
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          {...register("dateOfBirth")}
          label={labels.dateOfBirth}
          type="date"
          placeholder={labels.dateOfBirthPlaceholder}
          fullWidth
          sx={outlinedInputSx}
          slotProps={{
            inputLabel: { shrink: true },
          }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Controller
          control={control}
          name="gender"
          render={({ field }) => (
            <GenderSelector
              gender={field.value ?? null}
              setGenderAction={field.onChange}
              fullWidth
              labels={{
                title: labels.gender,
                male: labels.male,
                female: labels.female,
              }}
            />
          )}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Controller
          control={control}
          name="language"
          render={({ field }) => (
            <LanguageSelector
              fullWidth
              label={labels.language}
              language={field.value ? getLanguageByCode(field.value) : undefined}
              setLanguageAction={option => {
                field.onChange(option.code);
              }}
              error={!!errors.language}
              helperText={errors.language?.message}
              onBlurAction={field.onBlur}
            />
          )}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <FormControl fullWidth sx={outlinedInputSx}>
              <InputLabel id={statusLabelId}>{labels.status}</InputLabel>
              <Select {...field} labelId={statusLabelId} label={labels.status} fullWidth>
                <MenuItem value={StudentStatus.OnTrial}>{labels.statusOnTrial}</MenuItem>
                <MenuItem value={StudentStatus.Regular}>{labels.statusRegular}</MenuItem>
              </Select>
            </FormControl>
          )}
        />
      </Grid>
    </>
  );
}
