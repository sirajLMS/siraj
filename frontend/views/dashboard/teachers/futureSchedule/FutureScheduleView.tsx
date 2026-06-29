"use client";

import { Box, Grid, Stack, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useTranslations } from "next-intl";
import { PageContainer } from "@/frontend/components/ui/PageContainer";
import { PageHeader } from "@/frontend/components/ui/PageHeader";
import type { FutureClass } from "@/frontend/graphql/generated/gql/graphql-types";
import { FutureClassCard } from "./components/FutureClassCard";
import { ImportantNotes } from "./components/ImportantNotes";
import { JumpToDateHeader } from "./components/JumpToDateHeader";
import { MiniCalendar } from "./components/MiniCalendar";
import { SupportContact } from "./components/SupportContact";
import type { FutureScheduleViewProps } from "./types";

export function FutureScheduleView({
  classes,
  leaveQuotaUsed,
  leaveQuotaTotal,
  totalClasses,
  onRequestLeave,
  selectedDate,
  onDateChange,
  notes,
  contact,
  onViewMaterials,
}: Readonly<FutureScheduleViewProps>) {
  const t = useTranslations("dashboard.teacherFutureSchedule");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("lg"));

  return (
    <PageContainer>
      <PageHeader title={t("pageTitle")} />

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
                {t("futureClasses")}
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
                    {t("available")}
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
                    {t("reScheduled")}
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
                onViewMaterials={onViewMaterials}
              />
            ))}
          </Stack>
        </Grid>

        {!isMobile && (
          <Grid size={{ xs: 12, lg: 4 }}>
            <Stack spacing={3}>
              <MiniCalendar
                selectedDate={selectedDate}
                onSelectDate={onDateChange}
                classDates={classes
                  .filter((c: FutureClass) => c.scheduledDate)
                  .map((c: FutureClass) => c.scheduledDate as string)}
              />
              <ImportantNotes notes={notes} />
              <SupportContact contact={contact} />
            </Stack>
          </Grid>
        )}

        {isMobile && (
          <Grid size={{ xs: 12 }}>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <MiniCalendar
                selectedDate={selectedDate}
                onSelectDate={onDateChange}
                classDates={classes
                  .filter((c: FutureClass) => c.scheduledDate)
                  .map((c: FutureClass) => c.scheduledDate as string)}
              />
              <ImportantNotes notes={notes} />
              <SupportContact contact={contact} />
            </Stack>
          </Grid>
        )}
      </Grid>
    </PageContainer>
  );
}
