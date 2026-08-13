"use client";

import { Box } from "@mui/material";
import type { ComponentType, ReactNode } from "react";
import { type Control, Controller, useWatch } from "react-hook-form";
import type { PersonOption } from "@/frontend/common/components/ui/input/userSelect";
import type { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { ManualInvoiceFormData } from "@/frontend/common/views/dashboard/billing/manual/schemas/manualInvoiceSchema";
import type { BaseManualInvoiceDateFieldProps } from "@/frontend/common/views/dashboard/billing/manual/types/manualInvoiceDateField.types";
import type { BaseManualInvoiceFeeFieldProps } from "@/frontend/common/views/dashboard/billing/manual/types/manualInvoiceFeeField.types";
import type { BaseManualInvoiceFormFieldsProps } from "@/frontend/common/views/dashboard/billing/manual/types/manualInvoiceFormFields.types";
import type { ManualInvoiceParentFieldProps } from "@/frontend/common/views/dashboard/billing/manual/types/manualInvoiceParentField.types";
import { CurrencyControllerField } from "@/frontend/common/views/dashboard/profile/shared/CurrencyControllerField";
import type { BillingManualLabels } from "@/shared/locale";

export interface ManualInvoiceFormFieldsSharedConfig {
  readonly StudentAutocomplete: ComponentType<{
    readonly value: PersonOption | null;
    readonly onChange: (option: PersonOption | null) => void;
    readonly scope: { readonly parentId?: string };
    readonly skip: boolean;
    readonly label: string;
    readonly error: boolean;
    readonly helperText?: string;
    readonly disabled: boolean;
  }>;
  readonly ParentField: ComponentType<ManualInvoiceParentFieldProps>;
  // FeeField accepts optional draftCurrency — mobile uses it, desktop accepts but ignores it
  readonly FeeField: ComponentType<
    Readonly<BaseManualInvoiceFeeFieldProps & { readonly draftCurrency?: CurrencyCode }>
  >;
  readonly DateField: ComponentType<BaseManualInvoiceDateFieldProps>;
  readonly FieldWrapper?: ComponentType<{ readonly children: ReactNode }>;
  readonly containerSx: object;
  readonly datesGridSx: object;
  readonly draftCurrency?: CurrencyCode;
}

function StudentSelectorField({
  control,
  selectedParentId,
  labels,
  StudentAutocomplete,
}: {
  readonly control: Control<ManualInvoiceFormData>;
  readonly selectedParentId: string | null;
  readonly labels: BillingManualLabels;
  readonly StudentAutocomplete: ManualInvoiceFormFieldsSharedConfig["StudentAutocomplete"];
}) {
  return (
    <Controller
      control={control}
      name="studentId"
      render={({ field, fieldState }) => (
        <StudentAutocomplete
          value={field.value ? ({ id: field.value, name: "" } satisfies PersonOption) : null}
          onChange={option => {
            field.onChange(option?.id ?? "");
          }}
          scope={{ parentId: selectedParentId ?? undefined }}
          skip={!selectedParentId}
          label={labels.studentSelection}
          error={Boolean(fieldState.error)}
          helperText={fieldState.error?.message}
          disabled={!selectedParentId}
        />
      )}
    />
  );
}

function FieldWrapperSlot({
  children,
  FieldWrapper,
}: {
  readonly children: ReactNode;
  readonly FieldWrapper: ManualInvoiceFormFieldsSharedConfig["FieldWrapper"];
}) {
  if (FieldWrapper) {
    return <FieldWrapper>{children}</FieldWrapper>;
  }
  return <>{children}</>;
}

export interface ManualInvoiceFormFieldsSharedProps extends BaseManualInvoiceFormFieldsProps {
  readonly draftCurrency?: CurrencyCode;
  readonly config: ManualInvoiceFormFieldsSharedConfig;
}

export function ManualInvoiceFormFieldsShared({
  control,
  errors,
  labels,
  profileLabels,
  selectedParentId,
  draftCurrency: draftCurrencyProp,
  config,
}: Readonly<ManualInvoiceFormFieldsSharedProps>) {
  const draftCurrency = draftCurrencyProp ?? config.draftCurrency;
  const currencyLabel = profileLabels.fields.currency;
  const watchedParentId = useWatch({ control, name: "parentId" });
  const parentIdForStudents = watchedParentId || selectedParentId;

  const { FieldWrapper, containerSx, datesGridSx, FeeField, DateField, StudentAutocomplete, ParentField } = config;

  const parentField = <ParentField control={control} errors={errors} labels={labels} />;
  const studentField = (
    <StudentSelectorField
      control={control}
      selectedParentId={parentIdForStudents}
      labels={labels}
      StudentAutocomplete={StudentAutocomplete}
    />
  );

  const feeField = (
    <FeeField
      control={control}
      errors={errors}
      labels={labels}
      {...(draftCurrency !== undefined ? { draftCurrency } : {})}
    />
  );

  return (
    <Box sx={containerSx}>
      <FieldWrapperSlot FieldWrapper={FieldWrapper}>{parentField}</FieldWrapperSlot>
      <FieldWrapperSlot FieldWrapper={FieldWrapper}>{studentField}</FieldWrapperSlot>
      <FieldWrapperSlot FieldWrapper={FieldWrapper}>{feeField}</FieldWrapperSlot>
      <FieldWrapperSlot FieldWrapper={FieldWrapper}>
        <CurrencyControllerField control={control} name="currency" label={currencyLabel} />
      </FieldWrapperSlot>
      <Box sx={datesGridSx}>
        <FieldWrapperSlot FieldWrapper={FieldWrapper}>
          <DateField control={control} errors={errors} labels={labels} name="issueDate" />
        </FieldWrapperSlot>
        <FieldWrapperSlot FieldWrapper={FieldWrapper}>
          <DateField control={control} errors={errors} labels={labels} name="dueDate" />
        </FieldWrapperSlot>
      </Box>
    </Box>
  );
}
