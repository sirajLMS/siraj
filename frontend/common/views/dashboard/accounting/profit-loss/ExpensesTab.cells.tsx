"use client";

import { LinkOutlined } from "@mui/icons-material";
import { Box, Stack, Tooltip, Typography } from "@mui/material";
import { StatusBadge } from "@/frontend/common/components/ui/badge/StatusBadge";
import { ExpenseType } from "@/frontend/common/graphql/generated/gql/graphql";
import type { ProfitLossExpenseRow } from "@/frontend/common/views/dashboard/accounting/profit-loss/useProfitLossViewModel";
import { EXPENSE_SOURCE_CARRYOVER_BALANCES } from "@/shared/constants/expenses";
import type { ExpensesLabels } from "@/shared/locale/types/dashboard/accounting/expenses";

/** Maps the codegen enum onto the backend aggregate's per-type tally keys. */
const AGGREGATE_KEY_BY_TYPE: Record<ExpenseType, string> = {
  [ExpenseType.Salaries]: "Salaries",
  [ExpenseType.Marketing]: "Marketing",
  [ExpenseType.Logistics]: "Logistics",
  [ExpenseType.Technology]: "Technology",
};

const TYPE_LABEL_KEY_BY_TYPE: Record<ExpenseType, keyof ExpensesLabels["type"]> = {
  [ExpenseType.Salaries]: "Salaries",
  [ExpenseType.Marketing]: "Marketing",
  [ExpenseType.Logistics]: "Logistics",
  [ExpenseType.Technology]: "Technology",
};

const EXPENSE_TYPES: readonly ExpenseType[] = [
  ExpenseType.Salaries,
  ExpenseType.Marketing,
  ExpenseType.Logistics,
  ExpenseType.Technology,
];

function expenseTypeLabel(labels: ExpensesLabels, type: ExpenseType): string {
  return labels.type[TYPE_LABEL_KEY_BY_TYPE[type]];
}

/** Resolves a `rowCountByType` aggregate key to the codegen enum, or null when unknown. */
function expenseTypeFromAggregateKey(key: string): ExpenseType | null {
  for (const type of EXPENSE_TYPES) {
    if (AGGREGATE_KEY_BY_TYPE[type] === key) return type;
  }
  return null;
}

/**
 * Type chip cell: renders the expense's category with the same colors the
 * expense ledger grid uses, or the muted dash when the category is absent.
 */
export function ExpenseTypeCell({
  type,
  typeLabels,
  empty,
}: Readonly<{ type: ExpenseType | null; typeLabels: ExpensesLabels; empty: string }>) {
  if (type === null) return <Box component="span">{empty}</Box>;
  const label = expenseTypeLabel(typeLabels, type);
  return <StatusBadge category="expenseType" status={type} label={label} />;
}

interface ExpenseSourceCellProps {
  readonly row: ProfitLossExpenseRow;
  readonly sourceLabels: ExpensesLabels["source"];
  /** Opens the linked carryover balance's detail drawer. */
  readonly onOpenCarryover: (sourceEntityId: string) => void;
}

/**
 * Source chip cell: "Manual" for hand-entered rows, a linked "From Carryover"
 * chip for settlement-produced rows that opens the carryover drawer on click.
 * The chip swallows its own click so the row navigation never fires.
 */
export function ExpenseSourceCell({ row, sourceLabels, onOpenCarryover }: Readonly<ExpenseSourceCellProps>) {
  if (row.sourceEntity === EXPENSE_SOURCE_CARRYOVER_BALANCES) {
    const clickable = row.sourceEntityId !== null;
    const chip = (
      <StatusBadge
        category="expenseSource"
        status="carryover"
        label={sourceLabels.FromCarryover}
        icon={<LinkOutlined fontSize="small" />}
      />
    );
    if (!clickable) return chip;
    return (
      <Tooltip title={sourceLabels.FromCarryover}>
        <span>
          <Box
            component="a"
            onClick={event => {
              event.stopPropagation();
              if (row.sourceEntityId !== null) onOpenCarryover(row.sourceEntityId);
            }}
            sx={{ display: "inline-flex", cursor: "pointer", textDecoration: "none" }}
          >
            {chip}
          </Box>
        </span>
      </Tooltip>
    );
  }
  return <StatusBadge category="expenseSource" status="manual" label={sourceLabels.Manual} />;
}

interface ExpenseTypeTallyProps {
  readonly typeKey: string;
  readonly typeLabels: ExpensesLabels;
  readonly count: number;
}

/** Footer type tally: the same badge the rows render plus its whole-month count. */
export function ExpenseTypeTally({ typeKey, typeLabels, count }: Readonly<ExpenseTypeTallyProps>) {
  const type = expenseTypeFromAggregateKey(typeKey);
  if (type === null) return null;
  return (
    <Stack direction="row" sx={{ alignItems: "center", gap: 0.5 }}>
      <StatusBadge category="expenseType" status={type} label={expenseTypeLabel(typeLabels, type)} />
      <Typography variant="bodyMd">{count}</Typography>
    </Stack>
  );
}
