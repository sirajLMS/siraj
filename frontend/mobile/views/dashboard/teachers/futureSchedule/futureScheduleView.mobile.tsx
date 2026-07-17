"use client";

import { Box, Grid, Stack, Typography } from "@mui/material";
import type { FutureScheduleViewModel } from "@/frontend/common/views/dashboard/teachers/futureSchedule/useFutureScheduleViewModel";
import { MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";
import { FutureClassCardMobile } from "@/frontend/mobile/views/dashboard/teachers/futureSchedule/components/futureClassCard.mobile";
import { ImportantNotesMobile } from "@/frontend/mobile/views/dashboard/teachers/futureSchedule/components/importantNotes.mobile";
import { JumpToDateHeaderMobile } from "@/frontend/mobile/views/dashboard/teachers/futureSchedule/components/jumpToDateHeader.mobile";
import { MiniCalendarMobile } from "@/frontend/mobile/views/dashboard/teachers/futureSchedule/components/miniCalendar.mobile";
import { SupportContactMobile } from "@/frontend/mobile/views/dashboard/teachers/futureSchedule/components/supportContact.mobile";
import { useAppTranslation } from "@/shared/locale";

export function FutureScheduleViewMobile({
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
    <MobilePageContainer>
      <MobilePageHeader title={t.pageTitle} />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
          <JumpToDateHeaderMobile
            leaveQuotaUsed={leaveQuotaUsed}
            leaveQuotaTotal={leaveQuotaTotal}
            totalClasses={totalClasses}
            selectedDate={selectedDate}
            onDateChange={onDateChange}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
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
                    {t.reScheduled}
                  </Typography>
                </Box>
              </Stack>
            </Box>

            {classes.map(item => (
              <FutureClassCardMobile
                key={item.id ?? ""}
                item={item}
                onRequestLeave={() => {
                  if (item.id) onRequestLeave(item.id);
                }}
              />
            ))}
          </Stack>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <MiniCalendarMobile selectedDate={selectedDate} onSelectDate={onDateChange} classDates={classDates} />
            <ImportantNotesMobile notes={notes} />
            <SupportContactMobile contact={contact} />
          </Stack>
        </Grid>
      </Grid>
    </MobilePageContainer>
  );
}
