import type { SxProps, Theme } from "@mui/material/styles";
import { mergeSx } from "@/frontend/common/utils/sx/mergeSx";

export function getSidebarItemStyles(isCollapsed: boolean, isActive = false, isFooter = false): SxProps<Theme> {
  return (theme: Theme) => ({
    borderRadius: 0,
    py: isCollapsed ? 1 : 1.5,
    px: isCollapsed ? 0 : 2,
    justifyContent: isCollapsed ? "center" : "flex-start",
    // Active item: primaryContainer background + a primary-tinted overlay for
    // stronger dark-mode visibility + left accent bar with a soft glow + bold text.
    // borderRadius: 0 so the left accent bar isn't clipped.
    backgroundColor: isActive
      ? `color-mix(in srgb, var(--mui-palette-primaryContainer) 70%, var(--mui-palette-primary-main) 10%)`
      : "transparent",
    color: isActive ? "var(--mui-palette-primary-main)" : "var(--mui-palette-onSurfaceVariant)",
    ...(isActive && !isFooter
      ? {
          position: "relative" as const,
          "&::before": {
            content: '""',
            position: "absolute",
            left: 0,
            top: 6,
            bottom: 6,
            width: 4,
            borderRadius: 2,
            backgroundColor: "var(--mui-palette-primary-main)",
            boxShadow: `0 0 8px color-mix(in srgb, var(--mui-palette-primary-main) 60%, transparent)`,
          },
        }
      : {}),
    touchAction: "pan-y",
    "&:hover": {
      backgroundColor: "color-mix(in srgb, var(--mui-palette-primary-main) 8%, transparent)",
      color: "var(--mui-palette-primary-main)",
    },
    transition: theme.transitions.create("all", { duration: 200, easing: "ease" }),
    ...(!isFooter && {
      fontWeight: isActive ? 700 : 400,
      "&.Mui-selected": {
        backgroundColor: "var(--mui-palette-primaryContainer)",
        color: "var(--mui-palette-primary-main)",
        "&:hover": {
          backgroundColor: "var(--mui-palette-primaryContainer)",
        },
      },
    }),
  });
}

export function getGroupTitleStyles(): SxProps<Theme> {
  return {
    typography: "labelSm",
    fontWeight: 600,
    color: "var(--mui-palette-onSurfaceVariant)",
    opacity: 0.85,
    letterSpacing: "0.04em",
    px: 2,
    py: 0.5,
    display: "block",
  };
}

/** Full-width divider in collapsed icon mode. */
export function getCollapsedSidebarDividerSx(extra?: SxProps<Theme>): SxProps<Theme> {
  return mergeSx(
    {
      borderColor: "var(--mui-palette-outlineVariant)",
      width: "100%",
    },
    extra
  );
}

export function getNavListSx(isCollapsed: boolean): SxProps<Theme> {
  return {
    flex: 1,
    minHeight: 0,
    flexBasis: 0,
    overflowY: "auto",
    overflowX: "hidden",
    overscrollBehavior: "contain",
    WebkitOverflowScrolling: "touch",
    touchAction: "pan-y",
    py: isCollapsed ? 1.5 : 2,
    px: isCollapsed ? 0 : 1.5,
    "&::-webkit-scrollbar": { width: 4 },
    "&::-webkit-scrollbar-thumb": {
      backgroundColor: "var(--mui-palette-outlineVariant)",
      borderRadius: theme => theme.shape.borderRadius,
    },
  };
}

export function getGroupItemsListSx(isCollapsed: boolean): SxProps<Theme> {
  return { px: 0, pb: 0.5, paddingInlineStart: isCollapsed ? 0 : 2 };
}
