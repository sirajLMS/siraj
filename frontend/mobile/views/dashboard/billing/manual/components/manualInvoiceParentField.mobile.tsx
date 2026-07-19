"use client";

import { Controller } from "react-hook-form";
import { type PersonOption, resolvePersonOption } from "@/frontend/common/components/ui/input/userSelect";
import type { ManualInvoiceParentFieldProps } from "@/frontend/common/views/dashboard/billing/manual/types/manualInvoiceParentField.types";
import { ParentAutocompleteMobile } from "@/frontend/mobile/components/ui/input/userSelect";

export function ManualInvoiceParentFieldMobile({ control, errors, labels }: Readonly<ManualInvoiceParentFieldProps>) {
  return (
    <Controller
      name="parentId"
      control={control}
      render={({ field }) => {
        const selectedParent: PersonOption | null = field.value
          ? resolvePersonOption(field.value, [], { id: field.value, name: "" })
          : null;

        return (
          <ParentAutocompleteMobile
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
