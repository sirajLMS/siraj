"use client";

import type { CarryoverViewProps } from "@/frontend/common/views/dashboard/accounting/carryover/CarryoverContainer";
import { CarryoverDataGrid } from "@/frontend/common/views/dashboard/accounting/carryover/CarryoverDataGrid";
import { CarryoverFilterBar } from "@/frontend/common/views/dashboard/accounting/carryover/CarryoverFilterBar";
import { DesktopListStateGate } from "@/frontend/common/views/dashboard/accounting/components/DesktopListStateGate";
import { usePageBreadcrumbs } from "@/frontend/common/views/dashboard/lib/usePageBreadcrumbs";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui/container";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";

/**
 * Desktop layout of the carryover balance page: the page header owns the single
 * title, subtitle, and the parent-only breadcrumb trail; the filter card spans
 * the content width between the header and the list panel, which holds the data
 * grid (with its bulk toolbar and aggregate footer) without a repeated title.
 */
export function CarryoverDesktopView(props: Readonly<CarryoverViewProps>) {
  const { labels, rows, isLoading, error } = props;
  // The auto-walked trail ends with this page's own nav entry, which duplicates
  // the H1 — drop the trailing crumb so the trail carries only the parent path.
  const crumbs = usePageBreadcrumbs();
  const breadcrumbs = crumbs.length > 0 ? crumbs.slice(0, -1) : crumbs;

  return (
    <DesktopPageContainer>
      <DesktopPageHeader title={labels.title} subtitle={labels.pageSubtitle} breadcrumbs={breadcrumbs} />
      <CarryoverFilterBar />
      <DesktopSectionPanel contentPadding={false}>
        <DesktopListStateGate
          error={error !== null}
          loading={isLoading}
          hasRows={rows.length > 0}
          errorMessage={labels.loadError}
        >
          <CarryoverDataGrid {...props} />
        </DesktopListStateGate>
      </DesktopSectionPanel>
    </DesktopPageContainer>
  );
}
