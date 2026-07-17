"use client";

import { Box, Typography } from "@mui/material";
import { UserAvatar } from "@/frontend/common/components/ui";
import { StatusBadge } from "@/frontend/common/components/ui/badge/StatusBadge";
import type {
  StudentAccountStatus,
  StudentDirectoryRowExtended,
} from "@/frontend/common/views/dashboard/admin/parents/students/types";

interface StudentDirectoryCardHeaderProps {
  readonly row: StudentDirectoryRowExtended;
  readonly statusLabels: Record<StudentAccountStatus, string>;
}

export function StudentDirectoryCardHeader({ row, statusLabels }: Readonly<StudentDirectoryCardHeaderProps>) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <UserAvatar src={row.avatarUrl} label={row.name ?? ""} size={48} />
        <Box>
          <Typography
            variant="bodyLg"
            sx={theme => ({
              fontWeight: 700,
              color: theme.palette.primary.main,
            })}
          >
            {row.name}
          </Typography>
          <Typography
            variant="labelMd"
            sx={theme => ({
              color: theme.palette.text.secondary,
            })}
          >
            {row.email}
          </Typography>
        </Box>
      </Box>
      <StatusBadge category="studentAccount" status={row.accountStatus} label={statusLabels[row.accountStatus]} />
    </Box>
  );
}
