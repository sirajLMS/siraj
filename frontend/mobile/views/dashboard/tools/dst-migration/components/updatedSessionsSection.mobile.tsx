"use client";

import { UpdatedSessionsPanelShared } from "@/frontend/common/views/dashboard/tools/dst-migration/components/__shared__/updatedSessionsPanelShared";
import type { UpdatedSession } from "@/frontend/common/views/dashboard/tools/dst-migration/dst-migration.types";
import { UpdatedSessionsCardListMobile } from "@/frontend/mobile/views/dashboard/tools/dst-migration/components/updatedSessionsCardList.mobile";
import type { DstMigrationLabels } from "@/shared/locale/types/dashboard/admin/dstMigration";

interface Props {
  readonly labels: DstMigrationLabels;
  readonly sessions: readonly UpdatedSession[];
  readonly successfulCount: number;
  readonly loading?: boolean;
}

export function UpdatedSessionsSectionMobile({ labels, sessions, successfulCount }: Readonly<Props>) {
  return (
    <UpdatedSessionsPanelShared labels={labels} successfulCount={successfulCount} contentPadding={2}>
      <UpdatedSessionsCardListMobile sessions={sessions} successfulCount={successfulCount} />
    </UpdatedSessionsPanelShared>
  );
}
