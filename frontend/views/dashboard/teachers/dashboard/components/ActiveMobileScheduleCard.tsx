import { Box, Paper, Typography } from "@mui/material";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import type { TeacherScheduleRow } from "@/frontend/stores/teacherDashboardTypes";
import type { TeacherDashboardLabels } from "../types/teacherDashboardLabels";
import { SessionActivateButton } from "./SessionActivateButton";
import { TeacherActiveSessionControls } from "./TeacherActiveSessionControls";

export function ActiveMobileScheduleCard({
  row,
  labels,
  onActivate,
  onStartSession,
  onMarkAbsent,
  onRequestLeave,
}: {
  readonly row: TeacherScheduleRow;
  readonly labels: TeacherDashboardLabels;
  readonly onActivate?: (id: string) => void;
  readonly onStartSession?: (id: string) => void;
  readonly onMarkAbsent?: (id: string) => void;
  readonly onRequestLeave?: (id: string) => void;
}) {
  const isLive = row.isLive === true;

  return (
    <Paper
      variant="outlined"
      sx={theme => ({
        p: 2.5,
        borderColor: isLive ? theme.palette.header : theme.palette.border.light,
        borderLeftWidth: isLive ? 4 : 1,
        boxShadow: isLive ? theme.palette.shadow.card : undefined,
      })}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Box>
          {isLive && (
            <Typography
              sx={{ typography: "labelUppercase", color: theme => theme.palette.error.main, fontWeight: 700 }}
            >
              {labels.activeControls.liveNow}
            </Typography>
          )}
          <Typography sx={{ typography: "titleLg" }}>{row.courseTitle ?? row.classId}</Typography>
          {row.locationLabel && (
            <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
              {row.locationLabel}
            </Typography>
          )}
        </Box>
        <Box sx={{ textAlign: "right" }}>
          <Typography sx={{ typography: "bodyLg", fontWeight: 700 }}>{row.timeRange}</Typography>
          {row.durationMinutes && (
            <Typography sx={{ typography: "labelMd", color: theme => theme.palette.text.secondary }}>
              {labels.schedule.durationValue.replace("{minutes}", String(row.durationMinutes))}
            </Typography>
          )}
        </Box>
      </Box>

      {isLive ? (
        <Box sx={{ pt: 2, borderTop: theme => `1px solid ${theme.palette.border.light}` }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography sx={{ typography: "labelMd", color: theme => theme.palette.text.secondary }}>
              {labels.activeControls.sessionControls}
            </Typography>
            <Box sx={{ display: "flex", gap: 1.5 }}>
              <TeacherActiveSessionControls
                labels={labels.activeControls}
                onStart={() => onStartSession?.(row.id)}
                onMarkAbsent={() => onMarkAbsent?.(row.id)}
                onRequestLeave={() => onRequestLeave?.(row.id)}
              />
            </Box>
          </Box>
        </Box>
      ) : (
        <Box sx={{ width: "100%" }}>
          <RequirePermission permissions={[AppPermission.SessionActivateClass]}>
            <SessionActivateButton
              disabled={!row.activateEnabled}
              isConnecting={row.status === "connecting"}
              activateLabel={labels.actions.activateSession}
              connectingLabel={labels.actions.connecting}
              onActivate={() => onActivate?.(row.id)}
            />
          </RequirePermission>
        </Box>
      )}
    </Paper>
  );
}
