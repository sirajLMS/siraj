"use client";

import { Box, FormControl, FormControlLabel, Grid, Input, MenuItem, Radio, RadioGroup, Select } from "@mui/material";
import type { Control, FieldErrors, UseFormRegister } from "react-hook-form";
import { Controller } from "react-hook-form";
import { SectionPanel } from "@/frontend/components/ui/container/SectionPanel";
import { FieldWrapper, labelSx, standardInputSx } from "@/frontend/components/ui/form";
import { LanguageSelector } from "@/frontend/components/ui/input/languageSelector/LanguageSelector";
import { Gender, StudentStatus } from "@/frontend/graphql/generated/gql/graphql-types";
import { getLanguageByCode } from "@/frontend/lib/locale";
import type { StudentOnboardingFormData } from "@/frontend/views/dashboard/students/onboarding/schemas/studentOnboardingSchema";

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

export function StudentInfoSection({ register, errors, control, labels }: Readonly<StudentInfoSectionProps>) {
  return (
    <SectionPanel title={labels.sectionTitle}>
      <Grid container spacing={3} sx={theme => ({ p: theme.layout.cardPadding })}>
        <Grid size={{ xs: 12, md: 6 }}>
          <FieldWrapper label={labels.name} required error={errors.name ? labels.nameMinLength : undefined}>
            <Input
              {...register("name")}
              placeholder={labels.namePlaceholder}
              error={Boolean(errors.name)}
              fullWidth
              sx={standardInputSx}
            />
          </FieldWrapper>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <FieldWrapper label={labels.dateOfBirth}>
            <Input
              {...register("dateOfBirth")}
              type="date"
              placeholder={labels.dateOfBirthPlaceholder}
              fullWidth
              sx={standardInputSx}
            />
          </FieldWrapper>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Box component="label" sx={labelSx}>
            {labels.gender}
          </Box>
          <Controller
            control={control}
            name="gender"
            render={({ field }) => (
              <FormControl>
                <RadioGroup
                  row
                  value={field.value ?? ""}
                  onChange={event => {
                    field.onChange(event.target.value || null);
                  }}
                >
                  <FormControlLabel value={Gender.Male} control={<Radio />} label={labels.male} />
                  <FormControlLabel value={Gender.Female} control={<Radio />} label={labels.female} />
                </RadioGroup>
              </FormControl>
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <FieldWrapper label={labels.language}>
            <Controller
              control={control}
              name="language"
              render={({ field }) => (
                <LanguageSelector
                  fullWidth
                  label={labels.languagePlaceholder}
                  language={field.value ? getLanguageByCode(field.value) : undefined}
                  setLanguageAction={option => {
                    field.onChange(option.code);
                  }}
                />
              )}
            />
          </FieldWrapper>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <FieldWrapper label={labels.status}>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select value={field.value} fullWidth onChange={field.onChange} sx={standardInputSx}>
                  <MenuItem value={StudentStatus.OnTrial}>{labels.statusOnTrial}</MenuItem>
                  <MenuItem value={StudentStatus.Regular}>{labels.statusRegular}</MenuItem>
                </Select>
              )}
            />
          </FieldWrapper>
        </Grid>
      </Grid>
    </SectionPanel>
  );
}
