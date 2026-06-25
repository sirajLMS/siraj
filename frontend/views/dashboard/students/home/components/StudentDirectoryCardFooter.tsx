"use client";

import { InfoOutlined } from "@mui/icons-material";
import { Box, IconButton, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import type { StudentDirectoryRowExtended } from "../types";
import { ClassesLeftProgress } from "./ClassesLeftProgress";

interface StudentDirectoryCardFooterProps {
  readonly row: StudentDirectoryRowExtended;
  readonly classesLeftLabel: string;
  readonly viewProfileLabel: string;
  readonly onViewProfile: (id: string) => void;
}

export function StudentDirectoryCardFooter({
  row,
  classesLeftLabel,
  viewProfileLabel,
  onViewProfile,
}: StudentDirectoryCardFooterProps) {
  return (
    <Box
      sx={{
        borderTop: theme => `1px solid ${theme.palette.border.light}`,
        pt: 1.5,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Box sx={{ flex: 1, mr: 2 }}>
        <Typography
          sx={theme => ({
            fontFamily: '"Inter", sans-serif',
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            color: theme.palette.text.secondary,
            mb: 0.5,
          })}
        >
          {classesLeftLabel}
        </Typography>
        <ClassesLeftProgress
          remaining={row.classesRemaining ?? 0}
          total={row.classesTotal ?? 0}
          accountStatus={row.accountStatus}
          compact
        />
      </Box>
      <IconButton
        id={`mobile-student-info-${row.id}`}
        size="small"
        aria-label={viewProfileLabel}
        onClick={e => {
          e.stopPropagation();
          onViewProfile(row.id ?? "");
        }}
        sx={theme => ({
          width: 32,
          height: 32,
          bgcolor: theme.palette.action.hover,
          color: theme.palette.primary.main,
          "&:hover": {
            bgcolor: alpha(theme.palette.primary.main, 0.12),
          },
        })}
      >
        <InfoOutlined sx={{ fontSize: 20 }} />
      </IconButton>
    </Box>
  );
}
