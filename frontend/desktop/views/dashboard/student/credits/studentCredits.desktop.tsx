"use client";

import { ArrowBackOutlined, PaymentsOutlined, SchoolOutlined } from "@mui/icons-material";
import { Box, Button, Chip, Stack } from "@mui/material";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import type { StudentCreditsViewModel } from "@/frontend/common/views/dashboard/student/credits/useStudentCreditsViewModel";
import { DesktopMetricCardGrid } from "@/frontend/desktop/components/ui/card/MetricCardGrid";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui/container";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";
import { StudentCreditsDataGrid } from "@/frontend/desktop/views/dashboard/student/credits/components/studentCreditsDataGrid.desktop";

export function StudentCreditsDesktopView({
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
  onPageSizeChange,
  onBackToDashboard,
  reasonLabel,
}: Readonly<StudentCreditsViewModel>) {
  return (
    <DesktopPageContainer>
      <DesktopPageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} />

      <Box sx={{ mb: 3 }}>
        <DesktopMetricCardGrid
          metrics={
            [
              {
                key: "hours-remaining",
                count: balance.classesRemaining,
                labelKey: "hours-remaining",
                label: labels.hoursRemaining,
                icon: PaymentsOutlined,
                subLabel: `${balance.classesTotal} ${labels.hoursTotal.toLowerCase()}`,
              },
              {
                key: "hours-total",
                count: balance.classesTotal,
                labelKey: "hours-total",
                label: labels.hoursTotal,
                icon: SchoolOutlined,
              },
            ] satisfies MetricItem[]
          }
          size={{ xs: 12, md: 6 }}
        />
      </Box>

      <DesktopSectionPanel
        contentPadding={false}
        title={labels.transactionHistory}
        actions={
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
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
                    backgroundColor: selected ? theme.palette.primary.main : theme.palette.surfaceContainerHigh,
                    color: selected ? theme.palette.onPrimary : theme.palette.onSurfaceVariant,
                    fontWeight: selected ? 700 : 500,
                  })}
                />
              );
            })}
          </Stack>
        }
      >
        <StudentCreditsDataGrid
          rows={transactions}
          totalCount={totalCount}
          page={page}
          pageSize={pageSize}
          locale={locale}
          labels={labels}
          loading={loading}
          reasonLabel={reasonLabel}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      </DesktopSectionPanel>

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
