"use client";

import { NotificationsOutlined } from "@mui/icons-material";
import { Badge, type IconButtonProps, Popover } from "@mui/material";
import { type MouseEvent, useState } from "react";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useAppLocale } from "@/frontend/common/providers/LocaleProvider";
import { NavbarIcon } from "@/frontend/common/views/dashboard/components/navbar/NavbarIcon";
import { NotificationPanel } from "@/frontend/common/views/dashboard/components/navbar/NotificationPanel";
import { useAppTranslation } from "@/shared/locale/client";

interface NotificationButtonProps extends Omit<IconButtonProps, "children" | "title"> {
  notificationCount: number;
}

export function NotificationButton({ notificationCount, ...props }: Readonly<NotificationButtonProps>) {
  const t = useAppTranslation("common");
  const _locale = useAppLocale();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <RequirePermission permissions={[AppPermission.NotificationViewAlerts]}>
      <NavbarIcon tooltipTitle={t.notifications} onClick={handleClick} {...props}>
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
