import type { UpdateSchedulesButtonSharedOptions } from "@/frontend/common/views/dashboard/tools/dst-migration/components/__shared__/updateSchedulesButtonShared";

export const DESKTOP_UPDATE_SCHEDULES_OPTIONS: UpdateSchedulesButtonSharedOptions = {
  variant: isComplete => (isComplete ? "contained" : "outlined"),
  fullWidth: false,
  buttonSx: (theme, isComplete, isRunning) => ({
    px: 4,
    py: 1.5,
    borderRadius: 99,
    fontWeight: 700,
    letterSpacing: "0.1em",
    borderWidth: 2,
    ...(isComplete
      ? {
          backgroundColor: theme.palette.success.main,
          color: theme.palette.onSuccess,
          borderColor: theme.palette.success.main,
          "&:hover": { backgroundColor: theme.palette.success.dark },
        }
      : {
          color: theme.palette.primary.main,
          borderColor: theme.palette.primary.main,
          "&:hover": { backgroundColor: theme.palette.primary.main, color: theme.palette.onPrimary },
        }),
    "& .MuiButton-startIcon .MuiSvgIcon-root": isRunning
      ? { animation: "spin 1s linear infinite", "@keyframes spin": { to: { transform: "rotate(360deg)" } } }
      : undefined,
  }),
};

export const MOBILE_UPDATE_SCHEDULES_OPTIONS: UpdateSchedulesButtonSharedOptions = {
  variant: () => "contained",
  fullWidth: true,
  buttonSx: (theme, isComplete, isRunning) => ({
    py: 2,
    borderRadius: 99,
    fontWeight: 700,
    letterSpacing: "0.1em",
    backgroundColor: isComplete ? theme.palette.success.main : theme.palette.primary.main,
    color: theme.palette.onPrimary,
    "&:hover": { backgroundColor: isComplete ? theme.palette.success.dark : theme.palette.primary.dark },
    "& .MuiButton-startIcon .MuiSvgIcon-root": isRunning
      ? { animation: "spin 1s linear infinite", "@keyframes spin": { to: { transform: "rotate(360deg)" } } }
      : undefined,
  }),
};
