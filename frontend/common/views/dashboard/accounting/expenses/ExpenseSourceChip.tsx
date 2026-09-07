"use client";

import LinkOutlinedIcon from "@mui/icons-material/LinkOutlined";
import { Chip } from "@mui/material";
import { EXPENSE_SOURCE_CARRYOVER_BALANCES } from "@/shared/constants/expenses";
import { useAppTranslation } from "@/shared/locale/client";
import { DashboardAccountingExpenses } from "@/shared/locale/namespaces";

export interface ExpenseSourceChipProps {
  readonly sourceEntity: string | null;
  readonly sourceEntityId: string | null;
  /** Invoked with the linked carryover balance id when the provenance chip is activated. */
  readonly onViewSource?: (sourceEntityId: string) => void;
}

/**
 * Provenance chip for an expense ledger row: a neutral grey "Manual" chip for
 * hand-entered rows (`sourceEntity` null, per the ledger contract), and a blue
 * clickable "From Carryover" chip for rows produced by the carryover
 * settlement flow. Activating the carryover chip hands the linked balance id
 * to `onViewSource` so the caller can open the carryover detail drawer.
 * A carryover marker without a resolvable linked id (unreachable per the
 * server invariant) renders nothing rather than a mislabeled Manual chip.
 * The `aria-label` carries the full localized label so grid cells stay
 * legible to screen readers.
 */
export function ExpenseSourceChip({ sourceEntity, sourceEntityId, onViewSource }: Readonly<ExpenseSourceChipProps>) {
  const t = useAppTranslation(DashboardAccountingExpenses);
  const isFromCarryover = sourceEntity === EXPENSE_SOURCE_CARRYOVER_BALANCES && !!sourceEntityId;

  if (!isFromCarryover) {
    if (sourceEntity !== null) return null;
    const label = t.source.Manual;
    return (
      <Chip
        label={label}
        size="small"
        aria-label={label}
        sx={theme => ({
          backgroundColor: theme.palette.surfaceContainerHigh,
          color: theme.palette.onSurfaceVariant,
        })}
      />
    );
  }

  const label = t.source.FromCarryover;
  const handleClick = onViewSource ? () => onViewSource(sourceEntityId) : undefined;

  return (
    <Chip
      icon={<LinkOutlinedIcon />}
      label={label}
      size="small"
      aria-label={label}
      onClick={handleClick}
      sx={theme => ({
        backgroundColor: theme.palette.infoContainer,
        color: theme.palette.onInfoContainer,
        "& .MuiChip-icon": { color: theme.palette.onInfoContainer },
      })}
    />
  );
}
