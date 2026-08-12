import type { OverridesToolbarSharedOptions } from "@/frontend/common/views/dashboard/permissions/components/__shared__/overridesToolbarShared";

export const DESKTOP_OPTIONS: OverridesToolbarSharedOptions = {
  toolbarContainerSx: {
    p: 2,
    borderBottom: 1,
    borderColor: "divider",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 2,
    flexWrap: "wrap",
  },
  textFieldSx: { width: 260 },
};

export const MOBILE_OPTIONS: OverridesToolbarSharedOptions = {
  toolbarContainerSx: {
    p: 2,
    borderBottom: 1,
    borderColor: "divider",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "stretch",
    gap: 1.5,
  },
  textFieldSx: { width: "100%" },
};
