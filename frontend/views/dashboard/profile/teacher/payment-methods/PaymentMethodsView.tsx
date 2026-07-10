"use client";

import { useQuery } from "@apollo/client/react";
import { Box, Chip, CircularProgress, Stack, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { ErrorState } from "@/frontend/components/ui";
import { PaymentMethodType } from "@/frontend/graphql/generated/gql/graphql-types";
import type { UserPaymentMethodFieldsFragment } from "@/frontend/graphql/generated/gql/operations";
import { userPaymentMethodsQueryDocument } from "@/frontend/graphql/sharedDocuments/billing/payment-method.documents";
import { getPaymentMethodDirectionLabel, getPaymentMethodTypeLabel } from "@/frontend/lib/payment-method";

type PaymentMethodsViewProps = {
  readonly targetUserId: string;
};

function formatMethodLabel(method: UserPaymentMethodFieldsFragment, t: (key: string) => string): string {
  if (method.label?.trim()) {
    return method.label;
  }
  if (method.type) {
    return getPaymentMethodTypeLabel(method.type as PaymentMethodType, t);
  }
  return t("notProvided");
}

export function PaymentMethodsView({ targetUserId }: PaymentMethodsViewProps) {
  const t = useTranslations("profile.banking");
  const tRoot = useTranslations();

  const { data, loading, error, refetch } = useQuery(userPaymentMethodsQueryDocument, {
    variables: { userId: targetUserId, direction: null },
  });

  const methods = data?.userPaymentMethods ?? [];

  if (loading && methods.length === 0) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && methods.length === 0) {
    return (
      <ErrorState
        embedded
        message={t("empty.title")}
        retryLabel={t("actions.manage")}
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  if (methods.length === 0) {
    return (
      <Stack spacing={1}>
        <Typography sx={{ typography: "titleMd" }}>{t("empty.title")}</Typography>
        <Typography sx={{ typography: "bodyMd", color: "text.secondary" }}>{t("empty.description")}</Typography>
      </Stack>
    );
  }

  return (
    <Stack spacing={2}>
      {methods.map(method => {
        if (!method.id) return null;
        const typedMethod = method as UserPaymentMethodFieldsFragment;

        const directionLabel = typedMethod.direction
          ? getPaymentMethodDirectionLabel(typedMethod.direction, key => tRoot(key))
          : null;

        return (
          <Box
            key={typedMethod.id}
            sx={theme => ({
              border: `1px solid ${theme.palette.outlineVariant}`,
              borderRadius: 2,
              p: 2,
            })}
          >
            <Stack sx={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
              <Stack sx={{ gap: 0.5 }}>
                <Stack sx={{ flexDirection: "row", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
                  <Typography sx={{ typography: "titleMd" }}>
                    {formatMethodLabel(typedMethod, key => tRoot(key))}
                  </Typography>
                  {typedMethod.isDefault ? <Chip size="small" label="Default" color="primary" /> : null}
                  {typedMethod.verifiedAt ? (
                    <Chip size="small" label={t("verified")} color="success" variant="outlined" />
                  ) : typedMethod.type === PaymentMethodType.BankTransfer ? (
                    <Chip size="small" label={t("notVerified")} variant="outlined" />
                  ) : null}
                </Stack>
                {directionLabel ? (
                  <Typography sx={{ typography: "bodySm", color: "text.secondary" }}>{directionLabel}</Typography>
                ) : null}
                {typedMethod.details?.iban ? (
                  <Typography sx={{ typography: "bodySm", color: "text.secondary" }} dir="ltr">
                    {typedMethod.details.iban}
                  </Typography>
                ) : null}
              </Stack>
            </Stack>
          </Box>
        );
      })}
    </Stack>
  );
}
