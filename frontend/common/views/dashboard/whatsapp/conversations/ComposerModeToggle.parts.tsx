"use client";

import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import { WhatsappConversationSendMode } from "@/frontend/common/graphql/generated/gql/graphql";
import type { ComposerSharedProps } from "@/frontend/common/views/dashboard/whatsapp/conversations/ComposerShared";

type ComposerModeToggleProps = Readonly<Pick<ComposerSharedProps, "labels" | "mode" | "onModeChange">>;

export function ComposerModeToggle({ labels, mode, onModeChange }: ComposerModeToggleProps) {
  return (
    <ToggleButtonGroup
      exclusive
      size="small"
      value={mode}
      aria-label={labels.composerModeLabel}
      onChange={(_event, next: WhatsappConversationSendMode | null) => {
        if (next !== null) {
          onModeChange(next);
        }
      }}
    >
      <ToggleButton value={WhatsappConversationSendMode.Text}>{labels.composerModeText}</ToggleButton>
      <ToggleButton value={WhatsappConversationSendMode.Template}>{labels.composerModeTemplate}</ToggleButton>
    </ToggleButtonGroup>
  );
}
