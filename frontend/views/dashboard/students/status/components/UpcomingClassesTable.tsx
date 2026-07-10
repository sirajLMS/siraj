import { CalendarTodayOutlined, PersonOutlined } from "@mui/icons-material";
import { Box, Button, Paper, Typography, useMediaQuery, useTheme } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useLocale, useTranslations } from "next-intl";
import { useCallback } from "react";
import { PersonProfileLink } from "@/frontend/components/ui";
import { StatusBadge } from "@/frontend/components/ui/badge/StatusBadge";
import { AppDataGrid } from "@/frontend/components/ui/dataGrid/AppDataGrid";
import { MeetingJoinAction } from "@/frontend/components/ui/display/meetingConfig/MeetingJoinAction";
import { profileHrefForTeacher, studentProfileTabHref } from "@/frontend/utils/profileHref";
import { ProfileRestrictedSection } from "@/frontend/views/dashboard/profile/shared/sections/ProfileRestrictedSection";
import { useStudentFieldAccess } from "@/frontend/views/dashboard/students/profile/useStudentFieldAccess";
import type { UpcomingClassDisplay, UpcomingClassesTableProps } from "@/frontend/views/dashboard/students/status/types";
import { useRouter } from "@/shared/i18n/routing";
import { getLatnLocaleTag } from "@/shared/lib/locale-tag";
import { isJoinableClassInstance } from "@/shared/lib/meeting/isJoinableByExecutionState";

function formatDateTime(locale: string, dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString(getLatnLocaleTag(locale), { weekday: "short", month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

function formatTime(locale: string, dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleTimeString(getLatnLocaleTag(locale), { hour: "2-digit", minute: "2-digit" });
  } catch {
    return dateStr;
  }
}

function UpcomingClassesMobile({ classes, studentId }: Readonly<UpcomingClassesTableProps>) {
  const t = useTranslations("dashboard.studentStatus");
  const locale = useLocale();
  const router = useRouter();

  const handleViewAll = useCallback(() => {
    router.push(studentProfileTabHref(studentId, "history"));
  }, [router, studentId]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="titleLg" sx={theme => ({ color: theme.palette.primary.main, fontWeight: 700 })}>
          {t("sections.upcomingClasses").split(" Schedule")[0]}
        </Typography>
        <Button
          onClick={handleViewAll}
          sx={theme => ({
            color: theme.palette.primary.main,
            fontWeight: 700,
            typography: "labelMd",
          })}
        >
          {t("actions.viewAll")}
        </Button>
      </Box>
      {classes.length === 0 ? (
        <Typography
          variant="bodyMd"
          sx={theme => ({ color: theme.palette.onSurfaceVariant, textAlign: "center", py: 4 })}
        >
          {t("table.noUpcomingClasses")}
        </Typography>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {classes.map(cls => (
            <Box
              key={cls.id}
              sx={theme => ({
                backgroundColor: theme.palette.background.paper,
                borderRadius: "xl",
                p: 2.5,
                boxShadow: theme.palette.shadow.card,
                borderLeft: `4px solid ${cls.isFrozen ? theme.palette.error.main : theme.palette.primary.main}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                opacity: cls.isFrozen ? 0.7 : 1,
              })}
            >
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Typography variant="bodyLg" sx={{ fontWeight: 700 }}>
                  {formatDateTime(locale, cls.scheduledStartAt)}
                </Typography>
                <Box
                  sx={theme => ({
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    color: theme.palette.onSurfaceVariant,
                  })}
                >
                  <PersonOutlined sx={{ fontSize: 18 }} />
                  <PersonProfileLink
                    href={profileHrefForTeacher({ teacherId: cls.teacherId })}
                    name={cls.instructor}
                    showAvatar={false}
                    typographyVariant="bodyMd"
                    fontWeight={400}
                  />
                </Box>
                <Box
                  sx={theme => ({
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    color: theme.palette.onSurfaceVariant,
                  })}
                >
                  <CalendarTodayOutlined sx={{ fontSize: 18 }} />
                  <Typography variant="bodyMd">
                    {formatTime(locale, cls.scheduledStartAt)} - {formatTime(locale, cls.scheduledEndAt)}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1 }}>
                <StatusBadge
                  category="classInstance"
                  status={cls.executionState}
                  label={cls.isFrozen ? t("table.frozen").toUpperCase() : cls.executionState}
                />
                {isJoinableClassInstance(cls.executionState, cls.outcome, { isFrozen: cls.isFrozen }) ? (
                  <MeetingJoinAction
                    variant="icon"
                    joinUrl={cls.meetingJoinUrl}
                    meeting={cls.effectiveMeeting}
                    emptyRole="parent"
                  />
                ) : null}
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

function RenderCellWrapper({
  primary,
  secondary,
  primaryBold = false,
}: Readonly<{ primary: string; secondary: string; primaryBold?: boolean }>) {
  return (
    <Box sx={{ py: 1.5 }}>
      <Typography variant="bodyMd" sx={{ fontWeight: primaryBold ? 700 : 400 }}>
        {primary}
      </Typography>
      <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
        {secondary}
      </Typography>
    </Box>
  );
}

function DesktopHeader({ studentId, pendingCount }: Readonly<{ studentId: string; pendingCount: number }>) {
  const t = useTranslations("dashboard.studentStatus");
  return (
    <Box
      sx={theme => ({
        px: 3,
        py: 2.5,
        borderBottom: `1px solid ${theme.palette.border.main}`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: theme.palette.background.default,
      })}
    >
      <Box>
        <Typography variant="titleLg" sx={theme => ({ color: theme.palette.primary.main, fontWeight: 700 })}>
          {t("sections.upcomingClasses")}
        </Typography>
        <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
          {t("table.footerInfo", { id: studentId })}
        </Typography>
      </Box>
      <Box
        sx={theme => ({
          backgroundColor: theme.palette.primaryContainer,
          color: theme.palette.onPrimaryContainer,
          px: 1.5,
          py: 0.5,
          borderRadius: 1,
        })}
      >
        <Typography variant="labelMd" sx={{ fontWeight: 700 }}>
          {t("table.pendingHolds", { count: pendingCount })}
        </Typography>
      </Box>
    </Box>
  );
}

function DesktopFooter({ studentId }: Readonly<{ studentId: string }>) {
  const t = useTranslations("dashboard.studentStatus");
  return (
    <Box
      sx={theme => ({
        px: 3,
        py: 2,
        backgroundColor: theme.palette.background.default,
        borderTop: `1px solid ${theme.palette.border.main}`,
        textAlign: "right",
      })}
    >
      <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant, fontStyle: "italic" })}>
        {t("table.footerInfo", { id: studentId })}
      </Typography>
    </Box>
  );
}

function InstructorCell({ row, minutesLabel }: Readonly<{ row: UpcomingClassDisplay; minutesLabel: string }>) {
  const instructorHref = profileHrefForTeacher({ teacherId: row.teacherId });

  return (
    <Box sx={{ py: 1.5 }}>
      {instructorHref ? (
        <PersonProfileLink
          href={instructorHref}
          name={row.instructor}
          showAvatar={false}
          typographyVariant="bodyMd"
          fontWeight={700}
        />
      ) : (
        <Typography variant="bodyMd" sx={{ fontWeight: 700 }}>
          {row.instructor}
        </Typography>
      )}
      <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
        {minutesLabel}
      </Typography>
    </Box>
  );
}

function UpcomingClassesDesktop({ classes, studentId }: Readonly<UpcomingClassesTableProps>) {
  const t = useTranslations("dashboard.studentStatus");
  const locale = useLocale();

  const columns: GridColDef<UpcomingClassDisplay>[] = [
    {
      field: "instructor",
      headerName: t("table.subjectInstructor"),
      flex: 1.5,
      renderCell: params => (
        <InstructorCell
          row={params.row}
          minutesLabel={t("table.minutesShort", { minutes: params.row.durationMinutes })}
        />
      ),
    },
    {
      field: "scheduledStartAt",
      headerName: t("table.dateTime"),
      flex: 1.2,
      renderCell: params => (
        <RenderCellWrapper
          primary={formatDateTime(locale, params.row.scheduledStartAt)}
          secondary={`${formatTime(locale, params.row.scheduledStartAt)} - ${formatTime(locale, params.row.scheduledEndAt)}`}
        />
      ),
    },
    {
      field: "isFrozen",
      headerName: t("table.holdStatus"),
      flex: 1,
      renderCell: params => (
        <Box sx={{ py: 1.5 }}>
          <Box
            sx={theme => ({
              backgroundColor: params.row.isFrozen ? theme.palette.errorContainer : theme.palette.background.default,
              color: params.row.isFrozen ? theme.palette.onErrorContainer : theme.palette.onSurfaceVariant,
              px: 1,
              py: 0.5,
              borderRadius: 1,
              display: "inline-block",
            })}
          >
            <Typography variant="labelMd" sx={{ fontWeight: 600 }}>
              {params.row.isFrozen ? t("table.frozen") : t("table.active")}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      field: "join",
      headerName: "",
      width: 56,
      sortable: false,
      align: "center",
      headerAlign: "center",
      renderCell: params =>
        isJoinableClassInstance(params.row.executionState, params.row.outcome, { isFrozen: params.row.isFrozen }) ? (
          <MeetingJoinAction
            variant="icon"
            joinUrl={params.row.meetingJoinUrl}
            meeting={params.row.effectiveMeeting}
            emptyRole="parent"
          />
        ) : null,
    },
    {
      field: "executionState",
      headerName: t("table.status"),
      flex: 1,
      renderCell: params => (
        <Box sx={{ py: 1.5 }}>
          <StatusBadge
            category="classInstance"
            status={params.row.executionState}
            label={params.row.isFrozen ? t("table.frozen").toUpperCase() : params.row.executionState}
          />
        </Box>
      ),
    },
  ];

  return (
    <Paper
      elevation={0}
      sx={theme => ({
        backgroundColor: theme.palette.background.paper,
        borderRadius: "xl",
        boxShadow: theme.palette.shadow.card,
        border: `1px solid ${theme.palette.border.main}`,
        overflow: "hidden",
      })}
    >
      <DesktopHeader studentId={studentId} pendingCount={classes.length} />
      <AppDataGrid
        rows={classes}
        columns={columns}
        rowHeight={72}
        hideFooter
        disableRowSelectionOnClick
        sx={theme => ({
          border: "none",
          "& .MuiDataGrid-columnHeader": {
            backgroundColor: theme.palette.background.default,
            color: theme.palette.onSurfaceVariant,
            typography: "labelSm",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          },
        })}
      />
      <DesktopFooter studentId={studentId} />
    </Paper>
  );
}

export function UpcomingClassesTable({ classes, studentId }: Readonly<UpcomingClassesTableProps>) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const t = useTranslations("dashboard.studentStatus");
  const { canView } = useStudentFieldAccess();

  if (!canView("student_schedule")) {
    return <ProfileRestrictedSection title={t("sections.upcomingClasses")} />;
  }

  if (isMobile) {
    return <UpcomingClassesMobile classes={classes} studentId={studentId} />;
  }

  return <UpcomingClassesDesktop classes={classes} studentId={studentId} />;
}
