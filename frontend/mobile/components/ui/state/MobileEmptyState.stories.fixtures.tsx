import { CheckCircleOutlined, ErrorOutlined, InboxOutlined, InfoOutlined, SearchOutlined } from "@mui/icons-material";
import type { Theme } from "@mui/material";

export const MOBILE_EMPTY_STATE_VIEWPORTS = {
  mobile: {
    name: "Mobile (375px)",
    styles: { width: "375px", height: "667px" },
  },
  mobileLarge: {
    name: "Mobile Large (414px)",
    styles: { width: "414px", height: "896px" },
  },
  tablet: {
    name: "Tablet (768px)",
    styles: { width: "768px", height: "1024px" },
  },
  desktop: {
    name: "Desktop (1280px)",
    styles: { width: "1280px", height: "800px" },
  },
} as const;

export const inboxIcon = <InboxOutlined sx={{ fontSize: 64, color: (theme: Theme) => theme.palette.primary.main }} />;
export const errorIcon = <ErrorOutlined sx={{ fontSize: 64, color: (theme: Theme) => theme.palette.error.main }} />;
export const searchIcon = (
  <SearchOutlined sx={{ fontSize: 64, color: (theme: Theme) => theme.palette.text.secondary }} />
);
export const infoIcon = <InfoOutlined sx={{ fontSize: 64, color: (theme: Theme) => theme.palette.info.main }} />;
export const successIcon = (
  <CheckCircleOutlined sx={{ fontSize: 64, color: (theme: Theme) => theme.palette.success.main }} />
);

export const customEmptyStateSx = {
  py: 8,
  px: 4,
  backgroundColor: (theme: Theme) => theme.palette.primaryContainer,
  borderRadius: 3,
  border: (theme: Theme) => `1px solid ${theme.palette.primary.main}`,
} as const;
