"use client";

import { useQuery } from "@apollo/client/react";
import { useCallback, useMemo, useState } from "react";
import type {
  TeacherWeeklyScheduleGridQuery,
  UserMeetingConfigFieldsFragment,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { teacherWeeklyScheduleGridQueryDocument } from "@/frontend/common/graphql/sharedDocuments/scheduling/weekly-schedule.documents";
import type { LinkedClassInstance } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/LinkedClassInstancesList";
import {
  collapseProviderExpandedId,
  currentWeekStart,
} from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/useMeetingConfigsManager.helpers";

interface BookingsArgs {
  readonly configs: readonly UserMeetingConfigFieldsFragment[];
  readonly configById: ReadonlyMap<string, UserMeetingConfigFieldsFragment>;
  readonly targetUserId: string;
}

/** Class instances whose effective meeting uses the expanded config. */
function buildExpandedInstances(
  grid: NonNullable<TeacherWeeklyScheduleGridQuery["teacherWeeklyScheduleGrid"]>,
  expandedBookingsId: string
): readonly LinkedClassInstance[] {
  const instances: LinkedClassInstance[] = [];
  for (const cls of grid.classes ?? []) {
    const effectiveConfigId = cls.effectiveMeeting?.configId;
    if (effectiveConfigId !== expandedBookingsId) continue;
    instances.push({
      id: cls.id ?? "",
      title: cls.studentName ?? "",
      startTime: cls.startTime ?? null,
      meetingJoinUrl: cls.meetingJoinUrl ?? cls.effectiveMeeting?.joinUrl ?? null,
    });
  }
  return instances;
}

/** Owns the linked-bookings expansion: tracks which config's class instances
 *  are expanded, fetches the teacher's weekly schedule on demand (stateful
 *  query — no useLazyQuery), and derives the per-config instances map.
 *  Cleared configs (after reconnect/disconnect) are excluded until refetched. */
export function useMeetingConfigsManagerBookings({ configs, configById, targetUserId }: BookingsArgs) {
  const [clearedBookingsIds, setClearedBookingsIds] = useState<ReadonlySet<string>>(() => new Set());
  const [expandedBookingsId, setExpandedBookingsId] = useState<string | null>(null);
  const [fetchedBookingsIds, setFetchedBookingsIds] = useState<ReadonlySet<string>>(() => new Set());

  const weeklyScheduleQuery = useQuery(teacherWeeklyScheduleGridQueryDocument, {
    variables: { teacherId: targetUserId, weekDate: currentWeekStart() },
    skip: expandedBookingsId === null || fetchedBookingsIds.has(expandedBookingsId),
    fetchPolicy: "network-only",
  });

  const queryBookingsInstances = useMemo<ReadonlyMap<string, readonly LinkedClassInstance[]>>(() => {
    if (expandedBookingsId == null) return new Map();
    if (weeklyScheduleQuery.loading) return new Map();
    const grid = weeklyScheduleQuery.data?.teacherWeeklyScheduleGrid;
    if (grid == null) return new Map();
    return new Map([[expandedBookingsId, buildExpandedInstances(grid, expandedBookingsId)]]);
  }, [expandedBookingsId, weeklyScheduleQuery.data, weeklyScheduleQuery.loading]);

  const bookingsInstances = useMemo<ReadonlyMap<string, readonly LinkedClassInstance[]>>(() => {
    const merged = new Map<string, readonly LinkedClassInstance[]>();
    for (const [id, instances] of queryBookingsInstances) {
      if (!clearedBookingsIds.has(id)) {
        merged.set(id, instances);
      }
    }
    return merged;
  }, [queryBookingsInstances, clearedBookingsIds]);

  const handleViewBookings = (meetingConfigId: string) => {
    if (expandedBookingsId === meetingConfigId) {
      setExpandedBookingsId(null);
      return;
    }
    setExpandedBookingsId(meetingConfigId);
    setFetchedBookingsIds(prev => {
      if (prev.has(meetingConfigId)) return prev;
      const next = new Set(prev);
      next.add(meetingConfigId);
      return next;
    });
  };

  /** Clears cached bookings instances and fetched-status for all configs
   *  belonging to the given provider slug so stale data is re-fetched. */
  const clearProviderBookingsCache = useCallback(
    (providerSlug: string) => {
      const configIds = configs
        .filter(
          (c): c is UserMeetingConfigFieldsFragment & { id: string } =>
            c.provider?.slug === providerSlug && typeof c.id === "string"
        )
        .map(c => c.id);
      if (configIds.length === 0) return;
      setClearedBookingsIds(prev => {
        const next = new Set(prev);
        for (const id of configIds) next.add(id);
        return next;
      });
      setFetchedBookingsIds(prev => {
        const next = new Set(prev);
        for (const id of configIds) next.delete(id);
        return next;
      });
    },
    [configs]
  );

  /** Collapses the expanded bookings view when it belongs to the given provider. */
  const collapseExpandedForProvider = useCallback(
    (providerSlug: string) => {
      setExpandedBookingsId(prev => collapseProviderExpandedId(configById, providerSlug, prev));
    },
    [configById]
  );

  return {
    view: { expandedBookingsId, bookingsInstances, bookingsLoading: weeklyScheduleQuery.loading, handleViewBookings },
    clearProviderBookingsCache,
    collapseExpandedForProvider,
  };
}
