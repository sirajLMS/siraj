"use client";

import { ArrowBackOutlined, PaymentsOutlined, SchoolOutlined } from "@mui/icons-material";
import { Box, Button, Chip, Grid, Stack } from "@mui/material";
import type { StudentCreditsViewModel } from "@/frontend/common/views/dashboard/student/credits/useStudentCreditsViewModel";
import { DesktopMetricCard } from "@/frontend/desktop/components/ui/card/MetricCard";
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

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <DesktopMetricCard
            icon={PaymentsOutlined}
            label={labels.hoursRemaining}
            value={balance.classesRemaining}
            subLabel={`${balance.classesTotal} ${labels.hoursTotal.toLowerCase()}`}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <DesktopMetricCard icon={SchoolOutlined} label={labels.hoursTotal} value={balance.classesTotal} />
        </Grid>
      </Grid>

      <DesktopSectionPanel
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
