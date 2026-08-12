import type { SingleGroupHeaderSharedOptions } from "@/frontend/common/views/dashboard/permissions/components/__shared__/singleGroupHeaderShared";

export const DESKTOP_OPTIONS: SingleGroupHeaderSharedOptions = {
  headerPanelSx: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButtonsSx: {
    alignSelf: "center",
  },
  actionButtonSx: {},
};

export const MOBILE_OPTIONS: SingleGroupHeaderSharedOptions = {
  headerPanelSx: {
    flexDirection: "column",
    alignItems: "stretch",
  },
  actionButtonsSx: {
    flexDirection: "column",
    alignSelf: "stretch",
  },
  actionButtonSx: {
    width: "100%",
  },
};
