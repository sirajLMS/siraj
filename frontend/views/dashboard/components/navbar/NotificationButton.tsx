"use client";

import { NotificationsOutlined } from "@mui/icons-material";
import { Badge, type IconButtonProps, Popover } from "@mui/material";
import { useTranslations } from "next-intl";
import { type MouseEvent, useState } from "react";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { NavbarIcon } from "./NavbarIcon";
import { NotificationPanel } from "./NotificationPanel";

interface NotificationButtonProps extends Omit<IconButtonProps, "children" | "title"> {
  notificationCount: number;
}

export function NotificationButton({ notificationCount, ...props }: Readonly<NotificationButtonProps>) {
  const t = useTranslations("common");
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <RequirePermission permissions={[AppPermission.NotificationViewAlerts]}>
      <NavbarIcon tooltipTitle={t("notifications")} onClick={handleClick} {...props}>
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

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            elevation: 4,
            sx: theme => ({
              mt: 1,
              borderRadius: 2,
              border: `1px solid ${theme.palette.outlineVariant}`,
              backgroundColor: theme.palette.surface,
            }),
          },
        }}
      >
        <NotificationPanel />
      </Popover>
    </RequirePermission>
  );
}
