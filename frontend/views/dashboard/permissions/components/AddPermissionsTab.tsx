"use client";

import { Box, Checkbox } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { GridColDef } from "@mui/x-data-grid";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { AppDataGrid, SectionPanel } from "@/frontend/components/ui";
import type { Permission } from "@/frontend/graphql/generated/gql/graphql-types";
import { AddPermissionBulkBar } from "./AddPermissionBulkBar";
import { AddPermissionFilterBar } from "./AddPermissionFilterBar";

const StyledTabContainer = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: 24,
});

const StyledPermissionKeyCell = styled(Box)(({ theme }) => ({
  fontFamily: "JetBrains Mono, monospace",
  fontSize: "0.75rem",
  backgroundColor: theme.palette.surfaceVariant,
  color: theme.palette.onSurfaceVariant,
  padding: `${theme.spacing(0.5)} ${theme.spacing(1)}`,
  borderRadius: theme.shape.borderRadius,
  display: "inline-block",
}));

interface AddPermissionsTabProps {
  readonly filteredAvailablePermissions: readonly Permission[];
  readonly selectedAddPermissionIds: readonly string[];
  readonly searchQuery: string;
  readonly selectedCategory: string;
  readonly addCategories: readonly string[];
  readonly onAssignPermissions: () => void;
  readonly onPermissionToggle: (id: string, checked: boolean) => void;
  readonly onSearchChange: (value: string) => void;
  readonly onCategoryChange: (value: string) => void;
}

export function AddPermissionsTab({
  filteredAvailablePermissions,
  selectedAddPermissionIds,
  searchQuery,
  selectedCategory,
  addCategories,
  onAssignPermissions,
  onPermissionToggle,
  onSearchChange,
  onCategoryChange,
}: Readonly<AddPermissionsTabProps>) {
  const t = useTranslations("dashboard.permissions");

  const addPermissionsColumns = useMemo<GridColDef<Permission>[]>(() => {
    return [
      {
        field: "checkbox",
        headerName: "",
        width: 50,
        sortable: false,
        renderCell: params => {
          const id = params.row.id ?? "";
          const checked = selectedAddPermissionIds.includes(id);
          return <Checkbox size="small" checked={checked} onChange={e => onPermissionToggle(id, e.target.checked)} />;
        },
      },
      {
        field: "key",
        headerName: t("columnKey"),
        flex: 1,
        minWidth: 200,
        renderCell: params => <StyledPermissionKeyCell>{params.value as string}</StyledPermissionKeyCell>,
      },
      {
        field: "category",
        headerName: t("columnCategory"),
        width: 180,
      },
      {
        field: "description",
        headerName: t("columnDescription"),
        flex: 1.5,
        minWidth: 250,
      },
    ];
  }, [t, selectedAddPermissionIds, onPermissionToggle]);

  return (
    <StyledTabContainer>
      {/* Filter Bar */}
      <AddPermissionFilterBar
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        selectedCategory={selectedCategory}
        onCategoryChange={onCategoryChange}
        addCategories={addCategories}
        t={t}
      />

      {/* Bulk Action Bar */}
      {selectedAddPermissionIds.length > 0 && (
        <AddPermissionBulkBar
          selectedCount={selectedAddPermissionIds.length}
          onAssignPermissions={onAssignPermissions}
          t={t}
        />
      )}

      {/* Permissions Grid */}
      <SectionPanel title={t("addPermissions")}>
        <AppDataGrid<Permission>
          rows={filteredAvailablePermissions}
          columns={addPermissionsColumns}
          getRowId={row => row.id ?? row.key ?? ""}
          emptyMessage={t("noPermissionsFound")}
          autoHeight
        />
      </SectionPanel>
    </StyledTabContainer>
  );
}
