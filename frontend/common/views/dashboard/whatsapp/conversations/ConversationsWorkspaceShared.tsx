"use client";

import { Box } from "@mui/material";
import { ComposerShared } from "@/frontend/common/views/dashboard/whatsapp/conversations/ComposerShared";
import { ConversationListShared } from "@/frontend/common/views/dashboard/whatsapp/conversations/ConversationListShared";
import { ConversationThreadPaneShared } from "@/frontend/common/views/dashboard/whatsapp/conversations/ConversationThreadPaneShared";
import { TestNumberBanner } from "@/frontend/common/views/dashboard/whatsapp/conversations/TestNumberBanner";
import { TestRecipientsPanel } from "@/frontend/common/views/dashboard/whatsapp/conversations/TestRecipientsPanel";
import type { WhatsappConversationsViewModel } from "@/frontend/common/views/dashboard/whatsapp/conversations/types/whatsappConversationsView.types";

type SharedViewModelProps = Readonly<{ vm: WhatsappConversationsViewModel }>;

/** Test-number banner, `null` for regular numbers. */
export function WhatsappConversationsBanner({ vm }: SharedViewModelProps) {
  if (!vm.isTestAccount) {
    return null;
  }
  return <TestNumberBanner labels={vm.labelsBySection.banner} />;
}

/** Account selector + search + conversation list with pagination. */
export function WhatsappConversationsListBlock({ vm }: SharedViewModelProps) {
  return (
    <ConversationListShared
      labels={vm.labelsBySection.list}
      accounts={vm.accounts}
      accountId={vm.accountId}
      onAccountChange={vm.onAccountChange}
      search={vm.search}
      onSearchChange={vm.onSearchChange}
      conversations={vm.conversations}
      loading={vm.conversationsLoading}
      selectedConversationId={vm.selectedConversation?.id ?? null}
      totalCount={vm.conversationsTotalCount}
      page={vm.conversationsPage}
      pageSize={vm.conversationsPageSize}
      onPageChange={vm.onConversationsPageChange}
      onSelectConversation={vm.onSelectConversation}
      formatTimestamp={vm.formatTimestamp}
      accountLabel={vm.accountLabel}
      accountIsTestNumber={vm.accountIsTestNumber}
    />
  );
}

/** Open thread with the composer docked, or a standalone new-message composer. */
export function WhatsappConversationsWorkspacePane({
  vm,
  showThreadBackButton = true,
}: SharedViewModelProps & { readonly showThreadBackButton?: boolean }) {
  const { composer: composerLabels, thread: threadLabels } = vm.labelsBySection;
  const composer = (
    <ComposerShared
      labels={composerLabels}
      mode={vm.composerMode}
      onModeChange={vm.onComposerModeChange}
      textBody={vm.textBody}
      onTextBodyChange={vm.onTextBodyChange}
      templateName={vm.templateName}
      onTemplateNameChange={vm.onTemplateNameChange}
      templateLanguage={vm.templateLanguage}
      onTemplateLanguageChange={vm.onTemplateLanguageChange}
      showRecipientPicker={vm.showRecipientPicker}
      textModeLocked={vm.showRecipientPicker}
      registryTargetOnly={vm.registryTargetOnly}
      registryTargetPhones={vm.registryTargetPhones}
      recipientSelection={vm.recipientSelection}
      onRecipientSelectionChange={vm.onRecipientSelectionChange}
      customRecipient={vm.customRecipient}
      onCustomRecipientChange={vm.onCustomRecipientChange}
      windowOpen={vm.windowOpen}
      windowStatusHint={vm.windowStatusHint}
      sendBlockReason={vm.sendBlockReason}
      sendDisabled={vm.sendDisabled}
      sendError={vm.sendError}
      sending={vm.sending}
      onSend={vm.onSend}
    />
  );
  if (vm.selectedConversation === null) {
    return (
      <Box sx={theme => ({ border: `1px solid ${theme.palette.outlineVariant}`, borderRadius: 2, p: 2 })}>
        {composer}
      </Box>
    );
  }
  return (
    <ConversationThreadPaneShared
      labels={threadLabels}
      inboxLabels={vm.inboxLabels}
      title={
        vm.selectedConversation.displayName ?? vm.selectedConversation.username ?? vm.selectedConversation.waId ?? ""
      }
      subtitle={vm.selectedConversation.waId ?? ""}
      lastActivityText={vm.threadLastActivityText}
      messages={vm.threadMessages}
      loading={vm.threadLoading}
      formatTimestamp={vm.formatTimestamp}
      onBack={showThreadBackButton ? vm.onCloseThread : undefined}
      composer={composer}
    />
  );
}

/** Test-recipient registry panel, `null` for regular numbers. */
export function WhatsappConversationsRecipientsBlock({ vm }: SharedViewModelProps) {
  if (!vm.isTestAccount) {
    return null;
  }
  return (
    <TestRecipientsPanel
      labels={vm.labelsBySection.recipients}
      bannerLabels={vm.labelsBySection.banner}
      canManage={vm.canManage}
      rows={vm.recipientRows}
      loading={vm.recipientsLoading}
      limitReached={vm.recipientLimitReached}
      notice={vm.recipientsNotice}
      verifyingRecipientId={vm.verifyingRecipientId}
      addOpen={vm.addRecipientOpen}
      addPhone={vm.addRecipientPhone}
      addPhoneValid={vm.addRecipientPhoneValid}
      addNote={vm.addRecipientNote}
      addError={vm.addRecipientError}
      busy={vm.registryBusy}
      removeTarget={vm.removeDialogRecipient}
      removeConfirmText={vm.removeRecipientConfirmText}
      onOpenAdd={vm.onOpenAddRecipient}
      onCloseAdd={vm.onCloseAddRecipient}
      onAddPhoneChange={vm.onAddRecipientPhoneChange}
      onAddNoteChange={vm.onAddRecipientNoteChange}
      onSubmitAdd={vm.onSubmitAddRecipient}
      onAskRemove={vm.onAskRemoveRecipient}
      onCloseRemove={vm.onCloseRemoveRecipient}
      onConfirmRemove={vm.onConfirmRemoveRecipient}
      onVerify={vm.onVerifyRecipient}
    />
  );
}
