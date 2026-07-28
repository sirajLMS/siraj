"use client";

import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { Box, Button, InputAdornment, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { useCallback } from "react";
import type { PaymentMethodRow } from "@/frontend/common/components/ui/display/paymentMethod/types";
import { outlinedInputSx } from "@/frontend/common/components/ui/form";
import type { PaymentMethodDefaultsEditorProps } from "@/frontend/common/components/ui/input/paymentMethodDefaultsEditor/types";
import { filterMethodsForDirection } from "@/frontend/common/components/ui/input/paymentMethodDefaultsEditor/utils";
import { getPaymentMethodDirectionLabel, getPaymentMethodTypeLabel } from "@/frontend/common/lib/payment-method";
import { DesktopStatusBadge } from "@/frontend/desktop/components/ui/badge";
import { DesktopFormSuccessSnackbar } from "@/frontend/desktop/components/ui/form/snackbar";
import { CurrencySelectDesktop } from "@/frontend/desktop/components/ui/input/currencySelect";
import { LocalizedStringDrawerDesktop } from "@/frontend/desktop/components/ui/input/localizedString";
import { Translation, useAppTranslation } from "@/shared/locale";

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
  const t = useAppTranslation(Translation.Ui.PaymentMethod);
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
      <TextField
        select
        label={tDefaults.payinDefault}
        fullWidth
        size="small"
        disabled={disabled}
        value={payinDefaultId ?? ""}
        onChange={event => onPayinDefaultChangeAction(event.target.value || null)}
        sx={outlinedInputSx}
        slotProps={{ inputLabel: { shrink: true } }}
      >
        <MenuItem value="">{tDefaults.none}</MenuItem>
        {payinMethods.map(method => (
          <MenuItem key={method.id} value={method.id}>
            {formatMethodLabel(method)}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        label={tDefaults.payoutDefault}
        fullWidth
        size="small"
        disabled={disabled}
        value={payoutDefaultId ?? ""}
        onChange={event => onPayoutDefaultChangeAction(event.target.value || null)}
        sx={outlinedInputSx}
        slotProps={{ inputLabel: { shrink: true } }}
      >
        <MenuItem value="">{tDefaults.none}</MenuItem>
        {payoutMethods.map(method => (
          <MenuItem key={method.id} value={method.id}>
            {formatMethodLabel(method)}
          </MenuItem>
        ))}
      </TextField>

      {onInstructionsSaveAction ? (
        <>
          <TextField
            label={tDefaults.instructions}
            fullWidth
            size="small"
            disabled={disabled}
            value={Object.values(instructions).find(value => value.trim() !== "") ?? tDefaults.none}
            sx={outlinedInputSx}
            slotProps={{
              input: {
                readOnly: true,
                endAdornment: (
                  <InputAdornment position="end">
                    <Button
                      variant="outlined"
                      size="small"
                      disabled={disabled}
                      startIcon={<EditOutlinedIcon />}
                      onClick={() => setInstructionsOpen(true)}
                    >
                      {tDefaults.editInstructions}
                    </Button>
                  </InputAdornment>
                ),
              },
            }}
          />
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
        </>
      ) : null}

      {onDisplayCurrencyChangeAction ? (
        <CurrencySelectDesktop
          label={tDefaults.displayCurrency}
          currency={displayCurrency ?? null}
          setCurrencyAction={onDisplayCurrencyChangeAction}
          allowedCodes={allowedCurrencyCodes}
          disabled={disabled}
          fullWidth
        />
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
