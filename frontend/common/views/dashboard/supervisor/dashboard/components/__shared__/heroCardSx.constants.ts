import type { SxProps, Theme } from "@mui/material";
import { mergeSx } from "@/frontend/common/utils/sx/mergeSx";
import { mobileContentGutterSx } from "@/frontend/common/utils/sx/mobileContentGutterSx";

export const MOBILE_HERO_CARD_SX: SxProps<Theme> = mergeSx(mobileContentGutterSx, (theme: Theme) => ({
  width: "100%",
  backgroundColor: theme.palette.surfaceContainerHigh,
  borderRadius: 0,
  py: 2.5,
  display: "flex",
  flexDirection: "column",
  gap: 2,
  borderTop: `1px solid ${theme.palette.outlineVariant}`,
  borderBottom: `1px solid ${theme.palette.outlineVariant}`,
  borderLeft: "none",
  borderRight: "none",
  boxShadow: "none",
}));
