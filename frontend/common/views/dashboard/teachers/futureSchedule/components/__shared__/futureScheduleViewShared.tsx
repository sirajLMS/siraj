"use client";

import { Box, Grid, Stack, Typography } from "@mui/material";
import type { ComponentType, ReactNode } from "react";
import type {
  FutureClassCardProps,
  JumpToDateHeaderProps,
} from "@/frontend/common/views/dashboard/teachers/futureSchedule/types";
import type { FutureScheduleViewModel } from "@/frontend/common/views/dashboard/teachers/futureSchedule/useFutureScheduleViewModel";
import { ScheduleLegend } from "@/frontend/common/views/dashboard/teachers/schedule/__shared__/teacherScheduleLegendShared";

type FutureClassItem = FutureClassCardProps["item"];

/**
 * List-ownership contract for the future-class collection: the tier wrapper
 * receives the rows plus stable key/render closures and decides how the list
 * is materialized (mobile: paginated `MobileCardList`; desktop: plain stack).
 */
export interface FutureClassListWrapperProps {
  readonly rows: readonly FutureClassItem[];
  readonly getKey: (item: FutureClassItem) => string;
  readonly renderItem: (item: FutureClassItem) => ReactNode;
}

interface FutureScheduleViewSharedSlots {
  readonly PageContainer: ComponentType<{ readonly children: ReactNode }>;
  readonly PageHeader: ComponentType<{ readonly title: string }>;
  readonly JumpToDateHeader: ComponentType<Readonly<JumpToDateHeaderProps>>;
  readonly FutureClassCard: ComponentType<Readonly<FutureClassCardProps>>;
  readonly ClassListWrapper: ComponentType<FutureClassListWrapperProps>;
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

interface FutureScheduleViewSharedOptions {
  readonly mainGridSize: Record<string, number>;
  readonly sidebarGridSize: Record<string, number>;
  readonly legendSecondColorLabel: "regular" | "reScheduled";
  readonly sidebarStackSx?: Record<string, unknown>;
}

export type FutureScheduleViewSharedProps = Readonly<FutureScheduleViewModel> & {
  readonly slots: FutureScheduleViewSharedSlots;
  readonly options: FutureScheduleViewSharedOptions;
};

function getFutureClassKey(item: FutureClassItem): string {
  return item.id ?? "";
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
              <ScheduleLegend
                items={[
                  {
                    key: "available",
                    label: labels.available,
                    swatch: { kind: "dot", color: theme => theme.palette.status.active },
                  },
                  {
                    key: "second",
                    label: legendSecondColorLabel,
                    swatch: { kind: "dot", color: theme => theme.palette.status.blocked },
                  },
                ]}
                spacing={2}
              />
            </Box>

            <slots.ClassListWrapper
              rows={classes}
              getKey={getFutureClassKey}
              renderItem={item => (
                <slots.FutureClassCard
                  item={item}
                  labels={labels}
                  onRequestLeave={() => {
                    if (item.id) void onRequestLeave(item.id);
                  }}
                />
              )}
            />
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
