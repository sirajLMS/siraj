export const defaultGridSx = {
  border: "none",
  borderRadius: 0,
  "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within": {
    outline: "none",
  },
  "& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within": {
    outline: "none",
  },
  // Row hover effect: subtle primary tint on hover for better interactivity.
  "& .MuiDataGrid-row:hover": {
    backgroundColor: "color-mix(in srgb, var(--mui-palette-primary-main) 6%, transparent)",
  },
  // Zebra striping: alternating row backgrounds for better readability.
  "& .MuiDataGrid-row:nth-of-type(even)": {
    backgroundColor: "color-mix(in srgb, var(--mui-palette-common-black) 3%, transparent)",
  },
  // Better row height + cell padding for readability.
  "& .MuiDataGrid-row": {
    minHeight: "52px !important",
  },
  "& .MuiDataGrid-cell": {
    padding: "0 12px",
  },
} as const;

export function createNoRowsOverlay(Overlay: React.ComponentType<{ message: string }>, message: string) {
  return function NoRowsOverlay() {
    return <Overlay message={message} />;
  };
}
