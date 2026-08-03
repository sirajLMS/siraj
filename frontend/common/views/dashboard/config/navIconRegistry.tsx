"use client";

import type { SvgIconComponent } from "@mui/icons-material";
import { Box, type SvgIconProps } from "@mui/material";
import { type ComponentType, lazy, Suspense } from "react";
import type { NavIconKey } from "@/frontend/common/views/dashboard/config/navIconKeys";

type IconModule = { default: SvgIconComponent };

const ICON_LOADERS: Record<NavIconKey, () => Promise<IconModule>> = {
  accountBalanceWallet: () => import("@mui/icons-material/AccountBalanceWalletOutlined"),
  analytics: () => import("@mui/icons-material/AnalyticsOutlined"),
  assessment: () => import("@mui/icons-material/AssessmentOutlined"),
  badge: () => import("@mui/icons-material/BadgeOutlined"),
  calendarToday: () => import("@mui/icons-material/CalendarTodayOutlined"),
  category: () => import("@mui/icons-material/CategoryOutlined"),
  class: () => import("@mui/icons-material/ClassOutlined"),
  currencyExchange: () => import("@mui/icons-material/CurrencyExchangeOutlined"),
  dashboard: () => import("@mui/icons-material/DashboardOutlined"),
  description: () => import("@mui/icons-material/DescriptionOutlined"),
  diversity1: () => import("@mui/icons-material/Diversity1Outlined"),
  edit: () => import("@mui/icons-material/EditOutlined"),
  eventRepeat: () => import("@mui/icons-material/EventRepeatOutlined"),
  folderOpen: () => import("@mui/icons-material/FolderOpenOutlined"),
  group: () => import("@mui/icons-material/GroupOutlined"),
  history: () => import("@mui/icons-material/HistoryOutlined"),
  hub: () => import("@mui/icons-material/HubOutlined"),
  lightbulb: () => import("@mui/icons-material/LightbulbOutlined"),
  logout: () => import("@mui/icons-material/LogoutOutlined"),
  menuBook: () => import("@mui/icons-material/MenuBookOutlined"),
  noteAdd: () => import("@mui/icons-material/NoteAddOutlined"),
  notificationsActive: () => import("@mui/icons-material/NotificationsActiveOutlined"),
  payments: () => import("@mui/icons-material/PaymentsOutlined"),
  personAddAlt: () => import("@mui/icons-material/PersonAddAltOutlined"),
  personOutline: () => import("@mui/icons-material/PersonOutlineOutlined"),
  rateReview: () => import("@mui/icons-material/RateReviewOutlined"),
  receiptLong: () => import("@mui/icons-material/ReceiptLongOutlined"),
  reportProblem: () => import("@mui/icons-material/ReportProblemOutlined"),
  school: () => import("@mui/icons-material/SchoolOutlined"),
  search: () => import("@mui/icons-material/SearchOutlined"),
  security: () => import("@mui/icons-material/SecurityOutlined"),
  settings: () => import("@mui/icons-material/SettingsOutlined"),
  share: () => import("@mui/icons-material/ShareOutlined"),
  shield: () => import("@mui/icons-material/ShieldOutlined"),
  timeline: () => import("@mui/icons-material/TimelineOutlined"),
  update: () => import("@mui/icons-material/UpdateOutlined"),
  videocam: () => import("@mui/icons-material/VideocamOutlined"),
  visibility: () => import("@mui/icons-material/VisibilityOutlined"),
};

const LAZY_ICONS = (Object.keys(ICON_LOADERS) as NavIconKey[]).reduce(
  (acc, key) => {
    acc[key] = lazy(ICON_LOADERS[key]);
    return acc;
  },
  {} as Record<NavIconKey, ComponentType<SvgIconProps>>
);

interface NavIconProps extends SvgIconProps {
  readonly iconKey: NavIconKey;
}

export function NavIcon({ iconKey, ...props }: Readonly<NavIconProps>) {
  const LazyIcon = LAZY_ICONS[iconKey];
  return (
    <Suspense fallback={<Box sx={{ width: 24, height: 24 }} />}>
      <LazyIcon {...props} />
    </Suspense>
  );
}
