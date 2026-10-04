"use client";

import { WarningAmberOutlined } from "@mui/icons-material";
import { Chip, Tooltip, Typography } from "@mui/material";
import type { ReactNode } from "react";
import type { FxWarning } from "@/backend/types";
import { joinFxPairs } from "@/frontend/common/views/dashboard/accounting/profit-loss/GlobalFilterBar.helpers";
import { useAppTranslation } from "@/shared/locale/client";
import { DashboardAccountingProfitLoss } from "@/shared/locale/namespaces";

interface FxWarningChipProps {
  readonly warnings: readonly FxWarning[];
}

/**
 * FX-rate warning chip: rendered only when the report excluded rows for
 * missing conversion rates. The tooltip enumerates the affected currency
 * pairs with their excluded row counts, so the aggregate discrepancy is
 * explainable without leaving the dashboard.
 */
export function FxWarningChip({ warnings }: Readonly<FxWarningChipProps>) {
  const t = useAppTranslation(DashboardAccountingProfitLoss);
  const excludedRows = warnings.reduce((total, warning) => total + warning.rowCount, 0);
  const chipLabel = t.fx.chip(excludedRows);
  const tooltipTitle: ReactNode = (
    <Typography sx={{ fontSize: "0.75rem" }}>{t.fx.tooltip(joinFxPairs(warnings))}</Typography>
  );
  return (
    <Tooltip title={tooltipTitle}>
      <Chip
        size="small"
        color="warning"
        variant="outlined"
        icon={<WarningAmberOutlined fontSize="small" />}
        label={chipLabel}
        sx={{ height: "auto", alignSelf: "center", whiteSpace: "normal" }}
      />
    </Tooltip>
  );
}
