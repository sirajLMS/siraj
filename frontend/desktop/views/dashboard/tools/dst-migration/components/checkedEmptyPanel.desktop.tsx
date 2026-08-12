"use client";

import { CheckOutlined, ReportProblemOutlined } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import { DstMigrationPanelShared } from "@/frontend/common/views/dashboard/tools/dst-migration/components/__shared__/dstMigrationPanelShared";
import {
  getOnWarningColor,
  getWarningColor,
  getWarningHeaderAlpha,
  getWarningTitleColor,
} from "@/frontend/common/views/dashboard/tools/dst-migration/components/__shared__/dstMigrationPanelShared.options";
import type { CheckedEmptyItem } from "@/frontend/common/views/dashboard/tools/dst-migration/dst-migration.types";
import type { DstMigrationLabels } from "@/shared/locale/types/dashboard/admin/dstMigration";

interface Props {
  readonly labels: DstMigrationLabels;
  readonly items: readonly CheckedEmptyItem[];
}

export function CheckedEmptyPanelDesktop({ labels, items }: Readonly<Props>) {
  return (
    <DstMigrationPanelShared
      getColor={getWarningColor}
      getOnColor={getOnWarningColor}
      getHeaderAlpha={getWarningHeaderAlpha}
      getTitleColor={getWarningTitleColor}
      icon={<ReportProblemOutlined sx={{ fontSize: 18 }} />}
      title={labels.sections.checkedEmpty}
      headerActions={undefined}
      contentPadding={undefined}
    >
      <Box component="ul" sx={{ p: 3, m: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 2 }}>
        {items.map(item => (
          <Box component="li" key={item.id} sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
            <CheckOutlined sx={theme => ({ color: theme.palette.warning.main, mt: 0.25 })} />
            <Box>
              <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.primary.main })}>
                {item.studentName}
              </Typography>
              <Typography variant="labelMd" sx={theme => ({ color: theme.palette.text.secondary })}>
                {item.reason}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </DstMigrationPanelShared>
  );
}
