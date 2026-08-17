"use client";

import { FormControl, InputLabel, MenuItem, Select, TextField } from "@mui/material";
import { type Control, Controller, type FieldErrors } from "react-hook-form";
import { StudentAutocomplete } from "@/frontend/common/components/ui/input/userSelect/StudentAutocomplete";
import type { PersonOption } from "@/frontend/common/components/ui/input/userSelect/types";
import { QuotaKind, QuotaPeriodType } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useQuotaFormAccess } from "@/frontend/common/views/dashboard/billing/quota/quotaFormAccessContext";
import type {
  QuotaFormData,
  QuotaFormInput,
} from "@/frontend/common/views/dashboard/billing/quota/schemas/quotaSchema";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui/container";
import { DesktopAppDatePicker } from "@/frontend/desktop/components/ui/form/date";
import type { QuotaLabels } from "@/shared/locale/types/dashboard/billing/quota";

export interface QuotaFormSectionDesktopProps {
  readonly control: Control<QuotaFormInput, undefined, QuotaFormData>;
  readonly errors: FieldErrors<QuotaFormInput>;
  readonly labels: QuotaLabels;
  readonly isEditing: boolean;
  readonly watchPeriodType: QuotaPeriodType | null | undefined;
  readonly watchKind: QuotaKind | undefined;
}

export function QuotaFormSectionDesktop({
  control,
  errors,
  labels,
  isEditing,
  watchPeriodType,
  watchKind,
}: Readonly<QuotaFormSectionDesktopProps>) {
  const { fieldAccess } = useQuotaFormAccess();

  return (
    <>
      <DesktopSectionPanel title={labels.fields.student}>
        <StudentInfoFields
          control={control}
          errors={errors}
          labels={labels}
          isEditing={isEditing}
          fieldAccess={fieldAccess}
        />
      </DesktopSectionPanel>

      <DesktopSectionPanel title={labels.fields.kind}>
        <QuotaConfigFields
          control={control}
          errors={errors}
          labels={labels}
          isEditing={isEditing}
          watchKind={watchKind}
          watchPeriodType={watchPeriodType}
          fieldAccess={fieldAccess}
        />
      </DesktopSectionPanel>

      <DesktopSectionPanel title={labels.fields.validFrom}>
        <ValidityDateFields control={control} errors={errors} labels={labels} fieldAccess={fieldAccess} />
      </DesktopSectionPanel>
    </>
  );
}

function StudentInfoFields({
  control,
  errors,
  labels,
  isEditing,
  fieldAccess,
}: Readonly<
  Omit<QuotaFormSectionDesktopProps, "watchPeriodType" | "watchKind"> & {
    readonly fieldAccess: import("@/frontend/common/views/dashboard/billing/quota/quotaFormAccessContext.types").QuotaFormFieldAccess;
  }
>) {
  if (isEditing) {
    return (
      <Controller
        name="name"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            fullWidth
            label={labels.fields.name}
            error={Boolean(errors.name)}
            helperText={errors.name?.message}
            required
            disabled={fieldAccess.name.disabled}
            sx={{ mb: 2 }}
          />
        )}
      />
    );
  }

  return (
    <>
      <Controller
        name="studentId"
        control={control}
        render={({ field }) => (
          <StudentAutocomplete
            value={field.value ? { id: field.value, name: field.value } : null}
            onChange={(next: PersonOption | null) => field.onChange(next?.id ?? "")}
            label={labels.fields.student}
            placeholder={labels.fields.studentPickerPlaceholder}
            error={Boolean(errors.studentId)}
            helperText={fieldAccess.studentId.helperText ?? errors.studentId?.message}
            required
            disabled={fieldAccess.studentId.disabled}
            fullWidth
            sx={{ mb: 2 }}
          />
        )}
      />
      <Controller
        name="name"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            fullWidth
            label={labels.fields.name}
            error={Boolean(errors.name)}
            helperText={errors.name?.message}
            required
            disabled={fieldAccess.name.disabled}
          />
        )}
      />
    </>
  );
}

function QuotaConfigFields({
  control,
  errors,
  labels,
  isEditing,
  watchKind,
  watchPeriodType,
  fieldAccess,
}: Readonly<
  QuotaFormSectionDesktopProps & {
    readonly fieldAccess: import("@/frontend/common/views/dashboard/billing/quota/quotaFormAccessContext.types").QuotaFormFieldAccess;
  }
>) {
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
    </>
  );
}

function ValidityDateFields({
  control,
  errors,
  labels,
  fieldAccess,
}: Readonly<
  Pick<QuotaFormSectionDesktopProps, "control" | "errors" | "labels"> & {
    readonly fieldAccess: import("@/frontend/common/views/dashboard/billing/quota/quotaFormAccessContext.types").QuotaFormFieldAccess;
  }
>) {
  return (
    <>
      <Controller
        name="validFrom"
        control={control}
        render={({ field }) => (
          <DesktopAppDatePicker
            label={labels.fields.validFrom}
            value={field.value ? new Date(field.value) : null}
            onChange={(date: Date | null) => field.onChange(date ? date.toISOString() : null)}
            disabled={fieldAccess.validFrom.disabled}
            slotProps={{
              textField: {
                fullWidth: true,
                error: Boolean(errors.validFrom),
                helperText: fieldAccess.validFrom.helperText ?? errors.validFrom?.message,
                sx: { mb: 2 },
              },
            }}
          />
        )}
      />
      <Controller
        name="validUntil"
        control={control}
        render={({ field }) => (
          <DesktopAppDatePicker
            label={labels.fields.validUntil}
            value={field.value ? new Date(field.value) : null}
            onChange={(date: Date | null) => field.onChange(date ? date.toISOString() : null)}
            disabled={fieldAccess.validUntil.disabled}
            slotProps={{
              textField: {
                fullWidth: true,
                error: Boolean(errors.validUntil),
                helperText: fieldAccess.validUntil.helperText ?? errors.validUntil?.message,
              },
            }}
          />
        )}
      />
    </>
  );
}

function isQuotaKind(value: string): value is QuotaKind {
  return (Object.values(QuotaKind) as readonly string[]).includes(value);
}

function isQuotaPeriodType(value: string): value is QuotaPeriodType {
  return (Object.values(QuotaPeriodType) as readonly string[]).includes(value);
}
