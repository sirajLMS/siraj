import { RefreshOutlined } from "@mui/icons-material";
import { Button, Divider, Skeleton, Stack, Typography } from "@mui/material";
import {
  InviteLinkBlock,
  ParticipantsBlock,
} from "@/frontend/common/views/dashboard/whatsapp/groups/GroupDetailShared.blocks.parts";
import { GroupInfoHeader } from "@/frontend/common/views/dashboard/whatsapp/groups/GroupDetailShared.header.parts";
import { JoinRequestsBlock } from "@/frontend/common/views/dashboard/whatsapp/groups/GroupDetailShared.joinRequests.parts";
import type {
  WhatsappGroupJoinRequestRow,
  WhatsappGroupRow,
  WhatsappGroupsDetailLabels,
} from "@/frontend/common/views/dashboard/whatsapp/groups/types/whatsappGroupsView.types";

export function DetailLoadingState() {
  return (
    <Stack spacing={2} sx={{ p: 2 }} aria-busy>
      <Skeleton variant="rounded" height={48} />
      <Skeleton variant="rounded" height={32} />
      <Skeleton variant="rounded" height={96} />
    </Stack>
  );
}

interface DetailErrorStateProps {
  readonly labels: WhatsappGroupsDetailLabels;
  readonly onRefresh: () => void;
}

export function DetailErrorState({ labels, onRefresh }: Readonly<DetailErrorStateProps>) {
  return (
    <Stack spacing={1.5} sx={{ p: 2, alignItems: "center", textAlign: "center", py: 6 }}>
      <Typography variant="titleLg" sx={{ fontWeight: 700 }}>
        {labels.errorGeneric}
      </Typography>
      <Button size="small" startIcon={<RefreshOutlined />} onClick={onRefresh}>
        {labels.refresh}
      </Button>
    </Stack>
  );
}

interface DetailLoadedBodyProps {
  readonly labels: WhatsappGroupsDetailLabels;
  readonly canManage: boolean;
  readonly group: WhatsappGroupRow;
  readonly approvalModeLabel: string;
  readonly copied: boolean;
  readonly onCopyInviteLink: () => void;
  readonly onAskReset: () => void;
  readonly onRefresh: () => void;
  readonly onAskDelete: () => void;
  readonly joinRequests: readonly WhatsappGroupJoinRequestRow[];
  readonly joinRequestsLoading: boolean;
  readonly joinRequestBusyId: string | null;
  readonly onApproveJoinRequest: (requestId: string) => void;
  readonly onRejectJoinRequest: (requestId: string) => void;
  readonly onAskRemoveParticipant: () => void;
  readonly formatTimestamp: (iso: string | null) => string;
  readonly children?: React.ReactNode;
}

export function DetailLoadedBody({
  labels,
  canManage,
  group,
  approvalModeLabel,
  copied,
  onCopyInviteLink,
  onAskReset,
  onRefresh,
  onAskDelete,
  joinRequests,
  joinRequestsLoading,
  joinRequestBusyId,
  onApproveJoinRequest,
  onRejectJoinRequest,
  onAskRemoveParticipant,
  formatTimestamp,
  children,
}: Readonly<DetailLoadedBodyProps>) {
  return (
    <Stack spacing={2} sx={{ p: 2 }}>
      <GroupInfoHeader
        labels={labels}
        canManage={canManage}
        group={group}
        approvalModeLabel={approvalModeLabel}
        formatTimestamp={formatTimestamp}
        onRefresh={onRefresh}
        onAskDelete={onAskDelete}
      />
      <Divider />
      <InviteLinkBlock
        labels={labels}
        canManage={canManage}
        group={group}
        copied={copied}
        onCopy={onCopyInviteLink}
        onAskReset={onAskReset}
      />
      <Divider />
      <JoinRequestsBlock
        labels={labels}
        canManage={canManage}
        joinRequests={joinRequests}
        loading={joinRequestsLoading}
        busyId={joinRequestBusyId}
        onApprove={onApproveJoinRequest}
        onReject={onRejectJoinRequest}
      />
      <Divider />
      <ParticipantsBlock labels={labels} canManage={canManage} group={group} onAskRemove={onAskRemoveParticipant} />
      {children ? (
        <>
          <Divider />
          {children}
        </>
      ) : null}
    </Stack>
  );
}
