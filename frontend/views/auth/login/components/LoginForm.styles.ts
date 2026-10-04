import { Email, Lock } from "@mui/icons-material";
import { Box, Button, Link } from "@mui/material";
import { alpha, styled, type Theme } from "@mui/material/styles";

// Semantic envelope icon for the email field — signals "email" not "username".
export const StyledEmailIcon = styled(Email)(({ theme }) => ({
  color: theme.palette.text.secondary,
}));

export const StyledLockIcon = styled(Lock)(({ theme }) => ({
  color: theme.palette.text.secondary,
}));

export const StyledFormActionsContainer = styled(Box)({
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "center",
  marginTop: "-0.5rem",
});

// Shared focus + error styling for all login TextFields — gives inputs a clear focus
// ring (accessibility), consistent border radius, and a red focus ring on error.
// Reused by both the email and password fields to avoid duplication (jscpd).
export const textFieldFocusSx = (theme: Theme) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: 1.5,
    transition: theme.transitions.create(["box-shadow", "border-color"], {
      duration: theme.transitions.duration.short,
    }),
    "& fieldset": {
      borderColor: alpha(theme.palette.text.primary, 0.6),
      borderWidth: 2,
    },
    "&:hover fieldset": {
      borderColor: alpha(theme.palette.primary.main, 0.6),
    },
    "&.Mui-focused fieldset": {
      borderColor: theme.palette.primary.main,
      borderWidth: 2,
    },
    "&.Mui-focused": {
      boxShadow: `0 0 0 4px ${alpha(theme.palette.primary.main, 0.22)}`,
    },
    "&.Mui-focused.Mui-error": {
      boxShadow: `0 0 0 4px ${alpha(theme.palette.error.main, 0.25)}`,
    },
    "&.Mui-error .MuiInputAdornment-root": {
      color: theme.palette.error.main,
    },
  },
  "& .MuiInputLabel-root": {
    color: alpha(theme.palette.text.primary, 0.7),
    fontWeight: 500,
    "&.Mui-focused": { color: theme.palette.primary.main },
    "&.Mui-error": { color: theme.palette.error.main },
    "&.Mui-error.Mui-focused": { color: theme.palette.error.main },
  },
});

export const StyledForgotPasswordLink = styled(Link)(({ theme }) => ({
  color: theme.palette.primary.main,
  fontSize: theme.typography.bodyMd.fontSize,
  fontWeight: 500,
}));

// Submit button — flat fill aligned with the global MuiButton override (which kills
// elevation), so no gradient or glow that would fight the design system or make a
// disabled button look clickable. Interactive states are explicit: hover/active
// darken the fill, focus-visible rings, disabled fully mutes.
export const StyledSubmitButton = styled(Button)(({ theme }) => ({
  paddingTop: 14,
  paddingBottom: 14,
  minHeight: 52,
  fontSize: theme.typography.bodyMd.fontSize,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: theme.palette.onPrimary,
  backgroundColor: theme.palette.primary.main,
  transition: theme.transitions.create(["background-color", "box-shadow"], {
    duration: theme.transitions.duration.short,
  }),
  "&:hover": {
    backgroundColor: theme.palette.primary.dark,
  },
  "&:focus-visible": {
    boxShadow: `0 0 0 4px ${alpha(theme.palette.primary.main, 0.3)}`,
  },
  "&.Mui-disabled": {
    color: theme.palette.action.disabled,
    backgroundColor: theme.palette.action.disabledBackground,
    boxShadow: "none",
  },
}));
