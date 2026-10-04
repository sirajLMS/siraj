import type { Theme } from "@mui/material/styles";
import type { StatusBadgeCategory } from "@/frontend/common/components/ui/badge/types/statusBadgeShared.types";

interface StatusColorPair {
  backgroundColor: string;
  color: string;
}

/**
 * Neutral surface colors used when a category/status pair has no dedicated
 * palette mapping.
 */
function getFallbackStatusColors(theme: Theme): StatusColorPair {
  return {
    backgroundColor: theme.palette.surfaceContainerHigh,
    color: theme.palette.onSurfaceVariant,
  };
}

/**
 * Reads a string value from a palette object with a runtime type guard,
 * avoiding unsafe template-literal type assertions.
 */
function getPaletteEntryValue(palette: object, key: string): string {
  const value = Reflect.get(palette, key);
  return typeof value === "string" ? value : "";
}

/**
 * Resolves a container token to its `{ backgroundColor, color }` pair.
 *
 * `"status."`-prefixed tokens resolve against `theme.palette.status`; bare
 * tokens resolve against the root palette. Each container key is paired with
 * its `on<Key>Container` sibling for contrast; a missing container value
 * falls back to neutral surface colors.
 */
function getContainerColorPair(theme: Theme, containerToken: string): StatusColorPair {
  const isStatusScoped = containerToken.startsWith("status.");
  const palette = isStatusScoped ? theme.palette.status : theme.palette;
  const key = isStatusScoped ? containerToken.slice("status.".length) : containerToken;
  const capitalizedKey = `${key.charAt(0).toUpperCase()}${key.slice(1)}`;
  const backgroundColor = getPaletteEntryValue(palette, `${key}Container`);
  if (!backgroundColor) {
    return getFallbackStatusColors(theme);
  }
  return {
    backgroundColor,
    color: getPaletteEntryValue(palette, `on${capitalizedKey}Container`),
  };
}

/**
 * Maps each category's raw status values to a container palette token.
 *
 * `"status."`-prefixed tokens resolve against `theme.palette.status`; bare
 * tokens resolve against the root palette. Categories absent from this map
 * (or with an unrecognized status) resolve through the category fallback
 * token or neutral surface colors.
 */
const CATEGORY_CONTAINER_TOKEN_MAPS: Partial<Record<StatusBadgeCategory, Record<string, string>>> = {
  session: {
    active: "status.active",
    pending: "status.pending",
    blocked: "status.blocked",
    confirmed: "status.confirmed",
    completed: "status.completed",
    cancelled: "status.cancelled",
  },
  studentAccount: {
    regular: "status.active",
    deactivated: "status.cancelled",
    suspended: "status.blocked",
    on_leave: "secondary",
    on_trial: "status.pending",
  },
  staffAccount: {
    activated: "status.active",
    deactivated: "status.cancelled",
  },
  enrollment: {
    regular: "status.active",
    prospect: "status.pending",
    withdrawn: "status.cancelled",
  },
  expenseType: {
    SALARIES: "status.completed",
    MARKETING: "warning",
    LOGISTICS: "info",
    TECHNOLOGY: "success",
  },
  expenseSource: {
    carryover: "info",
  },
  payrollCalculation: {
    REFUND: "error",
    CALCULATED: "info",
    PARTIALLY: "warning",
    WAITING_PAID: "secondary",
    PAID: "status.completed",
  },
  creditBalance: {
    EXHAUSTED: "error",
    LOW: "warning",
    AVAILABLE: "status.completed",
  },
};

/**
 * Fallback container tokens for categories whose unrecognized statuses
 * resolve to a semantic palette key instead of neutral surface colors.
 */
const CATEGORY_FALLBACK_TOKENS: Partial<Record<StatusBadgeCategory, string>> = {
  session: "status.pending",
};

/**
 * Returns `{ backgroundColor, color }` for categories that bypass semantic
 * palette keys, or neutral surface colors when the category has no mapping.
 */
export function resolveCategorySpecificColors(
  theme: Theme,
  category: StatusBadgeCategory,
  status: string
): StatusColorPair {
  const containerToken = CATEGORY_CONTAINER_TOKEN_MAPS[category]?.[status] ?? CATEGORY_FALLBACK_TOKENS[category];
  if (!containerToken) {
    return getFallbackStatusColors(theme);
  }
  return getContainerColorPair(theme, containerToken);
}
