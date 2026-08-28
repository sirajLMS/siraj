"use client";

import { useMemo } from "react";
import { buildTeacherClassListColumns } from "@/frontend/common/views/dashboard/teachers/classes/__shared__/teacherClassListColumns";
import {
  type TeacherClassListActionSlots,
  TeacherClassListErrorNotice,
  type TeacherClassRow,
} from "@/frontend/common/views/dashboard/teachers/classes/__shared__/teacherClassListViewShared";
import type { TeacherClassListViewModel } from "@/frontend/common/views/dashboard/teachers/classes/useTeacherClassListViewModel";
import {
  DesktopAppDataGrid,
  DesktopPageContainer,
  DesktopPageHeader,
  DesktopSectionPanel,
} from "@/frontend/desktop/components/ui";
import { DesktopMeetingJoinAction } from "@/frontend/desktop/components/ui/display/meetingConfig";
import { ClassSessionActionButtonDesktop } from "@/frontend/desktop/views/dashboard/schedule/alerts/components/classSessionActionButton.desktop";

const DESKTOP_SLOTS: TeacherClassListActionSlots = {
  MeetingJoinAction: DesktopMeetingJoinAction,
  ClassSessionActionButton: ClassSessionActionButtonDesktop,
};

/**
 * Desktop tier of the teacher class list: a `DesktopAppDataGrid` (columns from the
 * shared contract) inside a `DesktopSectionPanel` with grid-flush content.
 */
export function TeacherClassListDesktopView({
  rows,
  loading,
  error,
  labels,
  locale,
  handleViewClassAudit,
}: Readonly<TeacherClassListViewModel>) {
  const columns = useMemo(
    () =>
      buildTeacherClassListColumns({
        labels,
        locale,
        onViewClassAudit: handleViewClassAudit,
        slots: DESKTOP_SLOTS,
      }),
    [labels, locale, handleViewClassAudit]
  );

  return (
    <DesktopPageContainer>
      <DesktopPageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} />
      {error ? (
        <TeacherClassListErrorNotice message={labels.failedToLoad} />
      ) : (
        <DesktopSectionPanel contentPadding={false}>
          <DesktopAppDataGrid<TeacherClassRow>
            rows={rows}
            columns={columns}
            getRowId={row => row.id ?? ""}
            loading={loading}
            autoHeight
            ariaLabel={labels.pageTitle}
            emptyMessage={labels.noClasses}
            paginationOptions={{ mode: "client" }}
          />
        </DesktopSectionPanel>
      )}
    </DesktopPageContainer>
  );
}
