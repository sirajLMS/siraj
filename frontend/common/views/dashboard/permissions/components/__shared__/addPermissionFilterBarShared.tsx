"use client";

import { styled } from "@mui/material/styles";
import type { AddPermissionFilterBarSharedProps } from "@/frontend/common/views/dashboard/permissions/types/addPermissionFilterBarShared.types";

const StyledFilterContainer = styled("div", {
  shouldForwardProp: prop => prop !== "variant",
})<{ readonly variant: "desktop" | "mobile" }>(({ theme, variant }) => ({
  padding: theme.spacing(2),
  borderRadius: 8,
  backgroundColor: theme.palette.surfaceContainerLow ?? theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  display: "flex",
  gap: theme.spacing(2),
  ...(variant === "desktop"
    ? {
        flexDirection: "row" as const,
        alignItems: "center" as const,
        justifyContent: "space-between" as const,
      }
    : {
        flexDirection: "column" as const,
        alignItems: "stretch" as const,
      }),
}));

export function AddPermissionFilterBarShared({ props, slots }: Readonly<AddPermissionFilterBarSharedProps>) {
  const { SearchSlot, CategorySlot, variant } = slots;
  const { searchQuery, onSearchChange, selectedCategory, onCategoryChange, addCategories, t } = props;

  return (
    <StyledFilterContainer variant={variant}>
      <SearchSlot searchQuery={searchQuery} onSearchChange={onSearchChange} t={t} />
      <CategorySlot
        selectedCategory={selectedCategory}
        onCategoryChange={onCategoryChange}
        addCategories={addCategories}
        t={t}
      />
    </StyledFilterContainer>
  );
}
