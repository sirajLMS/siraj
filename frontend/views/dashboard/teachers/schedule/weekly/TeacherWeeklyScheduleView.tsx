"use client";

import { Box, Typography } from "@mui/material";
import { createLazyView } from "@/frontend/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/components/ui/container/ResponsiveViewSwitch";
import type { TeacherWeeklyScheduleViewProps } from "@/frontend/views/dashboard/teachers/schedule/weekly/types";

interface ScheduleFooterLegendProps {
  readonly bookedClassLabel: string;
  readonly availableSlotLabel: string;
  readonly lastUpdatedText: string;
}

export function ScheduleFooterLegend({
  bookedClassLabel,
  availableSlotLabel,
  lastUpdatedText,
}: Readonly<ScheduleFooterLegendProps>) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        justifyContent: "space-between",
        alignItems: { xs: "flex-start", md: "center" },
        gap: 2,
        mt: 2,
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "row", gap: 3, alignItems: "center" }}>
        <Box sx={{ display: "flex", flexDirection: "row", gap: 1, alignItems: "center" }}>
          <Box
            sx={theme => ({
              width: 12,
              height: 12,
              backgroundColor: theme.palette.primary.main,
              borderRadius: 0.5,
            })}
          />
          <Typography variant="labelUppercase" sx={theme => ({ color: theme.palette.text.secondary })}>
            {bookedClassLabel}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", flexDirection: "row", gap: 1, alignItems: "center" }}>
          <Box
            sx={theme => ({
              width: 12,
              height: 12,
              border: `1px solid ${theme.palette.border.light}`,
              borderRadius: 0.5,
            })}
          />
          <Typography variant="labelUppercase" sx={theme => ({ color: theme.palette.text.secondary })}>
            {availableSlotLabel}
          </Typography>
        </Box>
      </Box>
      <Typography variant="caption" sx={theme => ({ color: theme.palette.text.disabled })}>
        {lastUpdatedText}
      </Typography>
    </Box>
  );
}

const lazyViews = createLazyView<TeacherWeeklyScheduleViewProps>(
  () =>
    import("@/frontend/views/dashboard/teachers/schedule/weekly/teacherWeeklyScheduleView.mobile").then(m => ({
      default: m.TeacherWeeklyScheduleViewMobile,
    })),
  () =>
    import("@/frontend/views/dashboard/teachers/schedule/weekly/teacherWeeklyScheduleView.desktop").then(m => ({
      default: m.TeacherWeeklyScheduleViewDesktop,
    }))
);

export default function TeacherWeeklyScheduleView(props: Readonly<TeacherWeeklyScheduleViewProps>) {
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={props} />;
}
