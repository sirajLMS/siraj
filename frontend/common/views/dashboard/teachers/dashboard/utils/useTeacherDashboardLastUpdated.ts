"use client";

import { useEffect, useState } from "react";
import type { TeacherDashboardLastUpdatedLabels } from "@/frontend/common/views/dashboard/teachers/dashboard/types/teacherDashboardLabels";

export function useTeacherDashboardLastUpdated(
  dataArrivedAt: number | null,
  labels: TeacherDashboardLastUpdatedLabels
): string {
  const { updatedJustNow, updatedMinutesAgo } = labels;
  const [lastUpdated, setLastUpdated] = useState(updatedJustNow);

  useEffect(() => {
    if (dataArrivedAt === null) {
      setLastUpdated(updatedJustNow);
      return;
    }

    const computeLabel = () => {
      const elapsedMin = Math.floor((Date.now() - dataArrivedAt) / 60000);
      if (elapsedMin < 1) {
        return updatedJustNow;
      }
      return updatedMinutesAgo(elapsedMin);
    };

    setLastUpdated(computeLabel());
    const interval = setInterval(computeLabel, 60000);
    return () => clearInterval(interval);
  }, [dataArrivedAt, updatedJustNow, updatedMinutesAgo]);

  return lastUpdated;
}
