import { Suspense } from "react";
import { DashboardContainer } from "@/frontend/views/dashboard/dashboard/DashboardContainer";

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardContainer />
    </Suspense>
  );
}
