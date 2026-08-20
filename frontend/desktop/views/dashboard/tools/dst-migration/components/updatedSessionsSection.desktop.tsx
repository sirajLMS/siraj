"use client";

import { CheckCircleOutlined } from "@mui/icons-material";
import { Chip } from "@mui/material";
import { DstMigrationPanelShared } from "@/frontend/common/views/dashboard/tools/dst-migration/components/__shared__/dstMigrationPanelShared";
import {
  getOnSuccessColor,
  getSuccessColor,
  getSuccessHeaderAlpha,
  getSuccessTitleColor,
} from "@/frontend/common/views/dashboard/tools/dst-migration/components/__shared__/dstMigrationPanelShared.options";
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
    <DstMigrationPanelShared
      getColor={getSuccessColor}
      getOnColor={getOnSuccessColor}
      getHeaderAlpha={getSuccessHeaderAlpha}
      getTitleColor={getSuccessTitleColor}
      icon={<CheckCircleOutlined sx={{ fontSize: 18 }} />}
      title={labels.sections.updated}
      headerActions={<Chip size="small" variant="outlined" label={labels.table.sessionsCount(successfulCount)} />}
      contentPadding={undefined}
    >
      <UpdatedSessionsDataGridDesktop labels={labels} sessions={sessions} loading={loading} />
    </DstMigrationPanelShared>
  );
}
