"use client";

import { Box, Chip, Stack, Typography } from "@mui/material";
import type * as React from "react";
import { PaymentMethodType } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { getPaymentMethodDirectionLabel, getPaymentMethodTypeLabel } from "@/frontend/common/lib/payment-method";
import { MobileStatusBadge } from "@/frontend/mobile/components/ui/badge";
import {
  MobileCountryDisplay,
  MobileCurrencyDisplay,
  MobileLocalizedStringDisplay,
  MobilePhoneDisplay,
} from "@/frontend/mobile/components/ui/display";
import type {
  PaymentMethodDisplayData,
  PaymentMethodDisplayProps,
} from "@/frontend/mobile/components/ui/display/paymentMethod/paymentMethodDisplay.types";
import {
  type PaymentMethodDirectionLabels,
  type PaymentMethodDisplayLabels,
  type PaymentMethodListLabels,
  type PaymentMethodTypeFieldsLabels,
  type PaymentMethodTypeLabels,
  useAppTranslation,
} from "@/shared/locale";

function DetailRow({ label, children }: { readonly label: string; readonly children: React.ReactNode }) {
  return (
    <Box sx={{ display: "flex", gap: 0.75, alignItems: "baseline", flexWrap: "wrap" }}>
      <Typography sx={{ typography: "labelSm", color: "text.secondary", minWidth: 72 }}>{label}</Typography>
      <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
    </Box>
  );
}

interface DetailRowSpec {
  readonly key: string;
  readonly label: string;
  readonly node: React.ReactNode;
}

function textRow(key: string, label: string, value: string | null | undefined): DetailRowSpec | null {
  if (!value?.trim()) {
    return null;
  }
  return { key, label, node: <Typography sx={{ typography: "bodyMd" }}>{value}</Typography> };
}

function ltrTextRow(
  key: string,
  label: string,
  value: string | null | undefined,
  masked?: boolean
): DetailRowSpec | null {
  if (!value?.trim()) {
    return null;
  }
  const display = masked ? "••••••••" : value;
  return {
    key,
    label,
    node: (
      <Typography sx={{ typography: "bodyMd" }} dir="ltr">
        {display}
      </Typography>
    ),
  };
}

function buildHeaderSpecs(
  method: PaymentMethodDisplayData,
  showDirection: boolean,
  tList: PaymentMethodListLabels,
  tType: PaymentMethodTypeLabels,
  tDirection: PaymentMethodDirectionLabels
): DetailRowSpec[] {
  const specs: DetailRowSpec[] = [];

  const typeLabel = method.type
    ? getPaymentMethodTypeLabel(method.type, key => tType[key as keyof PaymentMethodTypeLabels] ?? "")
    : "";
  if (typeLabel) {
    specs.push({
      key: "type",
      label: tList.columnType,
      node: <Typography sx={{ typography: "bodyMd" }}>{typeLabel}</Typography>,
    });
  }

  if (showDirection && method.direction) {
    const directionLabel = getPaymentMethodDirectionLabel(
      method.direction,
      key => tDirection[key as keyof PaymentMethodDirectionLabels] ?? ""
    );
    if (directionLabel) {
      specs.push({
        key: "direction",
        label: tList.columnDirection,
        node: <Typography sx={{ typography: "bodyMd" }}>{directionLabel}</Typography>,
      });
    }
  }

  return specs;
}

function buildDetailRowSpecs(
  method: PaymentMethodDisplayData,
  tDisplay: PaymentMethodDisplayLabels,
  tTypeFields: PaymentMethodTypeFieldsLabels
): DetailRowSpec[] {
  const details = method.details ?? {};
  const specs: DetailRowSpec[] = [];

  if (method.countryCode) {
    specs.push({
      key: "country",
      label: tTypeFields.country,
      node: <MobileCountryDisplay code={method.countryCode} />,
    });
  }
  if (method.currencyCode) {
    specs.push({
      key: "currency",
      label: tTypeFields.currency,
      node: <MobileCurrencyDisplay code={method.currencyCode} />,
    });
  }
  if (details.phone) {
    specs.push({
      key: "phone",
      label: tDisplay.phone,
      node: <MobilePhoneDisplay phone={details.phone} masked={method.masked} />,
    });
  }

  const textRows: (DetailRowSpec | null)[] = [
    ltrTextRow("url", tDisplay.url, details.url),
    textRow("identifier", tDisplay.identifier, details.identifier),
    textRow("bankName", tDisplay.bankName, details.bankName),
    textRow("beneficiaryName", tDisplay.beneficiaryName, details.beneficiaryName),
    ltrTextRow("iban", tDisplay.iban, details.iban, method.masked),
    textRow("note", tDisplay.note, details.note),
  ];

  for (const row of textRows) {
    if (row !== null) {
      specs.push(row);
    }
  }

  return specs;
}

export function MobilePaymentMethodDisplay({
  method,
  showStatus = true,
  showDirection = true,
  compact = false,
}: PaymentMethodDisplayProps): React.ReactNode {
  const t = useAppTranslation().uiTranslations.paymentMethod;
  const tDisplay = t.display;

  const typeLabel = method.type
    ? getPaymentMethodTypeLabel(method.type, key => t.type[key as keyof typeof t.type] ?? "")
    : "";

  const verificationStatus = method.verifiedAt ? "verified" : "unverified";
  const activityStatus = method.isActive === false ? "inactive" : "active";

  const headerSpecs = buildHeaderSpecs(method, showDirection, t.list, t.type, t.direction);
  const detailSpecs = buildDetailRowSpecs(method, tDisplay, t.typeFields);
  const rowSpecs: DetailRowSpec[] = [...headerSpecs, ...detailSpecs];

  return (
    <Stack spacing={compact ? 0.75 : 1}>
      <Stack sx={{ flexDirection: "row", flexWrap: "wrap", gap: 0.75, alignItems: "center" }}>
        {method.catalogName ? (
          <MobileLocalizedStringDisplay
            value={method.catalogName}
            typographyVariant="bodyMd"
            sx={{ fontWeight: 700 }}
          />
        ) : (
          <Typography sx={{ typography: "titleLg" }}>
            {method.label?.trim() || typeLabel || method.catalogSlug}
          </Typography>
        )}
        {method.isDefault ? <Chip size="small" color="primary" label={tDisplay.defaultBadge} /> : null}
        {showStatus && method.type === PaymentMethodType.BankTransfer ? (
          <MobileStatusBadge
            category="paymentMethod"
            status={verificationStatus}
            label={tDisplay.verified}
            size="small"
          />
        ) : null}
        {showStatus && method.isActive !== undefined && method.isActive !== null ? (
          <MobileStatusBadge category="paymentMethod" status={activityStatus} label={tDisplay.active} size="small" />
        ) : null}
      </Stack>

      <Stack spacing={0.5}>
        {rowSpecs.map(spec => (
          <DetailRow key={spec.key} label={spec.label}>
            {spec.node}
          </DetailRow>
        ))}
      </Stack>
    </Stack>
  );
}
