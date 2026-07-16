"use client";

import { useEffect, useState } from "react";
import { useAppTranslation } from "@/shared/locale";

export function useTeacherDashboardLastUpdated(dataArrivedAt: number | null): string {
  const t = useAppTranslation().dashboardTranslations.teacherDashboard;
  const updatedJustNow = t.updatedJustNow as string;
  const updatedMinutesAgo = t.updatedMinutesAgo as (minutes: number) => string;
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
