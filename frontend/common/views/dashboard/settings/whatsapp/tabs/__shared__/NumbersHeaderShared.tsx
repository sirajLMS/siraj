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
  /** Replaces the default tooltip — used for the translated "why disabled" hint. */
  readonly tooltip?: string;
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
  tooltip,
  compact,
  buttonSize,
  spinnerSize,
}: Readonly<HeaderActionProps>) {
  const startIcon = busy ? <CircularProgress size={spinnerSize} /> : icon;
  // Disabled buttons don't emit hover events — the span wrapper keeps the
  // tooltip reachable for the "why disabled" hints.
  return (
    <Tooltip title={tooltip ?? label}>
      <span>
        {compact ? (
          <IconButton size={buttonSize} aria-label={label} aria-busy={busy} disabled={disabled} onClick={onClick}>
            {startIcon}
          </IconButton>
        ) : (
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
        )}
      </span>
    </Tooltip>
  );
}

export function NumbersHeaderShared({
  labels,
  syncing,
  isConfigured,
  syncDisabledReason,
  onSyncFromMeta,
  onAddAccount,
  onConnectBusinessApp,
  embeddedSignupBlocked = false,
  titleSlot,
  buttonSize,
  syncIconSize,
  compactActions = false,
}: Readonly<{
  readonly labels: WhatsappLabels;
  readonly syncing: boolean;
  readonly isConfigured: boolean;
  /** "Why disabled" tooltip for the sync action (busy label or missing env keys). */
  readonly syncDisabledReason?: string;
  readonly onSyncFromMeta: () => void;
  readonly onAddAccount: () => void;
  /** Opens the embedded-signup (coexistence) dialog; omitted when unconfigured. */
  readonly onConnectBusinessApp?: () => void;
  /** Disables the connect button with the HTTPS-requirement tooltip (plain-HTTP serving). */
  readonly embeddedSignupBlocked?: boolean;
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
              disabled={embeddedSignupBlocked}
              tooltip={embeddedSignupBlocked ? labels.embeddedSignupRequiresHttps : undefined}
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
          tooltip={syncDisabledReason}
          compact={compactActions}
          buttonSize={buttonSize}
          spinnerSize={syncIconSize}
        />
      </Box>
    </Box>
  );
}
