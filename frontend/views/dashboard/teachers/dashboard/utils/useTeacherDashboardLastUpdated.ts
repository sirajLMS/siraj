"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

export function useTeacherDashboardLastUpdated(dataArrivedAt: number | null): string {
  const t = useTranslations("dashboard.teacherDashboard");
  const [lastUpdated, setLastUpdated] = useState(t("updatedJustNow"));

  useEffect(() => {
    if (dataArrivedAt === null) {
      setLastUpdated(t("updatedJustNow"));
      return;
    }

    const computeLabel = () => {
      const elapsedMin = Math.floor((Date.now() - dataArrivedAt) / 60000);
      if (elapsedMin < 1) {
        return t("updatedJustNow");
      }
      return t("updatedMinutesAgo", { minutes: elapsedMin });
    };

    setLastUpdated(computeLabel());
    const interval = setInterval(computeLabel, 60000);
    return () => clearInterval(interval);
  }, [dataArrivedAt, t]);

  return lastUpdated;
}
