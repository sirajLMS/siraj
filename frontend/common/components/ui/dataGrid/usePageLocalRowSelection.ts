"use client";

import type { GridRowId, GridRowSelectionModel } from "@mui/x-data-grid";
import { useCallback, useMemo } from "react";

interface PageLocalRowSelectionArgs {
  readonly selectedIds: readonly string[];
  readonly toggleSelected: (id: string) => void;
  readonly clearSelection: () => void;
  readonly onPageChange: (page: number) => void;
  readonly onPageSizeChange: (pageSize: number) => void;
}

interface PageLocalRowSelection {
  readonly rowSelectionModel: GridRowSelectionModel;
  readonly onSelectionChange: (model: GridRowSelectionModel) => void;
  readonly onPageChange: (page: number) => void;
  readonly onPageSizeChange: (pageSize: number) => void;
}

/**
 * Store-backed checkbox selection for server-paginated grids. Checkbox diffs
 * map onto the store's toggle (each added or removed id flips once), and page
 * turns drop the selection so bulk actions always act on rows the operator can
 * see.
 */
export function usePageLocalRowSelection(args: PageLocalRowSelectionArgs): PageLocalRowSelection {
  const { selectedIds, toggleSelected, clearSelection, onPageChange, onPageSizeChange } = args;
  const rowSelectionModel = useMemo<GridRowSelectionModel>(
    () => ({ type: "include", ids: new Set<GridRowId>(selectedIds) }),
    [selectedIds]
  );

  const onSelectionChange = useCallback(
    (model: GridRowSelectionModel) => {
      const nextIds = new Set(Array.from(model.ids, String));
      for (const id of selectedIds) {
        if (!nextIds.has(id)) toggleSelected(id);
      }
      for (const id of nextIds) {
        if (!selectedIds.includes(id)) toggleSelected(id);
      }
    },
    [selectedIds, toggleSelected]
  );

  const handlePageChange = useCallback(
    (nextPage: number) => {
      if (selectedIds.length > 0) clearSelection();
      onPageChange(nextPage);
    },
    [clearSelection, onPageChange, selectedIds.length]
  );
  const handlePageSizeChange = useCallback(
    (nextPageSize: number) => {
      if (selectedIds.length > 0) clearSelection();
      onPageSizeChange(nextPageSize);
    },
    [clearSelection, onPageSizeChange, selectedIds.length]
  );

  return {
    rowSelectionModel,
    onSelectionChange,
    onPageChange: handlePageChange,
    onPageSizeChange: handlePageSizeChange,
  };
}
