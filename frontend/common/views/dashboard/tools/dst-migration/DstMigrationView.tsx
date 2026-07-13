"use client";

import { useViewport } from "@/frontend/common/hooks/useViewport";
import type {
  CheckedEmptyItem,
  ConflictGroup,
  DstMigrationMetrics,
  MigrationStatus,
  UpdatedSession,
} from "@/frontend/common/views/dashboard/tools/dst-migration/dst-migration.types";
import { DstMigrationViewDesktop } from "@/frontend/desktop/views/dashboard/tools/dst-migration/dstMigrationView.desktop";
import { DstMigrationViewMobile } from "@/frontend/mobile/views/dashboard/tools/dst-migration/dstMigrationView.mobile";

export interface DstMigrationViewProps {
  readonly metrics: DstMigrationMetrics;
  readonly updatedSessions: readonly UpdatedSession[];
  readonly conflictGroups: readonly ConflictGroup[];
  readonly checkedEmptyItems: readonly CheckedEmptyItem[];
  readonly migrationStatus: MigrationStatus;
  readonly onUpdate: () => void;
  readonly dstOffsetDetected: boolean;
}

export function DstMigrationView({
  metrics,
  updatedSessions,
  conflictGroups,
  checkedEmptyItems,
  migrationStatus,
  onUpdate,
  dstOffsetDetected,
}: Readonly<DstMigrationViewProps>) {
  const { isMobile } = useViewport();

  if (isMobile) {
    return (
      <DstMigrationViewMobile
        metrics={metrics}
        updatedSessions={updatedSessions}
        conflictGroups={conflictGroups}
        migrationStatus={migrationStatus}
        onUpdate={onUpdate}
        dstOffsetDetected={dstOffsetDetected}
      />
    );
  }

  return (
    <DstMigrationViewDesktop
      metrics={metrics}
      updatedSessions={updatedSessions}
      conflictGroups={conflictGroups}
      checkedEmptyItems={checkedEmptyItems}
      migrationStatus={migrationStatus}
      onUpdate={onUpdate}
      dstOffsetDetected={dstOffsetDetected}
    />
  );
}
