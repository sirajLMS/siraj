"use client";

import { useAppLocale } from "@/frontend/common/providers/localeContext";
import type { UpcomingClassesTableProps } from "@/frontend/common/views/dashboard/students/status/types";
import { useStudentStatusLabels } from "@/frontend/common/views/dashboard/students/status/useStudentStatusLabels";
import { DesktopStatusBadge } from "@/frontend/desktop/components/ui/badge";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui/container";
import { DesktopAppDataGrid } from "@/frontend/desktop/components/ui/dataGrid/DesktopAppDataGrid";
import { buildUpcomingClassesColumns } from "@/frontend/desktop/views/dashboard/students/status/components/upcomingClassesTable.desktop.columns";

export function UpcomingClassesTableDesktop({ classes }: Readonly<UpcomingClassesTableProps>) {
  const t = useStudentStatusLabels();
  const locale = useAppLocale();

  const columns = buildUpcomingClassesColumns({ t, locale });

  const pendingCount = classes.filter(c => c.isFrozen).length;

  return (
    <DesktopSectionPanel
      title={t.sections.upcomingClasses}
      subTitle={t.table.footerInfo}
      actions={
        pendingCount > 0 ? (
          <DesktopStatusBadge category="classSession" status="hold" label={t.table.pendingHolds(pendingCount)} />
        ) : null
      }
      contentPadding={false}
    >
      <DesktopAppDataGrid
        rows={classes}
        columns={columns}
        rowHeight={72}
        autoHeight
        paginationOptions={{ mode: "client", pageSize: 10 }}
        disableRowSelectionOnClick
        sx={theme => ({
          border: "none",
          width: "100%",
          "& .MuiDataGrid-columnHeader": {
            backgroundColor: theme.palette.background.default,
            color: theme.palette.onSurfaceVariant,
            typography: "labelSm",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          },
        })}
      />
    </DesktopSectionPanel>
  );
}
