"use client";

import { Paper } from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  ScheduleOverviewCard as CommonScheduleOverviewCard,
  type ScheduleOverviewCardProps,
} from "@/frontend/common/views/dashboard/admin/home/components/ScheduleOverviewCardList";

const StyledDesktopCardContainer = styled(Paper)(({ theme }) => ({
  borderRadius: Number(theme.shape.borderRadius) * 2,
  border: `1px solid ${theme.palette.border.light}`,
  backgroundColor: theme.palette.surfaceContainerLowest,
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
