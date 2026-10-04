import VideocamOutlinedIcon from "@mui/icons-material/VideocamOutlined";
import { Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

export const StyledSectionTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.main,
}));

export const StyledPreviewContainer = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.action.hover,
  position: "relative",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}));

export const StyledDesktopVideoIcon = styled(VideocamOutlinedIcon)(({ theme }) => ({
  fontSize: 64,
  color: theme.palette.text.disabled,
  opacity: 0.3,
}));

export const StyledPreviewCaption = styled(Box)(({ theme }) => ({
  position: "absolute",
  insetInlineStart: theme.spacing(1.5),
  bottom: theme.spacing(1.5),
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  backgroundColor: theme.palette.surfaceContainerHighest,
  paddingInline: theme.spacing(2),
  paddingBlock: theme.spacing(0.75),
  borderRadius: theme.spacing(1),
}));

export const StyledCaptionPlatformName = styled(Typography)(({ theme }) => ({
  color: theme.palette.onSurface,
  fontWeight: 700,
}));

export const StyledCaptionMeetingId = styled(Typography)(({ theme }) => ({
  color: theme.palette.onSurfaceVariant,
}));

export const StyledEmptyMeetingRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
  backgroundColor: theme.palette.action.hover,
  paddingInline: theme.spacing(1.5),
  paddingBlock: theme.spacing(1.5),
  borderRadius: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

export const StyledEmptyMeetingIcon = styled(VideocamOutlinedIcon)(({ theme }) => ({
  fontSize: 40,
  color: theme.palette.text.disabled,
}));

export const StyledEmptyMeetingText = styled(Typography)(({ theme }) => ({
  color: theme.palette.onSurfaceVariant,
  fontWeight: 700,
  minWidth: 0,
  overflowWrap: "anywhere",
}));

export const StyledMeetingInfoRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: theme.spacing(1.5),
  padding: theme.spacing(1.5),
  backgroundColor: theme.palette.surfaceContainerLow,
  borderRadius: 2,
}));

export const StyledMeetingInfoContent = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
  minWidth: 0,
}));

export const StyledMeetingInfoIcon = styled(VideocamOutlinedIcon)(({ theme }) => ({
  color: theme.palette.onSurfaceVariant,
}));

export const StyledMeetingIdLabel = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  color: theme.palette.onSurfaceVariant,
}));

export const StyledMeetingUrlText = styled(Typography)(({ theme }) => ({
  color: theme.palette.onSurface,
}));
