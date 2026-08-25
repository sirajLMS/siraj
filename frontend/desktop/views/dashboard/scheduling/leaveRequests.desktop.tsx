"use client";

import { AccessTimeOutlined } from "@mui/icons-material";
import { Alert, Box, Card, CardContent, Chip, CircularProgress, Stack, Typography } from "@mui/material";
import { LeaveRequestReasonBox } from "@/frontend/common/views/dashboard/scheduling/leave-requests/components/LeaveRequestReasonBox";
import { LeaveRequestStatusBadge } from "@/frontend/common/views/dashboard/scheduling/leave-requests/components/LeaveRequestStatusBadge";
import type {
  LeaveRequestRow,
  LeaveRequestsViewModel,
} from "@/frontend/common/views/dashboard/scheduling/leave-requests/useLeaveRequestsViewModel";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";

function RequestTypeChip({
  requestType,
  labels,
}: Readonly<{ requestType: string | null; labels: LeaveRequestsViewModel["labels"] }>) {
  if (!requestType) return null;
  const label = requestType === "DELAY" ? labels.requestType.delay : labels.requestType.cancel;
  return <Chip size="small" variant="filled" label={label} sx={{ borderRadius: 2, fontWeight: 600 }} />;
}

function RequestCard({
  request,
  labels,
}: Readonly<{ request: LeaveRequestRow; labels: LeaveRequestsViewModel["labels"] }>) {
  const createdDate = new Date(request.createdAt).toLocaleDateString("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const processedDate = request.processedAt
    ? new Date(request.processedAt).toLocaleDateString("en", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <Card variant="outlined" sx={{ transition: "box-shadow 0.2s", "&:hover": { boxShadow: 3 } }}>
      <CardContent sx={{ p: 2.5 }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <RequestTypeChip requestType={request.requestType} labels={labels} />
            <LeaveRequestStatusBadge status={request.status} labels={labels} />
          </Stack>
          <AccessTimeOutlined sx={theme => ({ fontSize: 18, color: theme.palette.text.disabled })} />
        </Stack>
        <Typography variant="body2" sx={theme => ({ color: theme.palette.text.secondary })}>
          {labels.requestsList.submittedAt}: {createdDate}
        </Typography>
        {processedDate ? (
          <Typography variant="body2" sx={theme => ({ color: theme.palette.text.secondary })}>
            {labels.requestsList.processedAt}: {processedDate}
          </Typography>
        ) : null}
        <LeaveRequestReasonBox reason={request.reason} label={labels.requestsList.reason} />
      </CardContent>
    </Card>
  );
}

function RequestListBody({
  labels,
  requests,
  loading,
}: Readonly<{ labels: LeaveRequestsViewModel["labels"]; requests: readonly LeaveRequestRow[]; loading: boolean }>) {
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (requests.length === 0) {
    return (
      <Card variant="outlined" sx={{ borderStyle: "dashed" }}>
        <CardContent sx={{ textAlign: "center", py: 6 }}>
          <Typography variant="h6" sx={theme => ({ color: theme.palette.text.secondary })}>
            {labels.requestsList.emptyState}
          </Typography>
          <Typography variant="body2" sx={theme => ({ color: theme.palette.text.disabled, mt: 1 })}>
            {labels.requestsList.emptyStateDescription}
          </Typography>
        </CardContent>
      </Card>
    );
  }
  return (
    <Stack spacing={2}>
      {requests.map(r => (
        <RequestCard key={r.id} request={r} labels={labels} />
      ))}
    </Stack>
  );
}

export function LeaveRequestsDesktopView({ labels, requests, loading, error }: Readonly<LeaveRequestsViewModel>) {
  return (
    <DesktopPageContainer>
      <DesktopPageHeader title={labels.requestsList.title} />
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {labels.errors.requestFailed}
        </Alert>
      ) : (
        <RequestListBody labels={labels} requests={requests} loading={loading} />
      )}
    </DesktopPageContainer>
  );
}
