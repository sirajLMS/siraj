import type { Theme } from "@mui/material/styles";

// NEW FOR PLAN v5 (newly created for the migration wave)
// Lifted from frontend/{mobile,desktop}/.../recurring/components/dayScheduleRow.{mobile,desktop}.tsx (specs.md §3 N9)
// — these two pure-data style-builder helpers were duplicated (or near-duplicated) across the tier pair. Pure-data
// helpers must live once in common per the Three Inviolable Rules.

export function overrideTimePickerTextFieldSx(theme: Theme) {
  return {
    width: 150,
    "& .MuiOutlinedInput-root": {
      borderColor: theme.palette.sidebar,
      borderWidth: 2,
    },
  };
}

export function overrideTimePickerInputSx(theme: Theme) {
  return {
    fontWeight: 700,
    color: theme.palette.sidebar,
  };
}
