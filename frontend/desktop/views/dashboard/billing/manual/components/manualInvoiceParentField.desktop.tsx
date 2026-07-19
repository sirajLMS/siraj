"use client";

import { FamilyRestroomOutlined } from "@mui/icons-material";
import { Autocomplete, InputAdornment, TextField } from "@mui/material";
import { styled } from "@mui/material/styles";
import { Controller } from "react-hook-form";
import type { ManualInvoiceParentFieldProps } from "@/frontend/common/views/dashboard/billing/manual/types/manualInvoiceParentField.types";

const StyledParentIcon = styled(FamilyRestroomOutlined)(({ theme }) => ({
  color: theme.palette.primary.main,
}));

export function ManualInvoiceParentFieldDesktop({
  control,
  errors,
  labels,
  parentOptions,
}: Readonly<ManualInvoiceParentFieldProps>) {
  return (
    <Controller
      name="parentId"
      control={control}
      render={({ field }) => {
        const selectedParent = parentOptions.find(option => option.id === field.value) ?? null;

        return (
          <Autocomplete
            options={parentOptions}
            value={selectedParent}
            getOptionLabel={option => option.label}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            onChange={(_event, value) => {
              field.onChange(value?.id ?? "");
            }}
            renderInput={params => (
              <TextField
                {...params}
                label={labels.parentSelection}
                variant="outlined"
                placeholder={labels.parentPlaceholder}
                error={Boolean(errors.parentId)}
                helperText={errors.parentId?.message}
                slotProps={{
                  input: {
                    ...params.slotProps.input,
                    startAdornment: (
                      <>
                        <InputAdornment position="start">
                          <StyledParentIcon />
                        </InputAdornment>
                        {params.slotProps.input.startAdornment}
                      </>
                    ),
                  },
                  inputLabel: params.slotProps.inputLabel,
                  htmlInput: {
                    ...params.slotProps.htmlInput,
                    autoComplete: "off",
                  },
                }}
              />
            )}
          />
        );
      }}
    />
  );
}
