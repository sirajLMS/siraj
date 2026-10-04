import { alpha, type Components, type Theme } from "@mui/material/styles";

export const getMuiButton = (): Components<Omit<Theme, "components">>["MuiButton"] => ({
  styleOverrides: {
    root: ({ ownerState, theme }) => ({
      borderRadius: "8px",
      boxShadow: "none",
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: "0.1em",
      minHeight: 40,
      "&:hover": {
        boxShadow: "none",
      },
      ...(ownerState.variant === "contained" &&
        ownerState.color === "primary" && {
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.onPrimary,
          "&:hover": {
            backgroundColor: theme.palette.primary.dark,
            boxShadow: "none",
          },
        }),
    }),
  },
});

export const getMuiPaper = (): Components<Omit<Theme, "components">>["MuiPaper"] => ({
  styleOverrides: {
    root: {
      backgroundImage: "none",
    },
  },
});

export const getMuiCard = (): Components<Omit<Theme, "components">>["MuiCard"] => ({
  styleOverrides: {
    root: {
      borderRadius: 12,
      border: "1px solid var(--mui-palette-border-light)",
      backgroundColor: "var(--mui-palette-background-paper)",
    },
  },
});

export const getMuiDataGrid = (): Components<Omit<Theme, "components">>["MuiDataGrid"] => ({
  styleOverrides: {
    root: ({ theme }) => ({
      border: "none",
      "--DataGrid-containerBackground": "transparent",
      "& .MuiDataGrid-columnHeader": {
        backgroundColor: theme.palette.surfaceContainerLow,
      },
      "& .MuiDataGrid-columnHeaderTitle": {
        fontFamily: "var(--font-inter), sans-serif",
        fontSize: "11px",
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: theme.palette.onSurfaceVariant,
      },
      // Cells default to display:block; without flex, plain text sticks to the top
      // while taller renderCell content (avatars, icon buttons) sits mid-row.
      "& .MuiDataGrid-cell": {
        display: "flex",
        alignItems: "center",
        borderBottom: `1px solid`,
        borderColor: theme.palette.border.light,
      },
      "& .MuiDataGrid-row:hover": {
        backgroundColor:
          theme.palette.mode === "light"
            ? alpha(theme.palette.primary.main, 0.04)
            : alpha(theme.palette.primary.main, 0.06),
      },
      // Column separators double as resize hit-targets; keep them invisible so
      // headers stay clean, and reveal the affordance only on header
      // hover/focus (pointer devices) or during an active resize drag.
      "& .MuiDataGrid-columnSeparator": {
        color: "transparent",
      },
      "& .MuiDataGrid-columnSeparator--resizing": {
        color: theme.palette.primary.main,
      },
      "& .MuiDataGrid-columnHeader:focus-within .MuiDataGrid-columnSeparator--resizable": {
        color: theme.palette.divider,
      },
      "@media (hover: hover)": {
        "& .MuiDataGrid-columnHeader:hover .MuiDataGrid-columnSeparator--resizable": {
          color: theme.palette.divider,
        },
      },
      "& .MuiDataGrid-footerContainer": {
        borderTop: `1px solid`,
        borderColor: theme.palette.border.light,
      },
    }),
  },
});

/**
 * Custom typography variants default to `<span>` without a mapping, which makes
 * consecutive titles/subtitles render inline and overlap. Map every text-like
 * variant to a block element. Inline-only variants (button / buttonText /
 * labelSm / overline) stay as `span`. Pair with `display: "block"` on the
 * matching entries in `typography.ts` so styled wrappers stay stacked too.
 */
export const getMuiTypography = (): Components<Omit<Theme, "components">>["MuiTypography"] => ({
  defaultProps: {
    variantMapping: {
      // Built-in
      h1: "h1",
      h2: "h2",
      h3: "h3",
      h4: "h4",
      h5: "h5",
      h6: "h6",
      subtitle1: "h6",
      subtitle2: "h6",
      body1: "p",
      body2: "p",
      inherit: "p",
      caption: "p",
      overline: "span",
      button: "span",
      // Design-system
      display: "h1",
      headlineLg: "h2",
      headlineMd: "h3",
      titleLg: "h4",
      bodyLg: "p",
      bodyMd: "p",
      labelMd: "p",
      labelSm: "span",
      labelUppercase: "p",
      buttonText: "span",
    },
  },
});
