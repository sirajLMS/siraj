"use client";

import { Box, Button, ButtonGroup, Typography } from "@mui/material";
import type * as React from "react";
import { buildPaymentMethodTypeLabelByType } from "@/frontend/common/components/ui/input/paymentMethodTypeFields/constants";
import type { PaymentMethodTypeSelectorProps } from "@/frontend/common/components/ui/input/paymentMethodTypeFields/types";
import { PAYMENT_METHOD_TYPES } from "@/frontend/common/lib/payment-method";
import { useAppTranslation } from "@/shared/locale";

export const PaymentMethodTypeSelectorMobile: React.FC<PaymentMethodTypeSelectorProps> = ({
  type,
  setTypeAction,
  error = false,
  required = false,
  fullWidth = false,
  labels,
  allowEmpty = false,
  allowedTypes,
}): React.ReactNode => {
  const t = useAppTranslation().uiTranslations.paymentMethod.typeSelector;
  const title = labels?.title ?? t.title;
  const ariaLabel = labels?.ariaLabel ?? t.ariaLabel;

  const labelByType = buildPaymentMethodTypeLabelByType(labels, t);

  const visibleTypes = allowedTypes ?? PAYMENT_METHOD_TYPES;
  const buttons = visibleTypes.map(value => ({ value, label: labelByType[value] }));

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 1,
        width: fullWidth ? "100%" : "auto",
        flexWrap: "wrap",
        minWidth: 0,
      }}
    >
      <Typography
        color={error ? "error" : "default"}
        sx={{
          overflow: "visible",
          textOverflow: "ellipsis",
          display: "-webkit-box",
          WebkitLineClamp: 1,
          WebkitBoxOrient: "vertical",
        }}
        variant="subtitle1"
      >
        {title}
        {required ? (
          <Box component="span" sx={theme => ({ color: theme.palette.error.main, ml: 0.5 })}>
            *
          </Box>
        ) : null}
      </Typography>
      <ButtonGroup
        color={error ? "error" : "primary"}
        disableElevation
        variant="outlined"
        aria-label={ariaLabel}
        sx={{ width: fullWidth ? "100%" : "70%", flexWrap: "wrap" }}
      >
        {buttons.map(button => (
          <Button
            key={button.value}
            onClick={() => {
              setTypeAction(button.value);
            }}
            variant={type === button.value ? "contained" : "outlined"}
            sx={{ flex: 1, minWidth: 0, minHeight: 40 }}
          >
            {button.label}
          </Button>
        ))}
        {allowEmpty ? (
          <Button
            onClick={() => {
              setTypeAction(null);
            }}
            variant={type === null ? "contained" : "outlined"}
            sx={{ flex: 1, minWidth: 0, minHeight: 40 }}
          >
            {labels?.any ?? t.any}
          </Button>
        ) : null}
      </ButtonGroup>
    </Box>
  );
};
