import { Box, Chip, Typography } from "@mui/material";
import { StatusBadge } from "@/frontend/common/components/ui";

export interface OpenRequestsStatusLabels {
  readonly pending: string;
  readonly approved: string;
  readonly rejected: string;
  readonly rescheduled: string;
  readonly cancelled: string;
}

export interface OpenRequestsRequestTypeLabels {
  readonly delay: string;
  readonly cancel: string;
}

export interface LeaveRequestRow {
  readonly id: string;
  readonly requestType: string | null;
  readonly reason: string | null;
  readonly status: string;
  readonly createdAt: string;
}

function StatusChip({ status, labels }: Readonly<{ status: string; labels: OpenRequestsStatusLabels }>) {
  const labelMap: Record<string, string> = {
    PENDING: labels.pending,
    APPROVED: labels.approved,
    REJECTED: labels.rejected,
    RESCHEDULED: labels.rescheduled,
    CANCELLED: labels.cancelled,
  };
  return <StatusBadge category="requestStatus" status={status} label={labelMap[status] ?? status} />;
}

export function OpenRequestsRequestRowItem({
  request,
  statusLabels,
  requestTypeLabels,
}: Readonly<{
  request: LeaveRequestRow;
  statusLabels: OpenRequestsStatusLabels;
  requestTypeLabels: OpenRequestsRequestTypeLabels;
}>) {
  const typeLabel = request.requestType === "DELAY" ? requestTypeLabels.delay : requestTypeLabels.cancel;
  const createdDate = new Date(request.createdAt).toLocaleDateString("en", { month: "short", day: "numeric" });
  return (
    <Box
      sx={theme => ({
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        p: 1.5,
        borderRadius: 2,
        bgcolor: theme.palette.action.hover,
        transition: "background-color 0.2s",
        "&:hover": { bgcolor: theme.palette.action.selected },
      })}
    >
      <Chip size="small" variant="filled" label={typeLabel} sx={{ borderRadius: 1.5, fontWeight: 600, minWidth: 60 }} />
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Typography variant="body2" noWrap>
          {request.reason ?? typeLabel}
        </Typography>
        <Typography variant="caption" sx={theme => ({ color: theme.palette.text.disabled })}>
          {createdDate}
        </Typography>
      </Box>
      <StatusChip status={request.status} labels={statusLabels} />
    </Box>
  );
}
