export const PROFILE_SECTION_GRID_SX = {
  display: "grid",
  gap: 3,
  minWidth: 0,
  width: "100%",
  gridTemplateColumns: {
    xs: "minmax(0, 1fr)",
    lg: "repeat(2, minmax(0, 1fr))",
  },
} as const;
