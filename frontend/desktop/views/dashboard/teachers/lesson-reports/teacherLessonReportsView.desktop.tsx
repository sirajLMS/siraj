"use client";

import { Box, Stack } from "@mui/material";
import { TeacherLessonReportsViewShared } from "@/frontend/common/views/dashboard/teachers/lesson-reports/__shared__/teacherLessonReportsViewShared";
import type { TeacherLessonReportsViewModel } from "@/frontend/common/views/dashboard/teachers/lesson-reports/useTeacherLessonReportsViewModel";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";

function DesktopCardWrapper({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <Box
      sx={theme => ({
        p: 2,
        borderRadius: 1,
        border: `1px solid ${theme.palette.border.light}`,
        display: "flex",
        flexDirection: "column",
        gap: 1,
      })}
    >
      {children}
    </Box>
  );
}

function DesktopContentWrapper({ children }: Readonly<{ children: React.ReactNode }>) {
  return <Stack spacing={2}>{children}</Stack>;
}

export function TeacherLessonReportsDesktopView(props: Readonly<TeacherLessonReportsViewModel>) {
  return (
    <TeacherLessonReportsViewShared
      {...props}
      slots={{
        PageContainer: DesktopPageContainer,
        PageHeader: DesktopPageHeader,
        ContentWrapper: DesktopContentWrapper,
        CardWrapper: DesktopCardWrapper,
      }}
      options={{
        cardMarginTop: 0,
      }}
    />
  );
}
