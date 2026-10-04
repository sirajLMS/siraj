"use client";

import { useCallback, useMemo } from "react";
import type { PaymentMethodCatalogOption } from "@/frontend/common/lib/payment-method";

export function useChangeHandlers(
  openProp: boolean | undefined,
  onOpenAction: (() => void) | undefined,
  onCloseAction: (() => void) | undefined,
  onChangeAction: ((value: PaymentMethodCatalogOption) => void) | undefined,
  setInternalOpen: (open: boolean) => void
): {
  readonly handleOpen: () => void;
  readonly handleClose: () => void;
  readonly handleChange: (_: unknown, newValue: PaymentMethodCatalogOption | null) => void;
} {
  return {
    handleOpen: useCallback(() => {
      if (openProp === undefined) {
        setInternalOpen(true);
      }
      onOpenAction?.();
    }, [openProp, onOpenAction, setInternalOpen]),
    handleClose: useCallback(() => {
      if (openProp === undefined) {
        setInternalOpen(false);
      }
      onCloseAction?.();
    }, [openProp, onCloseAction, setInternalOpen]),
    handleChange: useCallback(
      (_: unknown, newValue: PaymentMethodCatalogOption | null) => {
        if (newValue) {
          onChangeAction?.(newValue);
        }
      },
      [onChangeAction]
    ),
  };
}

export interface InputFieldValues {
  readonly option: PaymentMethodCatalogOption | null | undefined;
  readonly label: string | undefined;
  readonly placeholder: string | undefined;
  readonly required: boolean | undefined;
  readonly showError: boolean;
  readonly resolvedHelperText: string | undefined;
  readonly onBlur: (() => void) | undefined;
  readonly autoFocus: boolean | undefined;
  readonly autoComplete: string;
  readonly textFieldSize: "small" | "medium" | undefined;
}

export function useInputFields(
  option: PaymentMethodCatalogOption | null | undefined,
  resolvedLabel: string | undefined,
  resolvedPlaceholder: string | undefined,
  required: boolean | undefined,
  showError: boolean,
  resolvedHelperText: string | undefined,
  onBlur: (() => void) | undefined,
  autoFocus: boolean | undefined,
  autoComplete: string,
  textFieldSize: "small" | "medium" | undefined
): InputFieldValues {
  return useMemo(
    () => ({
      option,
      label: resolvedLabel,
      placeholder: resolvedPlaceholder,
      required,
      showError,
      resolvedHelperText,
      onBlur,
      autoFocus,
      autoComplete,
      textFieldSize,
    }),
    [
      option,
      resolvedLabel,
      resolvedPlaceholder,
      required,
      showError,
      resolvedHelperText,
      onBlur,
      autoFocus,
      autoComplete,
      textFieldSize,
    ]
  );
}
