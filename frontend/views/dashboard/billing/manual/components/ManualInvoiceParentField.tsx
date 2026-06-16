"use client";

import { FamilyRestroomOutlined } from "@mui/icons-material";
import { Autocomplete, InputAdornment, TextField } from "@mui/material";
import type { Control, FieldErrors } from "react-hook-form";
import { Controller } from "react-hook-form";
import type { BillingManualLabels } from "@/frontend/messages/types/dashboard/billing/manual";
import type { ParentInvoiceOption } from "@/frontend/stores/adminManualInvoiceStore";
import type { ManualInvoiceFormData } from "../schemas/manualInvoiceSchema";

interface ManualInvoiceParentFieldProps {
  readonly control: Control<ManualInvoiceFormData>;
  readonly errors: FieldErrors<ManualInvoiceFormData>;
  readonly labels: BillingManualLabels;
  readonly parentOptions: readonly ParentInvoiceOption[];
}

export function ManualInvoiceParentField({
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
                id={params.id}
                disabled={params.disabled}
                fullWidth={params.fullWidth}
                size={params.size}
                placeholder={labels.parentPlaceholder}
                error={Boolean(errors.parentId)}
                helperText={errors.parentId?.message}
                slotProps={{
                  input: {
                    ...params.slotProps.input,
                    startAdornment: (
                      <>
                        <InputAdornment position="start">
                          <FamilyRestroomOutlined sx={theme => ({ color: theme.palette.primary.main })} />
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
