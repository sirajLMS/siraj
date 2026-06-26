"use client";

import { Alert, Box, Grid, Stack, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useTranslations } from "next-intl";
import { PageContainer } from "@/frontend/components/ui/PageContainer";
import { PageHeader } from "@/frontend/components/ui/PageHeader";
import type { FutureClass } from "@/frontend/graphql/generated/gql/graphql-types";
import { FutureClassCard } from "./components/FutureClassCard";
import { ImportantNotes } from "./components/ImportantNotes";
import { JumpToDateHeader } from "./components/JumpToDateHeader";
import { MiniCalendar } from "./components/MiniCalendar";
import { SupportContact } from "./components/SupportContact";

interface FutureScheduleViewProps {
  readonly classes: readonly FutureClass[];
  readonly leaveQuotaUsed: number;
  readonly leaveQuotaTotal: number;
  readonly totalClasses: number;
  readonly onRequestLeave: (classInstanceId: string) => Promise<void>;
  readonly leaveError: string | null;
  readonly onDismissError: () => void;
}

export function FutureScheduleView({
  classes,
  leaveQuotaUsed,
  leaveQuotaTotal,
  totalClasses,
  onRequestLeave,
  leaveError,
  onDismissError,
}: Readonly<FutureScheduleViewProps>) {
  const t = useTranslations("dashboard.teacherFutureSchedule");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("lg"));

  return (
    <PageContainer>
      <PageHeader title={t("pageTitle")} />

      <Grid container spacing={3}>
        {/* Top Header Section */}
        <Grid size={{ xs: 12 }}>
          <JumpToDateHeader
            leaveQuotaUsed={leaveQuotaUsed}
            leaveQuotaTotal={leaveQuotaTotal}
            totalClasses={totalClasses}
          />
        </Grid>

        {leaveError && (
          <Grid size={{ xs: 12 }}>
            <Alert severity="error" onClose={onDismissError}>
              {leaveError}
            </Alert>
          </Grid>
        )}

        {/* Main Content & Sidebar */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Stack spacing={2}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
              <Typography variant="headlineMd" sx={theme => ({ color: theme.palette.primary.main })}>
                {t("futureClasses")}
              </Typography>
              <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box
                    sx={theme => ({ width: 8, height: 8, borderRadius: "50%", backgroundColor: theme.palette.status.active })}
                  />
                  <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                    {t("available")}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box
                    sx={theme => ({ width: 8, height: 8, borderRadius: "50%", backgroundColor: theme.palette.status.blocked })}
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
              />
            ))}
          </Stack>
        </Grid>

        {!isMobile && (
          <Grid size={{ xs: 12, lg: 4 }}>
            <Stack spacing={3}>
              <MiniCalendar />
              <ImportantNotes />
              <SupportContact />
            </Stack>
          </Grid>
        )}

        {isMobile && (
          <Grid size={{ xs: 12 }}>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <MiniCalendar />
              <ImportantNotes />
              <SupportContact />
            </Stack>
          </Grid>
        )}
      </Grid>
    </PageContainer>
  );
}
