"use client";

import { PaymentsOutlined } from "@mui/icons-material";
import { InputAdornment, TextField, Typography } from "@mui/material";
import type { Control, FieldErrors } from "react-hook-form";
import { Controller } from "react-hook-form";
import type { BillingManualLabels } from "@/frontend/messages/types/dashboard/billing/manual";
import type { ManualInvoiceFormData } from "../schemas/manualInvoiceSchema";

interface ManualInvoiceFeeFieldProps {
  readonly control: Control<ManualInvoiceFormData>;
  readonly errors: FieldErrors<ManualInvoiceFormData>;
  readonly labels: BillingManualLabels;
  readonly variant: "desktop" | "mobile";
}

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
                  {isMobile ? (
                    <Typography sx={{ fontWeight: 700, color: theme => theme.palette.primary.main }}>AED</Typography>
                  ) : (
                    <PaymentsOutlined sx={theme => ({ color: theme.palette.primary.main })} />
                  )}
                </InputAdornment>
              ),
              inputProps: { step: "0.01", min: "0" },
            },
            htmlInput: { autoComplete: "off" },
          }}
          sx={isMobile ? { "& input": { fontSize: "2rem", fontWeight: 700 } } : undefined}
        />
      )}
    />
  );
}
