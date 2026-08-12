"use client";

import { Box, Grid, Stack, Typography } from "@mui/material";
import type { ComponentType, ReactNode } from "react";
import type {
  FutureClassCardProps,
  JumpToDateHeaderProps,
} from "@/frontend/common/views/dashboard/teachers/futureSchedule/types";
import type { FutureScheduleViewModel } from "@/frontend/common/views/dashboard/teachers/futureSchedule/useFutureScheduleViewModel";

export interface FutureScheduleViewSharedSlots {
  readonly PageContainer: ComponentType<{ readonly children: ReactNode }>;
  readonly PageHeader: ComponentType<{ readonly title: string }>;
  readonly JumpToDateHeader: ComponentType<Readonly<JumpToDateHeaderProps>>;
  readonly FutureClassCard: ComponentType<Readonly<FutureClassCardProps>>;
  readonly ClassListWrapper: ComponentType<{ readonly children: ReactNode }>;
  readonly MiniCalendar: ComponentType<{
    readonly selectedDate: FutureScheduleViewModel["selectedDate"];
    readonly onSelectDate: FutureScheduleViewModel["onDateChange"];
    readonly classDates: FutureScheduleViewModel["classDates"];
    readonly labels: FutureScheduleViewModel["labelsBySection"]["schedule"];
  }>;
  readonly ImportantNotes: ComponentType<{
    readonly notes: FutureScheduleViewModel["notes"];
    readonly labels: FutureScheduleViewModel["labelsBySection"]["schedule"];
  }>;
  readonly SupportContact: ComponentType<{
    readonly contact: FutureScheduleViewModel["contact"];
    readonly onContactAdmin: FutureScheduleViewModel["onSupportContact"];
    readonly supportContactLabel: string;
    readonly contactAdminLabel: string;
  }>;
}

export interface FutureScheduleViewSharedOptions {
  readonly mainGridSize: Record<string, number>;
  readonly sidebarGridSize: Record<string, number>;
  readonly legendSecondColorLabel: "regular" | "reScheduled";
  readonly sidebarStackSx?: Record<string, unknown>;
}

export type FutureScheduleViewSharedProps = Readonly<FutureScheduleViewModel> & {
  readonly slots: FutureScheduleViewSharedSlots;
  readonly options: FutureScheduleViewSharedOptions;
};

function ClassListWrapperPassthrough({ children }: Readonly<{ children: ReactNode }>) {
  return <>{children}</>;
}

export function FutureScheduleViewShared({
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
  slots,
  options,
}: FutureScheduleViewSharedProps) {
  const { schedule: labels, supportContact } = labelsBySection;

  const jumpToDateProps: JumpToDateHeaderProps = {
    leaveQuotaUsed,
    leaveQuotaTotal,
    totalClasses,
    selectedDate,
    onDateChange,
    labels,
  };

  const legendSecondColorLabel = labels[options.legendSecondColorLabel];

  return (
    <slots.PageContainer>
      <slots.PageHeader title={labels.pageTitle} />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
          <slots.JumpToDateHeader {...jumpToDateProps} />
        </Grid>

        <Grid size={options.mainGridSize}>
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
                    {legendSecondColorLabel}
                  </Typography>
                </Box>
              </Stack>
            </Box>

            <slots.ClassListWrapper>
              {classes.map(item => (
                <slots.FutureClassCard
                  key={item.id ?? ""}
                  item={item}
                  labels={labels}
                  onRequestLeave={() => {
                    if (item.id) void onRequestLeave(item.id);
                  }}
                />
              ))}
            </slots.ClassListWrapper>
          </Stack>
        </Grid>

        <Grid size={options.sidebarGridSize}>
          <Stack spacing={3} sx={options.sidebarStackSx}>
            <slots.MiniCalendar
              selectedDate={selectedDate}
              onSelectDate={onDateChange}
              classDates={classDates}
              labels={labels}
            />
            <slots.ImportantNotes notes={notes} labels={labels} />
            <slots.SupportContact
              contact={contact}
              onContactAdmin={onSupportContact}
              supportContactLabel={supportContact.supportContact}
              contactAdminLabel={supportContact.contactAdmin}
            />
          </Stack>
        </Grid>
      </Grid>
    </slots.PageContainer>
  );
}

export { ClassListWrapperPassthrough };
