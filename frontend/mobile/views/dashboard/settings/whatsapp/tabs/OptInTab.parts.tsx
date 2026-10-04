"use client";

import { Box, Stack, Typography } from "@mui/material";
import type { OptInTabSharedProps } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/whatsappTabSharedProps";
import type {
  WhatsappOptInAuditEntry,
  WhatsappOptInUserState,
} from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";
import { MobileStatusBadge } from "@/frontend/mobile/components/ui";
import { MobileCardListItem } from "@/frontend/mobile/components/ui/card";

type OptInLabels = OptInTabSharedProps["labels"]["page"];

interface OptInHistoryCardItemProps {
  readonly entry: WhatsappOptInAuditEntry;
  readonly labels: OptInLabels;
}

export function OptInHistoryCardItemMobile({ entry, labels: t }: Readonly<OptInHistoryCardItemProps>) {
  return (
    <MobileCardListItem
      variant="rounded"
      accentBorder={
        entry.action === "optIn"
          ? { color: "primary", side: "inline-start" }
          : { color: "warning", side: "inline-start" }
      }
    >
      <Stack spacing={0.5} sx={{ py: 1 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="labelMd">{entry.date}</Typography>
          <MobileStatusBadge
            category="syncStatus"
            status={entry.action === "optIn" ? "success" : "cancelled"}
            label={entry.action === "optIn" ? t.optInActionOptedIn : t.optInActionOptedOut}
          />
        </Box>
        <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary }}>
          {t.optInHistoryChangedBy}: {entry.changedBy}
        </Typography>
      </Stack>
    </MobileCardListItem>
  );
}

interface OptInAdminUserCardItemProps {
  readonly user: WhatsappOptInUserState;
  readonly labels: OptInLabels;
}

export function OptInAdminUserCardItemMobile({ user, labels: t }: Readonly<OptInAdminUserCardItemProps>) {
  return (
    <MobileCardListItem
      variant="rounded"
      accentBorder={user.optedIn ? { color: "primary", side: "inline-start" } : undefined}
    >
      <Stack spacing={0.5} sx={{ py: 1 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="labelMd">{user.userName}</Typography>
          <MobileStatusBadge
            category="syncStatus"
            status={user.optedIn ? "success" : "cancelled"}
            label={user.optedIn ? t.optInAdminYes : t.optInAdminNo}
          />
        </Box>
        {user.optedInAt && (
          <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary }}>
            {t.optInAdminOptedInAt}: {user.optedInAt}
          </Typography>
        )}
      </Stack>
    </MobileCardListItem>
  );
}
