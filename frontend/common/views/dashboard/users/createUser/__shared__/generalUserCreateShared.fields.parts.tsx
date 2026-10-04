"use client";

import { Grid, MenuItem, TextField } from "@mui/material";
import { type Control, Controller, type FieldErrors } from "react-hook-form";
import { outlinedInputSx } from "@/frontend/common/components/ui/form/field";
import { PhoneFormField } from "@/frontend/common/components/ui/input";
import { AccountStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  type VmLabels,
  validationMessage,
} from "@/frontend/common/views/dashboard/users/createUser/__shared__/generalUserCreateShared.helpers";
import type { GeneralUserCreateFormData } from "@/frontend/common/views/dashboard/users/createUser/schemas/generalUserCreateSchema";

function NameField({
  control,
  errors,
  labels,
}: Readonly<{
  control: Control<GeneralUserCreateFormData>;
  errors: FieldErrors<GeneralUserCreateFormData>;
  labels: VmLabels;
}>) {
  return (
    <Grid size={{ xs: 12, md: 6 }}>
      <Controller
        name="name"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label={labels.name}
            required
            fullWidth
            sx={outlinedInputSx}
            error={!!errors.name}
            helperText={validationMessage(labels, errors.name)}
          />
        )}
      />
    </Grid>
  );
}

function EmailField({
  control,
  errors,
  labels,
}: Readonly<{
  control: Control<GeneralUserCreateFormData>;
  errors: FieldErrors<GeneralUserCreateFormData>;
  labels: VmLabels;
}>) {
  return (
    <Grid size={{ xs: 12, md: 6 }}>
      <Controller
        name="email"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label={labels.email}
            type="email"
            required
            fullWidth
            sx={outlinedInputSx}
            error={!!errors.email}
            helperText={validationMessage(labels, errors.email)}
          />
        )}
      />
    </Grid>
  );
}

function PhoneField({
  control,
  errors,
  labels,
}: Readonly<{
  control: Control<GeneralUserCreateFormData>;
  errors: FieldErrors<GeneralUserCreateFormData>;
  labels: VmLabels;
}>) {
  return (
    <Grid size={{ xs: 12, md: 6 }}>
      <PhoneFormField<GeneralUserCreateFormData>
        name="phone"
        control={control}
        label={labels.phone}
        error={!!errors.phone}
        helperText={validationMessage(labels, errors.phone)}
      />
    </Grid>
  );
}

function AccountStatusField({
  control,
  errors,
  labels,
}: Readonly<{
  control: Control<GeneralUserCreateFormData>;
  errors: FieldErrors<GeneralUserCreateFormData>;
  labels: VmLabels;
}>) {
  return (
    <Grid size={{ xs: 12, md: 6 }}>
      <Controller
        name="status"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            select
            label={labels.accountStatus}
            required
            fullWidth
            sx={outlinedInputSx}
            error={!!errors.status}
            helperText={validationMessage(labels, errors.status)}
          >
            <MenuItem value={AccountStatus.Activated}>{labels.statusActivated}</MenuItem>
            <MenuItem value={AccountStatus.Deactivated}>{labels.statusDeactivated}</MenuItem>
          </TextField>
        )}
      />
    </Grid>
  );
}

export { AccountStatusField, EmailField, NameField, PhoneField };
