"use client";

import { Alert, FormControl, InputLabel, MenuItem, Select, TextField } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import { type CurrencyCode, PaymentGateway } from "@/frontend/common/graphql/generated/gql/graphql";
import { getCurrencyOptionLabel } from "@/frontend/common/lib/currency";

/** Localized gateway options presented on accounting payment forms. */
const ACCOUNTING_GATEWAY_OPTIONS: readonly PaymentGateway[] = [
  PaymentGateway.None,
  PaymentGateway.Paypal,
  PaymentGateway.WesternUnion,
  PaymentGateway.Bank,
  PaymentGateway.Other,
];

interface GatewaySelectFieldProps {
  readonly value: PaymentGateway;
  readonly onChange: (value: PaymentGateway) => void;
  readonly label: string;
  readonly localizedGateways: Record<PaymentGateway, string>;
  readonly sx?: SxProps<Theme>;
}

/** Localized select for the payment gateway (shared by create and edit flows). */
export function GatewaySelectField({
  value,
  onChange,
  label,
  localizedGateways,
  sx,
}: Readonly<GatewaySelectFieldProps>) {
  return (
    <FormControl size="small" sx={sx}>
      <InputLabel>{label}</InputLabel>
      <Select<PaymentGateway> value={value} label={label} onChange={e => onChange(e.target.value)}>
        {ACCOUNTING_GATEWAY_OPTIONS.map(gateway => (
          <MenuItem key={gateway} value={gateway}>
            {localizedGateways[gateway]}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

interface PaymentNoteFieldProps {
  readonly value: string | null;
  readonly onChange: (value: string) => void;
  readonly onBlur: () => void;
  readonly label: string;
  readonly placeholder: string;
}

/** Multiline free-form note attached to a payment (shared by create and edit flows). */
export function PaymentNoteField({ value, onChange, onBlur, label, placeholder }: Readonly<PaymentNoteFieldProps>) {
  return (
    <TextField
      value={value ?? ""}
      onChange={e => onChange(e.target.value)}
      onBlur={onBlur}
      size="small"
      multiline
      minRows={3}
      label={label}
      placeholder={placeholder}
    />
  );
}

interface CurrencyMismatchAlertProps {
  readonly active: boolean;
  readonly lastPaymentCurrency: CurrencyCode | null;
  /** Localized warning builder receiving the previous payment's currency label. */
  readonly message: (currencyLabel: string) => string;
}

/**
 * Soft warning shown when the chosen currency differs from the student's most
 * recent payment currency — hours from mixed currencies share one balance.
 */
export function CurrencyMismatchAlert({ active, lastPaymentCurrency, message }: Readonly<CurrencyMismatchAlertProps>) {
  if (!active || lastPaymentCurrency === null) {
    return null;
  }
  return (
    <Alert severity="warning" variant="outlined" sx={{ borderRadius: 2 }}>
      {message(getCurrencyOptionLabel(lastPaymentCurrency))}
    </Alert>
  );
}
