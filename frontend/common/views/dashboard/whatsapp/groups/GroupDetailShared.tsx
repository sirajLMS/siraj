"use client";

import { Stack } from "@mui/material";
import { GroupDetailDialogs } from "@/frontend/common/views/dashboard/whatsapp/groups/GroupDetailShared.dialogs.parts";
import {
  DetailErrorState,
  DetailLoadedBody,
  DetailLoadingState,
} from "@/frontend/common/views/dashboard/whatsapp/groups/GroupDetailShared.states.parts";
import type {
  WhatsappGroupJoinRequestRow,
  WhatsappGroupRow,
  WhatsappGroupsDetailLabels,
} from "@/frontend/common/views/dashboard/whatsapp/groups/types/whatsappGroupsView.types";

export interface GroupDetailSharedProps {
  readonly labels: WhatsappGroupsDetailLabels;
  readonly commonLabels: Readonly<{ cancel: string }>;
  readonly canManage: boolean;
  readonly group: WhatsappGroupRow | null;
  readonly loading: boolean;
  readonly error: boolean;
  readonly approvalModeLabel: string;
  readonly copied: boolean;
  readonly onCopyInviteLink: () => void;
  readonly onAskReset: () => void;
  readonly resetOpen: boolean;
  readonly resetting: boolean;
  readonly onCloseReset: () => void;
  readonly onConfirmReset: () => void;
  readonly onRefresh: () => void;
  readonly onAskDelete: () => void;
  readonly deleteOpen: boolean;
  readonly deleting: boolean;
  readonly onCloseDelete: () => void;
  readonly onConfirmDelete: () => void;
  readonly joinRequests: readonly WhatsappGroupJoinRequestRow[];
  readonly joinRequestsLoading: boolean;
  readonly joinRequestBusyId: string | null;
  readonly onApproveJoinRequest: (requestId: string) => void;
  readonly onRejectJoinRequest: (requestId: string) => void;
  readonly removeParticipantOpen: boolean;
  readonly removingParticipant: boolean;
  readonly removeParticipantWaId: string;
  readonly removeParticipantValid: boolean;
  readonly onRemoveParticipantWaIdChange: (value: string) => void;
  readonly onAskRemoveParticipant: () => void;
  readonly onCloseRemoveParticipant: () => void;
  readonly onConfirmRemoveParticipant: () => void;
  readonly formatTimestamp: (iso: string | null) => string;
  readonly children?: React.ReactNode;
}

function GroupDetailBody({ loading, error, group, children, ...rest }: Readonly<GroupDetailSharedProps>) {
  if (loading) {
    return <DetailLoadingState />;
  }
  if (error) {
    return <DetailErrorState labels={rest.labels} onRefresh={rest.onRefresh} />;
  }
  if (!group) {
    return null;
  }
  return (
    <DetailLoadedBody {...rest} group={group}>
      {children}
    </DetailLoadedBody>
  );
}

/**
 * Group detail panel for the `/whatsapp` groups workspace: info header with
 * the sync status badge and approval filter chip, invite-link block (copy +
 * reset), pending join-request review (approve/reject per request),
 * participant rollup with the remove-participant dialog, and the
 * delete-group confirmation. The message thread renders through the
 * `children` slot below the management blocks.
 */
export function GroupDetailShared(props: Readonly<GroupDetailSharedProps>) {
  return (
    <Stack
      sx={{ borderRadius: 2, overflow: "hidden", border: theme => `1px solid ${theme.palette.outlineVariant}` }}
      spacing={0}
    >
      <GroupDetailBody {...props} />
      <GroupDetailDialogs
        labels={props.labels}
        commonLabels={props.commonLabels}
        removeParticipantOpen={props.removeParticipantOpen}
        removingParticipant={props.removingParticipant}
        removeParticipantWaId={props.removeParticipantWaId}
        removeParticipantValid={props.removeParticipantValid}
        onRemoveParticipantWaIdChange={props.onRemoveParticipantWaIdChange}
        onCloseRemoveParticipant={props.onCloseRemoveParticipant}
        onConfirmRemoveParticipant={props.onConfirmRemoveParticipant}
        deleteOpen={props.deleteOpen}
        deleting={props.deleting}
        onCloseDelete={props.onCloseDelete}
        onConfirmDelete={props.onConfirmDelete}
        resetOpen={props.resetOpen}
        resetting={props.resetting}
        onCloseReset={props.onCloseReset}
        onConfirmReset={props.onConfirmReset}
      />
    </Stack>
  );
}
