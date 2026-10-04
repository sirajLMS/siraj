"use client";

import { Stack } from "@mui/material";
import type { WhatsappConversationSendMode } from "@/frontend/common/graphql/generated/gql/graphql";
import { ComposerFooter } from "@/frontend/common/views/dashboard/whatsapp/conversations/ComposerFooter.parts";
import {
  ComposerInitiationHeading,
  ComposerRecipientPicker,
} from "@/frontend/common/views/dashboard/whatsapp/conversations/ComposerInitiation.parts";
import { ComposerModeBody } from "@/frontend/common/views/dashboard/whatsapp/conversations/ComposerModeBody.parts";
import { ComposerModeToggle } from "@/frontend/common/views/dashboard/whatsapp/conversations/ComposerModeToggle.parts";
import type {
  WhatsappComposerLabels,
  WhatsappTemplateOption,
} from "@/frontend/common/views/dashboard/whatsapp/conversations/types/whatsappConversationsView.types";

export interface ComposerSharedProps {
  readonly labels: WhatsappComposerLabels;
  readonly mode: WhatsappConversationSendMode;
  readonly onModeChange: (mode: WhatsappConversationSendMode) => void;
  readonly textBody: string;
  readonly onTextBodyChange: (value: string) => void;
  readonly templateName: string;
  readonly onTemplateNameChange: (value: string) => void;
  readonly templateLanguage: string;
  readonly onTemplateLanguageChange: (value: string) => void;
  readonly templateOptions: readonly WhatsappTemplateOption[];
  readonly templatesLoading: boolean;
  readonly templatesError: boolean;
  readonly onRetryTemplates: () => void;
  readonly onTemplateSelect: (option: WhatsappTemplateOption | null) => void;
  /** Note shown on picker rows whose variables the composer cannot fill. */
  readonly templateParamsUnsupportedText: string;
  /** True when no conversation is open — a target must be picked/typed. */
  readonly showRecipientPicker: boolean;
  /** On test numbers the target must come from the local registry. */
  readonly registryTargetOnly: boolean;
  readonly registryTargetPhones: readonly string[];
  readonly recipientSelection: string;
  readonly onRecipientSelectionChange: (value: string) => void;
  readonly customRecipient: string;
  readonly onCustomRecipientChange: (value: string) => void;
  readonly windowOpen: boolean;
  readonly windowStatusHint: string;
  /** Already-translated reason the send action is unavailable, when any. */
  readonly sendBlockReason: string | null;
  readonly sendDisabled: boolean;
  readonly sendError: string | null;
  readonly sending: boolean;
  readonly onSend: () => void;
}

/**
 * Message composer for the `/whatsapp` workspace: text/template mode toggle,
 * advisory window hint, approved-template picker (live from Meta, with
 * freeSolo fallback for manual names) plus a language input, recipient picker
 * for new conversations (registry-restricted on test numbers), and the send
 * action with localized block reasons and mapped send errors. The 24h window
 * is advisory only — Meta is the authoritative gate and rejects out-of-window
 * sends with WHATSAPP_OUTSIDE_SERVICE_WINDOW.
 */
export function ComposerShared({
  labels,
  mode,
  onModeChange,
  textBody,
  onTextBodyChange,
  templateName,
  onTemplateNameChange,
  templateLanguage,
  onTemplateLanguageChange,
  templateOptions,
  templatesLoading,
  templatesError,
  onRetryTemplates,
  onTemplateSelect,
  templateParamsUnsupportedText,
  showRecipientPicker,
  registryTargetOnly,
  registryTargetPhones,
  recipientSelection,
  onRecipientSelectionChange,
  customRecipient,
  onCustomRecipientChange,
  windowOpen,
  windowStatusHint,
  sendBlockReason,
  sendDisabled,
  sendError,
  sending,
  onSend,
}: Readonly<ComposerSharedProps>) {
  return (
    <Stack spacing={1.5}>
      {showRecipientPicker ? <ComposerInitiationHeading labels={labels} /> : null}
      <ComposerModeToggle labels={labels} mode={mode} onModeChange={onModeChange} />
      <ComposerRecipientPicker
        labels={labels}
        showRecipientPicker={showRecipientPicker}
        registryTargetOnly={registryTargetOnly}
        registryTargetPhones={registryTargetPhones}
        recipientSelection={recipientSelection}
        onRecipientSelectionChange={onRecipientSelectionChange}
        customRecipient={customRecipient}
        onCustomRecipientChange={onCustomRecipientChange}
      />
      <ComposerModeBody
        labels={labels}
        mode={mode}
        textBody={textBody}
        onTextBodyChange={onTextBodyChange}
        templateName={templateName}
        onTemplateNameChange={onTemplateNameChange}
        onTemplateSelect={onTemplateSelect}
        templateOptions={templateOptions}
        templatesLoading={templatesLoading}
        templatesError={templatesError}
        onRetryTemplates={onRetryTemplates}
        templateParamsUnsupportedText={templateParamsUnsupportedText}
        templateLanguage={templateLanguage}
        onTemplateLanguageChange={onTemplateLanguageChange}
      />
      <ComposerFooter
        labels={labels}
        mode={mode}
        windowOpen={windowOpen}
        windowStatusHint={windowStatusHint}
        showRecipientPicker={showRecipientPicker}
        sendBlockReason={sendBlockReason}
        sendDisabled={sendDisabled}
        sendError={sendError}
        sending={sending}
        onSend={onSend}
      />
    </Stack>
  );
}
