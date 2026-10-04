"use client";

import { BlockOutlined, EditOutlined, KeyOutlined, PasswordOutlined } from "@mui/icons-material";
import { Menu, MenuItem, Typography } from "@mui/material";
import { NumbersHeaderShared } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/__shared__";
import type { WhatsappLabels } from "@/shared/locale/types/whatsapp";

export function NumbersHeaderMobile({
  labels,
  syncing,
  isConfigured,
  syncDisabledReason,
  onSyncFromMeta,
  onAddAccount,
  onConnectBusinessApp,
  embeddedSignupBlocked,
}: Readonly<{
  readonly labels: WhatsappLabels;
  readonly syncing: boolean;
  readonly isConfigured: boolean;
  readonly syncDisabledReason?: string;
  readonly onSyncFromMeta: () => void;
  readonly onAddAccount: () => void;
  readonly onConnectBusinessApp?: () => void;
  readonly embeddedSignupBlocked: boolean;
}>) {
  return (
    <NumbersHeaderShared
      labels={labels}
      syncing={syncing}
      isConfigured={isConfigured}
      syncDisabledReason={syncDisabledReason}
      onSyncFromMeta={onSyncFromMeta}
      onAddAccount={onAddAccount}
      onConnectBusinessApp={onConnectBusinessApp}
      embeddedSignupBlocked={embeddedSignupBlocked}
      compactActions
      buttonSize="small"
      syncIconSize={16}
      titleSlot={
        <Typography variant="titleLg" noWrap sx={{ overflow: "hidden", textOverflow: "ellipsis" }}>
          {labels.numbersTitle}
        </Typography>
      }
    />
  );
}

export function AccountActionMenuMobile({
  labels,
  anchorEl,
  onClose,
  onEditName,
  onEditToken,
  onEditPin,
  onLocalDeactivate,
}: Readonly<{
  readonly labels: WhatsappLabels;
  readonly anchorEl: null | HTMLElement;
  readonly onClose: () => void;
  readonly onEditName: () => void;
  readonly onEditToken: () => void;
  readonly onEditPin: () => void;
  readonly onLocalDeactivate: () => void;
}>) {
  const handleClick = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={onClose}>
      <MenuItem onClick={() => handleClick(onEditName)}>
        <EditOutlined sx={{ mr: 1.5 }} fontSize="small" />
        {labels.editName}
      </MenuItem>
      <MenuItem onClick={() => handleClick(onEditToken)}>
        <KeyOutlined sx={{ mr: 1.5 }} fontSize="small" />
        {labels.editToken}
      </MenuItem>
      <MenuItem onClick={() => handleClick(onEditPin)}>
        <PasswordOutlined sx={{ mr: 1.5 }} fontSize="small" />
        {labels.editPin}
      </MenuItem>
      <MenuItem onClick={() => handleClick(onLocalDeactivate)} sx={theme => ({ color: theme.palette.error.main })}>
        <BlockOutlined sx={{ mr: 1.5 }} fontSize="small" />
        {labels.localDeactivateAccount}
      </MenuItem>
    </Menu>
  );
}
