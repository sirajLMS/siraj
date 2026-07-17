"use client";

import { ArrowBackOutlined, PaymentsOutlined, SchoolOutlined } from "@mui/icons-material";
import { Box, Button, Grid, Stack, Typography } from "@mui/material";
import type { StudentCreditTransactionRow } from "@/frontend/common/views/dashboard/student/credits/types/studentCreditsTypes";
import type { StudentCreditsViewModel } from "@/frontend/common/views/dashboard/student/credits/useStudentCreditsViewModel";
import { DesktopMetricCard } from "@/frontend/desktop/components/ui/card/MetricCard";
import { DesktopPageContainer, DesktopSectionPanel } from "@/frontend/desktop/components/ui/container/page";

function reasonLabel(reason: StudentCreditTransactionRow["reason"], labels: StudentCreditsViewModel["labels"]): string {
  if (!reason) return "";
  switch (reason) {
    case "PURCHASE":
      return labels.purchase;
    case "DEDUCTION":
      return labels.deduction;
    case "REFUND":
      return labels.refund;
    case "ADJUSTMENT":
      return labels.adjustment;
    default:
      return reason;
  }
}

export function StudentCreditsDesktopView({
  balance,
  transactions,
  labels,
  loading,
  onBackToDashboard,
}: Readonly<StudentCreditsViewModel>) {
  if (loading && balance.classesTotal === 0) {
    return (
      <DesktopPageContainer>
        <Typography variant="bodyMd" sx={{ p: 3 }}>
          {labels.pageTitle}
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
          <DesktopSectionPanel title={labels.currentBalance} sx={{ height: "100%" }}>
            <Stack spacing={2}>
              <DesktopMetricCard
                icon={PaymentsOutlined}
                label={labels.hoursRemaining}
                value={balance.classesRemaining}
                variant="compact"
              />
              <DesktopMetricCard
                icon={SchoolOutlined}
                label={labels.hoursTotal}
                value={balance.classesTotal}
                variant="compact"
              />
            </Stack>
          </DesktopSectionPanel>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <DesktopSectionPanel title={labels.transactionHistory}>
            <Stack spacing={2}>
              {transactions.length === 0 ? (
                <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                  {labels.noTransactions}
                </Typography>
              ) : (
                transactions.map(row => (
                  <Box
                    key={row.id}
                    sx={theme => ({
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: theme.palette.surfaceContainer,
                      border: `1px solid ${theme.palette.outlineVariant}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 2,
                    })}
                  >
                    <Box>
                      <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                        {reasonLabel(row.reason, labels)}
                      </Typography>
                      <Typography variant="bodyMd" sx={theme => ({ fontWeight: 700, color: theme.palette.onSurface })}>
                        {row.createdAt ?? "—"}
                      </Typography>
                      {row.notes ? (
                        <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                          {row.notes}
                        </Typography>
                      ) : null}
                    </Box>
                    <Typography
                      variant="headlineMd"
                      sx={theme => ({
                        fontWeight: 700,
                        color: row.changeAmount >= 0 ? theme.palette.primary.main : theme.palette.error.main,
                      })}
                    >
                      {row.changeAmount >= 0 ? "+" : ""}
                      {row.changeAmount}
                    </Typography>
                  </Box>
                ))
              )}
            </Stack>
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
          {labels.backToDashboard}
        </Button>
      </Box>
    </DesktopPageContainer>
  );
}
