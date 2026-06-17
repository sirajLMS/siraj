import { CalendarTodayOutlined, PersonOutlined } from "@mui/icons-material";
import { Box, Button, Paper, Typography, useMediaQuery, useTheme } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useTranslations } from "next-intl";
import { AppDataGrid } from "@/frontend/components/ui/AppDataGrid";
import { StatusBadge } from "@/frontend/components/ui/StatusBadge";
import type { UpcomingClass } from "@/frontend/stores/mockStudentStatusStore";

interface UpcomingClassesTableProps {
  readonly classes: readonly UpcomingClass[];
  readonly studentId: string;
}

function UpcomingClassesMobile({ classes }: Readonly<{ classes: readonly UpcomingClass[] }>) {
  const t = useTranslations("dashboard.studentStatus");

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="titleLg" sx={theme => ({ color: theme.palette.primary.main, fontWeight: 700 })}>
          {t("sections.upcomingClasses").split(" Schedule")[0]}
        </Typography>
        <Button
          sx={theme => ({
            color: theme.palette.primary.main,
            fontWeight: 700,
            typography: "labelMd",
          })}
        >
          {t("actions.viewAll")}
        </Button>
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {classes.map(cls => (
          <Box
            key={cls.id}
            sx={theme => ({
              bgcolor: theme.palette.background.paper,
              borderRadius: "xl",
              p: 2.5,
              boxShadow: theme.palette.shadow.card,
              borderLeft: `4px solid ${theme.palette.primary.main}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            })}
          >
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Typography variant="bodyLg" sx={{ fontWeight: 700 }}>
                {cls.subject}
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
                <Typography variant="bodyMd">{cls.instructor}</Typography>
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
                  {cls.date.split(",")[0]}, {cls.date.split(" ")[1]} • {cls.time.split(" -")[0]}
                </Typography>
              </Box>
            </Box>
            <Box
              sx={theme => ({
                bgcolor: theme.palette.secondaryContainer,
                color: theme.palette.onSecondaryContainer,
                px: 1,
                py: 0.5,
                borderRadius: 1,
                fontSize: "10px",
                fontWeight: 700,
              })}
            >
              {cls.status.toUpperCase()}
            </Box>
          </Box>
        ))}
      </Box>
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
        bgcolor: theme.palette.background.default,
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
          bgcolor: theme.palette.primaryContainer,
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
        bgcolor: theme.palette.background.default,
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

function UpcomingClassesDesktop({ classes, studentId }: Readonly<UpcomingClassesTableProps>) {
  const t = useTranslations("dashboard.studentStatus");

  const columns: GridColDef<UpcomingClass>[] = [
    {
      field: "subject",
      headerName: t("table.subjectInstructor"),
      flex: 1.5,
      renderCell: params => (
        <RenderCellWrapper primary={params.row.subject} secondary={params.row.instructor} primaryBold />
      ),
    },
    {
      field: "date",
      headerName: t("table.dateTime"),
      flex: 1.2,
      renderCell: params => <RenderCellWrapper primary={params.row.date} secondary={params.row.time} />,
    },
    {
      field: "room",
      headerName: t("table.roomLink"),
      flex: 1,
      renderCell: params => (
        <Box sx={{ py: 1.5 }}>
          <Box
            sx={theme => ({
              bgcolor: theme.palette.background.default,
              px: 1,
              py: 0.5,
              borderRadius: 1,
              display: "inline-block",
            })}
          >
            <Typography variant="labelMd" sx={{ fontWeight: 600 }}>
              {params.row.room}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      field: "status",
      headerName: t("table.status"),
      flex: 1,
      renderCell: params => {
        let statusVariant: "active" | "blocked" | "pending" = "pending";
        if (params.row.status === "scheduled") statusVariant = "active";
        else if (params.row.status === "suspended") statusVariant = "blocked";

        return (
          <Box sx={{ py: 1.5 }}>
            <StatusBadge category="classSession" status={statusVariant} label={params.row.status.toUpperCase()} />
          </Box>
        );
      },
    },
  ];

  return (
    <Paper
      elevation={0}
      sx={theme => ({
        bgcolor: theme.palette.background.paper,
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
            bgcolor: theme.palette.background.default,
            color: theme.palette.onSurfaceVariant,
            fontSize: "10px",
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

  if (isMobile) {
    return <UpcomingClassesMobile classes={classes} />;
  }

  return <UpcomingClassesDesktop classes={classes} studentId={studentId} />;
}
