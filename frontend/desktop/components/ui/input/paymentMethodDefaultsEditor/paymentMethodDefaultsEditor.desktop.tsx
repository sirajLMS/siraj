"use client";

import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { Box, Button, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { useCallback, useState } from "react";
import { PaymentDirection, type PaymentMethodType } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { CurrencyOption } from "@/frontend/common/lib/currency";
import { getPaymentMethodDirectionLabel, getPaymentMethodTypeLabel } from "@/frontend/common/lib/payment-method";
import { DesktopStatusBadge } from "@/frontend/desktop/components/ui/badge";
import { DesktopFieldWrapper } from "@/frontend/desktop/components/ui/form/field";
import { DesktopFormSuccessSnackbar } from "@/frontend/desktop/components/ui/form/snackbar";
import { CurrencySelectDesktop } from "@/frontend/desktop/components/ui/input/currencySelect";
import { LocalizedStringDrawerDesktop } from "@/frontend/desktop/components/ui/input/localizedString";
import { useAppTranslation } from "@/shared/locale";

export type PaymentMethodDisplayData = {
  readonly id?: string;
  readonly type?: PaymentMethodType | null;
  readonly direction?: PaymentDirection | null;
  readonly label?: string | null;
  readonly catalogName?: Record<string, string> | null;
  readonly catalogSlug?: string | null;
  readonly logoUrl?: string | null;
  readonly details?: {
    readonly phone?: string | null;
    readonly url?: string | null;
    readonly identifier?: string | null;
    readonly iban?: string | null;
    readonly bankName?: string | null;
    readonly beneficiaryName?: string | null;
    readonly note?: string | null;
  } | null;
  readonly countryCode?: string | null;
  readonly currencyCode?: string | null;
  readonly verifiedAt?: string | null;
  readonly isActive?: boolean | null;
  readonly isDefault?: boolean;
  readonly masked?: boolean;
};

export type PaymentMethodRow = PaymentMethodDisplayData & {
  readonly id: string;
  readonly type: PaymentMethodType;
  readonly direction: PaymentDirection;
  readonly isDefault: boolean;
};

export type PaymentMethodDefaultsEditorProps = {
  readonly methods: readonly PaymentMethodRow[];
  readonly payinDefaultId: string | null;
  readonly payoutDefaultId: string | null;
  readonly onPayinDefaultChangeAction: (id: string | null) => void;
  readonly onPayoutDefaultChangeAction: (id: string | null) => void;
  readonly instructions?: Record<string, string>;
  readonly onInstructionsSaveAction?: (next: Record<string, string>) => void;
  readonly displayCurrency?: CurrencyOption | null;
  readonly onDisplayCurrencyChangeAction?: (currency: CurrencyOption) => void;
  readonly allowedCurrencyCodes?: readonly string[] | undefined;
  readonly disabled?: boolean;
  readonly successOpen?: boolean;
  readonly onSuccessCloseAction?: () => void;
};

function filterMethodsForDirection(
  methods: readonly PaymentMethodRow[],
  direction: "payin" | "payout"
): readonly PaymentMethodRow[] {
  return methods.filter(method => {
    if (!method.direction) return false;
    if (method.direction === PaymentDirection.Both) return true;
    return direction === "payin"
      ? method.direction === PaymentDirection.Payin
      : method.direction === PaymentDirection.Payout;
  });
}

export function PaymentMethodDefaultsEditorDesktop({
  methods,
  payinDefaultId,
  payoutDefaultId,
  onPayinDefaultChangeAction,
  onPayoutDefaultChangeAction,
  instructions = {},
  onInstructionsSaveAction,
  displayCurrency,
  onDisplayCurrencyChangeAction,
  allowedCurrencyCodes,
  disabled = false,
  successOpen = false,
  onSuccessCloseAction,
}: PaymentMethodDefaultsEditorProps) {
  const t = useAppTranslation().uiTranslations.paymentMethod;
  const tDefaults = t.defaultsEditor;
  const [instructionsOpen, setInstructionsOpen] = useState(false);

  const payinMethods = filterMethodsForDirection(methods, "payin");
  const payoutMethods = filterMethodsForDirection(methods, "payout");

  const formatMethodLabel = useCallback(
    (method: PaymentMethodRow) => {
      const typeLabel = method.type
        ? getPaymentMethodTypeLabel(method.type, key => t.type[key as keyof typeof t.type] ?? "")
        : "";
      const directionLabel = method.direction
        ? getPaymentMethodDirectionLabel(method.direction, key => t.direction[key as keyof typeof t.direction] ?? "")
        : "";
      const base = method.label?.trim() || method.catalogSlug || typeLabel;
      return directionLabel ? `${base} (${directionLabel})` : base;
    },
    [t]
  );

  return (
    <Stack spacing={2}>
      <DesktopFieldWrapper label={tDefaults.payinDefault}>
        <TextField
          select
          fullWidth
          size="small"
          disabled={disabled}
          value={payinDefaultId ?? ""}
          onChange={event => onPayinDefaultChangeAction(event.target.value || null)}
        >
          <MenuItem value="">{tDefaults.none}</MenuItem>
          {payinMethods.map(method => (
            <MenuItem key={method.id} value={method.id}>
              {formatMethodLabel(method)}
            </MenuItem>
          ))}
        </TextField>
      </DesktopFieldWrapper>

      <DesktopFieldWrapper label={tDefaults.payoutDefault}>
        <TextField
          select
          fullWidth
          size="small"
          disabled={disabled}
          value={payoutDefaultId ?? ""}
          onChange={event => onPayoutDefaultChangeAction(event.target.value || null)}
        >
          <MenuItem value="">{tDefaults.none}</MenuItem>
          {payoutMethods.map(method => (
            <MenuItem key={method.id} value={method.id}>
              {formatMethodLabel(method)}
            </MenuItem>
          ))}
        </TextField>
      </DesktopFieldWrapper>

      {onInstructionsSaveAction ? (
        <DesktopFieldWrapper label={tDefaults.instructions}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography sx={{ flex: 1, typography: "bodyMd", color: "text.secondary" }}>
              {Object.values(instructions).find(value => value.trim() !== "") ?? tDefaults.none}
            </Typography>
            <Button
              variant="outlined"
              size="small"
              disabled={disabled}
              startIcon={<EditOutlinedIcon />}
              onClick={() => setInstructionsOpen(true)}
            >
              {tDefaults.editInstructions}
            </Button>
          </Box>
          <LocalizedStringDrawerDesktop
            open={instructionsOpen}
            value={instructions}
            title={tDefaults.editInstructions}
            multiline
            onSaveAction={next => {
              onInstructionsSaveAction(next);
              setInstructionsOpen(false);
            }}
            onCancelAction={() => setInstructionsOpen(false)}
          />
        </DesktopFieldWrapper>
      ) : null}

      {onDisplayCurrencyChangeAction ? (
        <DesktopFieldWrapper label={tDefaults.displayCurrency}>
          <CurrencySelectDesktop
            currency={displayCurrency ?? null}
            setCurrencyAction={onDisplayCurrencyChangeAction}
            allowedCodes={allowedCurrencyCodes}
            disabled={disabled}
            fullWidth
          />
        </DesktopFieldWrapper>
      ) : null}

      {methods.length > 0 ? (
        <Stack spacing={1}>
          {methods.map(method => (
            <Box
              key={method.id}
              sx={theme => ({
                display: "flex",
                alignItems: "center",
                gap: 1,
                p: 1.5,
                borderRadius: 1,
                border: `1px solid ${theme.palette.outlineVariant}`,
              })}
            >
              <Typography sx={{ flex: 1, typography: "bodyMd" }}>{formatMethodLabel(method)}</Typography>
              {method.isDefault ? (
                <DesktopStatusBadge
                  category="paymentMethod"
                  status="active"
                  label={t.display.defaultBadge}
                  size="small"
                />
              ) : null}
            </Box>
          ))}
        </Stack>
      ) : null}

      <DesktopFormSuccessSnackbar
        open={successOpen}
        message={tDefaults.saved}
        onClose={() => onSuccessCloseAction?.()}
      />
    </Stack>
  );
}
