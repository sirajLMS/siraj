"use client";

import { Button } from "@mui/material";
import { styled } from "@mui/material/styles";

// Success-tinted contained button used for the start action
export const StyledStartActionButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.success.main,
  color: theme.palette.onSuccess,
  borderRadius: theme.layout.radius.button,
  "&:hover": { backgroundColor: theme.palette.success.dark },
}));

// Warning-tinted contained button used for the mark-absent action
export const StyledAbsentActionButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.warning.main,
  color: theme.palette.onWarning,
  borderRadius: theme.layout.radius.button,
  "&:hover": { backgroundColor: theme.palette.warning.dark },
}));

// Secondary-colored outlined button used for the leave action
export const StyledLeaveActionButton = styled(Button)(({ theme }) => ({
  color: theme.palette.secondary.main,
  borderColor: theme.palette.secondary.main,
  borderRadius: theme.layout.radius.button,
  "&:hover": {
    borderColor: theme.palette.secondary.dark,
    backgroundColor: theme.palette.action.hover,
  },
}));

// Error-tinted contained button used for the reset action
export const StyledResetActionButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.error.main,
  color: theme.palette.onError,
  borderRadius: theme.layout.radius.button,
  "&:hover": { backgroundColor: theme.palette.error.dark },
}));
