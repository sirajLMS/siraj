import { Controller } from "react-hook-form";
import type { SectionFieldProps } from "@/frontend/common/views/dashboard/billing/quota/components/__shared__/QuotaFormSectionShared.types";

export function ValidityDateFields({
  control,
  errors,
  labels,
  fieldAccess,
  datePickerSlot,
}: Readonly<Pick<SectionFieldProps, "control" | "errors" | "labels" | "fieldAccess" | "datePickerSlot">>) {
  const DatePickerComponent = datePickerSlot.component;

  return (
    <>
      <Controller
        name="validFrom"
        control={control}
        render={({ field }) => (
          <DatePickerComponent
            label={labels.fields.validFrom}
            value={field.value ? new Date(field.value) : null}
            onChange={(date: Date | null) => field.onChange(date ? date.toISOString() : null)}
            disabled={fieldAccess.validFrom.disabled}
            error={Boolean(errors.validFrom)}
            helperText={fieldAccess.validFrom.helperText ?? errors.validFrom?.message}
            fullWidth
            sx={{ mb: 2 }}
          />
        )}
      />
      <Controller
        name="validUntil"
        control={control}
        render={({ field }) => (
          <DatePickerComponent
            label={labels.fields.validUntil}
            value={field.value ? new Date(field.value) : null}
            onChange={(date: Date | null) => field.onChange(date ? date.toISOString() : null)}
            disabled={fieldAccess.validUntil.disabled}
            error={Boolean(errors.validUntil)}
            helperText={fieldAccess.validUntil.helperText ?? errors.validUntil?.message}
            fullWidth
          />
        )}
      />
    </>
  );
}
