"use client";

import { Box, type SxProps, type Theme, useTheme } from "@mui/material";
import type { Theme as MuiTheme } from "@mui/material/styles";
import { StudentStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import { StudentStatusHeaderShared } from "@/frontend/common/views/dashboard/students/status/components/studentStatusHeaderShared";
import type {
  StudentStatusHeaderProps,
  StudentStatusPageData,
} from "@/frontend/common/views/dashboard/students/status/types";
import { MobileUserAvatar } from "@/frontend/mobile/components/ui/avatar";
import { MobileStatusBadge } from "@/frontend/mobile/components/ui/badge";
import { MobileFilterButton } from "@/frontend/mobile/components/ui/button";

const STATUS_DOT_COLOR_MAP: Record<string, string> = {
  [StudentStatus.Regular]: "success",
  [StudentStatus.Suspended]: "error",
  [StudentStatus.OnLeave]: "warning",
  [StudentStatus.OnTrial]: "info",
  [StudentStatus.Deactivated]: "grey",
};

function getStatusDotColor(student: StudentStatusPageData, theme: MuiTheme) {
  const key = STATUS_DOT_COLOR_MAP[student.status] ?? "warning";
  if (key === "success") return theme.palette.success.main;
  if (key === "error") return theme.palette.error.main;
  if (key === "warning") return theme.palette.warning.main;
  if (key === "info") return theme.palette.info.main;
  if (key === "grey") return theme.palette.outline;
  return theme.palette.onSurfaceVariant;
}

function MobileStatusDot({ student }: Readonly<{ student: StudentStatusPageData }>) {
  const theme = useTheme();
  return (
    <Box
      sx={{
        position: "absolute",
        bottom: 0,
        right: 0,
        width: 24,
        height: 24,
        borderRadius: "full",
        border: `4px solid ${theme.palette.background.paper}`,
        backgroundColor: getStatusDotColor(student, theme),
      }}
    />
  );
}

const MOBILE_EMBEDDED_WRAPPER_SX: SxProps<Theme> = {
  display: "flex",
  justifyContent: "flex-end",
  mb: 3,
};

export function StudentStatusHeaderMobile({ student, embedded = false }: Readonly<StudentStatusHeaderProps>) {
  return (
    <StudentStatusHeaderShared
      student={student}
      embedded={embedded}
      slots={{
        AvatarComponent: MobileUserAvatar,
        StatusDot: MobileStatusDot,
        StatusBadgeComponent: MobileStatusBadge,
        FilterButton: MobileFilterButton,
        buttonFullWidth: true,
        embeddedWrapperSx: MOBILE_EMBEDDED_WRAPPER_SX,
      }}
    />
  );
}
