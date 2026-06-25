import { Box, Button, Typography } from "@mui/material";
import { alpha, styled } from "@mui/material/styles";
import Link from "next/link";

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

export const StyledActionsCellBox = styled(Box)({
  display: "flex",
  justifyContent: "center",
  width: "100%",
  alignSelf: "center",
  height: "100%",
});

export const StyledGridDetailsIconButton = styled(Button)(({ theme }) => ({
  color: theme.palette.primary.main,
  "&:hover": {
    backgroundColor: alpha(theme.palette.primary.main, 0.08),
  },
}));
