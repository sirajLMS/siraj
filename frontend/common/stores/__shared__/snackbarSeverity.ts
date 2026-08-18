/**
 * Shared severity union for snackbar/feedback notification stores.
 * Extracting this avoids every store re-declaring `"success" | "error" | "info"`
 * inline — see frontend/stores/AGENTS.md "Shared types" rule.
 */
export type SnackbarSeverity = "success" | "error" | "info";
