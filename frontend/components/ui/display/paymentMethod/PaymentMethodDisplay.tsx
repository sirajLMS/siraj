"use client";

import { Box, Chip, Stack, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import type * as React from "react";
import { StatusBadge } from "@/frontend/components/ui/badge/StatusBadge";
import {
  CountryDisplay,
  CurrencyDisplay,
  LocalizedStringDisplay,
  PhoneDisplay,
} from "@/frontend/components/ui/display";
import type { CurrencyCode } from "@/frontend/graphql/generated/gql/graphql-types";
import { type PaymentDirection, PaymentMethodType } from "@/frontend/graphql/generated/gql/graphql-types";
import { getPaymentMethodDirectionLabel, getPaymentMethodTypeLabel } from "@/frontend/lib/payment-method";
import type { LocalizedString } from "@/frontend/types/localized-string.types";

export type PaymentMethodDisplayData = {
  readonly id?: string;
  readonly type?: PaymentMethodType | null;
  readonly direction?: PaymentDirection | null;
  readonly label?: string | null;
  readonly catalogName?: LocalizedString | null;
  readonly catalogSlug?: string | null;
  readonly logoUrl?: string | null;
  readonly details?: {
    readonly phone?: string | null;
    readonly url?: string | null;
    readonly identifier?: string | null;
    readonly iban?: string | null;
    readonly bankName?: string | null;
    readonly beneficiaryName?: string | null;
    readonly note?: string | null;
  } | null;
  readonly countryCode?: string | null;
  readonly currencyCode?: CurrencyCode | string | null;
  readonly verifiedAt?: string | null;
  readonly isActive?: boolean | null;
  readonly isDefault?: boolean;
  readonly masked?: boolean;
};

export type PaymentMethodRow = PaymentMethodDisplayData & {
  readonly id: string;
  readonly type: PaymentMethodType;
  readonly direction: PaymentDirection;
  readonly isDefault: boolean;
};

export type PaymentMethodDisplayProps = {
  readonly method: PaymentMethodDisplayData;
  readonly showStatus?: boolean;
  readonly showDirection?: boolean;
  readonly compact?: boolean;
};

function DetailRow({ label, children }: { readonly label: string; readonly children: React.ReactNode }) {
  return (
    <Box sx={{ display: "flex", gap: 1, alignItems: "baseline", flexWrap: "wrap" }}>
      <Typography sx={{ typography: "labelMd", color: "text.secondary", minWidth: 96 }}>{label}</Typography>
      <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
    </Box>
  );
}

export function PaymentMethodDisplay({
  method,
  showStatus = true,
  showDirection = true,
  compact = false,
}: PaymentMethodDisplayProps): React.ReactNode {
  const t = useTranslations("ui.paymentMethod");
  const tDisplay = useTranslations("ui.paymentMethod.display");
  const details = method.details ?? {};

  const typeLabel = method.type ? getPaymentMethodTypeLabel(method.type, key => t(key as never)) : "";
  const directionLabel = method.direction
    ? getPaymentMethodDirectionLabel(method.direction, key => t(key as never))
    : "";

  const verificationStatus = method.verifiedAt ? "verified" : "unverified";
  const activityStatus = method.isActive === false ? "inactive" : "active";

  return (
    <Stack spacing={compact ? 1 : 1.5}>
      <Stack sx={{ flexDirection: "row", flexWrap: "wrap", gap: 1, alignItems: "center" }}>
        {method.catalogName ? (
          <LocalizedStringDisplay value={method.catalogName} typographyVariant="bodyMd" sx={{ fontWeight: 700 }} />
        ) : (
          <Typography sx={{ typography: "titleMd" }}>
            {method.label?.trim() || typeLabel || method.catalogSlug}
          </Typography>
        )}
        {method.isDefault ? <Chip size="small" color="primary" label={tDisplay("defaultBadge")} /> : null}
        {showStatus && method.type === PaymentMethodType.BankTransfer ? (
          <StatusBadge
            category="paymentMethod"
            status={verificationStatus}
            label={tDisplay(verificationStatus)}
            size="small"
          />
        ) : null}
        {showStatus && method.isActive !== undefined && method.isActive !== null ? (
          <StatusBadge category="paymentMethod" status={activityStatus} label={tDisplay(activityStatus)} size="small" />
        ) : null}
      </Stack>

      <Stack spacing={0.75}>
        {typeLabel ? (
          <DetailRow label={t("list.columnType")}>
            <Typography sx={{ typography: "bodyMd" }}>{typeLabel}</Typography>
          </DetailRow>
        ) : null}
        {showDirection && directionLabel ? (
          <DetailRow label={t("list.columnDirection")}>
            <Typography sx={{ typography: "bodyMd" }}>{directionLabel}</Typography>
          </DetailRow>
        ) : null}
        {method.countryCode ? (
          <DetailRow label={t("typeFields.country")}>
            <CountryDisplay code={method.countryCode} />
          </DetailRow>
        ) : null}
        {method.currencyCode ? (
          <DetailRow label={t("typeFields.currency")}>
            <CurrencyDisplay code={method.currencyCode} />
          </DetailRow>
        ) : null}
        {details.phone ? (
          <DetailRow label={tDisplay("phone")}>
            <PhoneDisplay phone={details.phone} masked={method.masked} />
          </DetailRow>
        ) : null}
        {details.url ? (
          <DetailRow label={tDisplay("url")}>
            <Typography sx={{ typography: "bodyMd" }} dir="ltr">
              {details.url}
            </Typography>
          </DetailRow>
        ) : null}
        {details.identifier ? (
          <DetailRow label={tDisplay("identifier")}>
            <Typography sx={{ typography: "bodyMd" }}>{details.identifier}</Typography>
          </DetailRow>
        ) : null}
        {details.bankName ? (
          <DetailRow label={tDisplay("bankName")}>
            <Typography sx={{ typography: "bodyMd" }}>{details.bankName}</Typography>
          </DetailRow>
        ) : null}
        {details.beneficiaryName ? (
          <DetailRow label={tDisplay("beneficiaryName")}>
            <Typography sx={{ typography: "bodyMd" }}>{details.beneficiaryName}</Typography>
          </DetailRow>
        ) : null}
        {details.iban ? (
          <DetailRow label={tDisplay("iban")}>
            <Typography sx={{ typography: "bodyMd" }} dir="ltr">
              {method.masked ? "••••••••" : details.iban}
            </Typography>
          </DetailRow>
        ) : null}
        {details.note ? (
          <DetailRow label={tDisplay("note")}>
            <Typography sx={{ typography: "bodyMd" }}>{details.note}</Typography>
          </DetailRow>
        ) : null}
      </Stack>
    </Stack>
  );
}
