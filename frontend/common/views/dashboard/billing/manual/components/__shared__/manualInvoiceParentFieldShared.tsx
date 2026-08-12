"use client";

import type { ComponentType } from "react";
import { Controller } from "react-hook-form";
import { type PersonOption, resolvePersonOption } from "@/frontend/common/components/ui/input/userSelect";
import type { ManualInvoiceParentFieldProps } from "@/frontend/common/views/dashboard/billing/manual/types/manualInvoiceParentField.types";

export interface ManualInvoiceParentFieldSharedConfig {
  readonly ParentAutocomplete: ComponentType<{
    readonly value: PersonOption | null;
    readonly label: string;
    readonly placeholder: string;
    readonly error: boolean;
    readonly helperText?: string;
    readonly onChange: (person: PersonOption | null) => void;
  }>;
}

export function ManualInvoiceParentFieldShared({
  control,
  errors,
  labels,
  config: { ParentAutocomplete },
}: Readonly<ManualInvoiceParentFieldProps & { readonly config: ManualInvoiceParentFieldSharedConfig }>) {
  return (
    <Controller
      name="parentId"
      control={control}
      render={({ field }) => {
        const selectedParent: PersonOption | null = field.value
          ? resolvePersonOption(field.value, [], { id: field.value, name: "" })
          : null;

        return (
          <ParentAutocomplete
            value={selectedParent}
            label={labels.parentSelection}
            placeholder={labels.parentPlaceholder}
            error={Boolean(errors.parentId)}
            helperText={errors.parentId?.message}
            onChange={person => {
              field.onChange(person?.id ?? "");
            }}
          />
        );
      }}
    />
  );
}
