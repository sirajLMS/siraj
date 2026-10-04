"use client";

import { EditOutlined } from "@mui/icons-material";
import { Box, Menu, MenuItem, Typography } from "@mui/material";
import { NumbersHeaderShared } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/__shared__";
import type { CredentialDialogField } from "@/frontend/desktop/views/dashboard/settings/whatsapp/tabs/NumbersTab.desktop.helpers";
import type { WhatsappLabels } from "@/shared/locale/types/whatsapp";

export function NumbersHeaderDesktop({
  labels,
  syncing,
  isConfigured,
  syncDisabledReason,
  onSyncFromMeta,
  onOpenCreateDialog,
  esConfigId,
  esAppId,
  onOpenEmbeddedSignup,
  embeddedSignupBlocked,
}: Readonly<{
  readonly labels: WhatsappLabels;
  readonly syncing: boolean;
  readonly isConfigured: boolean;
  readonly syncDisabledReason?: string;
  readonly onSyncFromMeta: () => Promise<void>;
  readonly onOpenCreateDialog: () => void;
  readonly esConfigId?: string | null;
  readonly esAppId?: string | null;
  readonly onOpenEmbeddedSignup?: () => void;
  readonly embeddedSignupBlocked: boolean;
}>) {
  const canConnect = esConfigId && esAppId && onOpenEmbeddedSignup;
  return (
    <NumbersHeaderShared
      labels={labels}
      syncing={syncing}
      isConfigured={isConfigured}
      syncDisabledReason={syncDisabledReason}
      onSyncFromMeta={onSyncFromMeta}
      onAddAccount={onOpenCreateDialog}
      onConnectBusinessApp={canConnect ? () => onOpenEmbeddedSignup?.() : undefined}
      embeddedSignupBlocked={embeddedSignupBlocked}
      buttonSize="medium"
      syncIconSize={20}
      titleSlot={
        <Box>
          <Typography variant="titleLg">{labels.numbersTitle}</Typography>
          <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary }}>
            {labels.numbersSubtitle}
          </Typography>
        </Box>
      }
    />
  );
}

export function AccountActionMenu({
  labels,
  anchorEl,
  onClose,
  onEditName,
  onOpenCredentialDialog,
}: Readonly<{
  readonly labels: WhatsappLabels;
  readonly anchorEl: null | HTMLElement;
  readonly onClose: () => void;
  readonly onEditName: () => void;
  readonly onOpenCredentialDialog: (field: CredentialDialogField) => void;
}>) {
  return (
    <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={onClose}>
      <MenuItem
        onClick={() => {
          onEditName();
          onClose();
        }}
      >
        <EditOutlined sx={{ mr: 1.5 }} fontSize="small" />
        {labels.editName}
      </MenuItem>
      <MenuItem
        onClick={() => {
          onOpenCredentialDialog("accessToken");
          onClose();
        }}
      >
        {labels.editToken}
      </MenuItem>
      <MenuItem
        onClick={() => {
          onOpenCredentialDialog("twoStepPin");
          onClose();
        }}
      >
        {labels.editPin}
      </MenuItem>
    </Menu>
  );
}
