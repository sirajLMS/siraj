"use client";

import { WarningOutlined } from "@mui/icons-material";
import { Alert, Box, Card, CardContent, CardHeader, Chip } from "@mui/material";
import type { ReactNode } from "react";
import { StatusBadge } from "@/frontend/common/components/ui/badge/StatusBadge";
import type { WhatsappAccountRow } from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";
import { getQualityLabelKey } from "@/frontend/common/views/dashboard/settings/whatsapp/whatsappQualityLabel";
import { getWhatsappAccountStatusBadgeConfig } from "@/frontend/common/views/dashboard/settings/whatsapp/whatsappStatusBadge";
import { getThroughputLabelKey } from "@/frontend/common/views/dashboard/settings/whatsapp/whatsappThroughputLabel";
import { getTierLabelKey } from "@/frontend/common/views/dashboard/settings/whatsapp/whatsappTierLabel";
import type { WhatsappLabels } from "@/shared/locale/types/whatsapp";

/** Reducible enum-label i18n keys (quality, tier, throughput, template status). */
const LABEL_KEYS = [
  "qualityGreen",
  "qualityYellow",
  "qualityRed",
  "qualityUnknown",
  "tier50",
  "tier250",
  "tier1K",
  "tier10K",
  "tier100K",
  "tierUnlimited",
  "tierUnknown",
  "throughputStandard",
  "throughputCoexistence",
  "throughputHigh",
  "throughputUnknown",
] as const satisfies readonly string[];

type LabelKey = (typeof LABEL_KEYS)[number];

function isLabelKey(key: string): key is LabelKey {
  return (LABEL_KEYS as readonly string[]).includes(key);
}

function resolveLabel(key: string, t: NumberCardLabels): string {
  return isLabelKey(key) ? t[key] : key;
}

/** Common labels needed for account card chips and warnings. */
type NumberCardLabels = Pick<
  WhatsappLabels,
  | "qualityRating"
  | "messagingTier"
  | "throughputLevel"
  | "throughput24h"
  | "lastWebhookAt"
  | "isActive"
  | "isInactive"
  | "wabaId"
  | "phoneNumberId"
  | "coexistenceWarningTitle"
  | "coexistenceWarningBody"
  | "unverifiedWarningTitle"
  | "unverifiedWarningBody"
  | "warningTierExceeded"
  | "warningCoexistence"
  | "qualityGreen"
  | "qualityYellow"
  | "qualityRed"
  | "qualityUnknown"
  | "tier50"
  | "tier250"
  | "tier1K"
  | "tier10K"
  | "tier100K"
  | "tierUnlimited"
  | "tierUnknown"
  | "throughputStandard"
  | "throughputCoexistence"
  | "throughputHigh"
  | "throughputUnknown"
>;

/** Props for the shared NumberCard component. */
export interface NumberCardProps {
  readonly account: WhatsappAccountRow;
  readonly labels: NumberCardLabels;
  /** Card header action area (platform-specific — icon buttons on desktop, text button on mobile). */
  readonly action: ReactNode;
  /** Extra chips to render after isActive but before qualityRating (desktop-only: wabaId, phoneNumberId). */
  readonly extraChips?: ReactNode;
  /** Chip gap — desktop uses 1, mobile uses 0.5. */
  readonly chipGap?: number;
}

/**
 * Shared NumberCard rendering the common Card/CardHeader/CardContent/Chip matrix
 * for a WhatsApp account. Both desktop and mobile use this component;
 * desktop passes `extraChips` for wabaId/phoneNumberId chips that mobile omits.
 * The isActive chip is common to both tiers.
 */
export function NumberCard({ account, labels: t, action, extraChips, chipGap = 1 }: Readonly<NumberCardProps>) {
  const qualityLabel = resolveLabel(getQualityLabelKey(account.qualityRating ?? ""), t);
  const tierLabel = resolveLabel(getTierLabelKey(account.portfolioMessagingLimitTier ?? ""), t);
  const throughputLabel = resolveLabel(getThroughputLabelKey(account.throughputLevel ?? ""), t);

  const isCoexistence = account.throughputLevel?.toUpperCase() === "COEXISTENCE";
  const isUnverified = account.portfolioMessagingLimitTier?.toUpperCase() === "UNTIERED";

  return (
    <Card variant="outlined">
      <CardHeader
        title={account.displayName?.en ?? account.displayPhoneNumber ?? "—"}
        subheader={account.displayPhoneNumber ?? "—"}
        action={action}
      />
      <CardContent>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: chipGap }}>
          <StatusBadge
            {...getWhatsappAccountStatusBadgeConfig(account.isActive)}
            label={account.isActive ? t.isActive : t.isInactive}
          />
          {extraChips}
          <Chip size="small" label={`${t.qualityRating}: ${qualityLabel}`} />
          <Chip size="small" label={`${t.messagingTier}: ${tierLabel}`} />
          <Chip size="small" label={`${t.throughput24h}: ${throughputLabel}`} />
          {account.lastWebhookAt ? (
            <Chip size="small" label={`${t.lastWebhookAt}: ${new Date(account.lastWebhookAt).toLocaleString()}`} />
          ) : null}
        </Box>
        {isCoexistence ? (
          <Alert severity="warning" icon={<WarningOutlined />} sx={{ mt: 1.5 }} role="alert">
            <strong>{t.coexistenceWarningTitle}</strong> — {t.coexistenceWarningBody}
          </Alert>
        ) : null}
        {isUnverified ? (
          <Alert severity="info" sx={{ mt: 1.5 }} role="alert">
            <strong>{t.unverifiedWarningTitle}</strong> — {t.unverifiedWarningBody}
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  );
}
