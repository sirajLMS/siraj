import { VideocamOffOutlined } from "@mui/icons-material";
import { Box, Paper, Tooltip, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import type { ComponentProps, ComponentType } from "react";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { classHref, profileHrefForTeacher } from "@/frontend/common/utils/profileHref";
import type {
  UpcomingClassDisplay,
  UpcomingClassesTableProps,
} from "@/frontend/common/views/dashboard/students/status/types";
import { useStudentStatusLabels } from "@/frontend/common/views/dashboard/students/status/useStudentStatusLabels";
import { DesktopStatusBadge } from "@/frontend/desktop/components/ui/badge";
import { DesktopAppDataGrid } from "@/frontend/desktop/components/ui/dataGrid/DesktopAppDataGrid";
import { DesktopClassProfileLinkCell } from "@/frontend/desktop/components/ui/display/classProfileLink/ClassProfileLinkCell.desktop";
import { DesktopMeetingJoinAction } from "@/frontend/desktop/components/ui/display/meetingConfig";
import { DesktopPersonProfileLinkCell } from "@/frontend/desktop/components/ui/display/personProfileLink/PersonProfileLinkCell.desktop";
import { getLatnLocaleTag } from "@/shared/lib/locale-tag";
import { isJoinableClassInstance } from "@/shared/lib/meeting/isJoinableByExecutionState";

type ProfileLinkCellProps = ComponentProps<typeof DesktopClassProfileLinkCell>;
type ProfileLinkCellComponent = ComponentType<ProfileLinkCellProps>;

type ProfileLinkColumnConfig = {
  readonly field: string;
  readonly headerName: string;
  readonly flex: number;
  readonly minWidth: number;
  readonly avatarSize: number;
  readonly Cell: ProfileLinkCellComponent;
  readonly href: (row: UpcomingClassDisplay) => string | null | undefined;
  readonly name: (row: UpcomingClassDisplay) => string;
  readonly avatarUrl: (row: UpcomingClassDisplay) => string | null | undefined;
};

function profileLinkColumn(config: ProfileLinkColumnConfig): GridColDef<UpcomingClassDisplay> {
  const { Cell, avatarSize, href, name, avatarUrl } = config;
  return {
    field: config.field,
    headerName: config.headerName,
    flex: config.flex,
    minWidth: config.minWidth,
    renderCell: params => (
      <Cell
        href={href(params.row)}
        name={name(params.row)}
        avatarUrl={avatarUrl(params.row)}
        avatarSize={avatarSize}
        typographyVariant="bodyMd"
        fontWeight={700}
      />
    ),
  };
}

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

function DesktopHeader({ pendingCount }: Readonly<{ pendingCount: number }>) {
  const t = useStudentStatusLabels();
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
          {t.sections.upcomingClasses}
        </Typography>
        <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
          {t.table.footerInfo}
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
            {t.table.pendingHolds(pendingCount)}
          </Typography>
        </Box>
      ) : null}
    </Box>
  );
}

function DesktopFooter() {
  const t = useStudentStatusLabels();
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
        {t.table.footerInfo}
      </Typography>
    </Box>
  );
}

export function UpcomingClassesTableDesktop({ classes }: Readonly<UpcomingClassesTableProps>) {
  const t = useStudentStatusLabels();
  const locale = useAppLocale();

  const columns: GridColDef<UpcomingClassDisplay>[] = [
    profileLinkColumn({
      field: "subjectName",
      headerName: t.table.subject,
      flex: 1.4,
      minWidth: 180,
      avatarSize: 40,
      Cell: DesktopClassProfileLinkCell,
      href: row => classHref(row.id),
      name: row => row.subjectName?.trim() || "—",
      avatarUrl: row => row.avatarUrl,
    }),
    profileLinkColumn({
      field: "instructor",
      headerName: t.table.instructor,
      flex: 1.3,
      minWidth: 180,
      avatarSize: 36,
      Cell: DesktopPersonProfileLinkCell,
      href: row => profileHrefForTeacher({ teacherId: row.teacherId }),
      name: row => row.instructor,
      avatarUrl: row => row.teacherAvatarUrl,
    }),
    {
      field: "scheduledStartAt",
      headerName: t.table.dateTime,
      flex: 1.3,
      minWidth: 180,
      renderCell: params => (
        <Box sx={{ py: 1.5 }}>
          <Typography variant="bodyMd" sx={{ fontWeight: 700 }}>
            {formatDateTime(locale, params.row.scheduledStartAt)}
          </Typography>
          <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
            {`${formatTime(locale, params.row.scheduledStartAt)} - ${formatTime(locale, params.row.scheduledEndAt)}`}
          </Typography>
        </Box>
      ),
    },
    {
      field: "durationMinutes",
      headerName: t.table.duration,
      flex: 0.7,
      minWidth: 100,
      renderCell: params => (
        <Typography variant="bodyMd">{t.table.minutesShort(params.row.durationMinutes)}</Typography>
      ),
    },
    {
      field: "isFrozen",
      headerName: t.table.holdStatus,
      flex: 0.9,
      minWidth: 130,
      renderCell: params => (
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
            {params.row.isFrozen ? t.table.frozen : t.table.active}
          </Typography>
        </Box>
      ),
    },
    {
      field: "join",
      headerName: t.table.join,
      width: 88,
      sortable: false,
      align: "center",
      headerAlign: "center",
      renderCell: params =>
        isJoinableClassInstance(params.row.executionState, params.row.outcome, { isFrozen: params.row.isFrozen }) ? (
          <DesktopMeetingJoinAction
            variant="icon"
            joinUrl={params.row.meetingJoinUrl}
            meeting={params.row.effectiveMeeting}
            emptyRole="parent"
            label={t.table.joinSession}
          />
        ) : (
          <Tooltip title={t.table.sessionEnded}>
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
      headerName: t.table.status,
      flex: 1,
      minWidth: 140,
      renderCell: params => (
        <DesktopStatusBadge
          category="classInstance"
          status={params.row.executionState}
          label={params.row.isFrozen ? t.table.frozen.toUpperCase() : params.row.executionState}
        />
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
        width: "100%",
      })}
    >
      <DesktopHeader pendingCount={classes.filter(c => c.isFrozen).length} />
      <DesktopAppDataGrid
        rows={classes}
        columns={columns}
        rowHeight={72}
        autoHeight
        paginationOptions={{ mode: "client", pageSize: 10 }}
        disableRowSelectionOnClick
        sx={theme => ({
          border: "none",
          width: "100%",
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
      <DesktopFooter />
    </Paper>
  );
}
