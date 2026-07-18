// cspell:ignore: onepassword, Hanken, Grotesk, Segoe

/**
 * Block-level display for stacked text variants.
 * Custom MUI variants render as `<span>` unless mapped otherwise; without
 * `display: "block"` consecutive Typography nodes sit on one line and overlap.
 * Keep labelSm / buttonText inline — they are typically used beside icons/actions.
 */
const blockText = { display: "block" } as const;

export const typography = {
  fontFamily: '"Hanken Grotesk", "Inter", "Segoe UI", sans-serif',
  display: {
    fontFamily: '"Hanken Grotesk", sans-serif',
    fontSize: "40px",
    fontWeight: 700,
    lineHeight: 1.2,
    letterSpacing: "-0.02em",
    ...blockText,
  },
  headlineLg: {
    fontFamily: '"Hanken Grotesk", sans-serif',
    fontSize: "32px",
    fontWeight: 600,
    lineHeight: 1.25,
    ...blockText,
  },
  headlineMd: {
    fontFamily: '"Hanken Grotesk", sans-serif',
    fontSize: "24px",
    fontWeight: 600,
    lineHeight: 1.33,
    ...blockText,
  },
  titleLg: {
    fontFamily: '"Hanken Grotesk", sans-serif',
    fontSize: "20px",
    fontWeight: 600,
    lineHeight: 1.4,
    ...blockText,
  },
  bodyLg: {
    fontFamily: '"Hanken Grotesk", sans-serif',
    fontSize: "16px",
    fontWeight: 400,
    lineHeight: 1.5,
    ...blockText,
  },
  bodyMd: {
    fontFamily: '"Hanken Grotesk", sans-serif',
    fontSize: "14px",
    fontWeight: 400,
    lineHeight: 1.43,
    ...blockText,
  },
  // No forced display — default maps to <p>; callers that need inline use component="span".
  labelMd: {
    fontFamily: '"Inter", sans-serif',
    fontSize: "12px",
    fontWeight: 500,
    lineHeight: 1.33,
    letterSpacing: "0.05em",
  },
  labelSm: {
    fontFamily: '"Inter", sans-serif',
    fontSize: "10px",
    fontWeight: 300,
    lineHeight: 1.2,
    letterSpacing: "0.1em",
  },
  labelUppercase: {
    fontFamily: '"Inter", sans-serif',
    fontSize: "11px",
    fontWeight: 700,
    lineHeight: 1.33,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    ...blockText,
  },
  buttonText: {
    fontFamily: '"Inter", sans-serif',
    fontSize: "14px",
    fontWeight: 700,
    lineHeight: 1.43,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
  },
  // Map basic MUI elements to ensure unified rendering
  h1: {
    fontFamily: '"Hanken Grotesk", sans-serif',
    fontSize: "40px",
    fontWeight: 700,
    lineHeight: 1.2,
    letterSpacing: "-0.02em",
    ...blockText,
  },
  h2: {
    fontFamily: '"Hanken Grotesk", sans-serif',
    fontSize: "32px",
    fontWeight: 600,
    lineHeight: 1.25,
    ...blockText,
    "@media (max-width: 768px)": {
      fontSize: "28px",
      lineHeight: 1.28,
    },
  },
  h3: {
    fontFamily: '"Hanken Grotesk", sans-serif',
    fontSize: "24px",
    fontWeight: 600,
    lineHeight: 1.33,
    ...blockText,
  },
  body1: {
    fontFamily: '"Hanken Grotesk", sans-serif',
    fontSize: "16px",
    fontWeight: 400,
    lineHeight: 1.5,
    ...blockText,
  },
  body2: {
    fontFamily: '"Hanken Grotesk", sans-serif',
    fontSize: "14px",
    fontWeight: 400,
    lineHeight: 1.43,
    ...blockText,
  },
  caption: {
    fontFamily: '"Inter", sans-serif',
    fontSize: "12px",
    fontWeight: 500,
    lineHeight: 1.33,
    letterSpacing: "0.05em",
    ...blockText,
  },
  button: {
    fontFamily: '"Inter", sans-serif',
    fontSize: "14px",
    fontWeight: 700,
    lineHeight: 1.43,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
  },
};
