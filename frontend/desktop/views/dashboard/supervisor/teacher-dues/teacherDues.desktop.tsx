"use client";

import { LinearProgress } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import type {
  TeacherDueRow,
  TeacherDuesViewModel,
} from "@/frontend/common/views/dashboard/supervisor/teacher-dues/types/teacherDuesTypes";
import { DesktopAppDataGrid, DesktopPrimaryPageAction, DesktopSectionPanel } from "@/frontend/desktop/components/ui";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";
import { buildTeacherDuesColumns } from "@/frontend/desktop/views/dashboard/supervisor/teacher-dues/teacherDues.columns";

export function TeacherDuesDesktopView({
  rows,
  loading,
  markingPaid,
  canMarkPaid,
  selectedDueIds,
  labels,
  onMarkPaid,
  onSelectDues,
}: Readonly<TeacherDuesViewModel>) {
  const columns = useMemo<GridColDef<TeacherDueRow>[]>(
    () => buildTeacherDuesColumns({ labels, canMarkPaid, markingPaid, onMarkPaid }),
    [labels, markingPaid, onMarkPaid, canMarkPaid]
  );

  return (
    <DesktopPageContainer>
      <DesktopPageHeader
        title={labels.pageTitle}
        actions={
          canMarkPaid && selectedDueIds.length > 0 ? (
            <DesktopPrimaryPageAction onClick={() => onMarkPaid(selectedDueIds)} disabled={markingPaid}>
              {labels.markAsPaidButton}
            </DesktopPrimaryPageAction>
          ) : null
        }
      />

      {loading ? <LinearProgress /> : null}

      <DesktopSectionPanel contentPadding={false} sx={{ flex: 1 }}>
        <DesktopAppDataGrid<TeacherDueRow>
          rows={rows}
          columns={columns}
          getRowId={row => row.id}
          emptyMessage={labels.noPendingDues}
          loading={loading}
          autoHeight
          rowHeight={64}
          checkboxSelection={canMarkPaid}
          paginationOptions={{ mode: "client" }}
          onRowSelectionModelChange={model => {
            const selectedIds = "ids" in model ? Array.from(model.ids).map(String) : [];
            onSelectDues(selectedIds);
          }}
        />
      </DesktopSectionPanel>
    </DesktopPageContainer>
  );
}
