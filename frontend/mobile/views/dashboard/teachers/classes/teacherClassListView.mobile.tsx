"use client";

import {
  type TeacherClassListActionSlots,
  TeacherClassListCardContent,
  TeacherClassListErrorNotice,
  type TeacherClassRow,
} from "@/frontend/common/views/dashboard/teachers/classes/__shared__/teacherClassListViewShared";
import type { TeacherClassListViewModel } from "@/frontend/common/views/dashboard/teachers/classes/useTeacherClassListViewModel";
import {
  MobileCardList,
  MobileCardListItem,
  MobileContentInset,
  MobilePageContainer,
  MobilePageHeader,
} from "@/frontend/mobile/components/ui";
import { MobileMeetingJoinAction } from "@/frontend/mobile/components/ui/display/meetingConfig";
import { ClassSessionActionButtonMobile } from "@/frontend/mobile/views/dashboard/schedule/alerts/components/classSessionActionButton.mobile";

const MOBILE_SLOTS: TeacherClassListActionSlots = {
  MeetingJoinAction: MobileMeetingJoinAction,
  ClassSessionActionButton: ClassSessionActionButtonMobile,
};

/**
 * Mobile tier of the teacher class list: `MobileCardList` of
 * `MobileCardListItem` cards using the shared card contract.
 */
export function TeacherClassListMobileView({
  rows,
  loading,
  error,
  labels,
  locale,
  handleViewClassAudit,
}: Readonly<TeacherClassListViewModel>) {
  return (
    <MobilePageContainer>
      <MobilePageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} />
      {error ? (
        <MobileContentInset>
          <TeacherClassListErrorNotice message={labels.failedToLoad} />
        </MobileContentInset>
      ) : (
        <MobileCardList<TeacherClassRow>
          rows={rows}
          getKey={row => row.id ?? row.studentName ?? ""}
          loading={loading}
          emptyMessage={labels.noClasses}
          paginationOptions={{ mode: "client" }}
          renderItem={row => (
            <MobileCardListItem>
              <TeacherClassListCardContent
                row={row}
                labels={labels}
                locale={locale}
                onViewClassAudit={handleViewClassAudit}
                slots={MOBILE_SLOTS}
              />
            </MobileCardListItem>
          )}
        />
      )}
    </MobilePageContainer>
  );
}
