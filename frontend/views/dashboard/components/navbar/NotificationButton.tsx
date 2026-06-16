"use client";

import { NotificationsOutlined } from "@mui/icons-material";
import { Badge, type IconButtonProps } from "@mui/material";
import { useTranslations } from "next-intl";
import { NavbarIcon } from "./NavbarIcon"; // Adjust path as needed

interface NotificationButtonProps extends Omit<IconButtonProps, "children" | "title"> {
  notificationCount: number;
}

export function NotificationButton({ notificationCount, ...props }: Readonly<NotificationButtonProps>) {
  const t = useTranslations("common");

  return (
    <NavbarIcon tooltipTitle={t("notifications")} {...props}>
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
  );
}
