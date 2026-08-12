"use client";

import { Alert, Snackbar } from "@mui/material";
import type * as React from "react";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";

export interface SnackbarContainerProps<TViewModel> {
  readonly viewModel: TViewModel & {
    readonly snackbar: {
      readonly open: boolean;
      readonly severity: "success" | "error" | "info" | "warning";
      readonly message: string;
    };
    readonly onCloseSnackbar: () => void;
  };
  readonly mobile: React.ComponentType<React.PropsWithChildren<{ viewModel: TViewModel }>>;
  readonly desktop: React.ComponentType<React.PropsWithChildren<{ viewModel: TViewModel }>>;
}

export function SnackbarContainer<TViewModel>({ viewModel, mobile, desktop }: SnackbarContainerProps<TViewModel>) {
  return (
    <>
      <Snackbar
        open={viewModel.snackbar.open}
        autoHideDuration={4000}
        onClose={viewModel.onCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={viewModel.snackbar.severity} onClose={viewModel.onCloseSnackbar} sx={{ width: "100%" }}>
          {viewModel.snackbar.message}
        </Alert>
      </Snackbar>
      <ResponsiveViewSwitch mobile={mobile} desktop={desktop} props={{ viewModel }} />
    </>
  );
}
