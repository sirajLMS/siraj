import { CheckOutlined, ContentCopyOutlined, LinkOffOutlined, PersonRemoveOutlined } from "@mui/icons-material";
import { Button, IconButton, Stack, Typography } from "@mui/material";
import type {
  WhatsappGroupRow,
  WhatsappGroupsDetailLabels,
} from "@/frontend/common/views/dashboard/whatsapp/groups/types/whatsappGroupsView.types";

interface InviteLinkBlockProps {
  readonly labels: WhatsappGroupsDetailLabels;
  readonly canManage: boolean;
  readonly group: WhatsappGroupRow;
  readonly copied: boolean;
  readonly onCopy: () => void;
  readonly onAskReset: () => void;
}

export function InviteLinkBlock({
  labels,
  canManage,
  group,
  copied,
  onCopy,
  onAskReset,
}: Readonly<InviteLinkBlockProps>) {
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

interface ParticipantsBlockProps {
  readonly labels: WhatsappGroupsDetailLabels;
  readonly canManage: boolean;
  readonly group: WhatsappGroupRow;
  readonly onAskRemove: () => void;
}

export function ParticipantsBlock({ labels, canManage, group, onAskRemove }: Readonly<ParticipantsBlockProps>) {
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
