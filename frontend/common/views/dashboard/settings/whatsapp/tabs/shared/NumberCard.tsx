"use client";

import { Box, Card, CardContent, CardHeader, Chip } from "@mui/material";
import type { ReactNode } from "react";
import type { WhatsappAccountRow } from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";
import type { WhatsappLabels } from "@/shared/locale/types/whatsapp";

/** Common labels needed for account card chips. */
type NumberCardLabels = Pick<
  WhatsappLabels,
  | "qualityRating"
  | "messagingTier"
  | "throughputLevel"
  | "lastWebhookAt"
  | "isActive"
  | "isInactive"
  | "wabaId"
  | "phoneNumberId"
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
  return (
    <Card variant="outlined">
      <CardHeader
        title={account.displayName?.en ?? account.displayPhoneNumber ?? "—"}
        subheader={account.displayPhoneNumber ?? "—"}
        action={action}
      />
      <CardContent>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: chipGap }}>
          <Chip
            size="small"
            label={account.isActive ? t.isActive : t.isInactive}
            color={account.isActive ? "success" : "default"}
          />
          {extraChips}
          <Chip size="small" label={`${t.qualityRating}: ${account.qualityRating}`} />
          <Chip size="small" label={`${t.messagingTier}: ${account.portfolioMessagingLimitTier}`} />
          <Chip size="small" label={`${t.throughputLevel}: ${account.throughputLevel}`} />
          {account.lastWebhookAt ? (
            <Chip size="small" label={`${t.lastWebhookAt}: ${new Date(account.lastWebhookAt).toLocaleString()}`} />
          ) : null}
        </Box>
      </CardContent>
    </Card>
  );
}
