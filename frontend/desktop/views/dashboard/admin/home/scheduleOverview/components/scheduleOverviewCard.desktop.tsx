"use client";

import { Paper } from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  ScheduleOverviewCard as CommonScheduleOverviewCard,
  type ScheduleOverviewCardProps,
} from "@/frontend/common/views/dashboard/admin/home/components/ScheduleOverviewCardList";

const StyledDesktopCardContainer = styled(Paper)(({ theme }) => ({
  borderRadius: 0,
  border: "none",
  borderBottom: `1px solid ${theme.palette.outlineVariant}`,
  backgroundColor: theme.palette.surfaceContainer,
  boxShadow: "none",
  overflow: "hidden",
  width: "100%",
}));

export function ScheduleOverviewDesktopCard(props: ScheduleOverviewCardProps) {
  return (
    <StyledDesktopCardContainer elevation={0}>
      <CommonScheduleOverviewCard {...props} />
    </StyledDesktopCardContainer>
  );
}
