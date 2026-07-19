"use client";

import { FormControl, Grid, InputLabel, MenuItem, Select, TextField } from "@mui/material";
import type { Control, FieldErrors, UseFormRegister } from "react-hook-form";
import { Controller } from "react-hook-form";
import { SectionPanel } from "@/frontend/common/components/ui/container/SectionPanel";
import { outlinedInputSx } from "@/frontend/common/components/ui/form";
import { GenderSelector } from "@/frontend/common/components/ui/input/genderSelector/GenderSelector";
import { LanguageSelector } from "@/frontend/common/components/ui/input/languageSelector/LanguageSelector";
import { StudentStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { getLanguageByCode } from "@/frontend/common/lib/locale";
import type { StudentOnboardingFormData } from "@/frontend/common/views/dashboard/students/onboarding/schemas/studentOnboardingSchema";

interface StudentInfoSectionProps {
  readonly register: UseFormRegister<StudentOnboardingFormData>;
  readonly errors: FieldErrors<StudentOnboardingFormData>;
  readonly control: Control<StudentOnboardingFormData>;
  readonly labels: {
    readonly sectionTitle: string;
    readonly name: string;
    readonly namePlaceholder: string;
    readonly nameMinLength: string;
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
  };
}

const statusLabelId = "student-onboarding-status-label";

export function StudentInfoSection({ register, errors, control, labels }: Readonly<StudentInfoSectionProps>) {
  return (
    <SectionPanel title={labels.sectionTitle}>
      <Grid container spacing={3} sx={theme => ({ p: theme.layout.cardPadding })}>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            {...register("name")}
            label={labels.name}
            placeholder={labels.namePlaceholder}
            required
            error={Boolean(errors.name)}
            helperText={errors.name ? labels.nameMinLength : undefined}
            fullWidth
            sx={outlinedInputSx}
          />
        </Grid>
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
      </Grid>
    </SectionPanel>
  );
}
