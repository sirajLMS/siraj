"use client";

import { InputAdornment, TextField, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { Controller } from "react-hook-form";
import { getCurrencySymbol } from "@/frontend/common/lib/currency";
import type { ManualInvoiceFeeFieldMobileProps } from "@/frontend/common/views/dashboard/billing/manual/types/manualInvoiceFeeField.types";

const StyledCurrencyLabel = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  color: theme.palette.primary.main,
}));

export function ManualInvoiceFeeFieldMobile({
  control,
  errors,
  labels,
  draftCurrency,
}: Readonly<ManualInvoiceFeeFieldMobileProps>) {
  const currencySymbol = getCurrencySymbol(draftCurrency ?? "SAR");

  return (
    <Controller
      name="feeAmount"
      control={control}
      render={({ field }) => (
        <TextField
          {...field}
          type="number"
          label={labels.feeAmount}
          placeholder={labels.feeAmountPlaceholder}
          variant="outlined"
          fullWidth
          error={Boolean(errors.feeAmount)}
          helperText={errors.feeAmount?.message}
          sx={theme => ({
            borderRadius: 3,
            "& input": { fontSize: theme.typography.headlineLg.fontSize, fontWeight: 700 },
          })}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <StyledCurrencyLabel>{currencySymbol}</StyledCurrencyLabel>
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
