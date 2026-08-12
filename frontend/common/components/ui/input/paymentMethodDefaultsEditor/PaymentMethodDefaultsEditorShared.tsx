"use client";

import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { Box, Button, InputAdornment, MenuItem, Stack, TextField, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import type * as React from "react";
import { useCallback, useState } from "react";
import type { PaymentMethodRow } from "@/frontend/common/components/ui/display/paymentMethod/types";
import { outlinedInputSx } from "@/frontend/common/components/ui/form";
import type { PaymentMethodDefaultsEditorProps } from "@/frontend/common/components/ui/input/paymentMethodDefaultsEditor/types";
import { filterMethodsForDirection } from "@/frontend/common/components/ui/input/paymentMethodDefaultsEditor/utils";
import { getPaymentMethodDirectionLabel, getPaymentMethodTypeLabel } from "@/frontend/common/lib/payment-method";
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

export interface PaymentMethodDefaultsEditorSlots {
  readonly StatusBadge: React.FC<{
    readonly category: "paymentMethod";
    readonly status: "active";
    readonly label: string;
    readonly size: "small";
  }>;
  readonly FormSuccessSnackbar: React.FC<{
    readonly open: boolean;
    readonly message: string;
    readonly onClose: () => void;
  }>;
  readonly CurrencySelect: React.FC<{
    readonly label: string;
    readonly currency: NonNullable<PaymentMethodDefaultsEditorProps["displayCurrency"]> | null;
    readonly setCurrencyAction: NonNullable<PaymentMethodDefaultsEditorProps["onDisplayCurrencyChangeAction"]>;
    readonly allowedCodes: PaymentMethodDefaultsEditorProps["allowedCurrencyCodes"];
    readonly disabled?: boolean;
    readonly fullWidth?: boolean;
  }>;
  readonly LocalizedStringDrawer: React.FC<{
    readonly open: boolean;
    readonly value: LocalizedString;
    readonly title: string;
    readonly multiline?: boolean;
    readonly onSaveAction: (next: LocalizedString) => void;
    readonly onCancelAction: () => void;
  }>;
}

export interface PaymentMethodDefaultsEditorOptions {
  readonly rootStackSx?: SxProps<Theme>;
  readonly menuItemSelectedSx?: SxProps<Theme>;
  readonly listStackSx?: SxProps<Theme>;
  readonly editButtonSize: "small" | "medium";
}

const DESKTOP_OPTIONS: PaymentMethodDefaultsEditorOptions = {
  rootStackSx: undefined,
  menuItemSelectedSx: undefined,
  listStackSx: undefined,
  editButtonSize: "small",
};

const MOBILE_OPTIONS: PaymentMethodDefaultsEditorOptions = {
  rootStackSx: { gap: 2 },
  menuItemSelectedSx: { minHeight: 40 },
  listStackSx: { gap: 1 },
  editButtonSize: "medium",
};

export const PAYMENT_METHOD_DEFAULTS_EDITOR_DESKTOP_OPTIONS = DESKTOP_OPTIONS;
export const PAYMENT_METHOD_DEFAULTS_EDITOR_MOBILE_OPTIONS = MOBILE_OPTIONS;

export function PaymentMethodDefaultsEditorShared({
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
  slots,
  options,
}: Readonly<PaymentMethodDefaultsEditorProps> & {
  readonly slots: PaymentMethodDefaultsEditorSlots;
  readonly options: PaymentMethodDefaultsEditorOptions;
}): React.ReactNode {
  const t = useAppTranslation(Translation.Ui.PaymentMethod);
  const tDefaults = t.defaultsEditor;
  const [internalInstructionsOpen, setInternalInstructionsOpen] = useState(false);
  const instructionsOpen = instructionsOpenProp ?? internalInstructionsOpen;

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
    if (instructionsOpenProp === undefined) {
      setInternalInstructionsOpen(open);
    }
    onInstructionsOpenChangeAction?.(open);
  };

  const { StatusBadge, FormSuccessSnackbar, CurrencySelect, LocalizedStringDrawer } = slots;
  const { rootStackSx, menuItemSelectedSx, listStackSx, editButtonSize } = options;
  const stackSpacing = rootStackSx ? undefined : 2;
  const innerStackSpacing = listStackSx ? undefined : 1;

  return (
    <Stack spacing={stackSpacing} sx={rootStackSx}>
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
        <MenuItem value="" sx={menuItemSelectedSx}>
          {tDefaults.none}
        </MenuItem>
        {payinMethods.map(method => (
          <MenuItem key={method.id} value={method.id} sx={menuItemSelectedSx}>
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
        <MenuItem value="" sx={menuItemSelectedSx}>
          {tDefaults.none}
        </MenuItem>
        {payoutMethods.map(method => (
          <MenuItem key={method.id} value={method.id} sx={menuItemSelectedSx}>
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
                      size={editButtonSize}
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
        <Stack spacing={innerStackSpacing} sx={listStackSx}>
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
