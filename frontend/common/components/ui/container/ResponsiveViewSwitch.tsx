"use client";

import { Alert, Box, Button, CircularProgress, Typography } from "@mui/material";
import { Component, type ComponentType, type ErrorInfo, type ReactNode, Suspense } from "react";
import { useViewport } from "@/frontend/common/hooks/useViewport";
import { logger } from "@/frontend/common/utils/logger";

type ViewProps<T> = Readonly<T>;

interface ViewSwitchErrorBoundaryProps {
  readonly children: ReactNode;
  readonly errorFallback?: ReactNode;
}

interface ViewSwitchErrorBoundaryState {
  readonly hasError: boolean;
  readonly errorMessage: string;
}

class ViewSwitchErrorBoundary extends Component<ViewSwitchErrorBoundaryProps, ViewSwitchErrorBoundaryState> {
  override state: ViewSwitchErrorBoundaryState = { hasError: false, errorMessage: "" };

  static getDerivedStateFromError(error: Error): ViewSwitchErrorBoundaryState {
    return { hasError: true, errorMessage: error.message };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logger.error("ResponsiveViewSwitch lazy load failed", { error: error.message, errorInfo, stack: error.stack });
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.errorFallback) {
        return this.props.errorFallback;
      }
      return (
        <Alert
          severity="error"
          sx={{ m: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => globalThis.location.reload()}>
              Retry
            </Button>
          }
        >
          <Typography variant="bodyMd">Failed to load view. Please refresh the page.</Typography>
        </Alert>
      );
    }
    return this.props.children;
  }
}

export interface ResponsiveViewSwitchProps<T> {
  readonly mobile: ComponentType<ViewProps<T>>;
  readonly desktop: ComponentType<ViewProps<T>>;
  readonly props: ViewProps<T>;
  readonly fallback?: ReactNode;
  readonly errorFallback?: ReactNode;
}

const defaultFallback: ReactNode = (
  <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 120 }}>
    <CircularProgress size={32} />
  </Box>
);

export function ResponsiveViewSwitch<T>({
  mobile: MobileComponent,
  desktop: DesktopComponent,
  props,
  fallback,
  errorFallback,
}: Readonly<ResponsiveViewSwitchProps<T>>) {
  const { isMobile } = useViewport();
  const suspenseFallback = fallback ?? defaultFallback;

  return (
    <ViewSwitchErrorBoundary errorFallback={errorFallback}>
      <Suspense fallback={suspenseFallback}>
        {isMobile ? <MobileComponent {...props} /> : <DesktopComponent {...props} />}
      </Suspense>
    </ViewSwitchErrorBoundary>
  );
}
