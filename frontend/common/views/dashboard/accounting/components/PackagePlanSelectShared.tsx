"use client";

import { useQuery } from "@apollo/client/react";
import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import type { SystemStyleObject } from "@mui/system";
import { packagePlansQueryDocument } from "@/frontend/common/graphql/sharedDocuments/accounting";

export interface PackagePlanSelectSharedProps {
  readonly value: string | null;
  readonly onChange: (value: string | null) => void;
  readonly label: string;
  readonly placeholder: string;
  /** Label for the "no package" (ad-hoc payment) option. */
  readonly adhocLabel: string;
  readonly disabled?: boolean;
  readonly error?: boolean;
  readonly size?: "small" | "medium";
  readonly minWidth?: number;
  readonly sx?: SxProps<Theme>;
}

/** Merges the default minWidth with caller sx (scalar | array | callback). */
/** Merges the default minWidth with caller sx (object | array | callback).
 * MUI's recursive SxProps union blocks typed nested arrays, so parts flatten:
 * object members merge into one object; callback members resolve at theme time. */
function composeSelectSx(sx: SxProps<Theme> | undefined, minWidth: number): SxProps<Theme> {
  // Single closure-return keeps a uniform declared type for SonarJS.
  const statics: SystemStyleObject<Theme> = { minWidth };
  const callbacks: Array<(theme: Theme) => SystemStyleObject<Theme>> = [];
  if (sx) {
    const parts: ReadonlyArray<SxProps<Theme>> = Array.isArray(sx) ? sx : [sx];
    for (const part of parts) {
      if (!part || typeof part === "boolean" || typeof part === "number" || typeof part === "string") continue;
      if (typeof part === "function") {
        callbacks.push(part);
        continue;
      }
      Object.assign(statics, part);
    }
  }
  return theme => {
    const resolved: SystemStyleObject<Theme> = { ...statics };
    for (const cb of callbacks) {
      Object.assign(resolved, cb(theme));
    }
    return resolved;
  };
}

/**
 * Active package-plan picker used by the Add Payment form. Lists ACTIVE plans
 * (sorted by sortOrder) so newly recorded payments always snapshot a live
 * catalog entry; archived plans disappear for new payments only.
 */
export function PackagePlanSelectShared({
  value,
  onChange,
  label,
  adhocLabel,
  disabled,
  error,
  size = "small",
  minWidth = 300,
  sx,
}: Readonly<PackagePlanSelectSharedProps>) {
  const { data, loading } = useQuery(packagePlansQueryDocument, {
    variables: { activeOnly: true, paginationArgs: null },
  });

  const plans = (data?.packagePlans ?? [])
    .filter(plan => plan.active)
    .toSorted((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  // Ternary form keeps boolean semantics while satisfying prefer-nullish rules.
  const selectDisabled = loading ? true : disabled;

  return (
    <FormControl size={size} sx={composeSelectSx(sx, minWidth)} disabled={disabled} error={error}>
      <InputLabel>{label}</InputLabel>
      <Select
        value={value ?? ""}
        label={label}
        onChange={e => onChange(e.target.value || null)}
        disabled={selectDisabled}
      >
        <MenuItem value="">{adhocLabel}</MenuItem>
        {plans.map(plan => (
          <MenuItem key={plan.id ?? plan.codename} value={plan.id ?? ""}>
            {`${plan.displayName} · ${Number(plan.creditHours).toFixed(0)}h · ${Number(plan.priceAmount).toFixed(0)} ${plan.currency ?? ""}`}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
