"use client";

import { ClassOutlined, EventBusyOutlined } from "@mui/icons-material";
import { Stack, Typography } from "@mui/material";
import type { ComponentType, ReactNode } from "react";
import { DateNavigator } from "@/frontend/common/components/ui/filter";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import type { JumpToDateHeaderProps } from "@/frontend/common/views/dashboard/teachers/futureSchedule/types";

export type JumpToDateHeaderCardComponent = ComponentType<{
  readonly sx?: object;
  readonly children: ReactNode;
}>;

export type JumpToDateHeaderMetricsRenderer = (params: { readonly metrics: readonly MetricItem[] }) => ReactNode;

function buildHeaderMetrics({
  leaveQuotaUsed,
  leaveQuotaTotal,
  totalClasses,
  labels,
}: Readonly<
  Pick<JumpToDateHeaderProps, "leaveQuotaUsed" | "leaveQuotaTotal" | "totalClasses" | "labels">
>): MetricItem[] {
  return [
    {
      key: "leave-quota",
      count: labels.remaining(leaveQuotaTotal - leaveQuotaUsed, leaveQuotaTotal),
      labelKey: "leave-quota",
      label: labels.leaveQuotaDesc(leaveQuotaTotal),
      icon: EventBusyOutlined,
    },
    {
      key: "total-classes",
      count: `${totalClasses} ${labels.totalClasses}`,
      labelKey: "total-classes",
      label: labels.totalClassesDesc(totalClasses),
      icon: ClassOutlined,
    },
  ];
}

function MetricStatsFallback({ metrics }: Readonly<{ metrics: readonly MetricItem[] }>) {
  return (
    <Stack direction="row" spacing={2} sx={{ width: "100%" }}>
      {metrics.map(metric => (
        <Stack key={metric.key} spacing={0.5} sx={{ flex: 1, minWidth: 140 }}>
          <Typography variant="labelSm" sx={theme => ({ color: theme.palette.onSurfaceVariant, fontWeight: 700 })}>
            {metric.label ?? metric.labelKey}
          </Typography>
          <Typography variant="headlineMd" sx={theme => ({ color: theme.palette.primary.main, fontWeight: 700 })}>
            {metric.count}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}

export function JumpToDateHeaderShared({
  leaveQuotaUsed,
  leaveQuotaTotal,
  totalClasses,
  selectedDate,
  onDateChange,
  labels,
  CardComponent,
  renderMetricsGrid,
}: Readonly<JumpToDateHeaderProps> & {
  readonly CardComponent: JumpToDateHeaderCardComponent;
  readonly renderMetricsGrid?: JumpToDateHeaderMetricsRenderer;
}) {
  const metrics = buildHeaderMetrics({ leaveQuotaUsed, leaveQuotaTotal, totalClasses, labels });

  return (
    <CardComponent sx={{ p: 2 }}>
      <Stack direction="column" spacing={3} sx={{ justifyContent: "space-between" }}>
        <Stack spacing={2}>
          <Typography variant="headlineMd" sx={theme => ({ color: theme.palette.primary.main })}>
            {labels.jumpToDate}
          </Typography>
          <DateNavigator
            dateValue={selectedDate}
            todayLabel={labels.today}
            previousDayLabel={labels.ariaLabels.previousDay}
            nextDayLabel={labels.ariaLabels.nextDay}
            dateLabel={labels.jumpToDate}
            onDateChange={onDateChange}
          />
        </Stack>
        {renderMetricsGrid ? renderMetricsGrid({ metrics }) : <MetricStatsFallback metrics={metrics} />}
      </Stack>
    </CardComponent>
  );
}
