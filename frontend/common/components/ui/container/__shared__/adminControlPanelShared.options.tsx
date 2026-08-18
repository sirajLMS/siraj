import type { AdminControlPanelSharedOptions } from "@/frontend/common/components/ui/container/__shared__/adminControlPanelShared";

export const DESKTOP_OPTIONS: AdminControlPanelSharedOptions = {
  headerPx: 3,
  headerPy: 2.5,
  headerGap: 1.5,
  bodyPadding: 3,
  iconSx: theme => ({ color: theme.palette.primary.main }),
  titleSx: theme => ({ typography: "titleLg", color: theme.palette.primary.main, fontWeight: 700 }),
};

export const MOBILE_OPTIONS: AdminControlPanelSharedOptions = {
  headerPx: 2.5,
  headerPy: 2,
  headerGap: 1,
  bodyPadding: 2.5,
  iconSx: theme => ({ color: theme.palette.primary.main, fontSize: 20 }),
  titleSx: theme => ({ typography: "titleLg", color: theme.palette.primary.main, fontWeight: 700 }),
};
