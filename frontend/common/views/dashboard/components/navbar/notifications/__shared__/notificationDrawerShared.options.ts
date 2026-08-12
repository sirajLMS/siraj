import type { NotificationDrawerSharedOptions } from "@/frontend/common/views/dashboard/components/navbar/notifications/__shared__/notificationDrawerShared";

const DRAWER_WIDTH_PX = 420;

export const DESKTOP_OPTIONS: NotificationDrawerSharedOptions = {
  anchor: "right",
  paperSx: {
    width: DRAWER_WIDTH_PX,
    maxWidth: "100vw",
  },
};

export const MOBILE_OPTIONS: NotificationDrawerSharedOptions = {
  anchor: "bottom",
  paperSx: {
    width: "100%",
    maxWidth: "100vw",
    height: "85vh",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
};
