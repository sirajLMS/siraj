"use client";

import { useQuery } from "@apollo/client/react";
import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
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
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  return (
    <FormControl size={size} sx={{ minWidth, ...sx }} disabled={disabled} error={error}>
      <InputLabel>{label}</InputLabel>
      <Select
        value={value ?? ""}
        label={label}
        onChange={e => onChange((e.target.value as string) || null)}
        disabled={disabled || loading}
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
