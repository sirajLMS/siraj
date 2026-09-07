"use client";

import { PhoneIphoneOutlined } from "@mui/icons-material";
import { Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import type { WhatsappLabels } from "@/shared/locale/types/whatsapp";

export type NumbersEmptyStateLabels = Pick<WhatsappLabels, "numbersTitle" | "noAccounts">;

/**
 * Centered empty-state card for the numbers tab: icon, heading, explainer, and
 * a tier-supplied CTA (`MobilePrimaryPageAction` on mobile, `PrimaryPageAction`
 * on desktop) wired to open the add-number dialog. The CTA is gated by the
 * config-manage permission, so read-only viewers see the message only.
 */
export function NumbersEmptyStateShared({
  labels,
  cta,
}: Readonly<{ readonly labels: NumbersEmptyStateLabels; readonly cta: ReactNode }>) {
  return (
    <Stack
      spacing={2}
      sx={theme => ({
        alignItems: "center",
        textAlign: "center",
        py: 6,
        px: 2,
        borderRadius: 2,
        border: `1px dashed ${theme.palette.outline}`,
      })}
    >
      <PhoneIphoneOutlined sx={{ fontSize: 40, color: theme => theme.palette.text.secondary }} />
      <Typography variant="titleLg" sx={{ fontWeight: 700 }}>
        {labels.numbersTitle}
      </Typography>
      <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary, maxWidth: 480 }}>
        {labels.noAccounts}
      </Typography>
      <RequirePermission permissions={AppPermission.WhatsappConfigManage}>{cta}</RequirePermission>
    </Stack>
  );
}
