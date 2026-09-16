"use client";

import { useQuery } from "@apollo/client/react";
import { AddOutlined, ChevronRightOutlined } from "@mui/icons-material";
import { Alert, Box, Button, Tooltip, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import type { GridColDef } from "@mui/x-data-grid";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { StatusBadge } from "@/frontend/common/components/ui";
import { SectionPanel } from "@/frontend/common/components/ui/container";
import { AppDataGrid } from "@/frontend/common/components/ui/dataGrid";
import { PersonProfileLinkCell } from "@/frontend/common/components/ui/display/personProfileLink/PersonProfileLinkCell";
import { SearchBarField } from "@/frontend/common/components/ui/input/searchBarField";
import type { StudentsDirectoryQuery } from "@/frontend/common/graphql/generated/gql/graphql";
import { studentsDirectoryQueryDocument } from "@/frontend/common/graphql/sharedDocuments/students/student-directory.documents";
import { studentHref } from "@/frontend/common/utils/profileHref";
import { rtlFlipIconSx } from "@/frontend/common/utils/rtlFlipIconSx";
import { mergeSx } from "@/frontend/common/utils/sx/mergeSx";
import { useRouter } from "@/shared/i18n/navigation";
import { useAppTranslation } from "@/shared/locale/client";
import { DashboardBillingCreditAdjustment, DashboardStudentDirectory } from "@/shared/locale/namespaces";

type StudentCreditsRow = StudentsDirectoryQuery["studentsDirectory"][number];

/** Server-side search cap; the fetched page is paginated client-side by the grid. */
export const DIRECTORY_FETCH_LIMIT = 500;
const SEARCH_DEBOUNCE_MS = 300;
/** Balances at or below this threshold render the balance chip as a warning. */
const LOW_BALANCE_THRESHOLD = 3;

function buildAdjustHref(studentId: string): string {
  return `/accounting/credits/adjust?studentId=${studentId}`;
}

function creditBalanceStatus(classesRemaining: number | null): string {
  if (classesRemaining === null) return "UNSET";
  if (classesRemaining <= 0) return "EXHAUSTED";
  if (classesRemaining <= LOW_BALANCE_THRESHOLD) return "LOW";
  return "AVAILABLE";
}

function StudentCell({ row }: Readonly<{ row: StudentCreditsRow }>) {
  return (
    <Box sx={{ minWidth: 0, width: "100%" }}>
      <PersonProfileLinkCell
        href={row.id === null ? null : studentHref(row.id)}
        name={row.name ?? "—"}
        avatarUrl={row.avatarUrl}
        avatarSize={32}
        typographyVariant="bodyMd"
        fontWeight={600}
      />
    </Box>
  );
}

/** Renders the assigned teacher; an empty value stays a muted dash so it reads as "no data" instead of an error. */
function TeacherCell({ teacherName }: Readonly<{ teacherName: string | null }>) {
  if (teacherName === null || teacherName === "") {
    return (
      <Typography
        sx={theme => ({ fontSize: 13, color: theme.palette.onSurfaceVariant, width: "100%", textAlign: "center" })}
      >
        —
      </Typography>
    );
  }
  return <Typography sx={{ fontSize: 13 }}>{teacherName}</Typography>;
}

function BalanceCell({ row }: Readonly<{ row: StudentCreditsRow }>) {
  const label = `${row.classesRemaining ?? "—"} / ${row.classesTotal ?? "—"}`;
  return <StatusBadge category="creditBalance" status={creditBalanceStatus(row.classesRemaining)} label={label} />;
}

function AdjustAction({ studentId, label }: Readonly<{ studentId: string | null; label: string }>) {
  const router = useRouter();
  if (studentId === null) return null;
  const handleClick = () => router.push(buildAdjustHref(studentId));
  return (
    <Tooltip title={label}>
      {/* Phones get a compact icon-only chevron; from the `sm` breakpoint (tablets) up there is room for the labeled button. */}
      <Button size="small" variant="outlined" onClick={handleClick} aria-label={label} sx={adjustActionSx}>
        <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
          {label}
        </Box>
        <ChevronRightOutlined
          fontSize="small"
          aria-hidden
          sx={mergeSx(rtlFlipIconSx, { display: { xs: "inline-flex", sm: "none" } })}
        />
      </Button>
    </Tooltip>
  );
}

/** Full-strength outline so the row action reads as an enabled call-to-action, not a disabled button. */
const adjustActionSx: SxProps<Theme> = theme => ({
  textTransform: "none",
  letterSpacing: 0,
  borderColor: theme.palette.primary.main,
  color: theme.palette.primary.main,
  "&:hover": {
    borderColor: theme.palette.primary.dark,
  },
  // Icon-only below `sm`: give up the wide text-button min width for a compact ~40px target.
  minWidth: { xs: 40, sm: 64 },
  px: { xs: 0.5, sm: 1.5 },
});

/**
 * Grid styles:
 * - below `md` the teacher column drops out; MUI X sizes rows/headers from its JS column model,
 *   which still counts the hidden column, so the width custom properties are zeroed and the
 *   row/scrollbar widths rebase on the container — otherwise phones get a phantom horizontal
 *   scroll into an empty band past the last column;
 * - the MUI X column separator icons are suppressed (they render as stray accent ticks between headers).
 */
const gridSx: SxProps<Theme> = theme => ({
  [theme.breakpoints.down("md")]: {
    "& .MuiDataGrid-columnHeader[data-field='teacherName']": {
      display: "none",
      width: "0 !important",
    },
    "& .MuiDataGrid-cell[data-field='teacherName']": {
      display: "none",
      "--width": "0px !important",
    },
    // Rows, fillers and the scrollbar shim size from the JS width model that still counts the
    // hidden teacher column; rebasing them on the container keeps the phantom horizontal
    // scroll (and the dead zebra band past the last column) from appearing on phones/tablets.
    "--DataGrid-rowWidth": "100% !important",
    "--DataGrid-columnsTotalWidth": "100% !important",
    "& .MuiDataGrid-contentFiller, & .MuiDataGrid-scrollbarContent": { width: "100% !important" },
    "& .MuiDataGrid-virtualScrollerRenderZone, & .MuiDataGrid-row": { width: "100% !important" },
    // The JS model still reports horizontal overflow while the CSS widths fit, so its
    // end-of-row fillers and empty horizontal scrollbar shim are dead weight here.
    "& .MuiDataGrid-filler, & .MuiDataGrid-scrollbar--horizontal": { display: "none" },
    "& .MuiDataGrid-cellEmpty": { display: "none" },
  },
  [theme.breakpoints.down("sm")]: {
    // The actions column shrinks to an icon affordance on phones; its header text
    // no longer fits the compressed width, so it drops out with the label.
    "& .MuiDataGrid-columnHeader[data-field='actions'] .MuiDataGrid-columnHeaderTitle": { display: "none" },
  },
  "& .MuiDataGrid-iconSeparator": { display: "none" },
});

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
    () => [
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
    ],
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
        <Typography sx={{ fontSize: 12, color: theme => theme.palette.onSurfaceVariant }}>
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
