"use client";

import { useEffect, useState } from "react";
import type { TeacherDashboardLastUpdatedLabels } from "@/frontend/common/views/dashboard/teachers/dashboard/types/teacherDashboardLabels";

function computeLabel(
  dataArrivedAt: number,
  updatedJustNow: string,
  updatedMinutesAgo: (count: number) => string
): string {
  const elapsedMin = Math.floor((Date.now() - dataArrivedAt) / 60000);
  if (elapsedMin < 1) {
    return updatedJustNow;
  }
  return updatedMinutesAgo(elapsedMin);
}

export function useTeacherDashboardLastUpdated(
  dataArrivedAt: number | null,
  labels: TeacherDashboardLastUpdatedLabels
): string {
  const { updatedJustNow, updatedMinutesAgo } = labels;

  const initialLabel =
    dataArrivedAt === null ? updatedJustNow : computeLabel(dataArrivedAt, updatedJustNow, updatedMinutesAgo);

  const [lastUpdated, setLastUpdated] = useState(initialLabel);
  const [prevDataArrivedAt, setPrevDataArrivedAt] = useState(dataArrivedAt);

  if (prevDataArrivedAt !== dataArrivedAt) {
    setPrevDataArrivedAt(dataArrivedAt);
    setLastUpdated(initialLabel);
  }

  useEffect(() => {
    if (dataArrivedAt === null) {
      return undefined;
    }

    const interval = setInterval(() => {
      setLastUpdated(computeLabel(dataArrivedAt, updatedJustNow, updatedMinutesAgo));
    }, 60000);
    return () => clearInterval(interval);
  }, [dataArrivedAt, updatedJustNow, updatedMinutesAgo]);

  return lastUpdated;
}
