import { Box, CircularProgress } from "@mui/material";
import { Suspense } from "react";
import { DashboardContainer } from "@/frontend/views/dashboard/dashboard/DashboardContainer";

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "50vh",
          }}
        >
          <CircularProgress />
        </Box>
      }
    >
      <DashboardContainer />
    </Suspense>
  );
}
