"use client";

import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type * as React from "react";
import type { PaymentMethodOptionRowProps } from "@/frontend/common/components/ui/input/paymentMethodSelect/types";
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
