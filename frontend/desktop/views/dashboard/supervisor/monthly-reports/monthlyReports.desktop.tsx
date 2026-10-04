"use client";

import type { MonthlyReportsViewModel } from "@/frontend/common/views/dashboard/supervisor/monthly-reports/types/monthlyReportsTypes";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";
import { FilterPanel } from "@/frontend/desktop/views/dashboard/supervisor/monthly-reports/monthlyReports.filterPanel.parts";
import { MetricsOutput } from "@/frontend/desktop/views/dashboard/supervisor/monthly-reports/monthlyReports.metricsOutput.parts";

export function MonthlyReportsDesktopView(props: Readonly<MonthlyReportsViewModel>) {
  return (
    <DesktopPageContainer>
      <DesktopPageHeader title={props.labels.pageTitle} />
      <FilterPanel {...props} />
      <MetricsOutput loading={props.loading} metrics={props.metrics} labels={props.labels} />
    </DesktopPageContainer>
  );
}
