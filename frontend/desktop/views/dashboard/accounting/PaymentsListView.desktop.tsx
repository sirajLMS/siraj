"use client";

import { Box } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { AppDataGrid } from "@/frontend/common/components/ui/dataGrid/AppDataGrid";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import { DesktopListStateGate } from "@/frontend/common/views/dashboard/accounting/components/DesktopListStateGate";
import type { PaymentsListViewModel } from "@/frontend/common/views/dashboard/accounting/usePaymentsListViewModel";
import { DesktopPrimaryPageAction } from "@/frontend/desktop/components/ui/button";
import { DesktopMetricCardGrid } from "@/frontend/desktop/components/ui/card/MetricCardGrid";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui/container/DesktopSectionPanel";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";
import { buildPaymentsListColumns } from "@/frontend/desktop/views/dashboard/accounting/PaymentsListView.desktop.columns";
import { buildPaymentsListMetricItems } from "@/frontend/desktop/views/dashboard/accounting/PaymentsListView.desktop.helpers";
import { PaymentsFiltersBar } from "@/frontend/desktop/views/dashboard/accounting/PaymentsListView.desktop.parts";
import { useAppLocale } from "@/shared/locale/localeContext";

export function PaymentsListDesktop(props: Readonly<PaymentsListViewModel>) {
  const { t, rows, loading, error, metrics, metricsBasis, canManagePayments } = props;
  const locale = useAppLocale();
  const router = useRouter();

  const columns = useMemo<GridColDef[]>(() => buildPaymentsListColumns(t, locale), [t, locale]);

  const metricItems = useMemo<MetricItem[]>(
    () => buildPaymentsListMetricItems(t, metrics, metricsBasis),
    [t, metrics, metricsBasis]
  );

  return (
    <DesktopPageContainer>
      <DesktopPageHeader
        title={t.pageTitle}
        subtitle={t.pageSubtitle}
        actions={
          canManagePayments ? (
            <Link href="/accounting/payments/new" style={{ textDecoration: "none" }}>
              <DesktopPrimaryPageAction>{t.addPayment}</DesktopPrimaryPageAction>
            </Link>
          ) : null
        }
      />

      <DesktopMetricCardGrid metrics={metricItems} size={{ md: 3, lg: 3 }} />

      <DesktopSectionPanel contentPadding={false} title={t.pageTitle} actions={<PaymentsFiltersBar {...props} />}>
        <DesktopListStateGate error={error} loading={loading} hasRows={rows.length > 0} errorMessage={t.loadError}>
          <Box sx={{ width: "100%", height: 560 }}>
            <AppDataGrid
              rows={rows}
              columns={columns}
              loading={loading}
              ariaLabel={t.pageTitle}
              emptyMessage={t.empty}
              autoHeight
              disableColumnMenu
              rowHeight={64}
              paginationOptions={{ mode: "client" }}
              onRowClick={params => router.push(`/accounting/payments/${String(params.row.id)}`)}
            />
          </Box>
        </DesktopListStateGate>
      </DesktopSectionPanel>
    </DesktopPageContainer>
  );
}
