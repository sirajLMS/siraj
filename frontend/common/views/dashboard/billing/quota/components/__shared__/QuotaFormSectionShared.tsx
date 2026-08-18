"use client";

import { FormControl, InputLabel, MenuItem, Select, TextField } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ComponentType, ReactElement } from "react";
import { type Control, Controller, type FieldErrors } from "react-hook-form";
import { StudentAutocomplete } from "@/frontend/common/components/ui/input/userSelect/StudentAutocomplete";
import type { PersonOption } from "@/frontend/common/components/ui/input/userSelect/types";
import { QuotaKind, QuotaPeriodType } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  isQuotaKind,
  isQuotaPeriodType,
} from "@/frontend/common/views/dashboard/billing/quota/components/__shared__/quotaFormSectionShared.options";
import type { QuotaFormFieldAccess } from "@/frontend/common/views/dashboard/billing/quota/quotaFormAccessContext.types";
import type {
  QuotaFormData,
  QuotaFormInput,
} from "@/frontend/common/views/dashboard/billing/quota/schemas/quotaSchema";
import { useQuotaFormAccess } from "@/frontend/common/views/dashboard/billing/quota/useQuotaFormAccess";
import type { QuotaLabels } from "@/shared/locale/types/dashboard/billing/quota";

// --- Date picker slot ---

export interface DatePickerSlotProps {
  readonly label: string;
  readonly value: Date | null;
  readonly onChange: (date: Date | null) => void;
  readonly disabled: boolean;
  readonly error: boolean;
  readonly helperText?: string;
  readonly fullWidth: boolean;
  readonly sx?: SxProps<Theme>;
}

export interface DatePickerSlot {
  readonly component: ComponentType<DatePickerSlotProps>;
}

// --- Section wrapper slot (desktop wraps in a panel, mobile does not) ---

export type SectionWrapper = ({ title, children }: Readonly<{ title: string; children: ReactElement }>) => ReactElement;

// --- Shared props ---

export interface QuotaFormSectionSharedProps {
  readonly control: Control<QuotaFormInput, undefined, QuotaFormData>;
  readonly errors: FieldErrors<QuotaFormInput>;
  readonly labels: QuotaLabels;
  readonly isEditing: boolean;
  readonly watchPeriodType: QuotaPeriodType | null | undefined;
  readonly watchKind: QuotaKind | undefined;
  readonly datePickerSlot: DatePickerSlot;
  readonly wrapSection: SectionWrapper;
}

// --- Type guards (shared) ---
// Re-exported from quotaFormSectionShared.options.ts for consumer convenience.

// --- Section field components ---

interface SectionFieldProps {
  readonly control: Control<QuotaFormInput, undefined, QuotaFormData>;
  readonly errors: FieldErrors<QuotaFormInput>;
  readonly labels: QuotaLabels;
  readonly isEditing: boolean;
  readonly watchKind: QuotaKind | undefined;
  readonly watchPeriodType: QuotaPeriodType | null | undefined;
  readonly fieldAccess: QuotaFormFieldAccess;
  readonly datePickerSlot: DatePickerSlot;
}

function StudentInfoFields({
  control,
  errors,
  labels,
  isEditing,
  fieldAccess,
}: Readonly<Pick<SectionFieldProps, "control" | "errors" | "labels" | "isEditing" | "fieldAccess">>) {
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
}: Readonly<Omit<SectionFieldProps, "datePickerSlot">>) {
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

// --- Shared scaffold component ---

export function QuotaFormSectionShared({
  control,
  errors,
  labels,
  isEditing,
  watchPeriodType,
  watchKind,
  datePickerSlot,
  wrapSection,
}: Readonly<QuotaFormSectionSharedProps>) {
  const { fieldAccess } = useQuotaFormAccess();

  return (
    <>
      {wrapSection({
        title: labels.fields.student,
        children: (
          <StudentInfoFields
            control={control}
            errors={errors}
            labels={labels}
            isEditing={isEditing}
            fieldAccess={fieldAccess}
          />
        ),
      })}

      {wrapSection({
        title: labels.fields.kind,
        children: (
          <QuotaConfigFields
            control={control}
            errors={errors}
            labels={labels}
            isEditing={isEditing}
            watchKind={watchKind}
            watchPeriodType={watchPeriodType}
            fieldAccess={fieldAccess}
          />
        ),
      })}

      {wrapSection({
        title: labels.fields.validFrom,
        children: (
          <ValidityDateFields
            control={control}
            errors={errors}
            labels={labels}
            fieldAccess={fieldAccess}
            datePickerSlot={datePickerSlot}
          />
        ),
      })}
    </>
  );
}
