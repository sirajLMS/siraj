"use client";

import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import { ManagersFilterBar } from "@/frontend/common/views/dashboard/managers/home/ManagersFilterBar";
import { ManagersMetrics } from "@/frontend/common/views/dashboard/managers/home/ManagersMetrics";
import type { ManagersViewProps } from "@/frontend/common/views/dashboard/managers/home/types";
import { MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";
import { MobilePrimaryPageAction } from "@/frontend/mobile/components/ui/button";
import { MobileSectionPanel } from "@/frontend/mobile/components/ui/container";
import { ManagersCardListMobile } from "@/frontend/mobile/views/dashboard/managers/home/components/managersCardList.mobile";
import { Link } from "@/shared/i18n/routing";
import { useAppTranslation } from "@/shared/locale";

export function ManagersViewMobile(props: Readonly<ManagersViewProps>) {
  const t = useAppTranslation().dashboardTranslations.managersDirectory;

  const actions = props.canCreateManager ? (
    <Link href="/managers/onboarding" style={{ textDecoration: "none" }}>
      <MobilePrimaryPageAction>{t.actions.addManager}</MobilePrimaryPageAction>
    </Link>
  ) : undefined;

  return (
    <MobilePageContainer>
      <MobilePageHeader title={t.mobileTitle} subtitle={t.pageSubtitle} actions={actions} />

      <ManagersMetrics metrics={props.metrics} />

      <MobileSectionPanel>
        <ManagersFilterBar
          roleFilter={props.roleFilter}
          statusFilter={props.statusFilter}
          onRoleFilterChange={props.onRoleFilterChange}
          onStatusFilterChange={props.onStatusFilterChange}
        />

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
