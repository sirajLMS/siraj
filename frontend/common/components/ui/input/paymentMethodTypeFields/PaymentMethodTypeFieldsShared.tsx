"use client";

import type * as React from "react";
import type { FieldValues } from "react-hook-form";
import {
  BankTransferFields,
  CashFields,
} from "@/frontend/common/components/ui/input/paymentMethodTypeFields/PaymentMethodTypeFieldsShared.parts";
import {
  MobileWalletFields,
  OnlineAccountFields,
  PaymentLinkFields,
} from "@/frontend/common/components/ui/input/paymentMethodTypeFields/PaymentMethodTypeFieldsShared.selectFields";
import type {
  PaymentMethodTypeFieldSharedOptions,
  PaymentMethodTypeFieldsContext,
  PaymentMethodTypeFieldsSlots,
} from "@/frontend/common/components/ui/input/paymentMethodTypeFields/PaymentMethodTypeFieldsShared.types";
import type { PaymentMethodTypeFieldsProps } from "@/frontend/common/components/ui/input/paymentMethodTypeFields/types";
import { PaymentMethodType } from "@/frontend/common/graphql/generated/gql/graphql";
import type { PaymentMethodTypeFieldsLabels } from "@/shared/locale/types/ui";

export type { PaymentMethodTypeFieldSharedOptions, PaymentMethodTypeFieldsSlots };

const EMPTY_READONLY_ARRAY = [] as const;
const DEFAULT_OPTIONS: PaymentMethodTypeFieldSharedOptions = {};

export function PaymentMethodTypeFieldsShared<T extends FieldValues>({
  type,
  control,
  disabled = false,
  walletOptions = EMPTY_READONLY_ARRAY,
  paymentLinkOptions = EMPTY_READONLY_ARRAY,
  onlineAccountOptions = EMPTY_READONLY_ARRAY,
  selectedWallet,
  selectedPaymentLink,
  selectedOnlineAccount,
  onWalletChangeAction,
  onPaymentLinkChangeAction,
  onOnlineAccountChangeAction,
  allowedCurrencyCodes,
  showCatalogMetadata = false,
  detailsPrefix,
  catalogPrefix,
  slots,
  options = DEFAULT_OPTIONS,
  tTypeFields,
}: Readonly<PaymentMethodTypeFieldsProps<T>> & {
  readonly slots: PaymentMethodTypeFieldsSlots<T>;
  readonly options?: PaymentMethodTypeFieldSharedOptions;
  readonly tTypeFields: PaymentMethodTypeFieldsLabels;
}): React.ReactNode {
  const { stackSpacing, textFieldSize } = options;
  const ctx: PaymentMethodTypeFieldsContext<T> = {
    type,
    control,
    disabled,
    detailsPrefix,
    catalogPrefix,
    allowedCurrencyCodes,
    showCatalogMetadata,
    sizeProp: textFieldSize ? { size: textFieldSize } : {},
    stackSx: stackSpacing !== undefined ? { gap: stackSpacing } : undefined,
    stackSpacingProp: stackSpacing === undefined ? 2 : undefined,
    tTypeFields,
    slots,
  };

  switch (type) {
    case PaymentMethodType.MobileWallet:
      return (
        <MobileWalletFields
          ctx={ctx}
          walletOptions={walletOptions}
          selectedWallet={selectedWallet}
          onWalletChangeAction={onWalletChangeAction}
        />
      );
    case PaymentMethodType.PaymentLink:
      return (
        <PaymentLinkFields
          ctx={ctx}
          paymentLinkOptions={paymentLinkOptions}
          selectedPaymentLink={selectedPaymentLink}
          onPaymentLinkChangeAction={onPaymentLinkChangeAction}
        />
      );
    case PaymentMethodType.OnlineAccount:
      return (
        <OnlineAccountFields
          ctx={ctx}
          onlineAccountOptions={onlineAccountOptions}
          selectedOnlineAccount={selectedOnlineAccount}
          onOnlineAccountChangeAction={onOnlineAccountChangeAction}
        />
      );
    case PaymentMethodType.BankTransfer:
      return <BankTransferFields ctx={ctx} />;
    case PaymentMethodType.Cash:
      return <CashFields ctx={ctx} />;
    default:
      return null;
  }
}
