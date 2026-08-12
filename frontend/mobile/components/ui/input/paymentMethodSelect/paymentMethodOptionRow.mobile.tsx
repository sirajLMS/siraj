"use client";

import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type * as React from "react";
import type { PaymentMethodOptionRowProps } from "@/frontend/common/components/ui/input/paymentMethodSelect/paymentMethodOptionRow.types";
import { resolvePaymentMethodTypeIcon } from "@/frontend/common/components/ui/input/paymentMethodSelect/utils";

export function PaymentMethodOptionRowMobile({
  option,
  type,
  showSlug = true,
}: PaymentMethodOptionRowProps): React.ReactNode {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, width: "100%", minHeight: 44 }}>
      {option.logoUrl ? (
        <Avatar src={option.logoUrl} alt="" sx={{ width: 32, height: 32 }} />
      ) : (
        <Avatar sx={{ width: 32, height: 32 }}>{resolvePaymentMethodTypeIcon(type)}</Avatar>
      )}
      <Typography component="span" sx={{ flex: 1, fontSize: "1rem" }}>
        {option.displayName}
      </Typography>
      {showSlug ? (
        <Typography
          component="span"
          dir="ltr"
          sx={theme => ({ color: theme.palette.text.secondary, flexShrink: 0, fontSize: "0.9rem" })}
        >
          {option.slug}
        </Typography>
      ) : null}
    </Box>
  );
}
