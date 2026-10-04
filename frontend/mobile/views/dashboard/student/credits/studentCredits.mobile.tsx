"use client";

import { ArrowBackOutlined, PaymentsOutlined, SchoolOutlined } from "@mui/icons-material";
import { Button, Chip, Typography } from "@mui/material";
import { useMemo } from "react";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import type { StudentCreditTransactionRow } from "@/frontend/common/views/dashboard/student/credits/types/studentCreditsTypes";
import type { StudentCreditsViewModel } from "@/frontend/common/views/dashboard/student/credits/useStudentCreditsViewModel";
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
import { MobileTransactionItem } from "@/frontend/mobile/views/dashboard/student/credits/studentCredits.parts";

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
        count: `${balance.hoursRemaining.toFixed(2)} h`,
        icon: PaymentsOutlined,
        labelKey: "hoursRemaining",
      },
      {
        key: "hoursTotal",
        label: labels.hoursTotal,
        count: `${balance.hoursTotal.toFixed(2)} h`,
        icon: SchoolOutlined,
        labelKey: "hoursTotal",
      },
    ],
    [balance.hoursRemaining, balance.hoursTotal, labels.hoursRemaining, labels.hoursTotal]
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
