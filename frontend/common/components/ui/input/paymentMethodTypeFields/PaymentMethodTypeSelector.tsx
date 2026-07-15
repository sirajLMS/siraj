"use client";

import { Box, Button, ButtonGroup, Typography } from "@mui/material";
import type * as React from "react";
import { PaymentMethodType } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { PAYMENT_METHOD_TYPES } from "@/frontend/common/lib/payment-method";
import { useAppTranslation } from "@/shared/locale/client";
import type { PaymentMethodTypeSelectorLabels } from "@/shared/locale/types/ui";

export type PaymentMethodTypeSelectorProps = {
  readonly type: PaymentMethodType | null;
  readonly setTypeAction: (type: PaymentMethodType | null) => void;
  readonly error?: boolean;
  readonly required?: boolean;
  readonly fullWidth?: boolean;
  readonly labels?: Partial<PaymentMethodTypeSelectorLabels>;
  readonly allowEmpty?: boolean;
  readonly allowedTypes?: readonly PaymentMethodType[];
};

export const PaymentMethodTypeSelector: React.FC<PaymentMethodTypeSelectorProps> = ({
  type,
  setTypeAction,
  error = false,
  required = false,
  fullWidth = false,
  labels,
  allowEmpty = false,
  allowedTypes,
}): React.ReactNode => {
  const t = useAppTranslation("ui").paymentMethod.typeSelector;
  const title = labels?.title ?? t.title;
  const ariaLabel = labels?.ariaLabel ?? t.ariaLabel;

  const labelByType: Record<PaymentMethodType, string> = {
    [PaymentMethodType.MobileWallet]: labels?.mobileWallet ?? t.mobileWallet,
    [PaymentMethodType.PaymentLink]: labels?.paymentLink ?? t.paymentLink,
    [PaymentMethodType.OnlineAccount]: labels?.onlineAccount ?? t.onlineAccount,
    [PaymentMethodType.BankTransfer]: labels?.bankTransfer ?? t.bankTransfer,
    [PaymentMethodType.Cash]: labels?.cash ?? t.cash,
    [PaymentMethodType.ProofUpload]: "Proof upload",
  };

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
            sx={{ flex: 1, minWidth: 0 }}
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
            sx={{ flex: 1, minWidth: 0 }}
          >
            {labels?.any ?? t.any}
          </Button>
        ) : null}
      </ButtonGroup>
    </Box>
  );
};
