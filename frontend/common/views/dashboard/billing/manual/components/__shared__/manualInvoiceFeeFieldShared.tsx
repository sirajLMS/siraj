"use client";

import { type SxProps, TextField, type Theme } from "@mui/material";
import { Controller } from "react-hook-form";
import { CurrencySymbolAdornment } from "@/frontend/common/components/ui/input/currencySelect/__shared__/currencySymbolAdornmentShared";
import { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import { getCurrencySymbol } from "@/frontend/common/lib/currency";
import type { BaseManualInvoiceFeeFieldProps } from "@/frontend/common/views/dashboard/billing/manual/types/manualInvoiceFeeField.types";

export interface ManualInvoiceFeeFieldSharedOptions {
  readonly textFieldSx: SxProps<Theme>;
}

export function ManualInvoiceFeeFieldShared({
  control,
  errors,
  labels,
  draftCurrency,
  options,
}: Readonly<BaseManualInvoiceFeeFieldProps & { draftCurrency?: CurrencyCode }> & {
  readonly options: ManualInvoiceFeeFieldSharedOptions;
}) {
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
          sx={options.textFieldSx}
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
