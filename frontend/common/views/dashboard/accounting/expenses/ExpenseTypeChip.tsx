"use client";

import { Chip } from "@mui/material";
import { ExpenseType } from "@/frontend/common/graphql/generated/gql/graphql";
import { useAppTranslation } from "@/shared/locale/client";
import { DashboardAccountingExpenses } from "@/shared/locale/namespaces";

export interface ExpenseTypeChipProps {
  readonly type: ExpenseType;
}

/**
 * Category chip for an expense ledger row, colouring each expense type with a
 * distinct theme palette family so grid scanning is fast: Salaries reads as
 * violet (completed-family tokens), Marketing as amber (warning), Logistics as
 * blue (info), and Technology as green (success). The `aria-label` carries the
 * full localized label so grid cells stay legible to screen readers.
 */
export function ExpenseTypeChip({ type }: Readonly<ExpenseTypeChipProps>) {
  const t = useAppTranslation(DashboardAccountingExpenses);
  const labelsByType: Record<ExpenseType, string> = {
    [ExpenseType.Salaries]: t.type.Salaries,
    [ExpenseType.Marketing]: t.type.Marketing,
    [ExpenseType.Logistics]: t.type.Logistics,
    [ExpenseType.Technology]: t.type.Technology,
  };
  const label = labelsByType[type];

  return (
    <Chip
      label={label}
      size="small"
      aria-label={label}
      sx={theme => {
        const colorsByType: Record<ExpenseType, { backgroundColor: string; color: string }> = {
          [ExpenseType.Salaries]: {
            backgroundColor: theme.palette.status.completedContainer,
            color: theme.palette.status.onCompletedContainer,
          },
          [ExpenseType.Marketing]: {
            backgroundColor: theme.palette.warningContainer,
            color: theme.palette.onWarningContainer,
          },
          [ExpenseType.Logistics]: {
            backgroundColor: theme.palette.infoContainer,
            color: theme.palette.onInfoContainer,
          },
          [ExpenseType.Technology]: {
            backgroundColor: theme.palette.successContainer,
            color: theme.palette.onSuccessContainer,
          },
        };
        return colorsByType[type];
      }}
    />
  );
}
