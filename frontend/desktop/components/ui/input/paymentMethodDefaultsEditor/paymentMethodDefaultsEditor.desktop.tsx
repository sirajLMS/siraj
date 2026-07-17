"use client";

import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { Box, Button, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { useCallback, useState } from "react";
import { StatusBadge } from "@/frontend/common/components/ui/badge/StatusBadge";
import type { PaymentMethodRow } from "@/frontend/common/components/ui/display/paymentMethod/paymentMethodDisplay.types";
import { FieldWrapper } from "@/frontend/common/components/ui/form/field/FieldWrapper";
import { FormSuccessSnackbar } from "@/frontend/common/components/ui/form/snackbar/FormSuccessSnackbar";
import type { PaymentMethodDefaultsEditorProps } from "@/frontend/common/components/ui/input/paymentMethodDefaultsEditor/PaymentMethodDefaultsEditor";
import { PaymentDirection } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { getPaymentMethodDirectionLabel, getPaymentMethodTypeLabel } from "@/frontend/common/lib/payment-method";
import { CurrencySelectDesktop } from "@/frontend/desktop/components/ui/input/currencySelect";
import { LocalizedStringDrawerDesktop } from "@/frontend/desktop/components/ui/input/localizedString";
import { useAppTranslation } from "@/shared/locale";

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
      <FieldWrapper label={tDefaults.payinDefault}>
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
      </FieldWrapper>

      <FieldWrapper label={tDefaults.payoutDefault}>
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
      </FieldWrapper>

      {onInstructionsSaveAction ? (
        <FieldWrapper label={tDefaults.instructions}>
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
        </FieldWrapper>
      ) : null}

      {onDisplayCurrencyChangeAction ? (
        <FieldWrapper label={tDefaults.displayCurrency}>
          <CurrencySelectDesktop
            currency={displayCurrency ?? null}
            setCurrencyAction={onDisplayCurrencyChangeAction}
            allowedCodes={allowedCurrencyCodes}
            disabled={disabled}
            fullWidth
          />
        </FieldWrapper>
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
                <StatusBadge category="paymentMethod" status="active" label={t.display.defaultBadge} size="small" />
              ) : null}
            </Box>
          ))}
        </Stack>
      ) : null}

      <FormSuccessSnackbar open={successOpen} message={tDefaults.saved} onClose={() => onSuccessCloseAction?.()} />
    </Stack>
  );
}
