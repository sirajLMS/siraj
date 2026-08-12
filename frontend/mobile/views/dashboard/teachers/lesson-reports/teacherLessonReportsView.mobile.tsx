"use client";

import { TeacherLessonReportsViewShared } from "@/frontend/common/views/dashboard/teachers/lesson-reports/__shared__/teacherLessonReportsViewShared";
import type { TeacherLessonReportsViewModel } from "@/frontend/common/views/dashboard/teachers/lesson-reports/useTeacherLessonReportsViewModel";
import {
  MobileCardListItem,
  MobileContentStack,
  MobilePageContainer,
  MobilePageHeader,
} from "@/frontend/mobile/components/ui";

function MobileCardWrapper({ children }: Readonly<{ children: React.ReactNode }>) {
  return <MobileCardListItem variant="edge-to-edge">{children}</MobileCardListItem>;
}

function MobileContentWrapper({ children }: Readonly<{ children: React.ReactNode }>) {
  return <MobileContentStack gap={2}>{children}</MobileContentStack>;
}

export function TeacherLessonReportsMobileView(props: Readonly<TeacherLessonReportsViewModel>) {
  return (
    <TeacherLessonReportsViewShared
      {...props}
      slots={{
        PageContainer: MobilePageContainer,
        PageHeader: MobilePageHeader,
        ContentWrapper: MobileContentWrapper,
        CardWrapper: MobileCardWrapper,
      }}
      options={{
        cardMarginTop: 1,
      }}
    />
  );
}
