import { Box, IconButton, Typography } from "@mui/material";
import { alpha, styled } from "@mui/material/styles";

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

export const StyledActionsCellBox = styled(Box)({
  display: "flex",
  justifyContent: "center",
  width: "100%",
  alignSelf: "center",
  height: "100%",
});

export const StyledGridDetailsIconButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.primary.main,
  "&:hover": {
    backgroundColor: alpha(theme.palette.primary.main, 0.08),
  },
}));
