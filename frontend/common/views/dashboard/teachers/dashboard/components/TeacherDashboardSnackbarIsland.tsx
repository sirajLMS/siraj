"use client";

import { Alert, Snackbar } from "@mui/material";
import { useTeacherDashboardStore } from "@/frontend/common/stores/teacherDashboardStore";

/**
 * Renders the shared teacher-dashboard snackbar. Snackbar state lives in the
 * Zustand store so any island can surface feedback without prop drilling, and
 * the snackbar survives tier switching while only a single instance is ever
 * mounted.
 */
export function TeacherDashboardSnackbarIsland() {
  const snackbarOpen = useTeacherDashboardStore(state => state.snackbarOpen);
  const snackbarMessage = useTeacherDashboardStore(state => state.snackbarMessage);
  const snackbarSeverity = useTeacherDashboardStore(state => state.snackbarSeverity);
  const setSnackbarOpen = useTeacherDashboardStore(state => state.setSnackbarOpen);

  return (
    <Snackbar
      open={snackbarOpen}
      autoHideDuration={4000}
      onClose={() => setSnackbarOpen(false)}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
    >
      <Alert severity={snackbarSeverity} onClose={() => setSnackbarOpen(false)} sx={{ width: "100%" }}>
        {snackbarMessage}
      </Alert>
    </Snackbar>
  );
}
