"use client";

import { Alert, Snackbar } from "@mui/material";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  type TeacherDuesViewModel,
  useTeacherDuesViewModel,
} from "@/frontend/common/views/dashboard/supervisor/teacher-dues/useTeacherDuesViewModel";

const lazyViews = createLazyView<TeacherDuesViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/supervisor/teacher-dues/teacherDues.mobile").then(m => ({
      default: m.TeacherDuesMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/supervisor/teacher-dues/teacherDues.desktop").then(m => ({
      default: m.TeacherDuesDesktopView,
    }))
);

export function TeacherDuesContainer() {
  const viewModel = useTeacherDuesViewModel({});

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
      <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />
    </>
  );
}

export type { TeacherDuesViewModel };
