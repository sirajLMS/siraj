"use client";

import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import { Chip } from "@mui/material";
import { useAppTranslation } from "@/shared/locale/client";
import { DashboardAccountingCarryover } from "@/shared/locale/namespaces";

/**
 * Marks a carryover row whose teacher was deactivated when the record was
 * snapshotted. Renders a neutral grey chip with a block icon; the `aria-label`
 * carries the full localized label for screen readers.
 */
export function DisabledTeacherChip() {
  const t = useAppTranslation(DashboardAccountingCarryover);
  const label = t.chip.disabledTeacher;

  return (
    <Chip
      icon={<BlockOutlinedIcon />}
      label={label}
      size="small"
      aria-label={label}
      sx={theme => ({
        backgroundColor: theme.palette.surfaceContainerHigh,
        color: theme.palette.onSurfaceVariant,
        "& .MuiChip-icon": { color: theme.palette.onSurfaceVariant },
      })}
    />
  );
}
