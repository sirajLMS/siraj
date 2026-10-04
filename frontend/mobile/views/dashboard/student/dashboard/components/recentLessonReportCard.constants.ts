export const metaTruncateTextSx = {
  minWidth: 0,
  overflow: "hidden",
  flex: "1 1 auto",
  "& .MuiTypography-root": {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
} as const;

export const teacherMetaSx = {
  ...metaTruncateTextSx,
  minWidth: 0,
  "& a": {
    display: "block",
    minWidth: 0,
    overflow: "hidden",
  },
} as const;

export const dateDurationMetaSx = {
  display: "flex",
  alignItems: "center",
  gap: 0.75,
  minWidth: 0,
  overflow: "hidden",
  justifyContent: "flex-end",
} as const;

export const metaRowSx = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto minmax(0, 1fr)",
  alignItems: "center",
  gap: 0.75,
  minWidth: 0,
  overflow: "hidden",
} as const;

export const narrowMobileMaxWidth = 400;

export const reflectionButtonSx = {
  flexShrink: 0,
  px: 0.5,
  minWidth: 0,
  typography: "labelSm",
  fontWeight: 700,
  textTransform: "uppercase",
  whiteSpace: "nowrap",
} as const;
