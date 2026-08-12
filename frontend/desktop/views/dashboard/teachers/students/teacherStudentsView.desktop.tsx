"use client";

import { Box } from "@mui/material";
import { TeacherStudentsViewShared } from "@/frontend/common/views/dashboard/teachers/students/__shared__/teacherStudentsViewShared";
import type { TeacherStudentsViewModel } from "@/frontend/common/views/dashboard/teachers/students/useTeacherStudentsViewModel";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui";

function DesktopRowWrapper({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <Box
      sx={theme => ({
        p: 2,
        borderRadius: 1,
        border: `1px solid ${theme.palette.border.light}`,
        backgroundColor: theme.palette.surfaceContainerLowest,
      })}
    >
      {children}
    </Box>
  );
}

export function TeacherStudentsDesktopView(props: Readonly<TeacherStudentsViewModel>) {
  return (
    <TeacherStudentsViewShared
      {...props}
      slots={{
        PageContainer: DesktopPageContainer,
        PageHeader: DesktopPageHeader,
        RowWrapper: DesktopRowWrapper,
      }}
    />
  );
}
