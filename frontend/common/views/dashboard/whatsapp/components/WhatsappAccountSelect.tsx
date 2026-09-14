"use client";

import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { textDirection } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/shared/textDirection";
import type { WhatsappConversationsAccountOption } from "@/frontend/common/views/dashboard/whatsapp/conversations/types/whatsappConversationsView.types";

export interface WhatsappAccountSelectProps {
  readonly label: string;
  readonly accounts: readonly WhatsappConversationsAccountOption[];
  readonly value: string | null;
  readonly onChange: (accountId: string) => void;
}

/**
 * Account selector for the `/whatsapp` workspaces: outlined small control
 * with a floating label whose options isolate each account label's text
 * direction. The empty-string target (clear action) is ignored so the
 * selection can never drop back to "no account".
 */
export function WhatsappAccountSelect({ label, accounts, value, onChange }: Readonly<WhatsappAccountSelectProps>) {
  return (
    <FormControl size="small" fullWidth>
      <InputLabel id="whatsapp-account-select">{label}</InputLabel>
      <Select
        labelId="whatsapp-account-select"
        value={value ?? ""}
        label={label}
        onChange={event => {
          if (event.target.value !== "") {
            onChange(event.target.value);
          }
        }}
      >
        {accounts.map(account => (
          <MenuItem
            key={account.id}
            value={account.id}
            dir={textDirection(account.label)}
            sx={{ unicodeBidi: "isolate" }}
          >
            {account.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
