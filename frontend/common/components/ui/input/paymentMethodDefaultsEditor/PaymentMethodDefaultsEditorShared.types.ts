import type { SxProps, Theme } from "@mui/material/styles";
import type * as React from "react";
import type { PaymentMethodDefaultsEditorProps } from "@/frontend/common/components/ui/input/paymentMethodDefaultsEditor/types";
import type { LocalizedString } from "@/shared/types";

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
