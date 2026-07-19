"use client";

import { ArrowBackOutlined, PaymentsOutlined, SchoolOutlined } from "@mui/icons-material";
import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { formatDate } from "@/frontend/common/components/intl/dateFormat";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import type { StudentCreditTransactionRow } from "@/frontend/common/views/dashboard/student/credits/types/studentCreditsTypes";
import type { StudentCreditsViewModel } from "@/frontend/common/views/dashboard/student/credits/useStudentCreditsViewModel";
import type { MetricItem } from "@/frontend/common/views/dashboard/types/dashboard";
import {
  MobileCardList,
  MobileContentInset,
  MobileContentStack,
  MobileHorizontalScrollRow,
  MobileMetricCardGrid,
  MobilePageContainer,
  MobilePageHeader,
  MobileSectionPanel,
} from "@/frontend/mobile/components/ui";

interface MobileTransactionItemProps {
  readonly row: StudentCreditTransactionRow;
  readonly locale: StudentCreditsViewModel["locale"];
  readonly reasonLabel: StudentCreditsViewModel["reasonLabel"];
}

function MobileTransactionItem({ row, locale, reasonLabel }: MobileTransactionItemProps): ReactNode {
  const positive = row.changeAmount >= 0;
  const sign = positive ? "+" : "";

  return (
    <Box
      sx={theme => ({
        p: 2,
        borderRadius: 2,
        backgroundColor: theme.palette.surfaceContainer,
        border: `1px solid ${theme.palette.outlineVariant}`,
      })}
    >
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", gap: 1 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
            {reasonLabel(row.reason)}
          </Typography>
          <Typography variant="bodyMd" sx={theme => ({ fontWeight: 700, color: theme.palette.onSurface })}>
            {row.createdAt ? formatDate(row.createdAt, locale) : "—"}
          </Typography>
        </Box>
        <Typography
          variant="bodyMd"
          sx={theme => ({
            fontWeight: 700,
            color: positive ? theme.palette.success.main : theme.palette.error.main,
          })}
        >
          {sign}
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
  totalCount,
  reasonFilter,
  reasonOptions,
  page,
  pageSize,
  locale,
  labels,
  loading,
  onReasonFilterChange,
  onPageChange,
  onBackToDashboard,
  reasonLabel,
}: Readonly<StudentCreditsViewModel>) {
  const metrics: readonly MetricItem[] = useMemo(
    () => [
      {
        key: "hoursRemaining",
        label: labels.hoursRemaining,
        count: balance.classesRemaining,
        icon: PaymentsOutlined,
        labelKey: "hoursRemaining",
      },
      {
        key: "hoursTotal",
        label: labels.hoursTotal,
        count: balance.classesTotal,
        icon: SchoolOutlined,
        labelKey: "hoursTotal",
      },
    ],
    [balance.classesRemaining, balance.classesTotal, labels.hoursRemaining, labels.hoursTotal]
  );

  return (
    <MobilePageContainer>
      <MobileContentStack>
        <MobilePageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} />

        <MobileMetricCardGrid metrics={metrics} />

        <MobileHorizontalScrollRow>
          {reasonOptions.map(option => {
            const selected = reasonFilter === option.value;
            return (
              <Chip
                key={option.value}
                label={option.label}
                size="small"
                clickable
                onClick={() => onReasonFilterChange(option.value)}
                sx={theme => ({
                  flexShrink: 0,
                  backgroundColor: selected ? theme.palette.primary.main : theme.palette.surfaceContainerHigh,
                  color: selected ? theme.palette.onPrimary : theme.palette.onSurfaceVariant,
                  fontWeight: selected ? 700 : 500,
                })}
              />
            );
          })}
        </MobileHorizontalScrollRow>

        <MobileSectionPanel title={labels.transactionHistory} contentInset={false}>
          {loading && transactions.length === 0 ? (
            <MobileContentInset>
              <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                {labels.pageTitle}
              </Typography>
            </MobileContentInset>
          ) : (
            <MobileCardList<StudentCreditTransactionRow>
              rows={transactions}
              emptyMessage={labels.noTransactions}
              getKey={row => row.id}
              renderItem={row => <MobileTransactionItem row={row} locale={locale} reasonLabel={reasonLabel} />}
              paginationOptions={buildServerPaginationOptions({
                page,
                pageSize,
                totalCount,
                onPageChange,
              })}
            />
          )}
        </MobileSectionPanel>

        <MobileContentInset>
          <Button
            variant="outlined"
            fullWidth
            startIcon={<ArrowBackOutlined />}
            sx={theme => ({ color: theme.palette.primary.main, borderColor: theme.palette.primary.main })}
            onClick={onBackToDashboard}
          >
            {labels.backToDashboard}
          </Button>
        </MobileContentInset>
      </MobileContentStack>
    </MobilePageContainer>
  );
}
