"use client";

import { Box, Stack } from "@mui/material";
import { TeacherReassignmentViewShared } from "@/frontend/common/views/dashboard/teachers/reassignment/components/__shared__/teacherReassignmentViewShared";
import type { TeacherReassignmentViewSlotProps } from "@/frontend/common/views/dashboard/teachers/reassignment/types/teacherReassignmentViewShared.types";
import type { TeacherReassignmentViewModel } from "@/frontend/common/views/dashboard/teachers/reassignment/useTeacherReassignmentViewModel";
import { MobileContentStack, MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";
import { CurrentTeacherCardMobile } from "@/frontend/mobile/views/dashboard/teachers/reassignment/components/currentTeacherCard.mobile";
import { ManagementControlsCardMobile } from "@/frontend/mobile/views/dashboard/teachers/reassignment/components/managementControlsCard.mobile";
import { ReassignmentBentoGridMobile } from "@/frontend/mobile/views/dashboard/teachers/reassignment/components/reassignmentBentoGrid.mobile";
import { StudentContextCardMobile } from "@/frontend/mobile/views/dashboard/teachers/reassignment/components/studentContextCard.mobile";

function MobileLeftPanel({ children }: Readonly<{ children: React.ReactNode }>) {
  return <Stack spacing={3}>{children}</Stack>;
}

function MobileRightPanel({ children }: Readonly<{ children: React.ReactNode }>) {
  return <Box>{children}</Box>;
}

export function TeacherReassignmentViewMobile(viewModel: Readonly<TeacherReassignmentViewModel>) {
  const slots: TeacherReassignmentViewSlotProps = {
    PageContainer: MobilePageContainer,
    PageHeader: MobilePageHeader,
    ContentLayout: MobileContentStack,
    LeftPanel: MobileLeftPanel,
    RightPanel: MobileRightPanel,
    StudentContextCard: StudentContextCardMobile,
    CurrentTeacherCard: CurrentTeacherCardMobile,
    ManagementControlsCard: ManagementControlsCardMobile,
    ReassignmentBentoGrid: ReassignmentBentoGridMobile,
    statusLabelIdSuffix: "mobile",
  };

  return <TeacherReassignmentViewShared viewModel={viewModel} slots={slots} />;
}
