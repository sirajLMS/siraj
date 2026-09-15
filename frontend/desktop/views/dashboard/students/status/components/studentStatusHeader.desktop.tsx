"use client";

import type { SxProps, Theme } from "@mui/material";
import { StudentStatusHeaderShared } from "@/frontend/common/views/dashboard/students/status/components/studentStatusHeaderShared";
import type { StudentStatusHeaderProps } from "@/frontend/common/views/dashboard/students/status/types";
import { DesktopUserAvatar } from "@/frontend/desktop/components/ui/avatar/DesktopUserAvatar";
import { DesktopStatusBadge } from "@/frontend/desktop/components/ui/badge";
import { DesktopFilterButton } from "@/frontend/desktop/components/ui/button";

const DESKTOP_EMBEDDED_WRAPPER_SX: SxProps<Theme> = {
  display: "flex",
  justifyContent: "center",
  width: "100%",
  mb: 2,
};

const DESKTOP_EMBEDDED_INNER_SX: SxProps<Theme> = {
  display: "flex",
  justifyContent: "flex-end",
  width: "100%",
  maxWidth: 720,
};

export function StudentStatusHeaderDesktop({ student, embedded = false }: Readonly<StudentStatusHeaderProps>) {
  return (
    <StudentStatusHeaderShared
      student={student}
      embedded={embedded}
      slots={{
        AvatarComponent: DesktopUserAvatar,
        StatusBadgeComponent: DesktopStatusBadge,
        FilterButton: DesktopFilterButton,
        buttonFullWidth: false,
        embeddedWrapperSx: DESKTOP_EMBEDDED_WRAPPER_SX,
        embeddedInnerWrapperSx: DESKTOP_EMBEDDED_INNER_SX,
      }}
    />
  );
}
