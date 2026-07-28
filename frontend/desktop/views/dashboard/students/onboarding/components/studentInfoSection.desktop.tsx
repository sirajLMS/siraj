"use client";

import { FormControl, Grid, InputLabel, MenuItem, Select, TextField } from "@mui/material";
import type { Control, FieldErrors, UseFormRegister } from "react-hook-form";
import { Controller } from "react-hook-form";
import { SectionPanel } from "@/frontend/common/components/ui/container/SectionPanel";
import { outlinedInputSx } from "@/frontend/common/components/ui/form";
import { AvatarImageField } from "@/frontend/common/components/ui/input/avatarImageField";
import { GenderSelector } from "@/frontend/common/components/ui/input/genderSelector/GenderSelector";
import { LanguageSelector } from "@/frontend/common/components/ui/input/languageSelector/LanguageSelector";
import { StudentStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { getLanguageByCode } from "@/frontend/common/lib/locale";
import type { StudentOnboardingFormData } from "@/frontend/common/views/dashboard/students/onboarding/schemas/studentOnboardingSchema";

interface StudentInfoSectionProps {
  readonly register: UseFormRegister<StudentOnboardingFormData>;
  readonly errors: FieldErrors<StudentOnboardingFormData>;
  readonly control: Control<StudentOnboardingFormData>;
  readonly onUploadAvatar: (file: File) => Promise<{ url: string }>;
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
    readonly avatar: string;
  };
}

type StudentInfoSectionLabels = StudentInfoSectionProps["labels"];

const statusLabelId = "student-onboarding-status-label";

function StudentInfoAvatarField({
  control,
  labels,
  onUploadAvatar,
}: Readonly<{
  control: Control<StudentOnboardingFormData>;
  labels: StudentInfoSectionLabels;
  onUploadAvatar: (file: File) => Promise<{ url: string }>;
}>) {
  return (
    <Grid size={{ xs: 12 }}>
      <AvatarImageField control={control} name="avatarUrl" label={labels.avatar} onUploadAvatar={onUploadAvatar} />
    </Grid>
  );
}

function StudentInfoNameField({
  register,
  errors,
  labels,
}: Readonly<{
  register: UseFormRegister<StudentOnboardingFormData>;
  errors: FieldErrors<StudentOnboardingFormData>;
  labels: StudentInfoSectionLabels;
}>) {
  return (
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
  );
}

function StudentInfoEmailField({
  register,
  errors,
}: Readonly<{
  register: UseFormRegister<StudentOnboardingFormData>;
  errors: FieldErrors<StudentOnboardingFormData>;
}>) {
  return (
    <Grid size={{ xs: 12, md: 6 }}>
      <TextField
        {...register("email")}
        label="Email"
        placeholder="Enter student email"
        type="email"
        required
        error={Boolean(errors.email)}
        helperText={errors.email?.message}
        fullWidth
        sx={outlinedInputSx}
      />
    </Grid>
  );
}

function StudentInfoPasswordField({
  register,
  errors,
}: Readonly<{
  register: UseFormRegister<StudentOnboardingFormData>;
  errors: FieldErrors<StudentOnboardingFormData>;
}>) {
  return (
    <Grid size={{ xs: 12, md: 6 }}>
      <TextField
        {...register("password")}
        label="Password"
        placeholder="Enter student password"
        type="password"
        required
        error={Boolean(errors.password)}
        helperText={errors.password?.message}
        fullWidth
        sx={outlinedInputSx}
      />
    </Grid>
  );
}

function StudentInfoDateOfBirthField({
  register,
  labels,
}: Readonly<{
  register: UseFormRegister<StudentOnboardingFormData>;
  labels: StudentInfoSectionLabels;
}>) {
  return (
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
  );
}

function StudentInfoGenderField({
  control,
  labels,
}: Readonly<{
  control: Control<StudentOnboardingFormData>;
  labels: StudentInfoSectionLabels;
}>) {
  return (
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
  );
}

function StudentInfoLanguageField({
  control,
  errors,
  labels,
}: Readonly<{
  control: Control<StudentOnboardingFormData>;
  errors: FieldErrors<StudentOnboardingFormData>;
  labels: StudentInfoSectionLabels;
}>) {
  return (
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
  );
}

function StudentInfoStatusField({
  control,
  labels,
}: Readonly<{
  control: Control<StudentOnboardingFormData>;
  labels: StudentInfoSectionLabels;
}>) {
  return (
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
  );
}

export function StudentInfoSection({
  register,
  errors,
  control,
  labels,
  onUploadAvatar,
}: Readonly<StudentInfoSectionProps>) {
  return (
    <SectionPanel title={labels.sectionTitle}>
      <Grid container spacing={3} sx={theme => ({ p: theme.layout.cardPadding })}>
        <StudentInfoAvatarField control={control} labels={labels} onUploadAvatar={onUploadAvatar} />
        <StudentInfoNameField register={register} errors={errors} labels={labels} />
        <StudentInfoEmailField register={register} errors={errors} />
        <StudentInfoPasswordField register={register} errors={errors} />
        <StudentInfoDateOfBirthField register={register} labels={labels} />
        <StudentInfoGenderField control={control} labels={labels} />
        <StudentInfoLanguageField control={control} errors={errors} labels={labels} />
        <StudentInfoStatusField control={control} labels={labels} />
      </Grid>
    </SectionPanel>
  );
}
