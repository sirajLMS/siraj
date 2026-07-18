// NEW FOR PLAN v5: lifted from inline tier declarations in
// frontend/mobile/components/ui/input/paymentMethodSelect/paymentMethodOptionRow.mobile.tsx and
// frontend/desktop/components/ui/input/paymentMethodSelect/paymentMethodOptionRow.desktop.tsx and
// frontend/common/components/ui/input/paymentMethodSelect/PaymentMethodOptionRow.tsx (byte-identical
// pure-data helper per specs.md §5 / §3 N9) so both tiers and the common wrapper import the same
// implementation.

import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";
import AlternateEmailOutlinedIcon from "@mui/icons-material/AlternateEmailOutlined";
import LinkOutlinedIcon from "@mui/icons-material/LinkOutlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import SmartphoneOutlinedIcon from "@mui/icons-material/SmartphoneOutlined";
import type * as React from "react";
import { PaymentMethodType } from "@/frontend/common/graphql/generated/gql/graphql-types";

export function resolvePaymentMethodTypeIcon(type: PaymentMethodType | null | undefined): React.ReactNode {
  switch (type) {
    case PaymentMethodType.MobileWallet:
      return <SmartphoneOutlinedIcon fontSize="small" />;
    case PaymentMethodType.PaymentLink:
      return <LinkOutlinedIcon fontSize="small" />;
    case PaymentMethodType.OnlineAccount:
      return <AlternateEmailOutlinedIcon fontSize="small" />;
    case PaymentMethodType.BankTransfer:
      return <AccountBalanceOutlinedIcon fontSize="small" />;
    case PaymentMethodType.Cash:
      return <PaymentsOutlinedIcon fontSize="small" />;
    default:
      return <PaymentsOutlinedIcon fontSize="small" />;
  }
}
