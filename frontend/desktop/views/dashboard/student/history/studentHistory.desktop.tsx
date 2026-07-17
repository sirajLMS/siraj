"use client";

import {
  ArrowBackOutlined,
  EventOutlined,
  PersonOutlined,
  SchoolOutlined,
  VisibilityOutlined,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Grid,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import type { Theme } from "@mui/material/styles";
import type { StudentHistoryViewModel } from "@/frontend/common/views/dashboard/student/history/useStudentHistoryViewModel";
import { DesktopMetricCard } from "@/frontend/desktop/components/ui/card/MetricCard";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui/container";
import { DesktopPageContainer } from "@/frontend/desktop/components/ui/container/page";

function statusColor(status: string | null, theme: Theme): string {
  if (!status) return theme.palette.onSurfaceVariant;
  switch (status.toLowerCase()) {
    case "completed":
      return theme.palette.success.main;
    case "cancelled":
      return theme.palette.error.main;
    case "pending":
      return theme.palette.warning.main;
    default:
      return theme.palette.primary.main;
  }
}

export function StudentHistoryDesktopView({
  metrics,
  sessions,
  labels,
  loading,
  onBackToDashboard,
}: Readonly<StudentHistoryViewModel>) {
  if (loading && metrics.totalClasses === 0) {
    return (
      <DesktopPageContainer>
        <Typography variant="bodyMd" sx={{ p: 3 }}>
          {labels.loadingMessage}
        </Typography>
      </DesktopPageContainer>
    );
  }

  return (
    <DesktopPageContainer>
      <Box sx={{ mb: 3 }}>
        <Typography variant="headlineLg" sx={theme => ({ fontWeight: 700, color: theme.palette.onSurface })}>
          {labels.pageTitle}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <DesktopSectionPanel title={labels.lessonHistory} sx={{ height: "100%" }}>
            <Stack spacing={2}>
              <DesktopMetricCard
                icon={EventOutlined}
                label={labels.sessionDate}
                value={metrics.totalClasses}
                variant="compact"
              />
              <DesktopMetricCard
                icon={SchoolOutlined}
                label={labels.subject}
                value={metrics.hoursStudied}
                variant="compact"
              />
              <DesktopMetricCard
                icon={PersonOutlined}
                label={labels.instructor}
                value={metrics.attendanceRate}
                variant="compact"
              />
            </Stack>
          </DesktopSectionPanel>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <DesktopSectionPanel title={labels.lessonHistory}>
            {sessions.length === 0 ? (
              <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                {labels.noHistory}
              </Typography>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>{labels.sessionDate}</TableCell>
                      <TableCell>{labels.subject}</TableCell>
                      <TableCell>{labels.instructor}</TableCell>
                      <TableCell>{labels.duration}</TableCell>
                      <TableCell>{labels.status}</TableCell>
                      <TableCell>{labels.outcome}</TableCell>
                      <TableCell>{labels.notes}</TableCell>
                      <TableCell align="right">{labels.joinUrl}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sessions.map(row => (
                      <TableRow key={row.id} hover>
                        <TableCell>{row.time ?? "—"}</TableCell>
                        <TableCell>{row.title}</TableCell>
                        <TableCell>{row.instructor ?? "—"}</TableCell>
                        <TableCell>{row.duration} min</TableCell>
                        <TableCell>
                          <Typography
                            variant="bodyMd"
                            sx={theme => ({ color: statusColor(row.status, theme), fontWeight: 600 })}
                          >
                            {row.status}
                          </Typography>
                        </TableCell>
                        <TableCell>{row.outcome ?? "—"}</TableCell>
                        <TableCell>{row.notes ?? "—"}</TableCell>
                        <TableCell align="right">
                          {row.meetingJoinUrl && (
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<VisibilityOutlined />}
                              onClick={() => window.open(row.meetingJoinUrl ?? "", "_blank", "noopener,noreferrer")}
                            >
                              {labels.viewReport}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </DesktopSectionPanel>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackOutlined />}
          sx={theme => ({ color: theme.palette.primary.main, borderColor: theme.palette.primary.main })}
          onClick={onBackToDashboard}
        >
          {labels.addReflection}
        </Button>
      </Box>
    </DesktopPageContainer>
  );
}
