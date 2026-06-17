"use client";

import { Box } from "@mui/material";
import type { Control, FieldErrors } from "react-hook-form";
import type { ParentInvoiceOption } from "@/frontend/stores/mocKAdminManualInvoiceStore";
import type { BillingManualLabels } from "@/shared/messages/types/dashboard/billing/manual";
import type { ManualInvoiceFormData } from "../schemas/manualInvoiceSchema";
import { ManualInvoiceDateField } from "./ManualInvoiceDateField";
import { ManualInvoiceFeeField } from "./ManualInvoiceFeeField";
import { FieldLabel, MobileFieldCard } from "./ManualInvoiceFormLayout";
import { ManualInvoiceParentField } from "./ManualInvoiceParentField";

interface ManualInvoiceFormFieldsProps {
  readonly control: Control<ManualInvoiceFormData>;
  readonly errors: FieldErrors<ManualInvoiceFormData>;
  readonly labels: BillingManualLabels;
  readonly parentOptions: readonly ParentInvoiceOption[];
  readonly variant: "desktop" | "mobile";
}

export function ManualInvoiceFormFields({
  control,
  errors,
  labels,
  parentOptions,
  variant,
}: Readonly<ManualInvoiceFormFieldsProps>) {
  const isMobile = variant === "mobile";

  if (isMobile) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <MobileFieldCard label={labels.parentSelection}>
          <ManualInvoiceParentField control={control} errors={errors} labels={labels} parentOptions={parentOptions} />
        </MobileFieldCard>
        <MobileFieldCard label={labels.feeAmount}>
          <ManualInvoiceFeeField control={control} errors={errors} labels={labels} variant={variant} />
        </MobileFieldCard>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
          <MobileFieldCard label={labels.issueDate}>
            <ManualInvoiceDateField
              control={control}
              errors={errors}
              labels={labels}
              name="issueDate"
              variant={variant}
            />
          </MobileFieldCard>
          <MobileFieldCard label={labels.dueDate}>
            <ManualInvoiceDateField
              control={control}
              errors={errors}
              labels={labels}
              name="dueDate"
              variant={variant}
            />
          </MobileFieldCard>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
        gap: 3,
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <FieldLabel>{labels.parentSelection}</FieldLabel>
        <ManualInvoiceParentField control={control} errors={errors} labels={labels} parentOptions={parentOptions} />
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <FieldLabel>{labels.feeAmount}</FieldLabel>
        <ManualInvoiceFeeField control={control} errors={errors} labels={labels} variant={variant} />
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <FieldLabel>{labels.issueDate}</FieldLabel>
        <ManualInvoiceDateField control={control} errors={errors} labels={labels} name="issueDate" variant={variant} />
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <FieldLabel>{labels.dueDate}</FieldLabel>
        <ManualInvoiceDateField control={control} errors={errors} labels={labels} name="dueDate" variant={variant} />
      </Box>
    </Box>
  );
}
