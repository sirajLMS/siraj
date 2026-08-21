"use client";

import { AddOutlined, CloudSyncOutlined } from "@mui/icons-material";
import { Box, Button, CircularProgress } from "@mui/material";
import type { ReactNode } from "react";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import type { WhatsappLabels } from "@/shared/locale/types/whatsapp";

export function NumbersHeaderShared({
  labels,
  syncing,
  isConfigured,
  onSyncFromMeta,
  onAddAccount,
  titleSlot,
  buttonSize,
  syncIconSize,
}: Readonly<{
  readonly labels: WhatsappLabels;
  readonly syncing: boolean;
  readonly isConfigured: boolean;
  readonly onSyncFromMeta: () => void;
  readonly onAddAccount: () => void;
  readonly titleSlot: ReactNode;
  readonly buttonSize: "small" | "medium" | "large";
  readonly syncIconSize: number;
}>) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
      {titleSlot}
      <Box sx={{ display: "flex", gap: 1 }}>
        <RequirePermission permissions={AppPermission.WhatsappConfigManage}>
          <Button size={buttonSize} variant="outlined" startIcon={<AddOutlined />} onClick={onAddAccount}>
            {labels.addAccount}
          </Button>
        </RequirePermission>
        <Button
          size={buttonSize}
          variant="outlined"
          startIcon={syncing ? <CircularProgress size={syncIconSize} /> : <CloudSyncOutlined />}
          disabled={syncing || !isConfigured}
          onClick={onSyncFromMeta}
          aria-label={labels.syncFromMeta}
          aria-busy={syncing}
        >
          {labels.syncFromMeta}
        </Button>
      </Box>
    </Box>
  );
}
