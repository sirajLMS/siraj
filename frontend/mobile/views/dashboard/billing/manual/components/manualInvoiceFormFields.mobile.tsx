"use client";

import { Box } from "@mui/material";
import type { Control } from "react-hook-form";
import { Controller, useWatch } from "react-hook-form";
import { CurrencySelect } from "@/frontend/common/components/ui/input/currencySelect/CurrencySelect";
import type { PersonOption } from "@/frontend/common/components/ui/input/userSelect";
import { type CurrencyOption, getCurrencyByCode } from "@/frontend/common/lib/currency";
import type { ManualInvoiceFormData } from "@/frontend/common/views/dashboard/billing/manual/schemas/manualInvoiceSchema";
import type { ManualInvoiceFormFieldsMobileProps } from "@/frontend/common/views/dashboard/billing/manual/types/manualInvoiceFormFields.types";
import { StudentAutocompleteMobile } from "@/frontend/mobile/components/ui/input/userSelect";
import { ManualInvoiceDateFieldMobile } from "@/frontend/mobile/views/dashboard/billing/manual/components/manualInvoiceDateField.mobile";
import { ManualInvoiceFeeFieldMobile } from "@/frontend/mobile/views/dashboard/billing/manual/components/manualInvoiceFeeField.mobile";
import { MobileFieldCard } from "@/frontend/mobile/views/dashboard/billing/manual/components/manualInvoiceFormLayout.mobile";
import { ManualInvoiceParentFieldMobile } from "@/frontend/mobile/views/dashboard/billing/manual/components/manualInvoiceParentField.mobile";
import type { BillingManualLabels } from "@/shared/locale";
import { useAppTranslation } from "@/shared/locale";

function CurrencyField({
  control,
  label,
}: {
  readonly control: Control<ManualInvoiceFormData>;
  readonly label: string;
}) {
  return (
    <Controller
      name="currency"
      control={control}
      render={({ field, fieldState }) => {
        const option: CurrencyOption | null = field.value ? (getCurrencyByCode(field.value) ?? null) : null;
        return (
          <CurrencySelect
            currency={option}
            setCurrencyAction={selected => {
              field.onChange(selected.code);
            }}
            onBlurAction={field.onBlur}
            label={label}
            error={Boolean(fieldState.error)}
            helperText={fieldState.error?.message}
            fullWidth
          />
        );
      }}
    />
  );
}

function StudentSelectorField({
  control,
  selectedParentId,
  labels,
}: {
  readonly control: Control<ManualInvoiceFormData>;
  readonly selectedParentId: string | null;
  readonly labels: BillingManualLabels;
}) {
  return (
    <Controller
      control={control}
      name="studentId"
      render={({ field, fieldState }) => (
        <StudentAutocompleteMobile
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

export function ManualInvoiceFormFieldsMobile({
  control,
  errors,
  labels,
  selectedParentId,
  draftCurrency,
}: Readonly<ManualInvoiceFormFieldsMobileProps>) {
  const tProfile = useAppTranslation().profileTranslations.parent;
  const currencyLabel = tProfile.fields.currency;
  const watchedParentId = useWatch({ control, name: "parentId" });
  const parentIdForStudents = watchedParentId || selectedParentId;

  const parentField = <ManualInvoiceParentFieldMobile control={control} errors={errors} labels={labels} />;
  const studentField = (
    <StudentSelectorField control={control} selectedParentId={parentIdForStudents} labels={labels} />
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <MobileFieldCard>{parentField}</MobileFieldCard>
      <MobileFieldCard>{studentField}</MobileFieldCard>
      <MobileFieldCard>
        <ManualInvoiceFeeFieldMobile control={control} errors={errors} labels={labels} draftCurrency={draftCurrency} />
      </MobileFieldCard>
      <MobileFieldCard>
        <CurrencyField control={control} label={currencyLabel} />
      </MobileFieldCard>
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
        <MobileFieldCard>
          <ManualInvoiceDateFieldMobile control={control} errors={errors} labels={labels} name="issueDate" />
        </MobileFieldCard>
        <MobileFieldCard>
          <ManualInvoiceDateFieldMobile control={control} errors={errors} labels={labels} name="dueDate" />
        </MobileFieldCard>
      </Box>
    </Box>
  );
}
