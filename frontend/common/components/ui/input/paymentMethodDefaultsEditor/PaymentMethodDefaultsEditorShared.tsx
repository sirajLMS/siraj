"use client";

import { Stack } from "@mui/material";
import type * as React from "react";
import { useState } from "react";
import { createFormatMethodLabel } from "@/frontend/common/components/ui/input/paymentMethodDefaultsEditor/PaymentMethodDefaultsEditorShared.helpers";
import {
  DefaultMethodSelects,
  InstructionsSection,
  MethodList,
} from "@/frontend/common/components/ui/input/paymentMethodDefaultsEditor/PaymentMethodDefaultsEditorShared.parts";
import type {
  PaymentMethodDefaultsEditorOptions,
  PaymentMethodDefaultsEditorSlots,
} from "@/frontend/common/components/ui/input/paymentMethodDefaultsEditor/PaymentMethodDefaultsEditorShared.types";
import type { PaymentMethodDefaultsEditorProps } from "@/frontend/common/components/ui/input/paymentMethodDefaultsEditor/types";
import { filterMethodsForDirection } from "@/frontend/common/components/ui/input/paymentMethodDefaultsEditor/utils";
import { Translation, useAppTranslation } from "@/shared/locale";
import type { LocalizedString } from "@/shared/types";

export type { PaymentMethodDefaultsEditorOptions, PaymentMethodDefaultsEditorSlots };

const DEFAULT_INSTRUCTIONS: LocalizedString = {};

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
  const formatMethodLabel = createFormatMethodLabel(t);

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
      <DefaultMethodSelects
        payinLabel={tDefaults.payinDefault}
        payoutLabel={tDefaults.payoutDefault}
        noneLabel={tDefaults.none}
        payinDefaultId={payinDefaultId}
        payoutDefaultId={payoutDefaultId}
        onPayinDefaultChangeAction={onPayinDefaultChangeAction}
        onPayoutDefaultChangeAction={onPayoutDefaultChangeAction}
        payinMethods={payinMethods}
        payoutMethods={payoutMethods}
        disabled={disabled}
        menuItemSelectedSx={menuItemSelectedSx}
        formatMethodLabel={formatMethodLabel}
      />

      {onInstructionsSaveAction ? (
        <InstructionsSection
          label={tDefaults.instructions}
          editLabel={tDefaults.editInstructions}
          displayValue={Object.values(instructions).find(value => value.trim() !== "") ?? tDefaults.none}
          instructions={instructions}
          disabled={disabled}
          editButtonSize={editButtonSize}
          open={instructionsOpen}
          LocalizedStringDrawer={LocalizedStringDrawer}
          onOpenChange={setInstructionsOpen}
          onSaveAction={onInstructionsSaveAction}
        />
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
        <MethodList
          methods={methods}
          formatMethodLabel={formatMethodLabel}
          renderDefaultBadge={label => (
            <StatusBadge category="paymentMethod" status="active" label={label} size="small" />
          )}
          defaultBadgeLabel={t.display.defaultBadge}
          spacing={innerStackSpacing}
          listStackSx={listStackSx}
        />
      ) : null}

      <FormSuccessSnackbar open={successOpen} message={tDefaults.saved} onClose={() => onSuccessCloseAction?.()} />
    </Stack>
  );
}
