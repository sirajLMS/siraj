"use client";

import { Box, Grid } from "@mui/material";
import { TeacherReassignmentViewShared } from "@/frontend/common/views/dashboard/teachers/reassignment/components/__shared__/teacherReassignmentViewShared";
import type { TeacherReassignmentViewSlotProps } from "@/frontend/common/views/dashboard/teachers/reassignment/types/teacherReassignmentViewShared.types";
import type { TeacherReassignmentViewModel } from "@/frontend/common/views/dashboard/teachers/reassignment/useTeacherReassignmentViewModel";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui";
import { CurrentTeacherCardDesktop } from "@/frontend/desktop/views/dashboard/teachers/reassignment/components/currentTeacherCard.desktop";
import { ManagementControlsCardDesktop } from "@/frontend/desktop/views/dashboard/teachers/reassignment/components/managementControlsCard.desktop";
import { ReassignmentBentoGridDesktop } from "@/frontend/desktop/views/dashboard/teachers/reassignment/components/reassignmentBentoGrid.desktop";
import { StudentContextCardDesktop } from "@/frontend/desktop/views/dashboard/teachers/reassignment/components/studentContextCard.desktop";

function DesktopContentLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <Grid container spacing={3}>
      {children}
    </Grid>
  );
}

function DesktopLeftPanel({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <Grid size={{ xs: 12, lg: 4 }}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>{children}</Box>
    </Grid>
  );
}

function DesktopRightPanel({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <Grid size={{ xs: 12, lg: 8 }}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>{children}</Box>
    </Grid>
  );
}

export function TeacherReassignmentViewDesktop(viewModel: Readonly<TeacherReassignmentViewModel>) {
  const breadcrumbs = [
    { label: viewModel.labels.breadcrumbs.dashboard, href: "/dashboard" },
    { label: viewModel.labels.breadcrumbs.parentManagement, href: "/teachers" },
    { label: viewModel.labels.breadcrumbs.teacherReassignment, active: true },
  ];

  const slots: TeacherReassignmentViewSlotProps = {
    PageContainer: DesktopPageContainer,
    PageHeader: DesktopPageHeader,
    ContentLayout: DesktopContentLayout,
    LeftPanel: DesktopLeftPanel,
    RightPanel: DesktopRightPanel,
    StudentContextCard: StudentContextCardDesktop,
    CurrentTeacherCard: CurrentTeacherCardDesktop,
    ManagementControlsCard: ManagementControlsCardDesktop,
    ReassignmentBentoGrid: ReassignmentBentoGridDesktop,
    statusLabelIdSuffix: "desktop",
    breadcrumbs,
  };

  return <TeacherReassignmentViewShared viewModel={viewModel} slots={slots} />;
}
