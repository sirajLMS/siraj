"use client";

import { PersonAddAlt1Outlined } from "@mui/icons-material";
import { Box, IconButton, Tooltip } from "@mui/material";
import { NumberCardField } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/shared/NumberCardContent";
import type { WhatsappAccountRow } from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";
import type { WhatsappLabels } from "@/shared/locale/types/whatsapp";

export function AccountIdFields({
  labels,
  account,
}: Readonly<{ readonly labels: WhatsappLabels; readonly account: WhatsappAccountRow }>) {
  return (
    <>
      <NumberCardField label={labels.wabaId} value={account.wabaId ?? "—"} />
      <NumberCardField label={labels.phoneNumberId} value={account.phoneNumberId ?? "—"} />
    </>
  );
}

/** Card affordance opening the recipients manage dialog — test numbers only. */
export function ManageRecipientsAction({
  account,
  label,
  disabled,
  onOpen,
}: Readonly<{
  readonly account: WhatsappAccountRow;
  readonly label: string | undefined;
  readonly disabled: boolean;
  readonly onOpen: (accountId: string) => void;
}>) {
  if (account.isTestNumber !== true || label === undefined || label === "") {
    return null;
  }
  const isDisabled = disabled || !account.id;
  const button = (
    <IconButton
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
