import { BlockOutlined, CheckOutlined } from "@mui/icons-material";
import { Button, CircularProgress, Skeleton, Stack, Typography } from "@mui/material";
import type {
  WhatsappGroupJoinRequestRow,
  WhatsappGroupsDetailLabels,
} from "@/frontend/common/views/dashboard/whatsapp/groups/types/whatsappGroupsView.types";

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

export function JoinRequestsBlock({
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
