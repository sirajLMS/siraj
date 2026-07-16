"use client";

import { Box, Grid, Stack, Typography } from "@mui/material";
import { PageContainer, PageHeader } from "@/frontend/common/components/ui";
import { FutureClassCard } from "@/frontend/common/views/dashboard/teachers/futureSchedule/components/FutureClassCard";
import { ImportantNotes } from "@/frontend/common/views/dashboard/teachers/futureSchedule/components/ImportantNotes";
import { JumpToDateHeader } from "@/frontend/common/views/dashboard/teachers/futureSchedule/components/JumpToDateHeader";
import { MiniCalendar } from "@/frontend/common/views/dashboard/teachers/futureSchedule/components/MiniCalendar";
import { SupportContact } from "@/frontend/common/views/dashboard/teachers/futureSchedule/components/SupportContact";
import type { FutureScheduleViewModel } from "@/frontend/common/views/dashboard/teachers/futureSchedule/useFutureScheduleViewModel";
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
    <PageContainer>
      <PageHeader title={t.pageTitle} />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
          <JumpToDateHeader
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
              <FutureClassCard
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
            <MiniCalendar selectedDate={selectedDate} onSelectDate={onDateChange} classDates={classDates} />
            <ImportantNotes notes={notes} />
            <SupportContact contact={contact} />
          </Stack>
        </Grid>
      </Grid>
    </PageContainer>
  );
}
