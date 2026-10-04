import type * as React from "react";
import { useCallback, useState } from "react";
import type { CurrencyOption } from "@/frontend/common/lib/currency";

export interface UseCurrencyAutocompleteOptions {
  readonly openProp: boolean | undefined;
  readonly onOpenAction?: () => void;
  readonly onCloseAction?: () => void;
  readonly onChangeAction: (currency: CurrencyOption) => void;
  readonly onClearAction?: () => void;
}

export function useCurrencyAutocomplete({
  openProp,
  onOpenAction,
  onCloseAction,
  onChangeAction,
  onClearAction,
}: UseCurrencyAutocompleteOptions) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = openProp ?? internalOpen;

  const handleOpen = useCallback(() => {
    if (openProp === undefined) {
      setInternalOpen(true);
    }
    onOpenAction?.();
  }, [openProp, onOpenAction]);

  const handleClose = useCallback(() => {
    if (openProp === undefined) {
      setInternalOpen(false);
    }
    onCloseAction?.();
  }, [openProp, onCloseAction]);

  const handleChange = useCallback(
    (_: React.SyntheticEvent, newValue: CurrencyOption | null) => {
      if (newValue) {
        onChangeAction(newValue);
      } else if (onClearAction) {
        onClearAction();
      }
    },
    [onChangeAction, onClearAction]
  );

  return { isOpen, handleOpen, handleClose, handleChange };
}
