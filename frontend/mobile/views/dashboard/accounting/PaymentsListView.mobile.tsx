"use client";

import { AddOutlined } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import {
  MobileListCardSkeletons,
  MobileListEmptyNotice,
  MobileListErrorNotice,
} from "@/frontend/common/views/dashboard/accounting/components/__shared__/mobileListStateShared";
import { usePaymentsPersonFilterSelection } from "@/frontend/common/views/dashboard/accounting/components/__shared__/paymentsPersonFiltersShared";
import type { PaymentsListViewModel } from "@/frontend/common/views/dashboard/accounting/usePaymentsListViewModel";
import {
  MobileCardList,
  MobileContentInset,
  MobileContentStack,
  MobileFab,
  MobileMetricCardGrid,
  MobilePageContainer,
  MobilePageHeader,
} from "@/frontend/mobile/components/ui";
import { buildPaymentsMetricItems } from "@/frontend/mobile/views/dashboard/accounting/PaymentsListView.mobile.helpers";
import {
  PaymentsListCardMobile,
  PaymentsListFiltersMobile,
} from "@/frontend/mobile/views/dashboard/accounting/PaymentsListView.mobile.parts";

export function PaymentsListMobile(props: Readonly<PaymentsListViewModel>) {
  const {
    t,
    rows,
    loading,
    error,
    metrics,
    metricsBasis,
    fromDate,
    toDate,
    unpaidOnly,
    setFromDate,
    setToDate,
    setUnpaidOnly,
    resetFilters,
    hasActiveFilters,
    canManagePayments,
  } = props;
  const router = useRouter();

  const { studentValue, parentValue, handleStudentChange, handleParentChange } =
    usePaymentsPersonFilterSelection(props);

  const metricItems = useMemo<MetricItem[]>(
    () => buildPaymentsMetricItems(t, metrics, metricsBasis),
    [t, metrics, metricsBasis]
  );

  return (
    <MobilePageContainer>
      <MobilePageHeader title={t.pageTitle} subtitle={t.pageSubtitle} />

      {/* pb 11 (88px): FAB height (56) + breathing room — the shell only reserves the bottom-nav height, so the last card can still scroll fully above the fixed MobileFab. */}
      <MobileContentStack gap={2} paddingBottom={11}>
        <MobileMetricCardGrid metrics={metricItems} />

        <MobileContentInset>
          <PaymentsListFiltersMobile
            t={t}
            fromDate={fromDate}
            toDate={toDate}
            setFromDate={setFromDate}
            setToDate={setToDate}
            unpaidOnly={unpaidOnly}
            setUnpaidOnly={setUnpaidOnly}
            resetFilters={resetFilters}
            hasActiveFilters={hasActiveFilters}
            studentValue={studentValue}
            parentValue={parentValue}
            handleStudentChange={handleStudentChange}
            handleParentChange={handleParentChange}
          />
        </MobileContentInset>

        <MobileListErrorNotice visible={error && rows.length === 0} message={t.loadError} />

        <MobileCardList
          rows={rows}
          getKey={row => row.id ?? ""}
          loading={loading}
          emptyMessage={t.empty}
          renderSkeleton={() => <MobileListCardSkeletons height={96} />}
          renderEmptyState={message => <MobileListEmptyNotice visible={!error} message={message} />}
          paginationOptions={{ mode: "client" }}
          renderItem={row => <PaymentsListCardMobile t={t} row={row} />}
        />
      </MobileContentStack>

      {canManagePayments ? (
        <MobileFab
          icon={<AddOutlined />}
          label={t.addPayment}
          onClick={() => router.push("/accounting/payments/new")}
        />
      ) : null}
    </MobilePageContainer>
  );
}
