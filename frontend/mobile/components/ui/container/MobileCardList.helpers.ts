import type { SxProps, Theme } from "@mui/material";
import type { SystemStyleObject } from "@mui/system";
import type { ListPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";

const DEFAULT_CLIENT_PAGE_SIZE = 10;

export type SxArrayElement = boolean | SystemStyleObject<Theme> | ((theme: Theme) => SystemStyleObject<Theme>);

function isSxArray(sx: SxProps<Theme> | undefined): sx is ReadonlyArray<SxArrayElement> {
  return Array.isArray(sx);
}

export function normalizeSx(sx: SxProps<Theme> | undefined): SxArrayElement[] {
  if (isSxArray(sx)) {
    return [...sx];
  }
  if (sx) {
    return [sx];
  }
  return [];
}

export function resolveClientPageSize(paginationOptions: ListPaginationOptions): number {
  if (paginationOptions !== false && paginationOptions.mode === "client") {
    return paginationOptions.pageSize ?? DEFAULT_CLIENT_PAGE_SIZE;
  }
  return DEFAULT_CLIENT_PAGE_SIZE;
}

export function computeClientPageCount(rowsLength: number, clientPageSize: number): number {
  return Math.max(1, Math.ceil(rowsLength / clientPageSize) || 1);
}
