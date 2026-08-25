"use client";

import { useQuery } from "@apollo/client/react";
import {
  CancelOutlined,
  CheckCircleOutlined,
  ChevronRightOutlined,
  EventBusyOutlined,
  HourglassEmptyOutlined,
  SwapHorizOutlined,
} from "@mui/icons-material";
import { Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Stack, Typography } from "@mui/material";
import type { ReactElement } from "react";
import { myLeaveRequestsQueryDocument } from "@/frontend/common/graphql/sharedDocuments";

interface OpenRequestsWidgetProps {
  readonly labels: {
    readonly title: string;
    readonly emptyState: string;
    readonly emptyStateDescription: string;
    readonly viewAll: string;
  };
  readonly statusLabels: {
    readonly pending: string;
    readonly approved: string;
    readonly rejected: string;
    readonly rescheduled: string;
    readonly cancelled: string;
  };
  readonly requestTypeLabels: {
    readonly delay: string;
    readonly cancel: string;
  };
}

interface LeaveRequestRow {
  readonly id: string;
  readonly requestType: string | null;
  readonly reason: string | null;
  readonly status: string;
  readonly createdAt: string;
}

function StatusChip({ status, labels }: Readonly<{ status: string; labels: OpenRequestsWidgetProps["statusLabels"] }>) {
  const colorMap: Record<string, "default" | "success" | "error" | "warning" | "info"> = {
    PENDING: "warning",
    APPROVED: "success",
    REJECTED: "error",
    RESCHEDULED: "info",
    CANCELLED: "default",
  };
  const labelMap: Record<string, string> = {
    PENDING: labels.pending,
    APPROVED: labels.approved,
    REJECTED: labels.rejected,
    RESCHEDULED: labels.rescheduled,
    CANCELLED: labels.cancelled,
  };
  const iconEl = (() => {
    const icons: Record<string, ReactElement> = {
      PENDING: <HourglassEmptyOutlined fontSize="small" />,
      APPROVED: <CheckCircleOutlined fontSize="small" />,
      REJECTED: <CancelOutlined fontSize="small" />,
      RESCHEDULED: <SwapHorizOutlined fontSize="small" />,
      CANCELLED: <EventBusyOutlined fontSize="small" />,
    };
    return icons[status];
  })();
  return (
    <Chip
      size="small"
      color={colorMap[status] ?? "default"}
      variant="outlined"
      icon={iconEl}
      label={labelMap[status] ?? status}
      sx={{ borderRadius: 2 }}
    />
  );
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

  if (error) {
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
          {recentRequests.map(req => {
            const typeLabel = req.requestType === "DELAY" ? requestTypeLabels.delay : requestTypeLabels.cancel;
            const createdDate = new Date(req.createdAt).toLocaleDateString("en", { month: "short", day: "numeric" });
            return (
              <Box
                key={req.id}
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
                <Chip
                  size="small"
                  variant="filled"
                  label={typeLabel}
                  sx={{ borderRadius: 1.5, fontWeight: 600, minWidth: 60 }}
                />
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography variant="body2" noWrap>
                    {req.reason ?? typeLabel}
                  </Typography>
                  <Typography variant="caption" sx={theme => ({ color: theme.palette.text.disabled })}>
                    {createdDate}
                  </Typography>
                </Box>
                <StatusChip status={req.status} labels={statusLabels} />
              </Box>
            );
          })}
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
