"use client";

import { useQuery } from "@apollo/client/react";
import { ChevronRightOutlined } from "@mui/icons-material";
import { Alert, Button, Card, CardContent, Chip, CircularProgress, Stack, Typography } from "@mui/material";
import { myLeaveRequestsQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import {
  type LeaveRequestRow,
  OpenRequestsRequestRowItem,
  type OpenRequestsRequestTypeLabels,
  type OpenRequestsStatusLabels,
} from "@/frontend/common/views/dashboard/widgets/OpenRequestsWidget.parts";

interface OpenRequestsWidgetProps {
  readonly labels: {
    readonly title: string;
    readonly emptyState: string;
    readonly emptyStateDescription: string;
    readonly viewAll: string;
  };
  readonly statusLabels: OpenRequestsStatusLabels;
  readonly requestTypeLabels: OpenRequestsRequestTypeLabels;
}

export function OpenRequestsWidget({ labels, statusLabels, requestTypeLabels }: Readonly<OpenRequestsWidgetProps>) {
  const { data, loading, error } = useQuery(myLeaveRequestsQueryDocument, {
    fetchPolicy: "cache-and-network",
  });

  const requests: readonly LeaveRequestRow[] =
    data?.myLeaveRequests?.map(r => ({
      id: r.id ?? "",
      requestType: r.requestType ?? null,
      reason: r.reason ?? null,
      status: r.status ?? "",
      createdAt: r.createdAt ?? "",
    })) ?? [];

  const recentRequests = requests.slice(0, 5);
  const pendingCount = requests.filter(r => r.status === "PENDING").length;

  if (loading) {
    return (
      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <CardContent sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress size={28} />
        </CardContent>
      </Card>
    );
  }

  if (error && !data) {
    return (
      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <CardContent>
          <Alert severity="error">{labels.emptyState}</Alert>
        </CardContent>
      </Card>
    );
  }

  if (recentRequests.length === 0) {
    return (
      <Card variant="outlined" sx={{ borderRadius: 3, borderStyle: "dashed" }}>
        <CardContent sx={{ textAlign: "center", py: 4 }}>
          <Typography variant="subtitle1" sx={theme => ({ color: theme.palette.text.secondary, fontWeight: 600 })}>
            {labels.emptyState}
          </Typography>
          <Typography variant="body2" sx={theme => ({ color: theme.palette.text.disabled, mt: 0.5 })}>
            {labels.emptyStateDescription}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: 2.5 }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {labels.title}
          </Typography>
          {pendingCount > 0 ? (
            <Chip
              size="small"
              color="warning"
              label={`${pendingCount} pending`}
              sx={{ borderRadius: 2, fontWeight: 600 }}
            />
          ) : null}
        </Stack>
        <Stack spacing={1}>
          {recentRequests.map(req => (
            <OpenRequestsRequestRowItem
              key={req.id}
              request={req}
              statusLabels={statusLabels}
              requestTypeLabels={requestTypeLabels}
            />
          ))}
        </Stack>
        <Button
          fullWidth
          variant="text"
          endIcon={<ChevronRightOutlined />}
          href="/student/requests"
          sx={{ mt: 1.5, textTransform: "none", fontWeight: 600 }}
        >
          {labels.viewAll}
        </Button>
      </CardContent>
    </Card>
  );
}
