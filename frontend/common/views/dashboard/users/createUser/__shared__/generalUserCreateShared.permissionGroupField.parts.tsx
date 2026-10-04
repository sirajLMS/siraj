"use client";

import { Autocomplete, Grid, TextField } from "@mui/material";
import { type Control, Controller, type FieldErrors } from "react-hook-form";
import { outlinedInputSx } from "@/frontend/common/components/ui/form/field";
import {
  type PermissionGroupOption,
  type VmLabels,
  validationMessage,
} from "@/frontend/common/views/dashboard/users/createUser/__shared__/generalUserCreateShared.helpers";
import type { GeneralUserCreateFormData } from "@/frontend/common/views/dashboard/users/createUser/schemas/generalUserCreateSchema";

function PermissionGroupField({
  control,
  errors,
  labels,
  options,
  loading,
}: Readonly<{
  control: Control<GeneralUserCreateFormData>;
  errors: FieldErrors<GeneralUserCreateFormData>;
  labels: VmLabels;
  options: readonly PermissionGroupOption[];
  loading: boolean;
}>) {
  return (
    <Grid size={{ xs: 12, md: 6 }}>
      <Controller
        name="groupSlug"
        control={control}
        render={({ field }) => {
          const selected = options.find(opt => opt.slug === field.value) ?? null;
          return (
            <Autocomplete
              options={options}
              loading={loading}
              value={selected}
              getOptionLabel={opt => opt.name}
              isOptionEqualToValue={(opt, val) => opt.slug === val.slug}
              onChange={(_, val) => {
                field.onChange(val?.slug ?? "");
              }}
              renderInput={params => (
                <TextField
                  {...params}
                  label={labels.permissionGroup}
                  required
                  fullWidth
                  sx={outlinedInputSx}
                  error={!!errors.groupSlug}
                  helperText={validationMessage(labels, errors.groupSlug)}
                />
              )}
            />
          );
        }}
      />
    </Grid>
  );
}

export { PermissionGroupField };
