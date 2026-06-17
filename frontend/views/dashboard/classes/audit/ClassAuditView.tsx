"use client";

import { Box, Chip, Grid, Typography, useMediaQuery, useTheme } from "@mui/material";
import { FilterButton, PageContainer, PageHeader, PrimaryPageAction } from "@/frontend/components/ui";
import type { ClassAuditData } from "@/frontend/stores/mockClassAuditStore";
import { AdminNoteCard } from "./AdminNoteCard";
import { ClassAuditDetailsCard } from "./ClassAuditDetailsCard";
import { CommunicationLogCard } from "./CommunicationLogCard";
import { RegisteredStudentsSection } from "./RegisteredStudentsSection";
import { VenueLocationCard } from "./VenueLocationCard";

export interface ClassAuditLabels {
  readonly breadcrumbs: {
    readonly dashboard: string;
    readonly schedules: string;
    readonly current: string;
  };
  readonly pageTitle: string;
  readonly mobileTitle: string;
  readonly generateReport: string;
  readonly editClass: string;
  readonly courseCode: string;
  readonly teacher: string;
  readonly originalDate: string;
  readonly rescheduledDate: string;
  readonly timeSlot: string;
  readonly venue: string;
  readonly auditTrailTitle: string;
  readonly statusRescheduled: string;
  readonly classDetails: string;
  readonly registeredStudents: {
    readonly title: string;
    readonly exportList: string;
    readonly studentName: string;
    readonly idNumber: string;
    readonly attendanceStatus: string;
    readonly actions: string;
    readonly student: string;
    readonly status: string;
    readonly viewAll: string;
    readonly pending: string;
    readonly present: string;
    readonly absent: string;
    readonly noEntries: string;
  };
  readonly venueLocation: {
    readonly title: string;
    readonly capacity: string;
    readonly viewMap: string;
    readonly capacityBadge: string;
  };
  readonly communicationLog: {
    readonly title: string;
    readonly resendNotifications: string;
  };
  readonly adminNote: {
    readonly title: string;
    readonly titleMobile: string;
    readonly lastUpdated: string;
    readonly update: string;
    readonly edit: string;
  };
}

interface ClassAuditViewProps {
  readonly audit: ClassAuditData;
  readonly labels: ClassAuditLabels;
  readonly onGenerateReport: () => void;
  readonly onEditClass: () => void;
  readonly onExportStudents: () => void;
  readonly onViewStudent: (id: string) => void;
  readonly onViewMap: () => void;
  readonly onResendNotifications: () => void;
  readonly onUpdateAdminNote: () => void;
  readonly onEditAdminNote: () => void;
}

export function ClassAuditView({
  audit,
  labels,
  onGenerateReport,
  onEditClass,
  onExportStudents,
  onViewStudent,
  onViewMap,
  onResendNotifications,
  onUpdateAdminNote,
  onEditAdminNote,
}: ClassAuditViewProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const detailsLabels = {
    courseCode: labels.courseCode,
    teacher: labels.teacher,
    originalDate: labels.originalDate,
    rescheduledDate: labels.rescheduledDate,
    timeSlot: labels.timeSlot,
    venue: labels.venue,
    auditTrailTitle: labels.auditTrailTitle,
    statusRescheduled: labels.statusRescheduled,
    classDetails: labels.classDetails,
  };

  return (
    <PageContainer>
      {isMobile ? (
        <Box sx={{ mb: 3 }}>
          <Typography
            sx={theme => ({
              fontFamily: '"Hanken Grotesk", sans-serif',
              fontSize: "24px",
              fontWeight: 600,
              color: theme.palette.primary.main,
              lineHeight: 1.2,
              mb: 1,
            })}
          >
            {audit.className}
          </Typography>
          <Chip
            label={labels.statusRescheduled}
            size="small"
            sx={theme => ({
              bgcolor: theme.palette.primaryContainer,
              color: theme.palette.onPrimaryContainer,
              fontFamily: '"Inter", sans-serif',
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            })}
          />
        </Box>
      ) : (
        <PageHeader
          title={labels.pageTitle}
          breadcrumbs={[
            { label: labels.breadcrumbs.dashboard, href: "/dashboard" },
            { label: labels.breadcrumbs.schedules, href: "/schedule-search" },
            { label: labels.breadcrumbs.current, current: true },
          ]}
          actions={
            <>
              <FilterButton
                id="audit-generate-report-btn"
                onClick={onGenerateReport}
                sx={theme => ({
                  bgcolor: theme.palette.background.paper,
                  "&:hover": { bgcolor: theme.palette.action.selected, borderColor: theme.palette.primary.dark },
                })}
              >
                {labels.generateReport}
              </FilterButton>
              <PrimaryPageAction id="audit-edit-class-btn" onClick={onEditClass}>
                {labels.editClass}
              </PrimaryPageAction>
            </>
          }
        />
      )}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }} sx={{ order: { xs: 1, lg: 1 } }}>
          <ClassAuditDetailsCard audit={audit} labels={detailsLabels} />
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }} sx={{ order: { xs: 2, lg: 2 } }}>
          <VenueLocationCard venue={audit.venueInfo} labels={labels.venueLocation} onViewMap={onViewMap} />
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }} sx={{ order: { xs: 3, lg: 4 } }}>
          <Box sx={{ mt: { lg: 0 } }}>
            <CommunicationLogCard
              entries={audit.communications}
              labels={labels.communicationLog}
              onResend={onResendNotifications}
            />
          </Box>
        </Grid>

        <Grid size={{ xs: 12, lg: 8 }} sx={{ order: { xs: 4, lg: 3 } }}>
          <RegisteredStudentsSection
            students={audit.students}
            registeredCount={audit.registeredStudentCount}
            labels={labels.registeredStudents}
            onExport={onExportStudents}
            onViewStudent={onViewStudent}
          />
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }} sx={{ order: { xs: 5, lg: 5 } }}>
          <AdminNoteCard
            note={audit.adminNote}
            labels={labels.adminNote}
            onUpdate={onUpdateAdminNote}
            onEdit={onEditAdminNote}
          />
        </Grid>
      </Grid>
    </PageContainer>
  );
}
