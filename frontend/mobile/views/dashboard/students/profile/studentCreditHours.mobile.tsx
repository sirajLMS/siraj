"use client";

import { AccessTimeFilledOutlined } from "@mui/icons-material";
import { Alert, Box, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { StatusBadge } from "@/frontend/common/components/ui/badge";
import type {
  StudentCreditHoursTransactionRow,
  StudentCreditHoursViewModel,
} from "@/frontend/common/views/dashboard/students/profile/useStudentCreditHoursViewModel";
import {
  MobileCardList,
  MobileCardListItem,
  MobileContentInset,
  MobileContentStack,
  MobileLoadingState,
  MobileMetricCardGrid,
  MobileSectionPanel,
} from "@/frontend/mobile/components/ui";

function MobileCreditTransactionItem({ row }: Readonly<{ row: StudentCreditHoursTransactionRow }>): ReactNode {
  return (
    <MobileCardListItem>
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", gap: 1 }}>
        <Box sx={{ minWidth: 0 }}>
          <StatusBadge category="creditTransaction" status={row.reasonStatus} label={row.reasonLabel} />
          <Typography variant="labelSm" sx={theme => ({ mt: 0.5, color: theme.palette.onSurfaceVariant })}>
            {row.dateLabel}
          </Typography>
        </Box>
        <Typography
          variant="bodyMd"
          sx={theme => ({
            fontWeight: 700,
            whiteSpace: "nowrap",
            flexShrink: 0,
            color: row.isPositive ? theme.palette.success.main : theme.palette.error.main,
          })}
        >
          {row.changeLabel}
        </Typography>
      </Stack>
      <Typography variant="labelMd" sx={theme => ({ mt: 1, color: theme.palette.onSurfaceVariant })}>
        {row.notes}
      </Typography>
    </MobileCardListItem>
  );
}

export function StudentCreditHoursMobileView(props: Readonly<StudentCreditHoursViewModel>) {
  const { labels } = props;

  if (props.initialLoading) {
    return <MobileLoadingState />;
  }
  if (props.balanceError) {
    return (
      <MobileContentInset>
        <Alert severity="error">{labels.loadError}</Alert>
      </MobileContentInset>
    );
  }

  return (
    <MobileContentStack>
      {props.hint ? (
        <MobileContentInset>
          <Typography variant="labelSm" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
            {props.hint}
          </Typography>
        </MobileContentInset>
      ) : null}

      {props.lowBalanceMessage ? (
        <MobileContentInset>
          <Alert severity="warning" icon={<AccessTimeFilledOutlined fontSize="inherit" />}>
            {props.lowBalanceMessage}
          </Alert>
        </MobileContentInset>
      ) : null}

      <MobileMetricCardGrid metrics={props.metrics} />

      <MobileSectionPanel title={labels.recentPurchasesTitle} contentInset={false}>
        {props.transactionsError ? (
          <MobileContentInset>
            <Alert severity="error">{labels.loadError}</Alert>
          </MobileContentInset>
        ) : (
          <MobileCardList
            rows={props.transactions}
            loading={props.transactionsLoading}
            emptyMessage={labels.recentPurchasesEmpty}
            getKey={row => row.id}
            renderItem={row => <MobileCreditTransactionItem row={row} />}
            paginationOptions={props.transactionsPagination}
          />
        )}
      </MobileSectionPanel>
    </MobileContentStack>
  );
}
