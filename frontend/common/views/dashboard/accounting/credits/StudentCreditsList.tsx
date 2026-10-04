"use client";

import { useQuery } from "@apollo/client/react";
import { AddOutlined } from "@mui/icons-material";
import { Alert, Button, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { SectionPanel } from "@/frontend/common/components/ui/container";
import { AppDataGrid } from "@/frontend/common/components/ui/dataGrid";
import { SearchBarField } from "@/frontend/common/components/ui/input/searchBarField";
import { studentsDirectoryQueryDocument } from "@/frontend/common/graphql/sharedDocuments/students/student-directory.documents";
import {
  AdjustAction,
  BalanceCell,
  StudentCell,
  TeacherCell,
} from "@/frontend/common/views/dashboard/accounting/credits/StudentCreditsList.cells";
import { SEARCH_DEBOUNCE_MS } from "@/frontend/common/views/dashboard/accounting/credits/StudentCreditsList.helpers";
import { gridSx } from "@/frontend/common/views/dashboard/accounting/credits/StudentCreditsList.styles";
import type { StudentCreditsRow } from "@/frontend/common/views/dashboard/accounting/credits/StudentCreditsList.types";
import { useAppTranslation } from "@/shared/locale/client";
import { DashboardBillingCreditAdjustment, DashboardStudentDirectory } from "@/shared/locale/namespaces";

/** Server-side search cap; the fetched page is paginated client-side by the grid. */
export const DIRECTORY_FETCH_LIMIT = 500;

function buildStudentCreditsColumns(
  directory: { readonly table: { readonly student: string; readonly classesLeft: string; readonly actions: string } },
  credits: { readonly carryover: { readonly teacher: string }; readonly adjustCredits: string }
): GridColDef<StudentCreditsRow>[] {
  return [
    {
      field: "name",
      headerName: directory.table.student,
      flex: 1.6,
      minWidth: 132,
      renderCell: params => <StudentCell row={params.row} />,
    },
    {
      field: "teacherName",
      headerName: credits.carryover.teacher,
      flex: 1.2,
      minWidth: 148,
      renderCell: params => <TeacherCell teacherName={params.value} />,
    },
    {
      field: "classesRemaining",
      headerName: directory.table.classesLeft,
      flex: 0.8,
      // Sized so the full header label and the balance chip never need ellipsis on phones.
      minWidth: 148,
      maxWidth: 160,
      align: "center",
      headerAlign: "center",
      renderCell: params => <BalanceCell row={params.row} />,
    },
    {
      field: "actions",
      headerName: directory.table.actions,
      // Below `sm` the row action is a ~40px icon-only button, so the column only
      // needs enough room not to squeeze it; wider tiers let flex spread it out.
      flex: 0.6,
      minWidth: 64,
      maxWidth: 168,
      align: "center",
      headerAlign: "center",
      sortable: false,
      filterable: false,
      renderCell: params => <AdjustAction studentId={params.row.id} label={credits.adjustCredits} />,
    },
  ];
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

  // A result set equal to the fetch cap almost certainly means the directory
  // search was truncated server-side; the operator must refine the search to
  // reach the omitted rows.
  const hitsFetchCap = error === undefined && rows.length === DIRECTORY_FETCH_LIMIT;

  const columns = useMemo<GridColDef<StudentCreditsRow>[]>(
    () => buildStudentCreditsColumns(directory, credits),
    [directory, credits]
  );

  return (
    <SectionPanel
      title={credits.title}
      actions={
        <>
          <SearchBarField
            value={searchInput}
            placeholder={directory.searchPlaceholder}
            onChange={setSearchInput}
            sx={{ minWidth: { xs: "100%", sm: 260 } }}
          />
          <Link href="/accounting/credits/adjust" style={{ textDecoration: "none" }}>
            <Button variant="contained" startIcon={<AddOutlined />}>
              {credits.adjustCredits}
            </Button>
          </Link>
        </>
      }
    >
      {error ? <Alert severity="error">{directory.errors.loadFailed}</Alert> : null}
      {hitsFetchCap ? (
        <Typography
          sx={{ fontSize: theme => theme.typography.caption.fontSize, color: theme => theme.palette.onSurfaceVariant }}
        >
          {credits.resultsCappedHint(DIRECTORY_FETCH_LIMIT)}
        </Typography>
      ) : null}
      {/* autoHeight sizes the grid to its rows: no clipped last row and no dead space under it. */}
      <AppDataGrid<StudentCreditsRow>
        rows={rows}
        columns={columns}
        loading={loading}
        emptyMessage={directory.noEntries}
        ariaLabel={credits.title}
        rowHeight={64}
        disableColumnMenu
        autoHeight
        paginationOptions={{ mode: "client" }}
        sx={gridSx}
      />
    </SectionPanel>
  );
}
