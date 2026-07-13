"use client";

import { ArrowBackOutlined, PaymentsOutlined, SchoolOutlined } from "@mui/icons-material";
import { Box, Button, Stack, Typography } from "@mui/material";
import { PageContainer, SectionPanel } from "@/frontend/common/components/ui";
import { MetricCard } from "@/frontend/common/components/ui/card/MetricCard";
import type { StudentCreditTransactionRow } from "@/frontend/common/views/dashboard/student/credits/types/studentCreditsTypes";
import type { StudentCreditsViewModel } from "@/frontend/common/views/dashboard/student/credits/useStudentCreditsViewModel";
import { MobileCardList, MobileContentStack } from "@/frontend/mobile/components/ui";

interface MobileTransactionItemProps {
  readonly row: StudentCreditTransactionRow;
  readonly labels: StudentCreditsViewModel["labels"];
}

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

function MobileTransactionItem({ row, labels }: MobileTransactionItemProps): import("react").ReactNode {
  return (
    <Box
      sx={theme => ({
        p: 2,
        borderRadius: 2,
        backgroundColor: theme.palette.surfaceContainer,
        border: `1px solid ${theme.palette.outlineVariant}`,
      })}
    >
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
        <Box>
          <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
            {reasonLabel(row.reason, labels)}
          </Typography>
          <Typography variant="bodyMd" sx={theme => ({ fontWeight: 700, color: theme.palette.onSurface })}>
            {row.createdAt ?? "—"}
          </Typography>
        </Box>
        <Typography
          variant="bodyMd"
          sx={theme => ({
            fontWeight: 700,
            color: row.changeAmount >= 0 ? theme.palette.primary.main : theme.palette.error.main,
          })}
        >
          {row.changeAmount >= 0 ? "+" : ""}
          {row.changeAmount}
        </Typography>
      </Stack>
      {row.notes ? (
        <Typography variant="labelMd" sx={theme => ({ mt: 1, color: theme.palette.onSurfaceVariant })}>
          {row.notes}
        </Typography>
      ) : null}
    </Box>
  );
}

export function StudentCreditsMobileView({
  balance,
  transactions,
  labels,
  loading,
  onBackToDashboard,
}: Readonly<StudentCreditsViewModel>) {
  if (loading && balance.classesTotal === 0) {
    return (
      <PageContainer>
        <Typography variant="bodyMd" sx={{ p: 3 }}>
          {labels.pageTitle}
        </Typography>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <MobileContentStack>
        <SectionPanel title={labels.currentBalance}>
          <Stack direction="row" spacing={2} sx={{ alignItems: "stretch" }}>
            <Box sx={{ flex: 1 }}>
              <MetricCard
                icon={PaymentsOutlined}
                label={labels.hoursRemaining}
                value={balance.classesRemaining}
                variant="compact"
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <MetricCard
                icon={SchoolOutlined}
                label={labels.hoursTotal}
                value={balance.classesTotal}
                variant="compact"
              />
            </Box>
          </Stack>
        </SectionPanel>

        <SectionPanel title={labels.transactionHistory}>
          <MobileCardList<StudentCreditTransactionRow>
            rows={transactions}
            emptyMessage={labels.noTransactions}
            getKey={row => row.id}
            renderItem={row => <MobileTransactionItem row={row} labels={labels} />}
          />
        </SectionPanel>

        <Button
          variant="outlined"
          fullWidth
          startIcon={<ArrowBackOutlined />}
          sx={theme => ({ color: theme.palette.primary.main, borderColor: theme.palette.primary.main })}
          onClick={onBackToDashboard}
        >
          {labels.backToDashboard}
        </Button>
      </MobileContentStack>
    </PageContainer>
  );
}
