"use client";

import { Box, Grid, Stack, Typography } from "@mui/material";
import type { FutureScheduleViewModel } from "@/frontend/common/views/dashboard/teachers/futureSchedule/useFutureScheduleViewModel";
import { MobileCardList, MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";
import { FutureClassCardMobile } from "@/frontend/mobile/views/dashboard/teachers/futureSchedule/components/futureClassCard.mobile";
import { ImportantNotesMobile } from "@/frontend/mobile/views/dashboard/teachers/futureSchedule/components/importantNotes.mobile";
import { JumpToDateHeaderMobile } from "@/frontend/mobile/views/dashboard/teachers/futureSchedule/components/jumpToDateHeader.mobile";
import { MiniCalendarMobile } from "@/frontend/mobile/views/dashboard/teachers/futureSchedule/components/miniCalendar.mobile";
import { SupportContactMobile } from "@/frontend/mobile/views/dashboard/teachers/futureSchedule/components/supportContact.mobile";

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
  onSupportContact,
  labelsBySection,
}: Readonly<FutureScheduleViewModel>) {
  const { schedule: labels, supportContact } = labelsBySection;

  return (
    <MobilePageContainer>
      <MobilePageHeader title={labels.pageTitle} />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
          <JumpToDateHeaderMobile
            leaveQuotaUsed={leaveQuotaUsed}
            leaveQuotaTotal={leaveQuotaTotal}
            totalClasses={totalClasses}
            selectedDate={selectedDate}
            onDateChange={onDateChange}
            labels={labels}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Stack spacing={2}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
              <Typography variant="headlineMd" sx={theme => ({ color: theme.palette.primary.main })}>
                {labels.futureClasses}
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
                    {labels.available}
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
                    {labels.reScheduled}
                  </Typography>
                </Box>
              </Stack>
            </Box>

            <MobileCardList
              rows={classes}
              getKey={item => item.id ?? ""}
              paginationOptions={{ mode: "client" }}
              layout="edge-to-edge"
              renderItem={item => (
                <FutureClassCardMobile
                  item={item}
                  labels={labels}
                  onRequestLeave={() => {
                    if (item.id) onRequestLeave(item.id);
                  }}
                />
              )}
            />
          </Stack>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <MiniCalendarMobile
              selectedDate={selectedDate}
              onSelectDate={onDateChange}
              classDates={classDates}
              labels={labels}
            />
            <ImportantNotesMobile notes={notes} labels={labels} />
            <SupportContactMobile
              contact={contact}
              onContactAdmin={onSupportContact}
              supportContactLabel={supportContact.supportContact}
              contactAdminLabel={supportContact.contactAdmin}
            />
          </Stack>
        </Grid>
      </Grid>
    </MobilePageContainer>
  );
}
