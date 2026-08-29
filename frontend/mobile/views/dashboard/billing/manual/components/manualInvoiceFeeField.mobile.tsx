"use client";

import { TextField } from "@mui/material";
import { Controller } from "react-hook-form";
import { CurrencySymbolAdornment } from "@/frontend/common/components/ui/input/currencySelect/__shared__/currencySymbolAdornmentShared";
import { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import { getCurrencySymbol } from "@/frontend/common/lib/currency";
import type { ManualInvoiceFeeFieldMobileProps } from "@/frontend/common/views/dashboard/billing/manual/types/manualInvoiceFeeField.types";

export function ManualInvoiceFeeFieldMobile({
  control,
  errors,
  labels,
  draftCurrency,
}: Readonly<ManualInvoiceFeeFieldMobileProps>) {
  const currencySymbol = getCurrencySymbol(draftCurrency ?? CurrencyCode.Usd);

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
              startAdornment: <CurrencySymbolAdornment symbol={currencySymbol} />,
              inputProps: { step: "0.01", min: "0" },
            },
            htmlInput: { autoComplete: "off" },
          }}
        />
      )}
    />
  );
}
