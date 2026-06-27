import { Box, Typography } from "@mui/material";
import { alpha, styled } from "@mui/material/styles";
import { Link } from "@/shared/i18n/routing";
export const StyledMonospaceLabel = styled(Typography)(({ theme }) => ({
  fontFamily: "monospace",
  color: theme.palette.text.secondary,
  fontWeight: 500,
  alignSelf: "center",
}));

export const StyledStudentNameText = styled(Typography)({
  fontWeight: 500,
  alignSelf: "center",
});

export const StyledTeacherNameText = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  alignSelf: "center",
}));

export const StyledScheduleNameLink = styled(Link)(({ theme }) => ({
  alignSelf: "center",
  color: theme.palette.primary.main,
  fontWeight: 500,
  textDecoration: "none",
  "&:hover": {
    textDecoration: "underline",
  },
}));

export const StyledScheduleTeacherLink = styled(StyledScheduleNameLink)(({ theme }) => ({
  color: theme.palette.text.secondary,
}));

export const StyledActionsCellBox = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: theme.spacing(0.5),
  width: "100%",
  alignSelf: "center",
  height: "100%",
}));

export const StyledHistoryIconLink = styled(Link)(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 32,
  height: 32,
  borderRadius: Number(theme.shape.borderRadius),
  color: theme.palette.onSurfaceVariant,
  textDecoration: "none",
  "&:hover": {
    backgroundColor: alpha(theme.palette.primary.main, 0.08),
    color: theme.palette.primary.main,
  },
}));

export const StyledGridDetailsLink = styled(Link)(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  paddingInline: theme.spacing(1),
  paddingBlock: theme.spacing(0.5),
  borderRadius: Number(theme.shape.borderRadius),
  color: theme.palette.primary.main,
  fontSize: theme.typography.labelMd.fontSize,
  fontWeight: theme.typography.labelMd.fontWeight,
  textDecoration: "none",
  "&:hover": {
    backgroundColor: alpha(theme.palette.primary.main, 0.08),
    textDecoration: "none",
  },
}));
