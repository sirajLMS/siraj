"use client";

import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import { ManagersFilterBar } from "@/frontend/common/views/dashboard/staff/home/ManagersFilterBar";
import { ManagersMetrics } from "@/frontend/common/views/dashboard/staff/home/ManagersMetrics";
import type { ManagersViewProps } from "@/frontend/common/views/dashboard/staff/home/types";
import { MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";
import { MobilePrimaryPageAction } from "@/frontend/mobile/components/ui/button";
import { MobileContentInset, MobileSectionPanel } from "@/frontend/mobile/components/ui/container";
import { ManagersCardListMobile } from "@/frontend/mobile/views/dashboard/staff/home/components/managersCardList.mobile";
import { Link } from "@/shared/i18n";
import { useAppTranslation } from "@/shared/locale";

export function ManagersViewMobile(props: Readonly<ManagersViewProps>) {
  const t = useAppTranslation().dashboardTranslations.staffDirectory;

  const actions = props.canCreateManager ? (
    <Link href="/staff/create" style={{ textDecoration: "none" }}>
      <MobilePrimaryPageAction>{t.actions.addManager}</MobilePrimaryPageAction>
    </Link>
  ) : undefined;

  return (
    <MobilePageContainer>
      <MobilePageHeader title={t.mobileTitle} subtitle={t.pageSubtitle} actions={actions} />

      <MobileContentInset>
        <ManagersMetrics metrics={props.metrics} />
      </MobileContentInset>

      <MobileSectionPanel contentInset={false}>
        <MobileContentInset>
          <ManagersFilterBar
            roleFilter={props.roleFilter}
            statusFilter={props.statusFilter}
            onRoleFilterChange={props.onRoleFilterChange}
            onStatusFilterChange={props.onStatusFilterChange}
          />
        </MobileContentInset>

        <ManagersCardListMobile
          managers={[...props.managers]}
          paginationOptions={
            props.totalManagers !== undefined && props.onPageChange !== undefined
              ? buildServerPaginationOptions({
                  page: props.page ?? 0,
                  pageSize: props.pageSize ?? 10,
                  totalCount: props.totalManagers,
                  onPageChange: props.onPageChange,
                })
              : false
          }
        />
      </MobileSectionPanel>
    </MobilePageContainer>
  );
}
