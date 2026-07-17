"use client";

import { ArrowBackOutlined, AssignmentOutlined, SchoolOutlined } from "@mui/icons-material";
import { Box, Button, Chip, Stack, type Theme, Typography } from "@mui/material";
import type { StudentHistorySessionRow } from "@/frontend/common/views/dashboard/student/history/types/studentHistoryTypes";
import type { StudentHistoryViewModel } from "@/frontend/common/views/dashboard/student/history/useStudentHistoryViewModel";
import {
  MobileCardList,
  MobileContentStack,
  MobileMetricCard,
  MobilePageContainer,
  MobileSectionPanel,
} from "@/frontend/mobile/components/ui";

function StatusChip({ status }: { status: string }) {
  const getStatusColors = (theme: Theme, statusKey: string) => {
    switch (statusKey.toUpperCase()) {
      case "COMPLETED":
        return {
          backgroundColor: theme.palette.success.light,
          color: theme.palette.onSuccessContainer,
        };
      case "CANCELLED":
        return {
          backgroundColor: theme.palette.error.light,
          color: theme.palette.onErrorContainer,
        };
      case "SCHEDULED":
        return {
          backgroundColor: theme.palette.primary.light,
          color: theme.palette.onPrimaryContainer,
        };
      case "PENDING":
        return {
          backgroundColor: theme.palette.warning.light,
          color: theme.palette.onWarningContainer,
        };
      default:
        return {
          backgroundColor: theme.palette.surfaceVariant,
          color: theme.palette.onSurfaceVariant,
        };
    }
  };

  return <Chip label={status} size="small" sx={theme => getStatusColors(theme, status)} />;
}

function MobileSessionItem({
  row,
  labels,
}: {
  row: StudentHistorySessionRow;
  labels: StudentHistoryViewModel["labels"];
}): import("react").ReactNode {
  return (
    <Box
      sx={theme => ({
        p: 2,
        borderRadius: 2,
        backgroundColor: theme.palette.surfaceContainer,
        border: `1px solid ${theme.palette.outlineVariant}`,
      })}
    >
      <Stack direction="row" spacing={2} sx={{ alignItems: "flex-start", justifyContent: "space-between" }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurface, fontWeight: 700 })}>
            {row.title}
          </Typography>
          <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
            {labels.sessionDate}: {row.time ?? "—"}
          </Typography>
          <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
            {labels.instructor}: {row.instructor ?? "—"}
          </Typography>
          <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
            {labels.duration}: {row.duration} min
          </Typography>
        </Box>
        <StatusChip status={row.status ?? "—"} />
      </Stack>
      {row.notes ? (
        <Typography variant="labelMd" sx={theme => ({ mt: 1, color: theme.palette.onSurfaceVariant })}>
          {row.notes}
        </Typography>
      ) : null}
    </Box>
  );
}

export function StudentHistoryMobileView({
  metrics,
  sessions,
  labels,
  loading,
  onBackToDashboard,
}: Readonly<StudentHistoryViewModel>) {
  if (loading && metrics.totalClasses === 0) {
    return (
      <MobilePageContainer>
        <Typography variant="bodyMd" sx={{ p: 3 }}>
          {labels.loadingMessage}
        </Typography>
      </MobilePageContainer>
    );
  }

  return (
    <MobilePageContainer>
      <MobileContentStack>
        <MobileSectionPanel title={labels.lessonHistory}>
          <Stack spacing={2}>
            <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap" }}>
              <Box sx={{ flex: "1 1 140px" }}>
                <MobileMetricCard
                  icon={AssignmentOutlined}
                  label={labels.sessionDate}
                  value={metrics.totalClasses}
                  variant="compact"
                />
              </Box>
              <Box sx={{ flex: "1 1 140px" }}>
                <MobileMetricCard
                  icon={SchoolOutlined}
                  label={labels.duration}
                  value={metrics.hoursStudied}
                  variant="compact"
                />
              </Box>
            </Stack>

            <MobileCardList<StudentHistorySessionRow>
              rows={sessions}
              emptyMessage={labels.noHistory}
              getKey={row => row.id}
              renderItem={row => <MobileSessionItem row={row} labels={labels} />}
            />
          </Stack>
        </MobileSectionPanel>

        <Button
          variant="outlined"
          fullWidth
          startIcon={<ArrowBackOutlined />}
          sx={theme => ({ color: theme.palette.primary.main, borderColor: theme.palette.primary.main })}
          onClick={onBackToDashboard}
        >
          {labels.addReflection}
        </Button>
      </MobileContentStack>
    </MobilePageContainer>
  );
}
