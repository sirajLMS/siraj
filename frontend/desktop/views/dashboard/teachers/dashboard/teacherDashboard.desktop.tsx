"use client";

import { mergeSx } from "@/frontend/common/utils/sx/mergeSx";
import type { TeacherDashboardViewModel } from "@/frontend/common/views/dashboard/teachers/dashboard/useTeacherDashboardViewModel";
import { teacherDashboardPageContainerSx } from "@/frontend/common/views/dashboard/teachers/dashboard/utils/teacherDashboardMobileLayout";
import { DesktopPageContainer } from "@/frontend/desktop/components/ui";
import { MissedClassAlertBannerDesktop } from "@/frontend/desktop/views/dashboard/teachers/dashboard/components/missedClassAlertBanner.desktop";
import {
  TeacherDashboardHeaderSection,
  TeacherDashboardLowerSections,
  TeacherDashboardManualEntrySection,
  TeacherDashboardScheduleSection,
} from "@/frontend/desktop/views/dashboard/teachers/dashboard/teacherDashboard.parts";

export function TeacherDashboardDesktopView(props: Readonly<TeacherDashboardViewModel>) {
  const { missedAlert, labels } = props;
  return (
    <>
      {missedAlert && <MissedClassAlertBannerDesktop alert={missedAlert} labels={labels.alert} fixed />}

      <DesktopPageContainer sx={mergeSx(teacherDashboardPageContainerSx, missedAlert ? { pt: 10 } : undefined)}>
        <TeacherDashboardHeaderSection {...props} />
        <TeacherDashboardScheduleSection {...props} />
        <TeacherDashboardLowerSections {...props} />
      </DesktopPageContainer>

      <TeacherDashboardManualEntrySection {...props} />
    </>
  );
}
