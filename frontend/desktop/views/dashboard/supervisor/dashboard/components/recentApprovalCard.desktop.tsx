"use client";

import { Paper } from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  RecentApprovalCard as CommonRecentApprovalCard,
  type RecentApprovalCardProps,
} from "@/frontend/common/views/dashboard/supervisor/dashboard/components/RecentApprovalCardList";

const StyledDesktopCardContainer = styled(Paper)(({ theme }) => ({
  borderRadius: 0,
  border: "none",
  borderBottom: `1px solid ${theme.palette.outlineVariant}`,
  backgroundColor: theme.palette.surfaceContainer,
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
