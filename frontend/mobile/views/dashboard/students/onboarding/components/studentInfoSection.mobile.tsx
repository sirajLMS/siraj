"use client";

import { Grid, Input, MenuItem, Select } from "@mui/material";
import type { Control, FieldErrors, UseFormRegister } from "react-hook-form";
import { Controller } from "react-hook-form";
import { standardInputSx } from "@/frontend/common/components/ui/form";
import { StudentStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { getLanguageByCode } from "@/frontend/common/lib/locale";
import type { StudentOnboardingFormData } from "@/frontend/common/views/dashboard/students/onboarding/schemas/studentOnboardingSchema";
import { MobileSectionPanel } from "@/frontend/mobile/components/ui/container";
import { MobileFieldWrapper } from "@/frontend/mobile/components/ui/form/field";
import { GenderSelectorMobile } from "@/frontend/mobile/components/ui/input/genderSelector";
import { LanguageSelectorMobile } from "@/frontend/mobile/components/ui/input/languageSelector";

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
    <MobileSectionPanel title={labels.sectionTitle}>
      <Grid container spacing={3} sx={theme => ({ p: theme.layout.cardPadding })}>
        <Grid size={{ xs: 12, md: 6 }}>
          <MobileFieldWrapper label={labels.name} required error={errors.name ? labels.nameMinLength : undefined}>
            <Input
              {...register("name")}
              placeholder={labels.namePlaceholder}
              error={Boolean(errors.name)}
              fullWidth
              sx={standardInputSx}
            />
          </MobileFieldWrapper>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <MobileFieldWrapper label={labels.dateOfBirth}>
            <Input
              {...register("dateOfBirth")}
              type="date"
              placeholder={labels.dateOfBirthPlaceholder}
              fullWidth
              sx={standardInputSx}
            />
          </MobileFieldWrapper>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Controller
            control={control}
            name="gender"
            render={({ field }) => (
              <GenderSelectorMobile
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
              <LanguageSelectorMobile
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
          <MobileFieldWrapper label={labels.status}>
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
          </MobileFieldWrapper>
        </Grid>
      </Grid>
    </MobileSectionPanel>
  );
}
