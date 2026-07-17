"use client";

import type * as React from "react";
import type { PaymentMethodType } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { PaymentMethodAutocompleteDesktop } from "@/frontend/desktop/components/ui/input/paymentMethodSelect/paymentMethodAutocomplete.desktop";

export interface PaymentMethodCatalogOption {
  readonly id: string;
  readonly slug: string;
  readonly displayName: string;
  readonly logoUrl: string | null;
}

export type PaymentMethodAutocompleteProps = {
  readonly option?: PaymentMethodCatalogOption | null;
  readonly options: readonly PaymentMethodCatalogOption[];
  readonly onChangeAction: (option: PaymentMethodCatalogOption) => void;
  readonly type?: PaymentMethodType | null;
  readonly autoComplete?: string;
  readonly fullWidth?: boolean;
  readonly required?: boolean;
  readonly disabled?: boolean;
  readonly label?: string;
  readonly placeholder?: string;
  readonly error?: boolean;
  readonly helperText?: string;
  readonly onBlurAction?: () => void;
  readonly style?: React.CSSProperties;
  readonly open?: boolean;
  readonly onOpenAction?: () => void;
  readonly onCloseAction?: () => void;
  readonly autoFocus?: boolean;
  readonly allowedSlugs?: readonly string[];
  readonly matchAnchorWidth?: boolean;
  readonly disablePortal?: boolean;
  readonly listAttached?: boolean;
  readonly showSlug?: boolean;
};

export interface PaymentMethodSelectProps {
  readonly option?: PaymentMethodCatalogOption | null;
  readonly setOptionAction: (option: PaymentMethodCatalogOption | null) => void;
  readonly options: readonly PaymentMethodCatalogOption[];
  readonly type?: PaymentMethodType | null;
  readonly autoComplete?: string;
  readonly fullWidth?: boolean;
  readonly required?: boolean;
  readonly disabled?: boolean;
  readonly label?: string;
  readonly placeholder?: string;
  readonly error?: boolean;
  readonly helperText?: string;
  readonly onBlurAction?: () => void;
  readonly style?: React.CSSProperties;
  readonly open?: boolean;
  readonly onOpenAction?: () => void;
  readonly onCloseAction?: () => void;
  readonly autoFocus?: boolean;
  readonly allowedSlugs?: readonly string[];
  readonly matchAnchorWidth?: boolean;
  readonly disablePortal?: boolean;
  readonly listAttached?: boolean;
  readonly showSlug?: boolean;
}

export type PaymentMethodSelectDesktopProps = PaymentMethodSelectProps;

export const PaymentMethodSelectDesktop: React.FC<PaymentMethodSelectDesktopProps> = ({
  option,
  setOptionAction,
  options,
  ...props
}: PaymentMethodSelectDesktopProps): React.ReactNode => {
  const autocompleteProps: PaymentMethodAutocompleteProps = {
    option,
    options,
    onChangeAction: setOptionAction,
    matchAnchorWidth: true,
    showSlug: true,
    ...props,
  };

  return <PaymentMethodAutocompleteDesktop {...autocompleteProps} />;
};
