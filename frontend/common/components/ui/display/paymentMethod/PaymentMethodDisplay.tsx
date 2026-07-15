"use client";

import { Box, Chip, Stack, Typography } from "@mui/material";
import type * as React from "react";
import { StatusBadge } from "@/frontend/common/components/ui/badge/StatusBadge";
import {
  CountryDisplay,
  CurrencyDisplay,
  LocalizedStringDisplay,
  PhoneDisplay,
} from "@/frontend/common/components/ui/display";
import type { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { type PaymentDirection, PaymentMethodType } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { getPaymentMethodDirectionLabel, getPaymentMethodTypeLabel } from "@/frontend/common/lib/payment-method";
import type { LocalizedString } from "@/frontend/common/types/localized-string.types";
import { useAppTranslation } from "@/shared/locale/client";

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

function getDetailRows(
  method: PaymentMethodDisplayData,
  tDisplay: ReturnType<typeof useAppTranslation>["display"],
  tType: Record<string, string>,
  tDirection: Record<string, string>
): React.ReactNode[] {
  const details = method.details ?? {};
  const rows: React.ReactNode[] = [];

  const typeLabel = method.type
    ? getPaymentMethodTypeLabel(method.type, key => tType[key as keyof typeof tType] ?? "")
    : "";
  const directionLabel = method.direction
    ? getPaymentMethodDirectionLabel(method.direction, key => tDirection[key as keyof typeof tDirection] ?? "")
    : "";

  if (typeLabel) {
    rows.push(
      <DetailRow key="type" label={tDisplay.columnType}>
        <Typography sx={{ typography: "bodyMd" }}>{typeLabel}</Typography>
      </DetailRow>
    );
  }

  if (directionLabel) {
    rows.push(
      <DetailRow key="direction" label={tDisplay.columnDirection}>
        <Typography sx={{ typography: "bodyMd" }}>{directionLabel}</Typography>
      </DetailRow>
    );
  }

  if (method.countryCode) {
    rows.push(
      <DetailRow key="country" label={tDisplay.country}>
        <CountryDisplay code={method.countryCode} />
      </DetailRow>
    );
  }

  if (method.currencyCode) {
    rows.push(
      <DetailRow key="currency" label={tDisplay.currency}>
        <CurrencyDisplay code={method.currencyCode} />
      </DetailRow>
    );
  }

  if (details.phone) {
    rows.push(
      <DetailRow key="phone" label={tDisplay.phone}>
        <PhoneDisplay phone={details.phone} masked={method.masked} />
      </DetailRow>
    );
  }

  if (details.url) {
    rows.push(
      <DetailRow key="url" label={tDisplay.url}>
        <Typography sx={{ typography: "bodyMd" }} dir="ltr">
          {details.url}
        </Typography>
      </DetailRow>
    );
  }

  if (details.identifier) {
    rows.push(
      <DetailRow key="identifier" label={tDisplay.identifier}>
        <Typography sx={{ typography: "bodyMd" }}>{details.identifier}</Typography>
      </DetailRow>
    );
  }

  if (details.bankName) {
    rows.push(
      <DetailRow key="bankName" label={tDisplay.bankName}>
        <Typography sx={{ typography: "bodyMd" }}>{details.bankName}</Typography>
      </DetailRow>
    );
  }

  if (details.beneficiaryName) {
    rows.push(
      <DetailRow key="beneficiaryName" label={tDisplay.beneficiaryName}>
        <Typography sx={{ typography: "bodyMd" }}>{details.beneficiaryName}</Typography>
      </DetailRow>
    );
  }

  if (details.iban) {
    rows.push(
      <DetailRow key="iban" label={tDisplay.iban}>
        <Typography sx={{ typography: "bodyMd" }} dir="ltr">
          {method.masked ? "••••••••" : details.iban}
        </Typography>
      </DetailRow>
    );
  }

  if (details.note) {
    rows.push(
      <DetailRow key="note" label={tDisplay.note}>
        <Typography sx={{ typography: "bodyMd" }}>{details.note}</Typography>
      </DetailRow>
    );
  }

  return rows;
}

export function PaymentMethodDisplay({
  method,
  showStatus = true,
  showDirection = true,
  compact = false,
}: PaymentMethodDisplayProps): React.ReactNode {
  const t = useAppTranslation("ui.paymentMethod");
  const tDisplay = t.display;
  const details = method.details ?? {};

  const typeLabel = method.type
    ? getPaymentMethodTypeLabel(method.type, key => t.type[key as keyof typeof t.type] ?? "")
    : "";
  const directionLabel = method.direction
    ? getPaymentMethodDirectionLabel(method.direction, key => t.direction[key as keyof typeof t.direction] ?? "")
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
        {method.isDefault ? <Chip size="small" color="primary" label={tDisplay.defaultBadge} /> : null}
        {showStatus && method.type === PaymentMethodType.BankTransfer ? (
          <StatusBadge category="paymentMethod" status={verificationStatus} label={tDisplay.verified} size="small" />
        ) : null}
        {showStatus && method.isActive !== undefined && method.isActive !== null ? (
          <StatusBadge category="paymentMethod" status={activityStatus} label={tDisplay.active} size="small" />
        ) : null}
      </Stack>

      <Stack spacing={0.75}>
        {getDetailRows(method, tDisplay, t.type, t.direction)}
      </Stack>
    </Stack>
  );
}
