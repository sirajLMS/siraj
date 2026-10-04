import type { Theme } from "@mui/material/styles";

export const PAPER_SX = { width: { xs: "100%", sm: 460 }, maxWidth: "100%" } as const;

export const SCROLL_BODY_SX = { flex: 1, overflowY: "auto", px: 2.5, py: 3 } as const;

export const SUMMARY_GRID_SX = {
  display: "grid",
  gap: 2.5,
  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
} as const;

export const FULL_WIDTH_SX = { gridColumn: "1 / -1" } as const;

export const fieldLabelSx = (theme: Theme) => ({ color: theme.palette.onSurfaceVariant });

export const HEADER_SX = (theme: Theme) => ({
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 1,
  px: 2.5,
  py: 2,
  borderBottom: `1px solid ${theme.palette.divider}`,
});

export const FOOTER_SX = (theme: Theme) => ({
  display: "flex",
  justifyContent: "flex-end",
  gap: 1,
  px: 2.5,
  py: 2,
  borderTop: `1px solid ${theme.palette.divider}`,
});

export const SESSIONS_TABLE_SX = (theme: Theme) => ({
  width: "100%",
  borderCollapse: "collapse",
  "& th": {
    pb: 1,
    pe: 1.5,
    textAlign: "start",
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  "& td": {
    py: 1,
    pe: 1.5,
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  "& th:last-child, & td:last-child": { pe: 0 },
  "& tr:last-child td": { borderBottom: "none" },
});
