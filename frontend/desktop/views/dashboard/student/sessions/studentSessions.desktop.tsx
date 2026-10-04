"use client";

import { useMemo } from "react";
import { StudentViewShellShared } from "@/frontend/common/views/dashboard/student/__shared__/studentViewShellShared";
import type { StudentSessionsViewModel } from "@/frontend/common/views/dashboard/student/sessions/useStudentSessionsViewModel";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui/container";
import { DesktopAppDataGrid } from "@/frontend/desktop/components/ui/dataGrid/DesktopAppDataGrid";
import { SessionsFilters } from "@/frontend/desktop/views/dashboard/student/sessions/sessionsFilters.desktop";
import { buildStudentSessionsColumns } from "@/frontend/desktop/views/dashboard/student/sessions/studentSessions.columns";

export function StudentSessionsDesktopView({
  filteredSessions,
  subjectOptions,
  statusOptions,
  subjectFilter,
  statusFilter,
  monthLabel,
  selectedDay,
  canGoNext,
  labels,
  locale,
  loading,
  onOpenMeetingUrl,
  onPrevMonth,
  onNextMonth,
  onSubjectFilterChange,
  onStatusFilterChange,
}: Readonly<StudentSessionsViewModel>) {
  const columns = useMemo(
    () => buildStudentSessionsColumns(labels, locale, onOpenMeetingUrl),
    [labels, locale, onOpenMeetingUrl]
  );

  const tableRows = useMemo(() => {
    if (selectedDay == null) return filteredSessions;
    return filteredSessions.filter(s => s.dayOfMonth === selectedDay);
  }, [filteredSessions, selectedDay]);

  return (
    <StudentViewShellShared
      variant="desktop"
      pageTitle={labels.pageTitle}
      loading={loading && filteredSessions.length === 0}
      loadingMessage={labels.loadingMessage}
      monthLabel={monthLabel}
      canGoNext={canGoNext}
      monthNavigatorLabels={labels}
      onPrevMonth={onPrevMonth}
      onNextMonth={onNextMonth}
    >
      <DesktopSectionPanel
        contentPadding={false}
        sx={{ borderRadius: 0 }}
        actions={
          <SessionsFilters
            subjectFilter={subjectFilter}
            statusFilter={statusFilter}
            subjectOptions={subjectOptions}
            statusOptions={statusOptions}
            labels={labels}
            onSubjectFilterChange={onSubjectFilterChange}
            onStatusFilterChange={onStatusFilterChange}
          />
        }
      >
        <DesktopAppDataGrid
          rows={[...tableRows]}
          columns={columns}
          loading={loading}
          emptyMessage={labels.noHistory}
          getRowId={row => row.id}
          autoHeight
          rowHeight={72}
          ariaLabel={labels.pageTitle}
          paginationOptions={{ mode: "client" }}
          sx={{ borderRadius: 0 }}
        />
      </DesktopSectionPanel>
    </StudentViewShellShared>
  );
}
