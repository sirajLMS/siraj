"use client";

import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { Box, Button, InputAdornment, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { useCallback, useState } from "react";
import { StatusBadge } from "@/frontend/common/components/ui/badge/StatusBadge";
import type { PaymentMethodRow } from "@/frontend/common/components/ui/display/paymentMethod/types";
import { outlinedInputSx } from "@/frontend/common/components/ui/form";
import { FormSuccessSnackbar } from "@/frontend/common/components/ui/form/snackbar/FormSuccessSnackbar";
import { CurrencySelect } from "@/frontend/common/components/ui/input/currencySelect/CurrencySelect";
import { LocalizedStringDrawer } from "@/frontend/common/components/ui/input/localizedString/LocalizedStringDrawer";
import type { PaymentMethodDefaultsEditorProps } from "@/frontend/common/components/ui/input/paymentMethodDefaultsEditor/types";
import { filterMethodsForDirection } from "@/frontend/common/components/ui/input/paymentMethodDefaultsEditor/utils";
import { getPaymentMethodDirectionLabel, getPaymentMethodTypeLabel } from "@/frontend/common/lib/payment-method";
import { Translation, useAppTranslation } from "@/shared/locale";
import type { LocalizedString } from "@/shared/types";

export type { PaymentMethodDefaultsEditorProps } from "./types";

const DEFAULT_INSTRUCTIONS: LocalizedString = {};

function makeLabelResolver(labels: PaymentMethodTypeLabels | PaymentMethodDirectionLabels, prefix: string) {
  return (messageKey: string) => {
    const shortKey = messageKey.slice(prefix.length) as keyof typeof labels;
    return labels[shortKey] ?? "";
  };
}

export function PaymentMethodDefaultsEditor({
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
  instructionsOpen: instructionsOpenProp,
  onInstructionsOpenChangeAction,
}: Readonly<PaymentMethodDefaultsEditorProps>) {
  const t = useAppTranslation(Translation.Ui.PaymentMethod);
  const tDefaults = t.defaultsEditor;
  // EXCEPTION: documented in frontend/common/components/ui/AGENTS.md (purely ephemeral instructions drawer open state — viewport-agnostic primitives may use local useState with controlled-prop fallback)
  const [internalInstructionsOpen, setInternalInstructionsOpen] = useState(false);
  const instructionsOpen = instructionsOpenProp ?? internalInstructionsOpen;

  const payinMethods = filterMethodsForDirection(methods, "payin");
  const payoutMethods = filterMethodsForDirection(methods, "payout");

  const formatMethodLabel = useCallback(
    (method: PaymentMethodRow) => {
      const typeLabel = getPaymentMethodTypeLabel(method.type, makeLabelResolver(t.type, "type."));
      const directionLabel = getPaymentMethodDirectionLabel(
        method.direction,
        makeLabelResolver(t.direction, "direction.")
      );
      const base = method.label?.trim() || method.catalogSlug || typeLabel;
      return directionLabel ? `${base} (${directionLabel})` : base;
    },
    [t]
  );

  const setInstructionsOpen = (open: boolean) => {
    if (instructionsOpenProp === undefined) {
      setInternalInstructionsOpen(open);
    }
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
          <LocalizedStringDrawer
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
        <CurrencySelect
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
