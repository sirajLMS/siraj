"use client";

import { CheckCircleOutlined } from "@mui/icons-material";
import { Chip } from "@mui/material";
import type { ReactNode } from "react";
import { DstMigrationPanelShared } from "@/frontend/common/views/dashboard/tools/dst-migration/components/__shared__/dstMigrationPanelShared";
import {
  getOnSuccessColor,
  getSuccessColor,
  getSuccessHeaderAlpha,
  getSuccessTitleColor,
} from "@/frontend/common/views/dashboard/tools/dst-migration/components/__shared__/dstMigrationPanelShared.options";
import type { DstMigrationLabels } from "@/shared/locale/types/dashboard/admin/dstMigration";

export interface UpdatedSessionsPanelSharedProps {
  readonly labels: DstMigrationLabels;
  readonly successfulCount: number;
  readonly contentPadding?: number;
  readonly children: ReactNode;
}

export function UpdatedSessionsPanelShared({
  labels,
  successfulCount,
  contentPadding,
  children,
}: Readonly<UpdatedSessionsPanelSharedProps>) {
  return (
    <DstMigrationPanelShared
      getColor={getSuccessColor}
      getOnColor={getOnSuccessColor}
      getHeaderAlpha={getSuccessHeaderAlpha}
      getTitleColor={getSuccessTitleColor}
      icon={<CheckCircleOutlined sx={{ fontSize: 18 }} />}
      title={labels.sections.updated}
      headerActions={<Chip size="small" variant="outlined" label={labels.table.sessionsCount(successfulCount)} />}
      contentPadding={contentPadding}
    >
      {children}
    </DstMigrationPanelShared>
  );
}
