import { Box } from "@mui/material";
import { alpha, styled } from "@mui/material/styles";

/**
 * Shared styled time-highlight box used by both the common
 * `RecentApprovalCardList` and the mobile `TeacherScheduleMobileCard`.
 * Uses alpha-primary tinted background and border.
 */
export const StyledTimeHighlight = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  marginBottom: theme.spacing(1.5),
  padding: theme.spacing(1.25, 1.5),
  borderRadius: theme.layout.radius.card,
  backgroundColor: alpha(theme.palette.primary.main, 0.08),
  border: `1px solid ${alpha(theme.palette.primary.main, 0.16)}`,
  minWidth: 0,
  overflow: "hidden",
}));
