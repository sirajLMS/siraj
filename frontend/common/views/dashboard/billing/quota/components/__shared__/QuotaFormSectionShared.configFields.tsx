import { FormControl, InputLabel, MenuItem, Select, TextField } from "@mui/material";
import { Controller } from "react-hook-form";
import { QuotaKind } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  PriorityField,
  QuotaScheduleFields,
} from "@/frontend/common/views/dashboard/billing/quota/components/__shared__/QuotaFormSectionShared.periodFields";
import type { SectionFieldProps } from "@/frontend/common/views/dashboard/billing/quota/components/__shared__/QuotaFormSectionShared.types";
import { isQuotaKind } from "@/frontend/common/views/dashboard/billing/quota/components/__shared__/quotaFormSectionShared.options";

function QuotaClassificationFields({
  control,
  errors,
  labels,
  isEditing,
  fieldAccess,
}: Readonly<Omit<SectionFieldProps, "datePickerSlot" | "watchKind" | "watchPeriodType">>) {
  return (
    <>
      {!isEditing && (
        <Controller
          name="kind"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth error={Boolean(errors.kind)} disabled={fieldAccess.kind.disabled} sx={{ mb: 2 }}>
              <InputLabel>{labels.fields.kind}</InputLabel>
              <Select
                {...field}
                label={labels.fields.kind}
                onChange={e => field.onChange(isQuotaKind(e.target.value) ? e.target.value : QuotaKind.Package)}
              >
                <MenuItem value={QuotaKind.Package}>{labels.kinds.PACKAGE}</MenuItem>
                <MenuItem value={QuotaKind.Periodic}>{labels.kinds.PERIODIC}</MenuItem>
              </Select>
            </FormControl>
          )}
        />
      )}

      {!isEditing && (
        <Controller
          name="totalClasses"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              type="number"
              fullWidth
              label={labels.fields.totalClasses}
              error={Boolean(errors.totalClasses)}
              helperText={fieldAccess.totalClasses.helperText ?? errors.totalClasses?.message}
              required
              disabled={fieldAccess.totalClasses.disabled}
              sx={{ mb: 2 }}
            />
          )}
        />
      )}
    </>
  );
}

export function QuotaConfigFields({
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
      <QuotaClassificationFields
        control={control}
        errors={errors}
        labels={labels}
        isEditing={isEditing}
        fieldAccess={fieldAccess}
      />
      <QuotaScheduleFields
        control={control}
        errors={errors}
        labels={labels}
        isEditing={isEditing}
        watchKind={watchKind}
        watchPeriodType={watchPeriodType}
        fieldAccess={fieldAccess}
      />
      <PriorityField control={control} errors={errors} labels={labels} fieldAccess={fieldAccess} />
    </>
  );
}
