"use client";

import { Box, Chip, Stack, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import type * as React from "react";
import type {
  PaymentMethodDisplayData,
  PaymentMethodDisplayProps,
} from "@/frontend/common/components/ui/display/paymentMethod/types";
import { PaymentMethodType } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { getPaymentMethodDirectionLabel, getPaymentMethodTypeLabel } from "@/frontend/common/lib/payment-method";
import type { UiTypographyVariant } from "@/frontend/common/types/shared.types";
import type {
  PaymentMethodDirectionLabels,
  PaymentMethodDisplayLabels,
  PaymentMethodListLabels,
  PaymentMethodTypeFieldsLabels,
  PaymentMethodTypeLabels,
} from "@/shared/locale";
import type { LocalizedString } from "@/shared/types";

//#region Slots

type StatusBadgeSlot = React.ComponentType<{
  category: "paymentMethod";
  status: string;
  label: string;
  size: "small";
}>;

type CountryDisplaySlot = React.ComponentType<{ code: string }>;
type CurrencyDisplaySlot = React.ComponentType<{ code: string }>;
type LocalizedStringDisplaySlot = React.ComponentType<{
  value: LocalizedString;
  typographyVariant?: UiTypographyVariant;
  sx?: SxProps<Theme>;
}>;
type PhoneDisplaySlot = React.ComponentType<{ phone: string; masked?: boolean }>;

export interface PaymentMethodDisplaySlots {
  StatusBadge: StatusBadgeSlot;
  CountryDisplay: CountryDisplaySlot;
  CurrencyDisplay: CurrencyDisplaySlot;
  LocalizedStringDisplay: LocalizedStringDisplaySlot;
  PhoneDisplay: PhoneDisplaySlot;
}

export interface PaymentMethodDisplaySharedOptions {
  /** Outer Stack spacing when compact / not compact */
  readonly outerSpacing?: readonly [number, number];
  /** Header row gap */
  readonly headerGap?: number;
  /** Detail rows Stack spacing */
  readonly detailSpacing?: number;
  /** DetailRow label typography variant */
  readonly labelTypography?: UiTypographyVariant;
  /** DetailRow label min width */
  readonly labelMinWidth?: number;
  /** DetailRow gap between label and value */
  readonly detailRowGap?: number;
  /** Fallback title Typography variant (when catalogName is absent) */
  readonly titleTypography?: UiTypographyVariant;
}

//#endregion

//#region Module-level constants

const DEFAULT_OPTIONS: PaymentMethodDisplaySharedOptions = {};

//#endregion

//#region Types

interface DetailRowSpec {
  readonly key: string;
  readonly label: string;
  readonly node: React.ReactNode;
}

//#endregion

//#region Presentation helpers (module-scoped)

function DetailRow({
  label,
  children,
  labelTypography,
  labelMinWidth,
  detailRowGap,
}: {
  readonly label: string;
  readonly children: React.ReactNode;
  readonly labelTypography: UiTypographyVariant;
  readonly labelMinWidth: number;
  readonly detailRowGap: number;
}) {
  return (
    <Box sx={{ display: "flex", gap: detailRowGap, alignItems: "baseline", flexWrap: "wrap" }}>
      <Typography sx={{ typography: labelTypography, color: "text.secondary", minWidth: labelMinWidth }}>
        {label}
      </Typography>
      <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
    </Box>
  );
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
  tDirection: PaymentMethodDirectionLabels,
  getLabel: (labels: object, key: string) => string
): DetailRowSpec[] {
  const specs: DetailRowSpec[] = [];

  const typeLabel = method.type ? getPaymentMethodTypeLabel(method.type, key => getLabel(tType, key)) : "";
  if (typeLabel) {
    specs.push({
      key: "type",
      label: tList.columnType,
      node: <Typography sx={{ typography: "bodyMd" }}>{typeLabel}</Typography>,
    });
  }

  if (showDirection && method.direction) {
    const directionLabel = getPaymentMethodDirectionLabel(method.direction, key => getLabel(tDirection, key));
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
  tTypeFields: PaymentMethodTypeFieldsLabels,
  slots: PaymentMethodDisplaySlots
): DetailRowSpec[] {
  const details = method.details ?? {};
  const specs: DetailRowSpec[] = [];

  if (method.countryCode) {
    specs.push({
      key: "country",
      label: tTypeFields.country,
      node: <slots.CountryDisplay code={method.countryCode} />,
    });
  }
  if (method.currencyCode) {
    specs.push({
      key: "currency",
      label: tTypeFields.currency,
      node: <slots.CurrencyDisplay code={method.currencyCode} />,
    });
  }
  if (details.phone) {
    specs.push({
      key: "phone",
      label: tDisplay.phone,
      node: <slots.PhoneDisplay phone={details.phone} masked={method.masked} />,
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

//#endregion

export function PaymentMethodDisplayShared({
  method,
  showStatus = true,
  showDirection = true,
  compact = false,
  slots,
  options = DEFAULT_OPTIONS,
  getLabel,
  t,
}: Readonly<PaymentMethodDisplayProps> & {
  readonly slots: PaymentMethodDisplaySlots;
  readonly options?: PaymentMethodDisplaySharedOptions;
  readonly getLabel: (labels: object, key: string) => string;
  readonly t: {
    readonly display: PaymentMethodDisplayLabels;
    readonly list: PaymentMethodListLabels;
    readonly type: PaymentMethodTypeLabels;
    readonly typeFields: PaymentMethodTypeFieldsLabels;
    readonly direction: PaymentMethodDirectionLabels;
  };
}): React.ReactNode {
  const tDisplay = t.display;

  const typeLabel = method.type ? getPaymentMethodTypeLabel(method.type, key => getLabel(t.type, key)) : "";

  const verificationStatus = method.verifiedAt ? "verified" : "unverified";
  const activityStatus = method.isActive === false ? "inactive" : "active";

  const headerSpecs = buildHeaderSpecs(method, showDirection, t.list, t.type, t.direction, getLabel);
  const detailSpecs = buildDetailRowSpecs(method, tDisplay, t.typeFields, slots);
  const rowSpecs: DetailRowSpec[] = [...headerSpecs, ...detailSpecs];

  const [compactSpacing, normalSpacing] = options.outerSpacing ?? [1, 1.5];
  const headerGap = options.headerGap ?? 1;
  const detailSpacing = options.detailSpacing ?? 0.75;
  const labelTypography = options.labelTypography ?? "labelMd";
  const labelMinWidth = options.labelMinWidth ?? 96;
  const detailRowGap = options.detailRowGap ?? 1;
  const titleTypography = options.titleTypography ?? "titleLg";

  return (
    <Stack spacing={compact ? compactSpacing : normalSpacing}>
      <Stack sx={{ flexDirection: "row", flexWrap: "wrap", gap: headerGap, alignItems: "center" }}>
        {method.catalogName ? (
          <slots.LocalizedStringDisplay
            value={method.catalogName}
            typographyVariant="bodyMd"
            sx={{ fontWeight: 700 }}
          />
        ) : (
          <Typography sx={{ typography: titleTypography }}>
            {method.label?.trim() ?? typeLabel ?? method.catalogSlug}
          </Typography>
        )}
        {method.isDefault ? <Chip size="small" color="primary" label={tDisplay.defaultBadge} /> : null}
        {showStatus && method.type === PaymentMethodType.BankTransfer ? (
          <slots.StatusBadge
            category="paymentMethod"
            status={verificationStatus}
            label={tDisplay.verified}
            size="small"
          />
        ) : null}
        {showStatus && method.isActive !== undefined && method.isActive !== null ? (
          <slots.StatusBadge category="paymentMethod" status={activityStatus} label={tDisplay.active} size="small" />
        ) : null}
      </Stack>

      <Stack spacing={detailSpacing}>
        {rowSpecs.map(spec => (
          <DetailRow
            key={spec.key}
            label={spec.label}
            labelTypography={labelTypography}
            labelMinWidth={labelMinWidth}
            detailRowGap={detailRowGap}
          >
            {spec.node}
          </DetailRow>
        ))}
      </Stack>
    </Stack>
  );
}
