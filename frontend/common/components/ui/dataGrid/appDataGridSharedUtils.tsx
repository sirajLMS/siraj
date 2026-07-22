import { useMemo } from "react";

export const defaultGridSx = {
  border: "none",
  borderRadius: 0,
  "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within": {
    outline: "none",
  },
  "& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within": {
    outline: "none",
  },
} as const;

export function createNoRowsOverlay(Overlay: React.ComponentType<{ message: string }>, message: string) {
  return function NoRowsOverlay() {
    return <Overlay message={message} />;
  };
}

export function useAppDataGridNoRowsOverlay(message: string, Overlay: React.ComponentType<{ message: string }>) {
  return useMemo(() => createNoRowsOverlay(Overlay, message), [Overlay, message]);
}
