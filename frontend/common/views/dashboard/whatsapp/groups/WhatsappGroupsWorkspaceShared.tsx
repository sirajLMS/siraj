"use client";

import { Alert, Button, Typography } from "@mui/material";
import { CreateGroupDialog } from "@/frontend/common/views/dashboard/whatsapp/groups/CreateGroupDialog";
import { GroupDetailShared } from "@/frontend/common/views/dashboard/whatsapp/groups/GroupDetailShared";
import { GroupMessagesShared } from "@/frontend/common/views/dashboard/whatsapp/groups/GroupMessagesShared";
import { GroupsListShared } from "@/frontend/common/views/dashboard/whatsapp/groups/GroupsListShared";
import type { WhatsappGroupsViewModel } from "@/frontend/common/views/dashboard/whatsapp/groups/types/whatsappGroupsView.types";

type SharedViewModelProps = Readonly<{ vm: WhatsappGroupsViewModel }>;

/** Groups list with search, pending badges and server-driven pagination. */
export function WhatsappGroupsListBlock({ vm }: SharedViewModelProps) {
  return (
    <GroupsListShared
      labels={vm.labelsBySection.list}
      search={vm.search}
      onSearchChange={vm.onSearchChange}
      groups={vm.groups}
      loading={vm.groupsLoading}
      selectedGroupId={vm.selectedGroupId}
      totalCount={vm.groupsTotalCount}
      page={vm.groupsPage}
      pageSize={vm.groupsPageSize}
      onPageChange={vm.onGroupsPageChange}
      onSelectGroup={vm.onSelectGroup}
      formatTimestamp={vm.formatTimestamp}
    />
  );
}

/** Open group: management detail blocks with the message thread docked below. */
export function WhatsappGroupsDetailBlock({ vm }: SharedViewModelProps) {
  return (
    <GroupDetailShared
      labels={vm.labelsBySection.detail}
      commonLabels={vm.commonLabels}
      canManage={vm.canManage}
      group={vm.selectedGroup}
      loading={vm.selectedGroupLoading}
      error={vm.selectedGroupError}
      approvalModeLabel={vm.selectedGroupApprovalModeLabel}
      copied={vm.copied}
      onCopyInviteLink={vm.onCopyInviteLink}
      onAskReset={vm.onAskResetInviteLink}
      resetOpen={vm.resetOpen}
      resetting={vm.resetting}
      onCloseReset={vm.onCloseReset}
      onConfirmReset={vm.onConfirmResetInviteLink}
      onRefresh={vm.onRefreshGroup}
      onAskDelete={vm.onAskDeleteGroup}
      deleteOpen={vm.deleteOpen}
      deleting={vm.deleting}
      onCloseDelete={vm.onCloseDelete}
      onConfirmDelete={vm.onConfirmDeleteGroup}
      joinRequests={vm.joinRequests}
      joinRequestsLoading={vm.joinRequestsLoading}
      joinRequestBusyId={vm.joinRequestBusyId}
      onApproveJoinRequest={vm.onApproveJoinRequest}
      onRejectJoinRequest={vm.onRejectJoinRequest}
      removeParticipantOpen={vm.removeParticipantOpen}
      removingParticipant={vm.removingParticipant}
      removeParticipantWaId={vm.removeParticipantWaId}
      removeParticipantValid={vm.removeParticipantValid}
      onRemoveParticipantWaIdChange={vm.onRemoveParticipantWaIdChange}
      onAskRemoveParticipant={vm.onAskRemoveParticipant}
      onCloseRemoveParticipant={vm.onCloseRemoveParticipant}
      onConfirmRemoveParticipant={vm.onConfirmRemoveParticipant}
      formatTimestamp={vm.formatTimestamp}
    >
      <GroupMessagesShared
        labels={vm.labelsBySection.messages}
        messages={vm.groupMessages}
        loading={vm.messagesLoading}
        error={vm.messagesError}
        draft={vm.messageDraft}
        onDraftChange={vm.onMessageDraftChange}
        sendDisabled={vm.sendDisabled}
        sending={vm.sending}
        sendError={vm.messageError}
        onSend={vm.onSendMessage}
        canManage={vm.canManage}
        pinningMessageId={vm.pinningMessageId}
        onPin={vm.onPinMessage}
        onUnpin={vm.onUnpinMessage}
        formatTimestamp={vm.formatTimestamp}
        onRetry={vm.onRefreshGroup}
      />
    </GroupDetailShared>
  );
}

/** Create-group dialog wired to the VM's create state. */
export function WhatsappGroupsCreateDialog({ vm }: SharedViewModelProps) {
  return (
    <CreateGroupDialog
      labels={vm.labelsBySection.create}
      cancelLabel={vm.commonLabels.cancel}
      open={vm.createOpen}
      subject={vm.createSubject}
      onSubjectChange={vm.onCreateSubjectChange}
      description={vm.createDescription}
      onDescriptionChange={vm.onCreateDescriptionChange}
      approvalMode={vm.createApprovalMode}
      onApprovalModeChange={vm.onCreateApprovalModeChange}
      submitDisabled={vm.createSubmitDisabled}
      creating={vm.creating}
      error={vm.createError}
      onSubmit={vm.onSubmitCreate}
      onClose={vm.onCloseCreate}
    />
  );
}

/** Transient success/error notice strip (sync results, copy failures). */
export function WhatsappGroupsNotice({ vm }: SharedViewModelProps) {
  if (vm.notice === null) {
    return null;
  }
  return (
    <Alert
      severity={vm.noticeSeverity}
      component="div"
      onClose={vm.onDismissNotice}
      action={
        vm.noticeSeverity === "error" ? (
          <Button color="inherit" size="small" onClick={vm.onDismissNotice}>
            {vm.commonLabels.cancel}
          </Button>
        ) : undefined
      }
    >
      <Typography variant="bodyMd">{vm.notice}</Typography>
    </Alert>
  );
}
