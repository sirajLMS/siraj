"use client";

import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import type * as React from "react";
import type { PaymentMethodOptionRowProps } from "@/frontend/common/components/ui/input/paymentMethodSelect/paymentMethodOptionRow.types";
import { resolvePaymentMethodTypeIcon } from "@/frontend/common/components/ui/input/paymentMethodSelect/utils";

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
        <Avatar sx={{ width: 24, height: 24 }}>{resolvePaymentMethodTypeIcon(type)}</Avatar>
      )}
      <Box component="span" sx={{ flex: 1 }}>
        {option.displayName}
      </Box>
      {showSlug ? (
        <Box component="span" sx={theme => ({ color: theme.palette.text.secondary, flexShrink: 0, direction: "ltr" })}>
          {option.slug}
        </Box>
      ) : null}
    </Box>
  );
}
