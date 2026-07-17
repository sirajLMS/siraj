"use client";

import { Box, Grid, Stack, Typography } from "@mui/material";
import type { FutureScheduleViewModel } from "@/frontend/common/views/dashboard/teachers/futureSchedule/useFutureScheduleViewModel";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui";
import { FutureClassCardDesktop } from "@/frontend/desktop/views/dashboard/teachers/futureSchedule/components/futureClassCard.desktop";
import { ImportantNotesDesktop } from "@/frontend/desktop/views/dashboard/teachers/futureSchedule/components/importantNotes.desktop";
import { JumpToDateHeaderDesktop } from "@/frontend/desktop/views/dashboard/teachers/futureSchedule/components/jumpToDateHeader.desktop";
import { MiniCalendarDesktop } from "@/frontend/desktop/views/dashboard/teachers/futureSchedule/components/miniCalendar.desktop";
import { SupportContactDesktop } from "@/frontend/desktop/views/dashboard/teachers/futureSchedule/components/supportContact.desktop";
import { useAppTranslation } from "@/shared/locale";

export function FutureScheduleViewDesktop({
  classes,
  leaveQuotaUsed,
  leaveQuotaTotal,
  totalClasses,
  onRequestLeave,
  selectedDate,
  onDateChange,
  notes,
  contact,
  classDates,
}: Readonly<FutureScheduleViewModel>) {
  const t = useAppTranslation().dashboardTranslations.teacherFutureSchedule;

  return (
    <DesktopPageContainer>
      <DesktopPageHeader title={t.pageTitle} />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
          <JumpToDateHeaderDesktop
            leaveQuotaUsed={leaveQuotaUsed}
            leaveQuotaTotal={leaveQuotaTotal}
            totalClasses={totalClasses}
            selectedDate={selectedDate}
            onDateChange={onDateChange}
          />
        </Grid>

        <Grid size={{ xs: 12, lg: 8 }}>
          <Stack spacing={2}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
              <Typography variant="headlineMd" sx={theme => ({ color: theme.palette.primary.main })}>
                {t.futureClasses}
              </Typography>
              <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box
                    sx={theme => ({
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor: theme.palette.status.active,
                    })}
                  />
                  <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                    {t.available}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box
                    sx={theme => ({
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor: theme.palette.status.blocked,
                    })}
                  />
                  <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                    {t.regular}
                  </Typography>
                </Box>
              </Stack>
            </Box>

            {classes.map(item => (
              <FutureClassCardDesktop
                key={item.id ?? ""}
                item={item}
                onRequestLeave={() => {
                  if (item.id) onRequestLeave(item.id);
                }}
              />
            ))}
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={3}>
            <MiniCalendarDesktop selectedDate={selectedDate} onSelectDate={onDateChange} classDates={classDates} />
            <ImportantNotesDesktop notes={notes} />
            <SupportContactDesktop contact={contact} />
          </Stack>
        </Grid>
      </Grid>
    </DesktopPageContainer>
  );
}
