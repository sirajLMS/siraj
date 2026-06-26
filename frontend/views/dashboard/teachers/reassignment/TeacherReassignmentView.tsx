"use client";

import { WarningOutlined } from "@mui/icons-material";
import { Alert, Box, Grid, useMediaQuery, useTheme } from "@mui/material";
import { useTranslations } from "next-intl";
import { PageContainer, PageHeader } from "@/frontend/components/ui";
import type { TeacherDirectoryRow } from "@/frontend/stores/mockTeachersStore";
import type { StudentDirectoryRowExtended } from "@/frontend/views/dashboard/students/home/types";
import { CurrentTeacherCard } from "./components/CurrentTeacherCard";
import { ManagementControlsCard } from "./components/ManagementControlsCard";
import { ReassignmentBentoGrid } from "./components/ReassignmentBentoGrid";
import { StudentContextCard } from "./components/StudentContextCard";

interface TeacherReassignmentViewProps {
  readonly student: StudentDirectoryRowExtended;
  readonly currentTeacherName: string;
  readonly teachers: readonly TeacherDirectoryRow[];
}

export function TeacherReassignmentView({
  student,
  currentTeacherName,
  teachers,
}: Readonly<TeacherReassignmentViewProps>) {
  const t = useTranslations("dashboard.teacherReassignment");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const breadcrumbs = [
    { label: t("breadcrumbs.dashboard"), href: "/dashboard" },
    { label: t("breadcrumbs.parentManagement"), href: "/parents" },
    { label: t("breadcrumbs.teacherReassignment"), active: true },
  ];

  return (
    <PageContainer>
      {!isMobile && <PageHeader title={t("pageTitle")} subtitle={t("pageSubtitle")} breadcrumbs={breadcrumbs} />}

      <Grid container spacing={3}>
        {/* Left Column: Student Context */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <StudentContextCard student={student} />
            <CurrentTeacherCard currentTeacherName={currentTeacherName} />
          </Box>
        </Grid>

        {/* Right Column: Reassignment Form */}
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

            <ManagementControlsCard teachers={teachers} currentStatus={student.accountStatus} />

            <ReassignmentBentoGrid />
          </Box>
        </Grid>
      </Grid>
    </PageContainer>
  );
}
