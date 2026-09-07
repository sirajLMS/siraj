"use client";

import { Chip } from "@mui/material";
import { useAppTranslation } from "@/shared/locale/client";
import { DashboardAccountingCarryover } from "@/shared/locale/namespaces";

export interface PaidStatusChipProps {
  readonly paid: boolean;
}

/**
 * Paid state of a carryover row: a green chip when paid, an amber "pending"
 * chip when unpaid. The `aria-label` carries the full localized label so grid
 * cells stay legible to screen readers.
 */
export function PaidStatusChip({ paid }: Readonly<PaidStatusChipProps>) {
  const t = useAppTranslation(DashboardAccountingCarryover);
  const label = paid ? t.chip.paid : t.chip.unpaid;

  return (
    <Chip
      label={label}
      size="small"
      aria-label={label}
      sx={theme =>
        paid
          ? {
              backgroundColor: theme.palette.status.activeContainer,
              color: theme.palette.status.onActiveContainer,
            }
          : {
              backgroundColor: theme.palette.status.pendingContainer,
              color: theme.palette.status.onPendingContainer,
            }
      }
    />
  );
}
