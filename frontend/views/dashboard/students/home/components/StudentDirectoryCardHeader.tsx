"use client";

import { Avatar, Box, Typography } from "@mui/material";
import { StatusBadge } from "@/frontend/components/ui/StatusBadge";
import type { StudentAccountStatus, StudentDirectoryRow } from "../types";

interface StudentDirectoryCardHeaderProps {
  readonly row: StudentDirectoryRow;
  readonly statusLabels: Record<StudentAccountStatus, string>;
}

export function StudentDirectoryCardHeader({ row, statusLabels }: StudentDirectoryCardHeaderProps) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Avatar src={row.avatarUrl} alt={row.name} sx={{ width: 48, height: 48 }} />
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
