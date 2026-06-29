import type { Components, Theme } from "@mui/material/styles";

interface ComponentProps {
  isLight: boolean;
  autofillBackground: string;
  autofillText: string;
}

const getMuiCssBaseline = ({
  isLight,
  autofillBackground,
  autofillText,
}: ComponentProps): Components<Omit<Theme, "components">>["MuiCssBaseline"] => ({
  styleOverrides: {
    body: {
      backgroundColor: isLight ? "#FFFFFF" : "#1A1A1A",
      backgroundImage: isLight
        ? "radial-gradient(circle at top left, rgba(13, 148, 136, 0.04), transparent 32%), radial-gradient(circle at top right, rgba(79, 70, 229, 0.05), transparent 28%)"
        : "radial-gradient(circle at top left, rgba(45, 212, 191, 0.08), transparent 32%), radial-gradient(circle at top right, rgba(129, 140, 248, 0.1), transparent 28%)",
    },
    "input:-webkit-autofill": {
      WebkitBoxShadow: `0 0 0 1000px ${autofillBackground} inset !important`,
      WebkitTextFillColor: `${autofillText} !important`,
      caretColor: `${autofillText} !important`,
      borderRadius: "inherit",
      transition: "background-color 5000s ease-in-out 0s",
    },
    "input:-webkit-autofill:hover": {
      WebkitBoxShadow: `0 0 0 1000px ${autofillBackground} inset !important`,
      WebkitTextFillColor: `${autofillText} !important`,
    },
    "input:-webkit-autofill:focus": {
      WebkitBoxShadow: `0 0 0 1000px ${autofillBackground} inset !important`,
      WebkitTextFillColor: `${autofillText} !important`,
    },
    "input:-webkit-autofill:active": {
      WebkitBoxShadow: `0 0 0 1000px ${autofillBackground} inset !important`,
      WebkitTextFillColor: `${autofillText} !important`,
    },
    "textarea:-webkit-autofill, select:-webkit-autofill": {
      WebkitBoxShadow: `0 0 0 1000px ${autofillBackground} inset !important`,
      WebkitTextFillColor: `${autofillText} !important`,
      caretColor: `${autofillText} !important`,
      borderRadius: "inherit",
      transition: "background-color 5000s ease-in-out 0s",
    },
    "input:autofill, textarea:autofill, select:autofill": {
      boxShadow: `0 0 0 1000px ${autofillBackground} inset !important`,
      color: `${autofillText} !important`,
    },
    "input:-internal-autofill-selected": {
      backgroundColor: `${autofillBackground} !important`,
      backgroundImage: "none !important",
      color: `${autofillText} !important`,
    },
    "input[data-com-onepassword-filled], textarea[data-com-onepassword-filled], input[data-com-onepassword-filled='dark'], textarea[data-com-onepassword-filled='dark']":
      {
        backgroundColor: `${autofillBackground} !important`,
        WebkitBoxShadow: `0 0 0 1000px ${autofillBackground} inset !important`,
        WebkitTextFillColor: `${autofillText} !important`,
        color: `${autofillText} !important`,
        caretColor: `${autofillText} !important`,
      },
    "*::-webkit-scrollbar": {
      width: "6px",
      backgroundColor: "transparent",
    },
    "*::-webkit-scrollbar-track": {
      background: isLight ? "rgba(0, 0, 0, 0.02)" : "rgba(255, 255, 255, 0.02)",
      borderRadius: "6px",
      margin: "4px 0",
    },
    "*::-webkit-scrollbar-thumb": {
      background: isLight ? "rgba(0, 0, 0, 0.15)" : "rgba(255, 255, 255, 0.15)",
      borderRadius: "6px",
      border: isLight ? "2px solid #FFFFFF" : "2px solid #1A1A1A",
    },
    "*::-webkit-scrollbar-thumb:hover": {
      background: isLight ? "rgba(0, 0, 0, 0.25)" : "rgba(255, 255, 255, 0.25)",
    },
    "*": {
      scrollbarWidth: "thin",
      scrollbarColor: isLight
        ? "rgba(0, 0, 0, 0.15) rgba(0, 0, 0, 0.02)"
        : "rgba(255, 255, 255, 0.15) rgba(255, 255, 255, 0.02)",
    },
  },
});

const getMuiButton = (): Components<Omit<Theme, "components">>["MuiButton"] => ({
  styleOverrides: {
    root: ({ ownerState, theme }) => ({
      borderRadius: 8, // Rounded buttons
      boxShadow: "none",
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: "0.1em",
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

const getMuiPaper = (): Components<Omit<Theme, "components">>["MuiPaper"] => ({
  styleOverrides: {
    root: {
      backgroundImage: "none",
    },
  },
});

const getMuiCard = (): Components<Omit<Theme, "components">>["MuiCard"] => ({
  styleOverrides: {
    root: ({ theme }) => ({
      borderRadius: 16, // Data containers use modern rounded-xl (1rem/16px) standard
      boxShadow: theme.palette.shadow.card,
      border: `1px solid ${theme.palette.border.light}`,
      backgroundColor: theme.palette.background.paper,
    }),
  },
});

const getMuiInputOverrides = ({
  autofillBackground,
  autofillText,
}: Pick<ComponentProps, "autofillBackground" | "autofillText">) => ({
  MuiOutlinedInput: {
    styleOverrides: {
      root: {
        "& input:-webkit-autofill": {
          WebkitBoxShadow: `0 0 0 100px ${autofillBackground} inset !important`,
          WebkitTextFillColor: `${autofillText} !important`,
          caretColor: `${autofillText} !important`,
          borderRadius: "inherit",
          transition: "background-color 5000s ease-in-out 0s",
        },
        "& input:-webkit-autofill:hover": {
          WebkitBoxShadow: `0 0 0 100px ${autofillBackground} inset !important`,
          WebkitTextFillColor: `${autofillText} !important`,
        },
        "& input:-webkit-autofill:focus": {
          WebkitBoxShadow: `0 0 0 100px ${autofillBackground} inset !important`,
          WebkitTextFillColor: `${autofillText} !important`,
        },
        "& input:-webkit-autofill:active": {
          WebkitBoxShadow: `0 0 0 100px ${autofillBackground} inset !important`,
          WebkitTextFillColor: `${autofillText} !important`,
        },
      },
      input: {
        "&:-webkit-autofill": {
          WebkitBoxShadow: `0 0 0 100px ${autofillBackground} inset !important`,
          WebkitTextFillColor: `${autofillText} !important`,
          caretColor: `${autofillText} !important`,
          borderRadius: "inherit",
        },
        "&:-webkit-autofill:hover": {
          WebkitBoxShadow: `0 0 0 100px ${autofillBackground} inset !important`,
        },
        "&:-webkit-autofill:focus": {
          WebkitBoxShadow: `0 0 0 100px ${autofillBackground} inset !important`,
        },
        "&:-webkit-autofill:active": {
          WebkitBoxShadow: `0 0 0 100px ${autofillBackground} inset !important`,
        },
      },
    },
  },
  MuiInputBase: {
    styleOverrides: {
      input: {
        "&:-webkit-autofill": {
          WebkitBoxShadow: `0 0 0 100px ${autofillBackground} inset !important`,
          WebkitTextFillColor: `${autofillText} !important`,
          caretColor: `${autofillText} !important`,
        },
        "&:-webkit-autofill:hover, &:-webkit-autofill:focus, &:-webkit-autofill:active": {
          WebkitBoxShadow: `0 0 0 100px ${autofillBackground} inset !important`,
          WebkitTextFillColor: `${autofillText} !important`,
        },
      },
    },
  },
});

const getMuiDataGrid = (): Components<Omit<Theme, "components">>["MuiDataGrid"] => ({
  styleOverrides: {
    root: ({ theme }) => ({
      border: "none",
      "--DataGrid-containerBackground": "transparent",
      "& .MuiDataGrid-columnHeader": {
        backgroundColor: theme.palette.surfaceContainerLow,
      },
      "& .MuiDataGrid-columnHeaderTitle": {
        fontFamily: '"Inter", sans-serif',
        fontSize: "11px",
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: theme.palette.onSurfaceVariant,
      },
      "& .MuiDataGrid-cell": {
        borderBottom: `1px solid`,
        borderColor: theme.palette.border.light,
      },
      "& .MuiDataGrid-row:hover": {
        backgroundColor: theme.palette.mode === "light" ? "rgba(13, 148, 136, 0.04)" : "rgba(45, 212, 191, 0.06)",
      },
      "& .MuiDataGrid-footerContainer": {
        borderTop: `1px solid`,
        borderColor: theme.palette.border.light,
      },
    }),
  },
});

export const components = ({
  isLight,
  autofillBackground,
  autofillText,
}: ComponentProps): Components<Omit<Theme, "components">> => {
  return {
    MuiCssBaseline: getMuiCssBaseline({ isLight, autofillBackground, autofillText }),
    MuiButton: getMuiButton(),
    MuiPaper: getMuiPaper(),
    MuiCard: getMuiCard(),
    ...getMuiInputOverrides({ autofillBackground, autofillText }),
    MuiDataGrid: getMuiDataGrid(),
  };
};
