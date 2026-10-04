/** HTML id of the dialog form so the submit button in DialogActions can target it. */
export const FORM_ID = "payroll-override-form";

/** Two-column summary layout on wide viewports, single column on phones. */
export const SUMMARY_GRID_SX = {
  display: "grid",
  gap: 2,
  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
} as const;
