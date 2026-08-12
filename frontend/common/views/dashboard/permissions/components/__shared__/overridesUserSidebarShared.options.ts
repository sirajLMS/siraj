import type { OverridesUserSidebarSharedOptions } from "@/frontend/common/views/dashboard/permissions/components/__shared__/overridesUserSidebarShared";

export const DESKTOP_OPTIONS: OverridesUserSidebarSharedOptions = {
  sidebarContainerSx: theme => ({
    width: "25%",
    borderRight: `1px solid ${theme.palette.divider}`,
    p: 3,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    backgroundColor: theme.palette.surfaceContainerLow ?? "transparent",
    gap: theme.spacing(3),
  }),
};

export const MOBILE_OPTIONS: OverridesUserSidebarSharedOptions = {
  sidebarContainerSx: theme => ({
    width: "100%",
    borderBottom: `1px solid ${theme.palette.divider}`,
    p: 3,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    backgroundColor: theme.palette.surfaceContainerLow ?? "transparent",
    gap: theme.spacing(3),
  }),
};
