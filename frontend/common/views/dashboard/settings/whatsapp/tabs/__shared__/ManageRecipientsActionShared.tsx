"use client";

import { PersonAddAlt1Outlined } from "@mui/icons-material";
import { Box, IconButton, Tooltip } from "@mui/material";
import type { WhatsappAccountRow } from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";

export type ManageRecipientsActionSharedProps = Readonly<{
  account: WhatsappAccountRow;
  /** Aria/tooltip label of the affordance (conversations namespace). */
  label: string | undefined;
  disabled: boolean;
  /** IconButton density — desktop renders medium, mobile small. */
  iconButtonSize: "small" | "medium";
  onOpen: (accountId: string) => void;
}>;

/** Card affordance opening the recipients manage dialog — test numbers only. */
export function ManageRecipientsActionShared({
  account,
  label,
  disabled,
  iconButtonSize,
  onOpen,
}: ManageRecipientsActionSharedProps) {
  if (account.isTestNumber !== true || label === undefined || label === "") {
    return null;
  }
  const isDisabled = disabled || !account.id;
  const button = (
    <IconButton
      size={iconButtonSize}
      aria-label={label}
      disabled={isDisabled}
      onClick={() => {
        if (account.id) {
          onOpen(account.id);
        }
      }}
    >
      <PersonAddAlt1Outlined />
    </IconButton>
  );

  return (
    <Tooltip title={label}>
      {isDisabled ? (
        <Box component="span" aria-disabled={true} sx={{ display: "inline-flex" }}>
          {button}
        </Box>
      ) : (
        button
      )}
    </Tooltip>
  );
}
