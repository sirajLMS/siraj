"use client";

import { Box, Button, Stack, Typography } from "@mui/material";
import { Component, type ErrorInfo, type ReactNode } from "react";
import { logger } from "@/frontend/common/utils/logger";
import { Translation, useAppTranslation } from "@/shared/locale";

/**
 * Props for {@link AppearanceErrorBoundary}.
 *
 * - `children` — the customizer subtree to wrap (toolbar + sidebar +
 *   dashboard preview bridge). When this subtree throws during render,
 *   the boundary catches it and renders {@link AppearanceErrorFallback}
 *   instead.
 * - `onReset` — recovery callback invoked by the fallback's Reset button.
 *   Wired by `CustomizeOverlay` to clear the appearance preview store
 *   (`resetToDefaults()`) and strip `?customize=1` from the URL so the
 *   user lands back on the dashboard without the broken overlay.
 */
export interface AppearanceErrorBoundaryProps {
  readonly children: ReactNode;
  readonly onReset: () => void;
}

interface AppearanceErrorBoundaryState {
  readonly error: Error | null;
}

/**
 * React class error boundary around the site-appearance customizer
 * overlay (Task 9.9, AC-35).
 *
 * Why a class component: React error boundaries still require the legacy
 * `static getDerivedStateFromError` + `componentDidCatch` lifecycle,
 * which is only available on `React.Component`. The function-component
 * equivalent (`useErrorBoundary`) does not exist in stable React.
 *
 * Recovery contract:
 *   1. The boundary catches any render-time error in the customizer
 *      subtree (e.g. a malformed draft that crashes `ColorEditorSection`).
 *   2. The fallback UI (a function component so it can call
 *      `useAppTranslation`) shows a short message + a "Reset & Exit"
 *      button.
 *   3. Clicking the button calls `onReset`, which clears the local
 *      appearance preview store (`resetToDefaults()`) and removes
 *      `?customize=1` from the URL — closing the overlay and returning
 *      the user to the dashboard. The boundary state is also cleared so
 *      a future customize-mode session starts fresh.
 *
 * The fallback deliberately avoids re-rendering the customizer subtree
 * (no "Try Again" button) because the underlying store state that
 * triggered the crash is still in memory; only a full reset is safe.
 */
export class AppearanceErrorBoundary extends Component<AppearanceErrorBoundaryProps, AppearanceErrorBoundaryState> {
  state: AppearanceErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): AppearanceErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    logger.error("AppearanceErrorBoundary caught a render error", { error, info });
  }

  private readonly handleReset = (): void => {
    this.setState({ error: null });
    this.props.onReset();
  };

  render(): ReactNode {
    const { error } = this.state;
    if (!error) {
      return <>{this.props.children}</>;
    }
    return <AppearanceErrorFallback error={error} onReset={this.handleReset} />;
  }
}

interface AppearanceErrorFallbackProps {
  readonly error: Error;
  readonly onReset: () => void;
}

/**
 * Function-component fallback rendered by {@link AppearanceErrorBoundary}
 * when the customizer subtree throws. Uses `useAppTranslation` for i18n
 * (class components can't call hooks), so the boundary delegates to this
 * component for the visible UI.
 *
 * Rendered as a `role="alert"` region so screen readers announce the
 * error immediately (complements the polite `aria-live` region in
 * `CustomizeOverlay` which only carries status messages).
 */
function AppearanceErrorFallback({ error, onReset }: Readonly<AppearanceErrorFallbackProps>) {
  const t = useAppTranslation(Translation.Dashboard.Settings).appearance;
  return (
    <Box
      role="alert"
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 1400,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--mui-palette-background-default)",
        p: 3,
      }}
    >
      <Stack sx={{ gap: 2, maxWidth: 480, textAlign: "center" }}>
        <Typography variant="h6" sx={{ color: theme => theme.palette.error.main }}>
          {t.errorBoundaryTitle}
        </Typography>
        <Typography variant="body2" sx={{ color: "var(--mui-palette-text-secondary)" }}>
          {t.errorBoundaryBody}
        </Typography>
        <Typography variant="caption" sx={{ color: "var(--mui-palette-text-disabled)", fontFamily: "monospace" }}>
          {error.message}
        </Typography>
        <Button variant="contained" color="error" onClick={onReset} sx={{ alignSelf: "center" }}>
          {t.errorBoundaryReset}
        </Button>
      </Stack>
    </Box>
  );
}
