"use client";

import { EventBusyOutlined } from "@mui/icons-material";
import type { SxProps, Theme } from "@mui/material";
import { EmptyState } from "@/frontend/common/components/ui";
import { useAppTranslation } from "@/shared/locale/client";
import { DashboardAccountingProfitLoss } from "@/shared/locale/namespaces";

interface EmptyMonthStateProps {
  /** Placement tweaks from the composing tab panel; content stays unchanged. */
  readonly sx?: SxProps<Theme>;
}

/**
 * Zero-data panel rendered when the selected accounting month has no rows in
 * any of the report tabs (E16): a muted calendar glyph, the month-empty
 * heading, and guidance copy. Content is direction-free and centered, so the
 * panel reads identically in RTL and at mobile widths.
 */
export function EmptyMonthState({ sx }: Readonly<EmptyMonthStateProps>) {
  const t = useAppTranslation(DashboardAccountingProfitLoss);

  return (
    <EmptyState
      title={t.empty.title}
      subtitle={t.empty.description}
      icon={<EventBusyOutlined fontSize="large" />}
      sx={sx}
    />
  );
}
