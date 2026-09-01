"use client";

import { buildServerPaginationOptions } from "@/frontend/common/components/ui";
import { SettingsCardBodyShared } from "@/frontend/common/views/dashboard/settings/tabs/__shared__/settingsCardBodyShared";
import type {
  SettingsAuditColumnLabels,
  SettingsAuditRow,
} from "@/frontend/common/views/dashboard/settings/types/settingsAudit.types";
import { MobileCardList, MobileCardListItem } from "@/frontend/mobile/components/ui";

export type SettingsAuditCardListMobileProps = {
  readonly rows: readonly SettingsAuditRow[];
  readonly columnLabels: SettingsAuditColumnLabels;
  readonly emptyMessage: string;
  readonly loading: boolean;
  readonly page: number;
  readonly pageSize: number;
  readonly totalCount: number;
  readonly onPageChange: (page: number) => void;
};

function SettingsAuditCard({
  row,
  columnLabels,
}: Readonly<{ readonly row: SettingsAuditRow; readonly columnLabels: SettingsAuditColumnLabels }>) {
  return (
    <MobileCardListItem variant="edge-to-edge">
      <SettingsCardBodyShared
        title={row.entityType}
        secondary={row.createdAt}
        fields={[
          { label: columnLabels.action, value: row.action },
          { label: columnLabels.description, value: row.description },
          { label: columnLabels.actor, value: row.actorUserId },
          { label: columnLabels.entityId, value: row.entityId },
        ]}
      />
    </MobileCardListItem>
  );
}

export function SettingsAuditCardListMobile({
  rows,
  columnLabels,
  emptyMessage,
  loading,
  page,
  pageSize,
  totalCount,
  onPageChange,
}: Readonly<SettingsAuditCardListMobileProps>) {
  return (
    <MobileCardList
      rows={rows}
      getKey={row => row.id}
      loading={loading}
      emptyMessage={emptyMessage}
      paginationOptions={buildServerPaginationOptions({
        page,
        pageSize,
        totalCount,
        onPageChange,
        pageSizeOptions: [pageSize],
      })}
      renderItem={row => <SettingsAuditCard row={row} columnLabels={columnLabels} />}
    />
  );
}
