"use client";

import { WarningOutlined } from "@mui/icons-material";
import { Alert, Box, Grid, useMediaQuery, useTheme } from "@mui/material";
import { useTranslations } from "next-intl";
import { PageContainer, PageHeader } from "@/frontend/components/ui";
import { CurrentTeacherCard } from "@/frontend/views/dashboard/teachers/reassignment/components/CurrentTeacherCard";
import { ManagementControlsCard } from "@/frontend/views/dashboard/teachers/reassignment/components/ManagementControlsCard";
import { ReassignmentBentoGrid } from "@/frontend/views/dashboard/teachers/reassignment/components/ReassignmentBentoGrid";
import { StudentContextCard } from "@/frontend/views/dashboard/teachers/reassignment/components/StudentContextCard";
import type { TeacherReassignmentViewProps } from "@/frontend/views/dashboard/teachers/reassignment/types";

export function TeacherReassignmentView({
  student,
  currentTeacherName,
  teachers,
  isSubmitting,
  onReassign,
  onStatusChange,
  onCancel,
}: Readonly<TeacherReassignmentViewProps>) {
  const t = useTranslations("dashboard.teacherReassignment");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const breadcrumbs = [
    { label: t("breadcrumbs.dashboard"), href: "/dashboard" },
    { label: t("breadcrumbs.parentManagement"), href: "/teachers" },
    { label: t("breadcrumbs.teacherReassignment"), active: true },
  ];

  return (
    <PageContainer>
      {!isMobile && <PageHeader title={t("pageTitle")} subtitle={t("pageSubtitle")} breadcrumbs={breadcrumbs} />}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <StudentContextCard student={student} />
            <CurrentTeacherCard
              currentTeacherName={currentTeacherName}
              teacherId={student.primaryTeacherId ?? undefined}
            />
          </Box>
        </Grid>

        <Grid size={{ xs: 12, lg: 8 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Alert
              severity="error"
              icon={<WarningOutlined />}
              sx={theme => ({
                backgroundColor: theme.palette.errorContainer,
                color: theme.palette.onErrorContainer,
                borderRadius: 2,
                "& .MuiAlert-icon": {
                  color: theme.palette.error.main,
                },
                fontWeight: 700,
              })}
            >
              {t("warning")}
            </Alert>

            <ManagementControlsCard
              teachers={teachers}
              currentStatus={student.status}
              studentId={student.id}
              version={student.version}
              isSubmitting={isSubmitting}
              onReassign={onReassign}
              onStatusChange={onStatusChange}
              onCancel={onCancel}
            />

            <ReassignmentBentoGrid
              studentId={student.id}
              lastUpdated={student.updatedAt}
              pendingNotificationCount={0}
            />
          </Box>
        </Grid>
      </Grid>
    </PageContainer>
  );
}
