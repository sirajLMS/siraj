"use client";

import { useQuery } from "@apollo/client/react";
import { AddOutlined, SearchOutlined } from "@mui/icons-material";
import { Alert, Box, Button, Chip, InputAdornment, Stack, TextField, Tooltip, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BaseAvatar } from "@/frontend/common/components/ui/avatar";
import { SectionPanel } from "@/frontend/common/components/ui/container";
import { AppDataGrid } from "@/frontend/common/components/ui/dataGrid";
import type { StudentsDirectoryQuery } from "@/frontend/common/graphql/generated/gql/graphql";
import { studentsDirectoryQueryDocument } from "@/frontend/common/graphql/sharedDocuments/students/student-directory.documents";
import { useRouter } from "@/shared/i18n/navigation";
import { useAppTranslation } from "@/shared/locale/client";
import { DashboardBillingCreditAdjustment, DashboardStudentDirectory } from "@/shared/locale/namespaces";

type StudentCreditsRow = StudentsDirectoryQuery["studentsDirectory"][number];

type CreditChipColor = "success" | "warning" | "error" | "default";

/** Server-side search cap; the fetched page is paginated client-side by the grid. */
const DIRECTORY_FETCH_LIMIT = 500;
const SEARCH_DEBOUNCE_MS = 300;
/** Balances at or below this threshold render the balance chip as a warning. */
const LOW_BALANCE_THRESHOLD = 3;

const DESKTOP_GRID_HEIGHT = 520;

function buildAdjustHref(studentId: string): string {
  return `/accounting/credits/adjust?studentId=${studentId}`;
}

function creditBalanceColor(classesRemaining: number | null): CreditChipColor {
  if (classesRemaining === null) return "default";
  if (classesRemaining <= 0) return "error";
  if (classesRemaining <= LOW_BALANCE_THRESHOLD) return "warning";
  return "success";
}

function StudentCell({ row }: Readonly<{ row: StudentCreditsRow }>) {
  const truncated = {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  } as const;
  return (
    <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", minWidth: 0, width: "100%" }}>
      <BaseAvatar label={row.name ?? undefined} src={row.avatarUrl} size={32} />
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ ...truncated, fontWeight: 600, fontSize: 13 }}>{row.name ?? "—"}</Typography>
        <Typography sx={{ ...truncated, fontSize: 12, color: theme => theme.palette.onSurfaceVariant }}>
          {row.email ?? "—"}
        </Typography>
      </Box>
    </Stack>
  );
}

function BalanceCell({ row }: Readonly<{ row: StudentCreditsRow }>) {
  const label = `${row.classesRemaining ?? "—"} / ${row.classesTotal ?? "—"}`;
  return <Chip size="small" color={creditBalanceColor(row.classesRemaining)} label={label} />;
}

function AdjustAction({ studentId, label }: Readonly<{ studentId: string | null; label: string }>) {
  const router = useRouter();
  if (studentId === null) return null;
  return (
    <Tooltip title={label}>
      <Button size="small" variant="outlined" onClick={() => router.push(buildAdjustHref(studentId))}>
        {label}
      </Button>
    </Tooltip>
  );
}

export function StudentCreditsList() {
  const credits = useAppTranslation(DashboardBillingCreditAdjustment);
  const directory = useAppTranslation(DashboardStudentDirectory);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const variables = useMemo(() => ({ search: search === "" ? null : search, limit: DIRECTORY_FETCH_LIMIT }), [search]);

  const { data, loading, error } = useQuery(studentsDirectoryQueryDocument, {
    variables,
    fetchPolicy: "cache-and-network",
  });

  const rows = useMemo<StudentCreditsRow[]>(() => data?.studentsDirectory ?? [], [data]);

  const columns = useMemo<GridColDef<StudentCreditsRow>[]>(
    () => [
      {
        field: "name",
        headerName: directory.table.student,
        flex: 1.4,
        minWidth: 220,
        renderCell: params => <StudentCell row={params.row} />,
      },
      {
        field: "teacherName",
        headerName: credits.carryover.teacher,
        flex: 1,
        minWidth: 160,
        valueFormatter: value => (value === null || value === undefined || value === "" ? "—" : String(value)),
      },
      {
        field: "classesRemaining",
        headerName: directory.table.classesLeft,
        width: 150,
        align: "center",
        headerAlign: "center",
        renderCell: params => <BalanceCell row={params.row} />,
      },
      {
        field: "actions",
        headerName: directory.table.actions,
        width: 160,
        sortable: false,
        filterable: false,
        renderCell: params => <AdjustAction studentId={params.row.id} label={credits.adjustCredits} />,
      },
    ],
    [directory, credits]
  );

  return (
    <SectionPanel
      title={credits.title}
      actions={
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", flexWrap: "wrap" }}>
          <TextField
            size="small"
            placeholder={directory.searchPlaceholder}
            value={searchInput}
            onChange={event => setSearchInput(event.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchOutlined fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
            sx={{ minWidth: { xs: "100%", sm: 260 } }}
          />
          <Link href="/accounting/credits/adjust" style={{ textDecoration: "none" }}>
            <Button variant="contained" startIcon={<AddOutlined />}>
              {credits.adjustCredits}
            </Button>
          </Link>
        </Stack>
      }
    >
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {directory.errors.loadFailed}
        </Alert>
      ) : null}
      <Box sx={{ width: "100%", height: DESKTOP_GRID_HEIGHT }}>
        <AppDataGrid<StudentCreditsRow>
          rows={rows}
          columns={columns}
          loading={loading}
          emptyMessage={directory.noEntries}
          ariaLabel={credits.title}
          rowHeight={64}
          disableColumnMenu
          paginationOptions={{ mode: "client" }}
        />
      </Box>
    </SectionPanel>
  );
}
