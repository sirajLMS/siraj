"use client";

import {
  BlockOutlined,
  CheckOutlined,
  ContentCopyOutlined,
  DeleteOutlined,
  LinkOffOutlined,
  PersonRemoveOutlined,
  RefreshOutlined,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { BaseDeleteDialog } from "@/frontend/common/components/ui/dialog/BaseDeleteDialog";
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

/** Replaces a single `{variable}` placeholder in a translated template. */
function withDate(template: string, date: string): string {
  return template.replaceAll("{date}", date);
}

interface InviteLinkBlockProps {
  readonly labels: WhatsappGroupsDetailLabels;
  readonly canManage: boolean;
  readonly group: WhatsappGroupRow;
  readonly copied: boolean;
  readonly onCopy: () => void;
  readonly onAskReset: () => void;
}

function InviteLinkBlock({ labels, canManage, group, copied, onCopy, onAskReset }: Readonly<InviteLinkBlockProps>) {
  const hasLink = group.inviteLink !== null && group.inviteLink !== "";
  return (
    <Stack spacing={1}>
      <Typography variant="labelUppercase" sx={{ color: theme => theme.palette.text.secondary }}>
        {labels.inviteLinkTitle}
      </Typography>
      {hasLink ? (
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Typography
            variant="bodyMd"
            sx={{
              flex: 1,
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              color: theme => theme.palette.text.secondary,
            }}
            dir="ltr"
          >
            {group.inviteLink}
          </Typography>
          {canManage && (
            <>
              <IconButton size="small" onClick={onCopy} aria-label={copied ? labels.copied : labels.copyInviteLink}>
                {copied ? <CheckOutlined fontSize="small" /> : <ContentCopyOutlined fontSize="small" />}
              </IconButton>
              <IconButton size="small" onClick={onAskReset} aria-label={labels.resetInviteLink}>
                <LinkOffOutlined fontSize="small" />
              </IconButton>
            </>
          )}
        </Stack>
      ) : (
        <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary }}>
          {labels.inviteLinkEmpty}
        </Typography>
      )}
    </Stack>
  );
}

interface JoinRequestActionButtonProps {
  readonly label: string;
  readonly icon: React.ReactNode;
  readonly busy: boolean;
  readonly disabled: boolean;
  readonly color?: "inherit" | "error";
  readonly onClick: () => void;
}

function JoinRequestActionButton({
  label,
  icon,
  busy,
  disabled,
  color = "inherit",
  onClick,
}: Readonly<JoinRequestActionButtonProps>) {
  return (
    <Button
      size="small"
      variant="outlined"
      color={color}
      disabled={disabled}
      onClick={onClick}
      startIcon={busy ? <CircularProgress size={14} /> : icon}
    >
      {label}
    </Button>
  );
}

interface JoinRequestsBlockProps {
  readonly labels: WhatsappGroupsDetailLabels;
  readonly canManage: boolean;
  readonly joinRequests: readonly WhatsappGroupJoinRequestRow[];
  readonly loading: boolean;
  readonly busyId: string | null;
  readonly onApprove: (requestId: string) => void;
  readonly onReject: (requestId: string) => void;
}

function JoinRequestsBlock({
  labels,
  canManage,
  joinRequests,
  loading,
  busyId,
  onApprove,
  onReject,
}: Readonly<JoinRequestsBlockProps>) {
  let body: React.ReactNode;
  if (loading) {
    body = <Skeleton variant="rounded" height={40} />;
  } else if (joinRequests.length === 0) {
    body = (
      <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary }}>
        {labels.joinRequestsEmpty}
      </Typography>
    );
  } else {
    body = (
      <Stack spacing={1}>
        {joinRequests.map(request => (
          <Stack
            key={request.id}
            direction="row"
            spacing={1}
            sx={{ alignItems: "center", justifyContent: "space-between" }}
          >
            <Typography variant="bodyMd" dir="ltr" sx={{ unicodeBidi: "isolate" }}>
              {request.waId}
            </Typography>
            {canManage && (
              <Stack direction="row" spacing={0.5}>
                <JoinRequestActionButton
                  label={labels.approveRequest}
                  icon={<CheckOutlined />}
                  busy={busyId === request.id}
                  disabled={busyId !== null}
                  onClick={() => onApprove(request.id)}
                />
                <JoinRequestActionButton
                  label={labels.rejectRequest}
                  icon={<BlockOutlined />}
                  busy={busyId === request.id}
                  disabled={busyId !== null}
                  color="error"
                  onClick={() => onReject(request.id)}
                />
              </Stack>
            )}
          </Stack>
        ))}
      </Stack>
    );
  }
  return (
    <Stack spacing={1}>
      <Typography variant="labelUppercase" sx={{ color: theme => theme.palette.text.secondary }}>
        {labels.joinRequestsTitle}
      </Typography>
      {body}
    </Stack>
  );
}

interface ParticipantsBlockProps {
  readonly labels: WhatsappGroupsDetailLabels;
  readonly canManage: boolean;
  readonly group: WhatsappGroupRow;
  readonly onAskRemove: () => void;
}

function ParticipantsBlock({ labels, canManage, group, onAskRemove }: Readonly<ParticipantsBlockProps>) {
  return (
    <Stack spacing={1}>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between" }}>
        <Typography variant="labelUppercase" sx={{ color: theme => theme.palette.text.secondary }}>
          {labels.participantsTitle}
        </Typography>
        {canManage && group.totalParticipantCount > 0 && (
          <Button size="small" startIcon={<PersonRemoveOutlined />} onClick={onAskRemove}>
            {labels.removeParticipant}
          </Button>
        )}
      </Stack>
      {group.totalParticipantCount === 0 ? (
        <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary }}>
          {labels.participantsEmpty}
        </Typography>
      ) : (
        <Typography variant="bodyMd">{group.totalParticipantCount}</Typography>
      )}
    </Stack>
  );
}

interface RemoveParticipantDialogProps {
  readonly labels: WhatsappGroupsDetailLabels;
  readonly cancelLabel: string;
  readonly open: boolean;
  readonly removing: boolean;
  readonly waId: string;
  readonly valid: boolean;
  readonly onWaIdChange: (value: string) => void;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
}

function RemoveParticipantDialog({
  labels,
  cancelLabel,
  open,
  removing,
  waId,
  valid,
  onWaIdChange,
  onClose,
  onConfirm,
}: Readonly<RemoveParticipantDialogProps>) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" aria-labelledby="remove-participant-dialog">
      <DialogTitle id="remove-participant-dialog">{labels.removeParticipant}</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary }}>
            {labels.removeParticipantConfirm}
          </Typography>
          <TextField
            size="small"
            label={labels.participantsTitle}
            value={waId}
            onChange={event => onWaIdChange(event.target.value)}
            slotProps={{ htmlInput: { dir: "ltr" } }}
            aria-invalid={!valid}
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={onClose} disabled={removing}>
          {cancelLabel}
        </Button>
        <Button variant="contained" color="error" onClick={onConfirm} disabled={removing || !valid}>
          {labels.removeParticipant}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

interface GroupInfoHeaderProps {
  readonly labels: WhatsappGroupsDetailLabels;
  readonly canManage: boolean;
  readonly group: WhatsappGroupRow;
  readonly approvalModeLabel: string;
  readonly formatTimestamp: (iso: string | null) => string;
  readonly onRefresh: () => void;
  readonly onAskDelete: () => void;
}

function GroupInfoHeader({
  labels,
  canManage,
  group,
  approvalModeLabel,
  formatTimestamp,
  onRefresh,
  onAskDelete,
}: Readonly<GroupInfoHeaderProps>) {
  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{ alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap" }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="titleLg" sx={{ fontWeight: 700 }}>
          {group.subject}
        </Typography>
        {group.description !== null && group.description !== "" && (
          <Typography variant="bodyMd" sx={{ color: theme => theme.palette.text.secondary, whiteSpace: "pre-wrap" }}>
            {group.description}
          </Typography>
        )}
        <Stack direction="row" spacing={0.75} sx={{ mt: 0.5, flexWrap: "wrap", alignItems: "center" }}>
          {group.suspended ? (
            <Chip size="small" color="error" label={labels.suspendedBadge} />
          ) : (
            <Chip size="small" color="success" label={labels.activeBadge} />
          )}
          <Chip size="small" variant="outlined" label={approvalModeLabel} />
          <Typography variant="caption" sx={{ color: theme => theme.palette.text.secondary }}>
            {withDate(labels.createdAtLabel, formatTimestamp(group.createdAt))}
          </Typography>
          {group.syncedAt !== null && (
            <Typography variant="caption" sx={{ color: theme => theme.palette.text.secondary }}>
              {withDate(labels.lastSyncedAtLabel, formatTimestamp(group.syncedAt))}
            </Typography>
          )}
        </Stack>
      </Box>
      <Stack direction="row" spacing={0.5}>
        <IconButton size="small" onClick={onRefresh} aria-label={labels.refresh}>
          <RefreshOutlined fontSize="small" />
        </IconButton>
        {canManage && (
          <IconButton size="small" onClick={onAskDelete} aria-label={labels.deleteGroup}>
            <DeleteOutlined fontSize="small" />
          </IconButton>
        )}
      </Stack>
    </Stack>
  );
}

interface ResetInviteLinkDialogProps {
  readonly labels: WhatsappGroupsDetailLabels;
  readonly cancelLabel: string;
  readonly open: boolean;
  readonly resetting: boolean;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
}

function ResetInviteLinkDialog({
  labels,
  cancelLabel,
  open,
  resetting,
  onClose,
  onConfirm,
}: Readonly<ResetInviteLinkDialogProps>) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" aria-labelledby="reset-invite-link-dialog">
      <DialogTitle id="reset-invite-link-dialog">{labels.resetInviteLink}</DialogTitle>
      <DialogContent>
        <Stack spacing={1}>
          <Typography variant="bodyMd" sx={{ color: theme => theme.palette.warning.main }}>
            {labels.resetInviteLinkWarning}
          </Typography>
          <Typography variant="bodyMd">{labels.resetInviteLinkConfirm}</Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={onClose} disabled={resetting}>
          {cancelLabel}
        </Button>
        <Button variant="contained" color="error" onClick={onConfirm} disabled={resetting}>
          {labels.resetInviteLink}
        </Button>
      </DialogActions>
    </Dialog>
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

function DetailLoadedBody({
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

interface DetailDialogsProps {
  readonly labels: WhatsappGroupsDetailLabels;
  readonly commonLabels: Readonly<{ cancel: string }>;
  readonly removeParticipantOpen: boolean;
  readonly removingParticipant: boolean;
  readonly removeParticipantWaId: string;
  readonly removeParticipantValid: boolean;
  readonly onRemoveParticipantWaIdChange: (value: string) => void;
  readonly onCloseRemoveParticipant: () => void;
  readonly onConfirmRemoveParticipant: () => void;
  readonly deleteOpen: boolean;
  readonly deleting: boolean;
  readonly onCloseDelete: () => void;
  readonly onConfirmDelete: () => void;
  readonly resetOpen: boolean;
  readonly resetting: boolean;
  readonly onCloseReset: () => void;
  readonly onConfirmReset: () => void;
}

function DetailDialogs({
  labels,
  commonLabels,
  removeParticipantOpen,
  removingParticipant,
  removeParticipantWaId,
  removeParticipantValid,
  onRemoveParticipantWaIdChange,
  onCloseRemoveParticipant,
  onConfirmRemoveParticipant,
  deleteOpen,
  deleting,
  onCloseDelete,
  onConfirmDelete,
  resetOpen,
  resetting,
  onCloseReset,
  onConfirmReset,
}: Readonly<DetailDialogsProps>) {
  return (
    <>
      <RemoveParticipantDialog
        labels={labels}
        cancelLabel={commonLabels.cancel}
        open={removeParticipantOpen}
        removing={removingParticipant}
        waId={removeParticipantWaId}
        valid={removeParticipantValid}
        onWaIdChange={onRemoveParticipantWaIdChange}
        onClose={onCloseRemoveParticipant}
        onConfirm={onConfirmRemoveParticipant}
      />
      <BaseDeleteDialog
        open={deleteOpen}
        onClose={onCloseDelete}
        onConfirm={onConfirmDelete}
        isLoading={deleting}
        title={labels.deleteGroup}
        body={labels.deleteGroupWarning}
        cancelLabel={commonLabels.cancel}
        confirmLabel={labels.deleteGroupConfirm}
      />
      <ResetInviteLinkDialog
        labels={labels}
        cancelLabel={commonLabels.cancel}
        open={resetOpen}
        resetting={resetting}
        onClose={onCloseReset}
        onConfirm={onConfirmReset}
      />
    </>
  );
}

/**
 * Group detail panel for the `/whatsapp` groups workspace: info header with
 * sync/approval chips, invite-link block (copy + reset), pending join-request
 * review (approve/reject per request), participant rollup with the
 * remove-participant dialog, and the delete-group confirmation. The message
 * thread renders through the `children` slot below the management blocks.
 */
export function GroupDetailShared({
  labels,
  commonLabels,
  canManage,
  group,
  loading,
  error,
  approvalModeLabel,
  copied,
  onCopyInviteLink,
  onAskReset,
  resetOpen,
  resetting,
  onCloseReset,
  onConfirmReset,
  onRefresh,
  onAskDelete,
  deleteOpen,
  deleting,
  onCloseDelete,
  onConfirmDelete,
  joinRequests,
  joinRequestsLoading,
  joinRequestBusyId,
  onApproveJoinRequest,
  onRejectJoinRequest,
  removeParticipantOpen,
  removingParticipant,
  removeParticipantWaId,
  removeParticipantValid,
  onRemoveParticipantWaIdChange,
  onAskRemoveParticipant,
  onCloseRemoveParticipant,
  onConfirmRemoveParticipant,
  formatTimestamp,
  children,
}: Readonly<GroupDetailSharedProps>) {
  let body: React.ReactNode;
  if (loading) {
    body = (
      <Stack spacing={2} sx={{ p: 2 }} aria-busy>
        <Skeleton variant="rounded" height={48} />
        <Skeleton variant="rounded" height={32} />
        <Skeleton variant="rounded" height={96} />
      </Stack>
    );
  } else if (error) {
    body = (
      <Stack spacing={1.5} sx={{ p: 2, alignItems: "center", textAlign: "center", py: 6 }}>
        <Typography variant="titleLg" sx={{ fontWeight: 700 }}>
          {labels.errorGeneric}
        </Typography>
        <Button size="small" startIcon={<RefreshOutlined />} onClick={onRefresh}>
          {labels.refresh}
        </Button>
      </Stack>
    );
  } else if (group) {
    body = (
      <DetailLoadedBody
        labels={labels}
        canManage={canManage}
        group={group}
        approvalModeLabel={approvalModeLabel}
        copied={copied}
        onCopyInviteLink={onCopyInviteLink}
        onAskReset={onAskReset}
        onRefresh={onRefresh}
        onAskDelete={onAskDelete}
        joinRequests={joinRequests}
        joinRequestsLoading={joinRequestsLoading}
        joinRequestBusyId={joinRequestBusyId}
        onApproveJoinRequest={onApproveJoinRequest}
        onRejectJoinRequest={onRejectJoinRequest}
        onAskRemoveParticipant={onAskRemoveParticipant}
        formatTimestamp={formatTimestamp}
      >
        {children}
      </DetailLoadedBody>
    );
  } else {
    body = null;
  }
  return (
    <Stack
      sx={{ borderRadius: 2, overflow: "hidden", border: theme => `1px solid ${theme.palette.outlineVariant}` }}
      spacing={0}
    >
      {body}
      <DetailDialogs
        labels={labels}
        commonLabels={commonLabels}
        removeParticipantOpen={removeParticipantOpen}
        removingParticipant={removingParticipant}
        removeParticipantWaId={removeParticipantWaId}
        removeParticipantValid={removeParticipantValid}
        onRemoveParticipantWaIdChange={onRemoveParticipantWaIdChange}
        onCloseRemoveParticipant={onCloseRemoveParticipant}
        onConfirmRemoveParticipant={onConfirmRemoveParticipant}
        deleteOpen={deleteOpen}
        deleting={deleting}
        onCloseDelete={onCloseDelete}
        onConfirmDelete={onConfirmDelete}
        resetOpen={resetOpen}
        resetting={resetting}
        onCloseReset={onCloseReset}
        onConfirmReset={onConfirmReset}
      />
    </Stack>
  );
}
