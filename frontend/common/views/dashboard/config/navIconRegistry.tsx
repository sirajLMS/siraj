"use client";

import type { SvgIconComponent } from "@mui/icons-material";
import { Box, type SvgIconProps } from "@mui/material";
import { type ComponentType, lazy, Suspense } from "react";
import type { NavIconKey } from "@/frontend/common/views/dashboard/config/navIconKeys";

type IconModule = { default: SvgIconComponent };
type LazyIconMap = Record<NavIconKey, ComponentType<SvgIconProps>>;

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
  packages: () => import("@mui/icons-material/CardGiftcardOutlined"),
  payments: () => import("@mui/icons-material/PaymentsOutlined"),
  personAddAlt: () => import("@mui/icons-material/PersonAddAltOutlined"),
  personOutline: () => import("@mui/icons-material/PersonOutlined"),
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

const LAZY_ICONS: LazyIconMap = {
  accountBalanceWallet: lazy(ICON_LOADERS.accountBalanceWallet),
  analytics: lazy(ICON_LOADERS.analytics),
  assessment: lazy(ICON_LOADERS.assessment),
  badge: lazy(ICON_LOADERS.badge),
  calendarToday: lazy(ICON_LOADERS.calendarToday),
  category: lazy(ICON_LOADERS.category),
  class: lazy(ICON_LOADERS.class),
  currencyExchange: lazy(ICON_LOADERS.currencyExchange),
  dashboard: lazy(ICON_LOADERS.dashboard),
  description: lazy(ICON_LOADERS.description),
  diversity1: lazy(ICON_LOADERS.diversity1),
  edit: lazy(ICON_LOADERS.edit),
  eventRepeat: lazy(ICON_LOADERS.eventRepeat),
  folderOpen: lazy(ICON_LOADERS.folderOpen),
  group: lazy(ICON_LOADERS.group),
  history: lazy(ICON_LOADERS.history),
  hub: lazy(ICON_LOADERS.hub),
  lightbulb: lazy(ICON_LOADERS.lightbulb),
  logout: lazy(ICON_LOADERS.logout),
  menuBook: lazy(ICON_LOADERS.menuBook),
  noteAdd: lazy(ICON_LOADERS.noteAdd),
  notificationsActive: lazy(ICON_LOADERS.notificationsActive),
  packages: lazy(ICON_LOADERS.packages),
  payments: lazy(ICON_LOADERS.payments),
  personAddAlt: lazy(ICON_LOADERS.personAddAlt),
  personOutline: lazy(ICON_LOADERS.personOutline),
  rateReview: lazy(ICON_LOADERS.rateReview),
  receiptLong: lazy(ICON_LOADERS.receiptLong),
  reportProblem: lazy(ICON_LOADERS.reportProblem),
  school: lazy(ICON_LOADERS.school),
  search: lazy(ICON_LOADERS.search),
  security: lazy(ICON_LOADERS.security),
  settings: lazy(ICON_LOADERS.settings),
  share: lazy(ICON_LOADERS.share),
  shield: lazy(ICON_LOADERS.shield),
  timeline: lazy(ICON_LOADERS.timeline),
  update: lazy(ICON_LOADERS.update),
  videocam: lazy(ICON_LOADERS.videocam),
  visibility: lazy(ICON_LOADERS.visibility),
};

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
