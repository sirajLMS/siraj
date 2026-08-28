"use client";

import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import {
  type TeacherLessonReportsSectionPanelSlotProps,
  TeacherLessonReportsViewShared,
} from "@/frontend/common/views/dashboard/teachers/lesson-reports/__shared__/teacherLessonReportsViewShared";
import type {
  TeacherLessonReportRow,
  TeacherLessonReportsViewModel,
} from "@/frontend/common/views/dashboard/teachers/lesson-reports/useTeacherLessonReportsViewModel";
import { buildTeacherLessonReportColumns } from "@/frontend/common/views/dashboard/teachers/lesson-reports/utils";
import { DesktopAppDataGrid, DesktopSectionPanel } from "@/frontend/desktop/components/ui";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";

function DesktopReportsSectionPanel({ actions, children }: Readonly<TeacherLessonReportsSectionPanelSlotProps>) {
  return (
    <DesktopSectionPanel contentPadding={false} actions={actions}>
      {children}
    </DesktopSectionPanel>
  );
}

export function TeacherLessonReportsDesktopView(props: Readonly<TeacherLessonReportsViewModel>) {
  const { rows, loading, labelsBySection, locale, resolveStatusLabel } = props;
  const { shell, columns: columnLabels } = labelsBySection;

  const columns = useMemo<GridColDef<TeacherLessonReportRow>[]>(
    () => buildTeacherLessonReportColumns({ labels: columnLabels, locale, resolveStatusLabel }),
    [columnLabels, locale, resolveStatusLabel]
  );

  return (
    <TeacherLessonReportsViewShared
      {...props}
      slots={{
        PageContainer: DesktopPageContainer,
        PageHeader: DesktopPageHeader,
        SectionPanel: DesktopReportsSectionPanel,
      }}
    >
      <DesktopAppDataGrid<TeacherLessonReportRow>
        rows={rows}
        columns={columns}
        getRowId={row => row.id ?? row.classInstanceId ?? ""}
        emptyMessage={shell.emptyMessage}
        loading={loading}
        autoHeight
        rowHeight={56}
        paginationOptions={{ mode: "client" }}
      />
    </TeacherLessonReportsViewShared>
  );
}
