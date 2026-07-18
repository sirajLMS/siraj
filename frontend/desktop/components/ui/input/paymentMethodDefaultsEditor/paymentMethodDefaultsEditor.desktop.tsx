"use client";

import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { Box, Button, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { useCallback } from "react";
import type { PaymentMethodRow } from "@/frontend/common/components/ui/display/paymentMethod/types";
import type { PaymentMethodDefaultsEditorProps } from "@/frontend/common/components/ui/input/paymentMethodDefaultsEditor/types";
import { filterMethodsForDirection } from "@/frontend/common/components/ui/input/paymentMethodDefaultsEditor/utils";
import { getPaymentMethodDirectionLabel, getPaymentMethodTypeLabel } from "@/frontend/common/lib/payment-method";
import { DesktopStatusBadge } from "@/frontend/desktop/components/ui/badge";
import { DesktopFieldWrapper } from "@/frontend/desktop/components/ui/form/field";
import { DesktopFormSuccessSnackbar } from "@/frontend/desktop/components/ui/form/snackbar";
import { CurrencySelectDesktop } from "@/frontend/desktop/components/ui/input/currencySelect";
import { LocalizedStringDrawerDesktop } from "@/frontend/desktop/components/ui/input/localizedString";
import { useAppTranslation } from "@/shared/locale";

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
  instructionsOpen = false,
  onInstructionsOpenChangeAction,
}: Readonly<PaymentMethodDefaultsEditorProps>) {
  const t = useAppTranslation().uiTranslations.paymentMethod;
  const tDefaults = t.defaultsEditor;

  const payinMethods = filterMethodsForDirection(methods, "payin");
  const payoutMethods = filterMethodsForDirection(methods, "payout");

  const formatMethodLabel = useCallback(
    (method: PaymentMethodRow) => {
      const typeLabel = getPaymentMethodTypeLabel(method.type, key => t.type[key as keyof typeof t.type] ?? "");
      const directionLabel = getPaymentMethodDirectionLabel(
        method.direction,
        key => t.direction[key as keyof typeof t.direction] ?? ""
      );
      const base = method.label?.trim() || method.catalogSlug || typeLabel;
      return directionLabel ? `${base} (${directionLabel})` : base;
    },
    [t]
  );

  const setInstructionsOpen = (open: boolean) => {
    onInstructionsOpenChangeAction?.(open);
  };

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
