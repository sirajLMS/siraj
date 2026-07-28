"use client";

import { Paper } from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  RecentApprovalCard as CommonRecentApprovalCard,
  type RecentApprovalCardProps,
} from "@/frontend/common/views/dashboard/supervisor/dashboard/components/RecentApprovalCardList";

const StyledDesktopCardContainer = styled(Paper)(({ theme }) => ({
  borderRadius: Number(theme.shape.borderRadius) * 2,
  border: `1px solid ${theme.palette.border.light}`,
  backgroundColor: theme.palette.surfaceContainerLowest,
  boxShadow: "none",
  overflow: "hidden",
  width: "100%",
}));

export function RecentApprovalDesktopCard(props: RecentApprovalCardProps) {
  return (
    <StyledDesktopCardContainer elevation={0}>
      <CommonRecentApprovalCard {...props} />
    </StyledDesktopCardContainer>
  );
}
