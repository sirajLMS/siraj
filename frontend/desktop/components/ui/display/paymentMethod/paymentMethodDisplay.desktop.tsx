"use client";

import { Box, Chip, Stack, Typography } from "@mui/material";
import type * as React from "react";
import type {
  PaymentMethodDisplayData,
  PaymentMethodDisplayProps,
} from "@/frontend/common/components/ui/display/paymentMethod/types";
import { PaymentMethodType } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { getPaymentMethodDirectionLabel, getPaymentMethodTypeLabel } from "@/frontend/common/lib/payment-method";
import { DesktopStatusBadge } from "@/frontend/desktop/components/ui/badge";
import {
  DesktopCountryDisplay,
  DesktopCurrencyDisplay,
  DesktopLocalizedStringDisplay,
  DesktopPhoneDisplay,
} from "@/frontend/desktop/components/ui/display";
import {
  type PaymentMethodDirectionLabels,
  type PaymentMethodDisplayLabels,
  type PaymentMethodListLabels,
  type PaymentMethodTypeFieldsLabels,
  type PaymentMethodTypeLabels,
  Translation,
  useAppTranslation,
} from "@/shared/locale";

function isKeyOf<T extends object>(value: string | number | symbol, obj: T): value is keyof T {
  return value in obj;
}

function DetailRow({ label, children }: { readonly label: string; readonly children: React.ReactNode }) {
  return (
    <Box sx={{ display: "flex", gap: 1, alignItems: "baseline", flexWrap: "wrap" }}>
      <Typography sx={{ typography: "labelMd", color: "text.secondary", minWidth: 96 }}>{label}</Typography>
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
    ? getPaymentMethodTypeLabel(method.type, key => (isKeyOf(key, tType) ? tType[key] : ""))
    : "";
  if (typeLabel) {
    specs.push({
      key: "type",
      label: tList.columnType,
      node: <Typography sx={{ typography: "bodyMd" }}>{typeLabel}</Typography>,
    });
  }

  if (showDirection && method.direction) {
    const directionLabel = getPaymentMethodDirectionLabel(method.direction, key =>
      isKeyOf(key, tDirection) ? tDirection[key] : ""
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
      node: <DesktopCountryDisplay code={method.countryCode} />,
    });
  }
  if (method.currencyCode) {
    specs.push({
      key: "currency",
      label: tTypeFields.currency,
      node: <DesktopCurrencyDisplay code={method.currencyCode} />,
    });
  }
  if (details.phone) {
    specs.push({
      key: "phone",
      label: tDisplay.phone,
      node: <DesktopPhoneDisplay phone={details.phone} masked={method.masked} />,
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

export function DesktopPaymentMethodDisplay({
  method,
  showStatus = true,
  showDirection = true,
  compact = false,
}: PaymentMethodDisplayProps): React.ReactNode {
  const t = useAppTranslation(Translation.Ui.PaymentMethod);
  const tDisplay = t.display;

  const typeLabel = method.type
    ? getPaymentMethodTypeLabel(method.type, key => (isKeyOf(key, t.type) ? t.type[key] : ""))
    : "";

  const verificationStatus = method.verifiedAt ? "verified" : "unverified";
  const activityStatus = method.isActive === false ? "inactive" : "active";

  const headerSpecs = buildHeaderSpecs(method, showDirection, t.list, t.type, t.direction);
  const detailSpecs = buildDetailRowSpecs(method, tDisplay, t.typeFields);
  const rowSpecs: DetailRowSpec[] = [...headerSpecs, ...detailSpecs];

  return (
    <Stack spacing={compact ? 1 : 1.5}>
      <Stack sx={{ flexDirection: "row", flexWrap: "wrap", gap: 1, alignItems: "center" }}>
        {method.catalogName ? (
          <DesktopLocalizedStringDisplay
            value={method.catalogName}
            typographyVariant="bodyMd"
            sx={{ fontWeight: 700 }}
          />
        ) : (
          <Typography sx={{ typography: "titleMd" }}>
            {method.label?.trim() || typeLabel || method.catalogSlug}
          </Typography>
        )}
        {method.isDefault ? <Chip size="small" color="primary" label={tDisplay.defaultBadge} /> : null}
        {showStatus && method.type === PaymentMethodType.BankTransfer ? (
          <DesktopStatusBadge
            category="paymentMethod"
            status={verificationStatus}
            label={tDisplay.verified}
            size="small"
          />
        ) : null}
        {showStatus && method.isActive !== undefined && method.isActive !== null ? (
          <DesktopStatusBadge category="paymentMethod" status={activityStatus} label={tDisplay.active} size="small" />
        ) : null}
      </Stack>

      <Stack spacing={0.75}>
        {rowSpecs.map(spec => (
          <DetailRow key={spec.key} label={spec.label}>
            {spec.node}
          </DetailRow>
        ))}
      </Stack>
    </Stack>
  );
}
