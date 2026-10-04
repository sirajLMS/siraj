"use client";

import { AddOutlined, FileDownloadOutlined } from "@mui/icons-material";
import { IconButton, Stack } from "@mui/material";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import type { CarryoverViewProps } from "@/frontend/common/views/dashboard/accounting/carryover/CarryoverContainer";
import { CarryoverFilterBar } from "@/frontend/common/views/dashboard/accounting/carryover/CarryoverFilterBar";
import { useCarryoverExport } from "@/frontend/common/views/dashboard/accounting/carryover/useCarryoverExport";
import {
  MobileListCardSkeletons,
  MobileListErrorNotice,
} from "@/frontend/common/views/dashboard/accounting/components/__shared__/mobileListStateShared";
import { usePageBreadcrumbs } from "@/frontend/common/views/dashboard/lib/usePageBreadcrumbs";
import {
  MobileCardList,
  MobileContentInset,
  MobileContentStack,
  MobilePageContainer,
  MobilePageHeader,
} from "@/frontend/mobile/components/ui";
import {
  CarryoverAggregateStrip,
  CarryoverCard,
} from "@/frontend/mobile/views/dashboard/accounting/carryover/carryover.mobile.parts";

/** Height of each placeholder card while the first page loads. */
const LIST_SKELETON_HEIGHT = 148;

/**
 * Mobile layout of the carryover balance page: a totals strip, the stacked
 * filter controls, then the rows as tappable cards with server pagination.
 */
export function CarryoverMobileView(props: Readonly<CarryoverViewProps>) {
  const { labels, rows, totalCount, aggregates, isLoading, error } = props;
  const { page, pageSize, onPageChange, onPageSizeChange, pageSizeOptions } = props;
  const { canManageCarryover, actionsMenuLabel, onOpenForm, onOpenDelete, onOpenUnpay, onOpenDrawer } = props;
  const locale = useAppLocale();
  const listFailed = error !== null && rows.length === 0;
  const { exporting, runExport } = useCarryoverExport(props.handleExportCsv, labels);
  // The trailing auto breadcrumb repeats the page title, so the trail keeps
  // only the parent path.
  const crumbs = usePageBreadcrumbs();
  const breadcrumbs = crumbs.length > 0 ? crumbs.slice(0, -1) : crumbs;

  return (
    <MobilePageContainer>
      <MobilePageHeader
        title={labels.title}
        subtitle={labels.pageSubtitle}
        breadcrumbs={breadcrumbs}
        actions={
          <Stack direction="row" sx={{ alignItems: "center" }}>
            <IconButton aria-label={labels.action.exportCsv} onClick={runExport} disabled={exporting} size="small">
              <FileDownloadOutlined />
            </IconButton>
            {canManageCarryover ? (
              <IconButton aria-label={labels.action.addNew} onClick={() => onOpenForm(null)} size="small">
                <AddOutlined />
              </IconButton>
            ) : null}
          </Stack>
        }
      />
      <MobileContentStack gap={2} paddingBottom={11}>
        <MobileContentInset>
          <CarryoverAggregateStrip aggregates={aggregates} labels={labels} totalCount={totalCount} />
        </MobileContentInset>
        <MobileContentInset>
          <CarryoverFilterBar />
        </MobileContentInset>
        <MobileListErrorNotice visible={listFailed} message={labels.loadError} />
        {listFailed ? null : (
          <MobileCardList
            rows={rows}
            layout="rounded"
            getKey={row => row.id ?? `${row.teacherId ?? ""}-${row.fromDate ?? ""}-${row.toDate ?? ""}`}
            loading={isLoading}
            emptyMessage={labels.empty}
            renderSkeleton={() => <MobileListCardSkeletons height={LIST_SKELETON_HEIGHT} />}
            paginationOptions={buildServerPaginationOptions({
              page,
              pageSize,
              totalCount,
              onPageChange,
              onPageSizeChange,
              pageSizeOptions,
            })}
            renderItem={row => (
              <CarryoverCard
                row={row}
                labels={labels}
                locale={locale}
                canManage={canManageCarryover}
                actionsMenuLabel={actionsMenuLabel}
                onOpenForm={onOpenForm}
                onOpenDelete={onOpenDelete}
                onOpenUnpay={onOpenUnpay}
                onOpenDrawer={onOpenDrawer}
              />
            )}
          />
        )}
      </MobileContentStack>
    </MobilePageContainer>
  );
}
