/**
 * CSS-variable-based autofill color tokens.
 *
 * With `cssVariables: true`, MUI bakes a single stylesheet that serves both
 * light and dark modes. Literal hex strings baked at theme creation time (the
 * previous approach) locked autofill colors to the *default* color scheme,
 * so switching to a non-default mode mismatched the palette and browser
 * autofill themes reappeared. Using CSS variable references lets the browser
 * resolve autofill colors at runtime per the active color scheme.
 *
 * Background: matches the surface behind the input (transparent inputs sit on
 * either background.default or background.paper); we use surface because it is
 * the elevated card surface where form inputs live.
 * Text: matches the primary text color.
 */
export const AUTOFILL_BACKGROUND_VAR = "var(--mui-palette-surface, var(--mui-palette-background-default))";
export const AUTOFILL_TEXT_VAR = "var(--mui-palette-text-primary)";

export const getMuiInputOverrides = () => ({
  MuiOutlinedInput: {
    styleOverrides: {
      root: {
        "& input:-webkit-autofill": {
          WebkitBoxShadow: `0 0 0 100px ${AUTOFILL_BACKGROUND_VAR} inset !important`,
          WebkitTextFillColor: `${AUTOFILL_TEXT_VAR} !important`,
          caretColor: `${AUTOFILL_TEXT_VAR} !important`,
          borderRadius: "inherit",
          transition: "background-color 5000s ease-in-out 0s",
        },
        "& input:-webkit-autofill:hover": {
          WebkitBoxShadow: `0 0 0 100px ${AUTOFILL_BACKGROUND_VAR} inset !important`,
          WebkitTextFillColor: `${AUTOFILL_TEXT_VAR} !important`,
        },
        "& input:-webkit-autofill:focus": {
          WebkitBoxShadow: `0 0 0 100px ${AUTOFILL_BACKGROUND_VAR} inset !important`,
          WebkitTextFillColor: `${AUTOFILL_TEXT_VAR} !important`,
        },
        "& input:-webkit-autofill:active": {
          WebkitBoxShadow: `0 0 0 100px ${AUTOFILL_BACKGROUND_VAR} inset !important`,
          WebkitTextFillColor: `${AUTOFILL_TEXT_VAR} !important`,
        },
      },
      input: {
        "&:-webkit-autofill": {
          WebkitBoxShadow: `0 0 0 100px ${AUTOFILL_BACKGROUND_VAR} inset !important`,
          WebkitTextFillColor: `${AUTOFILL_TEXT_VAR} !important`,
          caretColor: `${AUTOFILL_TEXT_VAR} !important`,
          borderRadius: "inherit",
        },
        "&:-webkit-autofill:hover": {
          WebkitBoxShadow: `0 0 0 100px ${AUTOFILL_BACKGROUND_VAR} inset !important`,
        },
        "&:-webkit-autofill:focus": {
          WebkitBoxShadow: `0 0 0 100px ${AUTOFILL_BACKGROUND_VAR} inset !important`,
        },
        "&:-webkit-autofill:active": {
          WebkitBoxShadow: `0 0 0 100px ${AUTOFILL_BACKGROUND_VAR} inset !important`,
        },
      },
    },
  },
  MuiInputBase: {
    styleOverrides: {
      input: {
        "&:-webkit-autofill": {
          WebkitBoxShadow: `0 0 0 100px ${AUTOFILL_BACKGROUND_VAR} inset !important`,
          WebkitTextFillColor: `${AUTOFILL_TEXT_VAR} !important`,
          caretColor: `${AUTOFILL_TEXT_VAR} !important`,
        },
        "&:-webkit-autofill:hover, &:-webkit-autofill:focus, &:-webkit-autofill:active": {
          WebkitBoxShadow: `0 0 0 100px ${AUTOFILL_BACKGROUND_VAR} inset !important`,
          WebkitTextFillColor: `${AUTOFILL_TEXT_VAR} !important`,
        },
      },
    },
  },
});
