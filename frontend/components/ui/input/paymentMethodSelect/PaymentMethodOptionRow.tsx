"use client";

import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";
import AlternateEmailOutlinedIcon from "@mui/icons-material/AlternateEmailOutlined";
import LinkOutlinedIcon from "@mui/icons-material/LinkOutlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import SmartphoneOutlinedIcon from "@mui/icons-material/SmartphoneOutlined";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type * as React from "react";
import { PaymentMethodType } from "@/frontend/graphql/generated/gql/graphql-types";
import { getPaymentMethodCatalogOptionLabel, type PaymentMethodCatalogOption } from "@/frontend/lib/payment-method";

export type PaymentMethodOptionRowProps = {
  readonly option: PaymentMethodCatalogOption;
  readonly type?: PaymentMethodType | null;
  readonly showSlug?: boolean;
};

function resolveTypeIcon(type: PaymentMethodType | null | undefined): React.ReactNode {
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

export function PaymentMethodOptionRow({
  option,
  type,
  showSlug = true,
}: PaymentMethodOptionRowProps): React.ReactNode {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
      {option.logoUrl ? (
        <Avatar src={option.logoUrl} alt="" sx={{ width: 24, height: 24 }} />
      ) : (
        <Avatar sx={{ width: 24, height: 24 }}>{resolveTypeIcon(type)}</Avatar>
      )}
      <Typography component="span" sx={{ flex: 1 }}>
        {option.displayName}
      </Typography>
      {showSlug ? (
        <Typography component="span" dir="ltr" sx={theme => ({ color: theme.palette.text.secondary, flexShrink: 0 })}>
          {option.slug}
        </Typography>
      ) : null}
    </Box>
  );
}

export function getPaymentMethodOptionRowLabel(option: PaymentMethodCatalogOption): string {
  return `${getPaymentMethodCatalogOptionLabel(option)} (${option.slug})`;
}
