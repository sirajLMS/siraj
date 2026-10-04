"use client";

import { Stack, Typography } from "@mui/material";
import type { WhatsappTemplateOption } from "@/frontend/common/views/dashboard/whatsapp/conversations/types/whatsappConversationsView.types";

type ComposerTemplateOptionRowProps = Readonly<{
  option: WhatsappTemplateOption;
  unsupportedText: string;
}>;

export function ComposerTemplateOptionRow({ option, unsupportedText }: ComposerTemplateOptionRowProps) {
  return (
    <Stack spacing={0}>
      <Typography variant="bodyMd">{`${option.name} · ${option.language}`}</Typography>
      {option.paramsCount > 0 ? (
        <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary }}>
          {unsupportedText}
        </Typography>
      ) : null}
      {option.paramsCount === 0 && option.bodyText !== "" ? (
        <Typography variant="bodyMd" noWrap sx={{ color: theme => theme.palette.text.secondary }}>
          {option.bodyText}
        </Typography>
      ) : null}
    </Stack>
  );
}
