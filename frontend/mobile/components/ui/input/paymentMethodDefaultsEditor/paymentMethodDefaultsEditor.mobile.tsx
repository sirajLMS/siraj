"use client";

import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { Box, Button, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { useCallback, useState } from "react";
import { PaymentDirection } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { getPaymentMethodDirectionLabel, getPaymentMethodTypeLabel } from "@/frontend/common/lib/payment-method";
import { MobileStatusBadge } from "@/frontend/mobile/components/ui/badge/MobileStatusBadge";
import { MobileFieldWrapper } from "@/frontend/mobile/components/ui/form/field/MobileFieldWrapper";
import { MobileFormSuccessSnackbar } from "@/frontend/mobile/components/ui/form/snackbar/MobileFormSuccessSnackbar";
import { CurrencySelectMobile } from "@/frontend/mobile/components/ui/input/currencySelect";
import { LocalizedStringDrawerMobile } from "@/frontend/mobile/components/ui/input/localizedString";
import type {
  PaymentMethodDefaultsEditorProps,
  PaymentMethodRow,
} from "@/frontend/mobile/components/ui/input/paymentMethodDefaultsEditor/paymentMethodDefaultsEditor.types";
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

export function PaymentMethodDefaultsEditorMobile({
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
    <Stack sx={{ gap: 2 }}>
      <MobileFieldWrapper label={tDefaults.payinDefault}>
        <TextField
          select
          fullWidth
          size="small"
          disabled={disabled}
          value={payinDefaultId ?? ""}
          onChange={event => onPayinDefaultChangeAction(event.target.value || null)}
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
      </MobileFieldWrapper>

      <MobileFieldWrapper label={tDefaults.payoutDefault}>
        <TextField
          select
          fullWidth
          size="small"
          disabled={disabled}
          value={payoutDefaultId ?? ""}
          onChange={event => onPayoutDefaultChangeAction(event.target.value || null)}
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
      </MobileFieldWrapper>

      {onInstructionsSaveAction ? (
        <MobileFieldWrapper label={tDefaults.instructions}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography sx={{ flex: 1, typography: "bodyMd", color: "text.secondary" }}>
              {Object.values(instructions).find(value => value.trim() !== "") ?? tDefaults.none}
            </Typography>
            <Button
              variant="outlined"
              size="medium"
              disabled={disabled}
              startIcon={<EditOutlinedIcon />}
              onClick={() => setInstructionsOpen(true)}
            >
              {tDefaults.editInstructions}
            </Button>
          </Box>
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
        </MobileFieldWrapper>
      ) : null}

      {onDisplayCurrencyChangeAction ? (
        <MobileFieldWrapper label={tDefaults.displayCurrency}>
          <CurrencySelectMobile
            currency={displayCurrency ?? null}
            setCurrencyAction={onDisplayCurrencyChangeAction}
            allowedCodes={allowedCurrencyCodes}
            disabled={disabled}
            fullWidth
          />
        </MobileFieldWrapper>
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
