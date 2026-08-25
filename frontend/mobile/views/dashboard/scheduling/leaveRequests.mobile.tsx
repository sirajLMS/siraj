"use client";

import { Alert, Box, Card, CardContent, Chip, CircularProgress, Stack, Typography } from "@mui/material";
import { LeaveRequestReasonBox } from "@/frontend/common/views/dashboard/scheduling/leave-requests/components/LeaveRequestReasonBox";
import { LeaveRequestStatusBadge } from "@/frontend/common/views/dashboard/scheduling/leave-requests/components/LeaveRequestStatusBadge";
import type {
  LeaveRequestRow,
  LeaveRequestsViewModel,
} from "@/frontend/common/views/dashboard/scheduling/leave-requests/useLeaveRequestsViewModel";
import { MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui/container/page";

function MobileRequestCard({
  request,
  labels,
}: Readonly<{ request: LeaveRequestRow; labels: LeaveRequestsViewModel["labels"] }>) {
  const createdDate = new Date(request.createdAt).toLocaleDateString("en", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  const requestTypeLabel = request.requestType === "DELAY" ? labels.requestType.delay : labels.requestType.cancel;

  return (
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
      <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 0.5 }}>
          <Chip size="small" variant="filled" label={requestTypeLabel} sx={{ borderRadius: 2, fontWeight: 600 }} />
          <LeaveRequestStatusBadge status={request.status} labels={labels} />
        </Stack>
        <Typography variant="caption" sx={theme => ({ color: theme.palette.text.secondary })}>
          {labels.requestsList.submittedAt}: {createdDate}
        </Typography>
        <LeaveRequestReasonBox compact reason={request.reason} label={labels.requestsList.reason} />
      </CardContent>
    </Card>
  );
}

function MobileRequestListBody({
  labels,
  requests,
  loading,
}: Readonly<{ labels: LeaveRequestsViewModel["labels"]; requests: readonly LeaveRequestRow[]; loading: boolean }>) {
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress size={32} />
      </Box>
    );
  }
  if (requests.length === 0) {
    return (
      <Card variant="outlined" sx={{ borderStyle: "dashed" }}>
        <CardContent sx={{ textAlign: "center", py: 4 }}>
          <Typography variant="subtitle2" sx={theme => ({ color: theme.palette.text.secondary })}>
            {labels.requestsList.emptyState}
          </Typography>
          <Typography variant="caption" sx={theme => ({ color: theme.palette.text.disabled, mt: 0.5 })}>
            {labels.requestsList.emptyStateDescription}
          </Typography>
        </CardContent>
      </Card>
    );
  }
  return (
    <Stack spacing={1.5}>
      {requests.map(r => (
        <MobileRequestCard key={r.id} request={r} labels={labels} />
      ))}
    </Stack>
  );
}

export function LeaveRequestsMobileView({ labels, requests, loading, error }: Readonly<LeaveRequestsViewModel>) {
  return (
    <MobilePageContainer>
      <MobilePageHeader title={labels.requestsList.title} />
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {labels.errors.requestFailed}
        </Alert>
      ) : (
        <MobileRequestListBody labels={labels} requests={requests} loading={loading} />
      )}
    </MobilePageContainer>
  );
}
