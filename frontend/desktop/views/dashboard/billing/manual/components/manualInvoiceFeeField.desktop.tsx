"use client";

import { PaymentsOutlined } from "@mui/icons-material";
import { InputAdornment, TextField } from "@mui/material";
import { styled } from "@mui/material/styles";
import { Controller } from "react-hook-form";
import type { BaseManualInvoiceFeeFieldProps } from "@/frontend/common/views/dashboard/billing/manual/types/manualInvoiceFeeField.types";

const StyledPaymentsIcon = styled(PaymentsOutlined)(({ theme }) => ({
  color: theme.palette.primary.main,
}));

export function ManualInvoiceFeeFieldDesktop({ control, errors, labels }: Readonly<BaseManualInvoiceFeeFieldProps>) {
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
                  <StyledPaymentsIcon />
                </InputAdornment>
              ),
              inputProps: { step: "0.01", min: "0" },
            },
            htmlInput: { autoComplete: "off" },
          }}
        />
      )}
    />
  );
}
