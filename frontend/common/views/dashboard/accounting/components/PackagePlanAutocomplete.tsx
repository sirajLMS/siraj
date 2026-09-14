"use client";

import { useQuery } from "@apollo/client/react";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import Autocomplete, { createFilterOptions } from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import InputAdornment from "@mui/material/InputAdornment";
import type { SxProps, Theme } from "@mui/material/styles";
import TextField from "@mui/material/TextField";
import type { SystemStyleObject } from "@mui/system";
import type * as React from "react";
import { useMemo } from "react";
import type { PackagePlansQuery_packagePlans } from "@/frontend/common/graphql/generated/gql/graphql";
import { packagePlansQueryDocument } from "@/frontend/common/graphql/sharedDocuments/accounting";

export interface PackagePlanAutocompleteProps {
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
 * One entry in the package-plan dropdown. `id: null` marks the ad-hoc
 * ("no package") sentinel option; `plan: null` never occurs in the rendered
 * option list and only models a value that has no matching active plan.
 */
interface PackagePlanOption {
  readonly id: string | null;
  readonly plan: PackagePlansQuery_packagePlans | null;
}

const ADHOC_OPTION: PackagePlanOption = { id: null, plan: null };

/** Formats a catalog plan as "name · hours · price currency". */
function buildPlanOptionLabel(plan: PackagePlansQuery_packagePlans): string {
  return `${plan.displayName ?? ""} · ${Number(plan.creditHours ?? 0).toFixed(0)}h · ${Number(
    plan.priceAmount ?? 0
  ).toFixed(0)} ${plan.currency ?? ""}`;
}

const filterOptions = createFilterOptions<PackagePlanOption>({
  matchFrom: "any",
  stringify: option => (option.plan ? buildPlanOptionLabel(option.plan) : ""),
});

/** Merges the default minWidth with caller sx (object | array | callback).
 * MUI's recursive SxProps union blocks typed nested arrays, so parts flatten:
 * object members merge into one object; callback members resolve at theme time. */
function composeAutocompleteSx(sx: SxProps<Theme> | undefined, minWidth: number): SxProps<Theme> {
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
 * catalog entry; archived plans disappear for new payments only. Selecting the
 * ad-hoc option (or clearing the field) resolves to `null`.
 */
export function PackagePlanAutocomplete({
  value,
  onChange,
  label,
  placeholder,
  adhocLabel,
  disabled,
  error,
  size = "small",
  minWidth = 300,
  sx,
}: Readonly<PackagePlanAutocompleteProps>) {
  const { data, loading } = useQuery(packagePlansQueryDocument, {
    variables: { activeOnly: true, paginationArgs: null },
  });

  const options = useMemo<PackagePlanOption[]>(() => {
    const planOptions = (data?.packagePlans ?? [])
      .filter(plan => plan.active)
      .toSorted((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map(plan => ({ id: plan.id ?? "", plan }));
    return [ADHOC_OPTION, ...planOptions];
  }, [data]);

  // A selected plan that is still loading (or has since been archived) has no
  // matching option; the field then falls back to an empty searchable input
  // instead of rendering the raw plan id.
  const selectedOption = useMemo(() => options.find(option => option.id === value) ?? null, [options, value]);

  return (
    <Autocomplete<PackagePlanOption>
      options={options}
      loading={loading}
      autoHighlight
      disabled={disabled}
      value={selectedOption}
      sx={composeAutocompleteSx(sx, minWidth)}
      onChange={(_: React.SyntheticEvent, newValue: PackagePlanOption | null) => {
        onChange(newValue?.id ?? null);
      }}
      isOptionEqualToValue={(option, selected) => option.id === selected.id}
      getOptionLabel={option => (option.plan ? buildPlanOptionLabel(option.plan) : "")}
      filterOptions={filterOptions}
      renderOption={(props, option) => {
        const { key, ...optionProps } = props;
        const optionLabel = option.plan ? buildPlanOptionLabel(option.plan) : adhocLabel;
        return (
          <Box key={key} component="li" {...optionProps}>
            {optionLabel}
          </Box>
        );
      }}
      renderInput={params => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          error={error}
          size={size}
          slotProps={{
            ...params.slotProps,
            input: {
              ...params.slotProps.input,
              startAdornment: (
                <>
                  <InputAdornment position="start">
                    <SearchOutlinedIcon fontSize="small" />
                  </InputAdornment>
                  {params.slotProps.input?.startAdornment}
                </>
              ),
            },
            htmlInput: {
              ...params.slotProps.htmlInput,
              autoComplete: "off",
            },
          }}
        />
      )}
    />
  );
}
