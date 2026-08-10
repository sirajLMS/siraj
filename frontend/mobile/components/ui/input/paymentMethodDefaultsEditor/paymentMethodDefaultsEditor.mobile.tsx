"use client";

import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { Box, Button, InputAdornment, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { useCallback } from "react";
import type { PaymentMethodRow } from "@/frontend/common/components/ui/display/paymentMethod/types";
import { outlinedInputSx } from "@/frontend/common/components/ui/form";
import type { PaymentMethodDefaultsEditorProps } from "@/frontend/common/components/ui/input/paymentMethodDefaultsEditor/types";
import { filterMethodsForDirection } from "@/frontend/common/components/ui/input/paymentMethodDefaultsEditor/utils";
import { getPaymentMethodDirectionLabel, getPaymentMethodTypeLabel } from "@/frontend/common/lib/payment-method";
import { MobileStatusBadge } from "@/frontend/mobile/components/ui/badge/MobileStatusBadge";
import { MobileFormSuccessSnackbar } from "@/frontend/mobile/components/ui/form/snackbar/MobileFormSuccessSnackbar";
import { CurrencySelectMobile } from "@/frontend/mobile/components/ui/input/currencySelect";
import { LocalizedStringDrawerMobile } from "@/frontend/mobile/components/ui/input/localizedString";
import { Translation, useAppTranslation } from "@/shared/locale";
import type { LocalizedString } from "@/shared/types";

const DEFAULT_INSTRUCTIONS: LocalizedString = {};

const TYPE_LABEL_KEYS = ["mobileWallet", "paymentLink", "onlineAccount", "bankTransfer", "cash"] as const;
const DIRECTION_LABEL_KEYS = ["in", "out", "both"] as const;

function isTypeLabelKey(key: string): key is (typeof TYPE_LABEL_KEYS)[number] {
  return (TYPE_LABEL_KEYS as readonly string[]).includes(key);
}

function isDirectionLabelKey(key: string): key is (typeof DIRECTION_LABEL_KEYS)[number] {
  return (DIRECTION_LABEL_KEYS as readonly string[]).includes(key);
}

export function PaymentMethodDefaultsEditorMobile({
  methods,
  payinDefaultId,
  payoutDefaultId,
  onPayinDefaultChangeAction,
  onPayoutDefaultChangeAction,
  instructions = DEFAULT_INSTRUCTIONS,
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
      const typeLabel = getPaymentMethodTypeLabel(method.type, key => {
        const shortKey = key.slice("type.".length);
        return isTypeLabelKey(shortKey) ? t.type[shortKey] : "";
      });
      const directionLabel = getPaymentMethodDirectionLabel(method.direction, key => {
        const shortKey = key.slice("direction.".length);
        return isDirectionLabelKey(shortKey) ? t.direction[shortKey] : "";
      });
      const base = method.label?.trim() || method.catalogSlug || typeLabel;
      return directionLabel ? `${base} (${directionLabel})` : base;
    },
    [t]
  );

  const setInstructionsOpen = (open: boolean) => {
    onInstructionsOpenChangeAction?.(open);
  };

  return (
    <Stack sx={{ gap: 2 }}>
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
        <MenuItem value="" sx={{ minHeight: 40 }}>
          {tDefaults.none}
        </MenuItem>
        {payinMethods.map(method => (
          <MenuItem key={method.id} value={method.id} sx={{ minHeight: 40 }}>
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
        <MenuItem value="" sx={{ minHeight: 40 }}>
          {tDefaults.none}
        </MenuItem>
        {payoutMethods.map(method => (
          <MenuItem key={method.id} value={method.id} sx={{ minHeight: 40 }}>
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
                      size="medium"
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
          <LocalizedStringDrawerMobile
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
        <CurrencySelectMobile
          label={tDefaults.displayCurrency}
          currency={displayCurrency ?? null}
          setCurrencyAction={onDisplayCurrencyChangeAction}
          allowedCodes={allowedCurrencyCodes}
          disabled={disabled}
          fullWidth
        />
      ) : null}

      {methods.length > 0 ? (
        <Stack sx={{ gap: 1 }}>
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
                <MobileStatusBadge
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

      <MobileFormSuccessSnackbar
        open={successOpen}
        message={tDefaults.saved}
        onClose={() => onSuccessCloseAction?.()}
      />
    </Stack>
  );
}
