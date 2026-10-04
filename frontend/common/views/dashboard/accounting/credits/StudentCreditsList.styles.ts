import type { SxProps, Theme } from "@mui/material/styles";

/** Full-strength outline so the row action reads as an enabled call-to-action, not a disabled button. */
export const adjustActionSx: SxProps<Theme> = theme => ({
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
export const gridSx: SxProps<Theme> = theme => ({
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
