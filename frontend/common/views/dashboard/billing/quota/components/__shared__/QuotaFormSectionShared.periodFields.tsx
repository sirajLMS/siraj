import { FormControl, InputLabel, MenuItem, Select, TextField } from "@mui/material";
import { Controller } from "react-hook-form";
import { QuotaKind, QuotaPeriodType } from "@/frontend/common/graphql/generated/gql/graphql";
import type { SectionFieldProps } from "@/frontend/common/views/dashboard/billing/quota/components/__shared__/QuotaFormSectionShared.types";
import { isQuotaPeriodType } from "@/frontend/common/views/dashboard/billing/quota/components/__shared__/quotaFormSectionShared.options";

export function QuotaScheduleFields({
  control,
  errors,
  labels,
  isEditing,
  watchKind,
  watchPeriodType,
  fieldAccess,
}: Readonly<Omit<SectionFieldProps, "datePickerSlot">>) {
  return (
    <>
      {!isEditing && watchKind === QuotaKind.Periodic && (
        <Controller
          name="periodType"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth disabled={fieldAccess.periodType.disabled} sx={{ mb: 2 }}>
              <InputLabel>{labels.fields.periodType}</InputLabel>
              <Select
                {...field}
                value={field.value ?? ""}
                label={labels.fields.periodType}
                onChange={e =>
                  field.onChange(e.target.value && isQuotaPeriodType(e.target.value) ? e.target.value : null)
                }
              >
                <MenuItem value={QuotaPeriodType.Weekly}>{labels.periodTypes.WEEKLY}</MenuItem>
                <MenuItem value={QuotaPeriodType.Monthly}>{labels.periodTypes.MONTHLY}</MenuItem>
                <MenuItem value={QuotaPeriodType.Custom}>{labels.periodTypes.CUSTOM}</MenuItem>
              </Select>
            </FormControl>
          )}
        />
      )}

      {!isEditing && watchPeriodType === QuotaPeriodType.Custom && (
        <Controller
          name="periodDays"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              type="number"
              fullWidth
              label={labels.fields.periodDays}
              helperText={fieldAccess.periodDays.helperText ?? labels.fields.periodDaysHelperText}
              error={Boolean(errors.periodDays)}
              required
              disabled={fieldAccess.periodDays.disabled}
              sx={{ mb: 2 }}
            />
          )}
        />
      )}
    </>
  );
}

export function PriorityField({
  control,
  errors,
  labels,
  fieldAccess,
}: Readonly<Pick<SectionFieldProps, "control" | "errors" | "labels" | "fieldAccess">>) {
  return (
    <Controller
      name="priority"
      control={control}
      render={({ field }) => (
        <TextField
          {...field}
          type="number"
          fullWidth
          label={labels.fields.priority}
          error={Boolean(errors.priority)}
          helperText={fieldAccess.priority.helperText ?? errors.priority?.message}
          disabled={fieldAccess.priority.disabled}
        />
      )}
    />
  );
}
