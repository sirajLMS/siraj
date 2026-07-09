"use client";

import { PaymentsOutlined } from "@mui/icons-material";
import { InputAdornment, TextField, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { Control, FieldErrors } from "react-hook-form";
import { Controller } from "react-hook-form";
import type { ManualInvoiceFormData } from "@/frontend/views/dashboard/billing/manual/schemas/manualInvoiceSchema";
import type { BillingManualLabels } from "@/shared/messages/types/dashboard/billing/manual";

interface ManualInvoiceFeeFieldProps {
  readonly control: Control<ManualInvoiceFormData>;
  readonly errors: FieldErrors<ManualInvoiceFormData>;
  readonly labels: BillingManualLabels;
  readonly variant: "desktop" | "mobile";
}

// Currency label for mobile view styled with primary color and bold weight
const StyledCurrencyLabel = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  color: theme.palette.primary.main,
}));

// Payments icon styled with primary color for the fee field adornment
const StyledPaymentsIcon = styled(PaymentsOutlined)(({ theme }) => ({
  color: theme.palette.primary.main,
}));

export function ManualInvoiceFeeField({ control, errors, labels, variant }: Readonly<ManualInvoiceFeeFieldProps>) {
  const isMobile = variant === "mobile";

  return (
    <Controller
      name="feeAmount"
      control={control}
      render={({ field }) => (
        <TextField
          {...field}
          type="number"
          placeholder={labels.feeAmountPlaceholder}
          fullWidth
          error={Boolean(errors.feeAmount)}
          helperText={errors.feeAmount?.message}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  {isMobile ? <StyledCurrencyLabel>AED</StyledCurrencyLabel> : <StyledPaymentsIcon />}
                </InputAdornment>
              ),
              inputProps: { step: "0.01", min: "0" },
            },
            htmlInput: { autoComplete: "off" },
          }}
          sx={
            isMobile
              ? { "& input": { fontSize: theme => theme.typography.headlineLg.fontSize, fontWeight: 700 } }
              : undefined
          }
        />
      )}
    />
  );
}
