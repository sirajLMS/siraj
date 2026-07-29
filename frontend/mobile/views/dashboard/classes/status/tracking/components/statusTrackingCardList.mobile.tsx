"use client";

import { Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  scheduleOverviewCardShellSx,
  scheduleOverviewListCanvasSx,
} from "@/frontend/common/views/dashboard/admin/home/components/scheduleOverviewSurfaces";
import type { StatusTrackingCardListProps } from "@/frontend/common/views/dashboard/classes/status/tracking/types";
import { MobileCardListItem } from "@/frontend/mobile/components/ui/card";
import { MobileCardList, MobileSectionTitleRow } from "@/frontend/mobile/components/ui/container";
import { StatusTrackingMobileCard } from "@/frontend/mobile/views/dashboard/classes/status/tracking/components/statusTrackingMobileCard.mobile";

const StyledSectionTitle = styled(Typography)(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  fontSize: theme.typography.titleLg.fontSize,
  fontWeight: 700,
  color: theme.palette.primary.main,
  whiteSpace: "nowrap",
}));

const StyledSessionCount = styled(Box)(({ theme }) => ({
  display: "inline",
  color: theme.palette.text.secondary,
  fontWeight: 400,
  fontSize: theme.typography.bodyMd.fontSize,
  whiteSpace: "nowrap",
}));

export function StatusTrackingCardList({
  rows,
  totalSessions,
  labels,
  onActivate,
  onReschedule,
  onVerify,
}: StatusTrackingCardListProps) {
  return (
    <Box>
      <MobileSectionTitleRow
        title={
          <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, minWidth: 0 }}>
            <StyledSectionTitle>{labels.todaysSchedule}</StyledSectionTitle>
            <StyledSessionCount>({totalSessions})</StyledSessionCount>
          </Box>
        }
      />

      <MobileCardList
        rows={rows}
        getKey={row => row.id ?? ""}
        emptyMessage={labels.noEntries}
        paginationOptions={{ mode: "client" }}
        gap={0}
        layout="edge-to-edge"
        sx={scheduleOverviewListCanvasSx}
        renderItem={row => (
          <MobileCardListItem variant="edge-to-edge" sx={scheduleOverviewCardShellSx}>
            <StatusTrackingMobileCard
              row={row}
              labels={labels}
              onActivate={onActivate}
              onReschedule={onReschedule}
              onVerify={onVerify}
            />
          </MobileCardListItem>
        )}
      />
    </Box>
  );
}
