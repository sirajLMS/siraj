export {
  ELLIPSIZED_TEXT_SX,
  EMPTY_GRID_MIN_HEIGHT_SX,
  EMPTY_VALUE_SX,
  SCROLLBAR_CUE_SX,
} from "@/frontend/common/views/dashboard/accounting/__shared__";

/**
 * Long combined headers (e.g. the From – To period column) wrap onto a second
 * line within the standard header height instead of clipping mid-word at the
 * column edge; wrapping stays at word boundaries only.
 */
export const HEADER_WRAP_SX = {
  "& .MuiDataGrid-columnHeaderTitle": {
    whiteSpace: "normal",
    overflowWrap: "normal",
    lineHeight: 1.25,
    fontSize: "0.7rem",
    letterSpacing: "0.04em",
  },
} as const;
