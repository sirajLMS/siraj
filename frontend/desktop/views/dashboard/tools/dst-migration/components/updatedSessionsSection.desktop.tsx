"use client";

import { UpdatedSessionsPanelShared } from "@/frontend/common/views/dashboard/tools/dst-migration/components/__shared__/updatedSessionsPanelShared";
import type { UpdatedSession } from "@/frontend/common/views/dashboard/tools/dst-migration/dst-migration.types";
import { UpdatedSessionsDataGridDesktop } from "@/frontend/desktop/views/dashboard/tools/dst-migration/components/updatedSessionsDataGrid.desktop";
import type { DstMigrationLabels } from "@/shared/locale/types/dashboard/admin/dstMigration";

interface Props {
  readonly labels: DstMigrationLabels;
  readonly sessions: readonly UpdatedSession[];
  readonly successfulCount: number;
  readonly loading?: boolean;
}

export function UpdatedSessionsSectionDesktop({ labels, sessions, successfulCount, loading }: Readonly<Props>) {
  return (
    <UpdatedSessionsPanelShared labels={labels} successfulCount={successfulCount}>
      <UpdatedSessionsDataGridDesktop labels={labels} sessions={sessions} loading={loading} />
    </UpdatedSessionsPanelShared>
  );
}
