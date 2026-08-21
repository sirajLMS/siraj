"use client";

import { NotificationsOutlined } from "@mui/icons-material";

import { Badge, type IconButtonProps } from "@mui/material";

import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";

import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";

import { useNotificationsDrawerStore } from "@/frontend/common/stores/notificationsDrawerStore";

import { NavbarIcon } from "@/frontend/common/views/dashboard/components/navbar/NavbarIcon";

import { Translation, useAppTranslation } from "@/shared/locale";

interface NotificationButtonProps extends Omit<IconButtonProps, "children" | "title"> {
  notificationCount: number;
}

function openNotificationsDrawer() {
  useNotificationsDrawerStore.getState().openDrawer();
}

export function NotificationButton({ notificationCount, ...props }: Readonly<NotificationButtonProps>) {
  const t = useAppTranslation(Translation.Common);

  return (
    <RequirePermission permissions={[AppPermission.NotificationViewAlerts]}>
      <NavbarIcon tooltipTitle={t.notifications} onClick={openNotificationsDrawer} {...props}>
        <Badge
          badgeContent={notificationCount}
          variant="dot"
          sx={theme => ({
            "& .MuiBadge-badge": {
              backgroundColor: theme.palette.error.main,

              color: theme.palette.onError,
            },
          })}
        >
          <NotificationsOutlined />
        </Badge>
      </NavbarIcon>
    </RequirePermission>
  );
}
