import { VideocamOffOutlined } from "@mui/icons-material";
import { Box, Paper, Tooltip, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useLocale, useTranslations } from "next-intl";
import { PersonProfileLink } from "@/frontend/components/ui";
import { StatusBadge } from "@/frontend/components/ui/badge/StatusBadge";
import { AppDataGrid } from "@/frontend/components/ui/dataGrid/AppDataGrid";
import { MeetingJoinAction } from "@/frontend/components/ui/display/meetingConfig/MeetingJoinAction";
import { formatStudentDisplayId } from "@/frontend/utils/formatStudentDisplayId";
import { profileHrefForTeacher } from "@/frontend/utils/profileHref";
import type { UpcomingClassDisplay, UpcomingClassesTableProps } from "@/frontend/views/dashboard/students/status/types";
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
          {t("table.footerInfo", { id: formatStudentDisplayId(studentId) })}
        </Typography>
      </Box>
      {pendingCount > 0 ? (
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
      ) : null}
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
        {t("table.footerInfo", { id: formatStudentDisplayId(studentId) })}
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

export function UpcomingClassesTableDesktop({ classes, studentId }: Readonly<UpcomingClassesTableProps>) {
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
            label={t("table.joinSession")}
          />
        ) : (
          <Tooltip title={t("table.sessionEnded")}>
            <Box
              sx={{ display: "flex", justifyContent: "center", width: "100%", height: "100%", alignItems: "center" }}
            >
              <VideocamOffOutlined sx={theme => ({ fontSize: 20, color: theme.palette.text.disabled })} />
            </Box>
          </Tooltip>
        ),
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
      <DesktopHeader studentId={studentId} pendingCount={classes.filter(c => c.isFrozen).length} />
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
