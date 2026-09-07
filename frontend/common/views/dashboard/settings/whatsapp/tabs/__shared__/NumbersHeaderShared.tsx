"use client";

import { AddOutlined, CloudSyncOutlined, PhonelinkSetupOutlined } from "@mui/icons-material";
import { Box, Button, CircularProgress, IconButton, Tooltip } from "@mui/material";
import type { ReactNode } from "react";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import type { WhatsappLabels } from "@/shared/locale/types/whatsapp";

interface HeaderActionProps {
  readonly icon: ReactNode;
  readonly label: string;
  readonly onClick: () => void;
  readonly disabled: boolean;
  readonly busy: boolean;
  /** Icon-only tooltip button instead of a labelled button (mobile tier). */
  readonly compact: boolean;
  readonly buttonSize: "small" | "medium" | "large";
  readonly spinnerSize: number;
}

function HeaderAction({
  icon,
  label,
  onClick,
  disabled,
  busy,
  compact,
  buttonSize,
  spinnerSize,
}: Readonly<HeaderActionProps>) {
  const startIcon = busy ? <CircularProgress size={spinnerSize} /> : icon;
  if (compact) {
    return (
      <Tooltip title={label}>
        <span>
          <IconButton size={buttonSize} aria-label={label} aria-busy={busy} disabled={disabled} onClick={onClick}>
            {startIcon}
          </IconButton>
        </span>
      </Tooltip>
    );
  }
  return (
    <Button
      size={buttonSize}
      variant="outlined"
      startIcon={startIcon}
      aria-busy={busy}
      disabled={disabled}
      onClick={onClick}
    >
      {label}
    </Button>
  );
}

export function NumbersHeaderShared({
  labels,
  syncing,
  isConfigured,
  onSyncFromMeta,
  onAddAccount,
  onConnectBusinessApp,
  titleSlot,
  buttonSize,
  syncIconSize,
  compactActions = false,
}: Readonly<{
  readonly labels: WhatsappLabels;
  readonly syncing: boolean;
  readonly isConfigured: boolean;
  readonly onSyncFromMeta: () => void;
  readonly onAddAccount: () => void;
  /** Opens the embedded-signup (coexistence) dialog; omitted when unconfigured. */
  readonly onConnectBusinessApp?: () => void;
  readonly titleSlot: ReactNode;
  readonly buttonSize: "small" | "medium" | "large";
  readonly syncIconSize: number;
  /**
   * Collapses header actions to icon-only tooltip buttons (mobile tier) so the
   * title keeps its own space and buttons never wrap mid-phrase on narrow viewports.
   */
  readonly compactActions?: boolean;
}>) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1, mb: 2 }}>
      <Box sx={{ minWidth: 0 }}>{titleSlot}</Box>
      <Box sx={{ display: "flex", gap: 0.5, flexShrink: 0 }}>
        <RequirePermission permissions={AppPermission.WhatsappConfigManage}>
          {onConnectBusinessApp ? (
            <HeaderAction
              icon={<PhonelinkSetupOutlined />}
              label={labels.connectBusinessApp}
              onClick={onConnectBusinessApp}
              disabled={false}
              busy={false}
              compact={compactActions}
              buttonSize={buttonSize}
              spinnerSize={syncIconSize}
            />
          ) : null}
          <HeaderAction
            icon={<AddOutlined />}
            label={labels.addAccount}
            onClick={onAddAccount}
            disabled={false}
            busy={false}
            compact={compactActions}
            buttonSize={buttonSize}
            spinnerSize={syncIconSize}
          />
        </RequirePermission>
        <HeaderAction
          icon={<CloudSyncOutlined />}
          label={labels.syncFromMeta}
          onClick={onSyncFromMeta}
          disabled={syncing || !isConfigured}
          busy={syncing}
          compact={compactActions}
          buttonSize={buttonSize}
          spinnerSize={syncIconSize}
        />
      </Box>
    </Box>
  );
}
