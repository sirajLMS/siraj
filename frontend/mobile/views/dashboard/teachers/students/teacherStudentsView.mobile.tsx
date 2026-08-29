"use client";

import {
  StudentRowCardShared,
  TeacherStudentsViewShared,
  type TeacherStudentsViewSharedListProps,
} from "@/frontend/common/views/dashboard/teachers/students/__shared__/teacherStudentsViewShared";
import type { TeacherStudentsViewModel } from "@/frontend/common/views/dashboard/teachers/students/useTeacherStudentsViewModel";
import { MobileCardListItem, MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";
import { MobileStatusBadge } from "@/frontend/mobile/components/ui/badge";
import { MobileCardList } from "@/frontend/mobile/components/ui/container/MobileCardList";
import { MobilePersonProfileLink } from "@/frontend/mobile/components/ui/display/personProfileLink";

function MobileListWrapper({
  rows,
  labels,
  emptyMessage,
  getKey,
  paginationOptions,
}: Readonly<TeacherStudentsViewSharedListProps>) {
  return (
    <MobileCardList
      rows={rows}
      renderItem={row => (
        <StudentRowCardShared
          row={row}
          labels={labels}
          RowWrapper={MobileCardListItem}
          PersonProfileLink={MobilePersonProfileLink}
          StatusBadge={MobileStatusBadge}
        />
      )}
      getKey={getKey}
      emptyMessage={emptyMessage}
      paginationOptions={paginationOptions}
    />
  );
}

export function TeacherStudentsMobileView(props: Readonly<TeacherStudentsViewModel>) {
  return (
    <TeacherStudentsViewShared
      {...props}
      slots={{
        PageContainer: MobilePageContainer,
        PageHeader: MobilePageHeader,
        RowWrapper: MobileCardListItem,
        ListWrapper: MobileListWrapper,
      }}
    />
  );
}
