/** HTML id of the dialog form so the submit button in DialogActions can target it. */
export const FORM_ID = "carryover-form";

export const FORM_GRID_SX = {
  display: "grid",
  gap: 2,
  pt: 1,
  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
} as const;

export const FULL_WIDTH_CELL_SX = { gridColumn: "1 / -1" } as const;
