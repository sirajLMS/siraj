"use client";

import { useQuery } from "@apollo/client/react";
import { Box, Chip, CircularProgress, Stack, Typography } from "@mui/material";
import { useLocale, useTranslations } from "next-intl";
import { ErrorState } from "@/frontend/components/ui";
import type { PaymentMethodType } from "@/frontend/graphql/generated/gql/graphql-types";
import type { UserPaymentMethodFieldsFragment } from "@/frontend/graphql/generated/gql/operations";
import { userPaymentMethodsQueryDocument } from "@/frontend/graphql/sharedDocuments/billing/payment-method.documents";
import { getPaymentMethodDirectionLabel, getPaymentMethodTypeLabel } from "@/frontend/lib/payment-method";

type PaymentMethodsViewProps = {
  readonly targetUserId: string;
};

function formatMethodLabel(
  method: UserPaymentMethodFieldsFragment,
  t: (key: string) => string
): string {
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
  const locale = useLocale();

  const { data, loading, error, refetch } = useQuery(userPaymentMethodsQueryDocument, {
    variables: { userId: targetUserId },
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

        const directionLabel = method.direction
          ? getPaymentMethodDirectionLabel(method.direction, key => tRoot(key))
          : null;

        return (
          <Box
            key={method.id}
            sx={theme => ({
              border: `1px solid ${theme.palette.outlineVariant}`,
              borderRadius: 2,
              p: 2,
            })}
          >
            <Stack sx={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
              <Stack sx={{ gap: 0.5 }}>
                <Stack sx={{ flexDirection: "row", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
                  <Typography sx={{ typography: "titleMd" }}>{formatMethodLabel(method, key => tRoot(key))}</Typography>
                  {method.isDefault ? <Chip size="small" label={locale === "ar" ? "افتراضي" : "Default"} color="primary" /> : null}
                  {method.verifiedAt ? (
                    <Chip size="small" label={t("verified")} color="success" variant="outlined" />
                  ) : method.type === "BANK_TRANSFER" ? (
                    <Chip size="small" label={t("notVerified")} variant="outlined" />
                  ) : null}
                </Stack>
                {directionLabel ? (
                  <Typography sx={{ typography: "bodySm", color: "text.secondary" }}>{directionLabel}</Typography>
                ) : null}
                {method.details?.iban ? (
                  <Typography sx={{ typography: "bodySm", color: "text.secondary" }} dir="ltr">
                    {method.details.iban}
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
