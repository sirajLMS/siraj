"use client";

import { FormControl, InputLabel, MenuItem, Select, type SelectChangeEvent, Stack } from "@mui/material";
import { SearchBarField } from "@/frontend/common/components/ui/input/searchBarField";
import { QuotaKind, QuotaStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import type { QuotaLabels } from "@/shared/locale/types/dashboard/billing/quota";

interface QuotaListDesktopFilterControlsProps {
  readonly t: QuotaLabels;
  readonly searchQuery: string;
  readonly filterStatus: QuotaStatus | null;
  readonly filterKind: QuotaKind | null;
  readonly setSearchQuery: (query: string) => void;
  readonly setFilterStatus: (status: QuotaStatus | null) => void;
  readonly setFilterKind: (kind: QuotaKind | null) => void;
}

export function QuotaListDesktopFilterControls({
  t,
  searchQuery,
  filterStatus,
  filterKind,
  setSearchQuery,
  setFilterStatus,
  setFilterKind,
}: Readonly<QuotaListDesktopFilterControlsProps>) {
  return (
    <Stack direction="row" spacing={2} sx={{ flex: 1, flexWrap: "wrap" }}>
      <SearchBarField value={searchQuery} placeholder={t.listTitle} onChange={setSearchQuery} sx={{ maxWidth: 300 }} />

      <FormControl size="small" sx={{ minWidth: 140 }}>
        <InputLabel>{t.fields.status}</InputLabel>
        <Select<QuotaStatus | "">
          value={filterStatus ?? ""}
          label={t.fields.status}
          onChange={(e: SelectChangeEvent<QuotaStatus | "">) => {
            const val = e.target.value;
            setFilterStatus(val === "" ? null : val);
          }}
        >
          <MenuItem value="">{t.fields.all}</MenuItem>
          <MenuItem value={QuotaStatus.Active}>{t.statuses.ACTIVE}</MenuItem>
          <MenuItem value={QuotaStatus.Expired}>{t.statuses.EXPIRED}</MenuItem>
          <MenuItem value={QuotaStatus.Archived}>{t.statuses.ARCHIVED}</MenuItem>
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 140 }}>
        <InputLabel>{t.fields.kind}</InputLabel>
        <Select<QuotaKind | "">
          value={filterKind ?? ""}
          label={t.fields.kind}
          onChange={(e: SelectChangeEvent<QuotaKind | "">) => {
            const val = e.target.value;
            setFilterKind(val === "" ? null : val);
          }}
        >
          <MenuItem value="">{t.fields.all}</MenuItem>
          <MenuItem value={QuotaKind.Package}>{t.kinds.PACKAGE}</MenuItem>
          <MenuItem value={QuotaKind.Periodic}>{t.kinds.PERIODIC}</MenuItem>
        </Select>
      </FormControl>
    </Stack>
  );
}
